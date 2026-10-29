import type { IncomingMessage, ServerResponse } from "http";
import { GoogleGenAI, Type } from "@google/genai";

interface FeedbackRequestBody {
  targetSentence?: string;
  spokenText?: string;
  outcome?: string;
  missingWord?: string;
  elicitationMask?: string;
  chunks?: string[];
  misleadingSentence?: string;
  misleadingReasonEn?: string;
  misleadingReasonKo?: string;
}

type VercelLikeRequest = IncomingMessage & {
  body?: unknown;
  method?: string;
};

type VercelLikeResponse = ServerResponse & {
  status?: (code: number) => VercelLikeResponse;
  json?: (payload: unknown) => void;
};

function violatesFeedbackRules(text: string): boolean {
  if (!text || text.trim().length < 8) return true;
  const lower = text.toLowerCase();
  const bannedWords = [
    "wrong",
    "incorrect",
    "bad pronunciation",
    "tongue",
    "lips",
    "lip ",
    "mouth",
    "teeth",
    "palate",
    "vocal cord",
  ];
  if (bannedWords.some((word) => lower.includes(word))) {
    return true;
  }
  if (/%|\b\d+\s*\/\s*\d+\b|\bscore\b/i.test(text)) {
    return true;
  }
  return false;
}

async function parseRequestBody(req: VercelLikeRequest): Promise<FeedbackRequestBody> {
  if (req.body && typeof req.body === "object") {
    return req.body as FeedbackRequestBody;
  }
  if (typeof req.body === "string" && req.body.trim()) {
    return JSON.parse(req.body) as FeedbackRequestBody;
  }
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  const raw = Buffer.concat(chunks).toString("utf8").trim();
  return raw ? (JSON.parse(raw) as FeedbackRequestBody) : {};
}

function sendJson(res: VercelLikeResponse, statusCode: number, payload: unknown): void {
  if (typeof res.status === "function") {
    const statusRes = res.status(statusCode);
    if (typeof statusRes.json === "function") {
      statusRes.json(payload);
      return;
    }
  }
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

export default async function handler(
  req: VercelLikeRequest,
  res: VercelLikeResponse
): Promise<void> {
  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Method Not Allowed" });
    return;
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
      sendJson(res, 200, { feedback: null, source: "fallback" });
      return;
    }

    const body = await parseRequestBody(req);
    const {
      targetSentence = "",
      spokenText = "",
      outcome = "recast",
      missingWord = "",
      elicitationMask = "",
      chunks = [],
      misleadingSentence = "",
      misleadingReasonEn = "",
      misleadingReasonKo = "",
    } = body;

    const strategyInstructions: Record<string, string> = {
      exact_success: `The student communicated the target sentence "${targetSentence}" intelligibly! Warmly praise them as a friendly conversation partner in 1-2 short sentences, followed by a natural Korean encouragement in parentheses.`,
      partial_success: `The student was understood ("${spokenText}"), missing only a small word ("${missingWord}") from "${targetSentence}". Praise first, gently suggest adding "${missingWord}", max 2 short sentences + Korean in parentheses.`,
      recast: `1st attempt recast. Student said "${spokenText}" instead of "${targetSentence}". Praise their effort first, then naturally model the full sentence: You can say, "${targetSentence}" + Korean in parentheses.`,
      elicitation: `2nd attempt elicitation (first-letter hint). Student said "${spokenText}". Praise them ("You're almost there!"), then give the first-letter hint "${elicitationMask}" and mention the starting letter in Korean in parentheses.`,
      chunking: `3rd attempt chunking. Student said "${spokenText}". Encourage them warmly, then show the chunked phrase "(${chunks.join(" / ")})" with brief Korean encouragement in parentheses.`,
      misleading: `The student used a grammatically okay but pragmatically awkward expression ("${spokenText}", similar to "${misleadingSentence}"). Praise their effort first, briefly explain why it can cause misunderstanding (${misleadingReasonEn}), and suggest "${targetSentence}" instead + Korean explanation (${misleadingReasonKo}) in parentheses.`,
      no_speech: `No speech was recognized. Kindly ask them to retry ("Let's try again! Please retry.") + short Korean encouragement in parentheses.`,
    };

    const specificGuide =
      strategyInstructions[outcome] || strategyInstructions.recast;

    const systemInstruction = [
      "You are Pine, a warm, encouraging small-talk coach for Korean high school students (CEFR B1-B2).",
      "STRICT FEEDBACK RULES:",
      "1. Praise first, mention at most ONE thing to fix, and keep the entire English part to TWO short sentences or fewer.",
      "2. Format strictly as: Simple English sentence(s) (Korean meaning in parentheses).",
      "3. NEVER use the word 'wrong' or 'incorrect'.",
      "4. NEVER include numbers as scores or '%' percentages.",
      "5. NEVER describe tongue, lip, teeth, or mouth positions.",
      "6. Judge purely by intelligibility and polite small-talk pragmatics, never native-like accent.",
    ].join("\n");

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3800);

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: `Situation outcome: ${outcome}\nInstruction: ${specificGuide}`,
        config: {
          systemInstruction,
          temperature: 0.4,
          abortSignal: controller.signal,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              english: {
                type: Type.STRING,
                description:
                  "1 to 2 short simple B1 English sentences. Praise first, no numbers or % scores, never say 'wrong'.",
              },
              korean: {
                type: Type.STRING,
                description:
                  "Friendly, concise Korean coaching translation without outer parentheses.",
              },
            },
            required: ["english", "korean"],
          },
        },
      });

      const rawText = response.text?.trim();
      if (!rawText) {
        sendJson(res, 200, { feedback: null, source: "fallback" });
        return;
      }

      const parsed = JSON.parse(rawText) as {
        english?: string;
        korean?: string;
      };
      const en = (parsed.english || "").trim();
      const ko = (parsed.korean || "").replace(/^\(|\)$/g, "").trim();
      if (!en || !ko) {
        sendJson(res, 200, { feedback: null, source: "fallback" });
        return;
      }

      const combined = `${en} (${ko})`;
      if (violatesFeedbackRules(combined)) {
        sendJson(res, 200, { feedback: null, source: "fallback" });
        return;
      }

      sendJson(res, 200, { feedback: combined, source: "gemini" });
    } finally {
      clearTimeout(timeout);
    }
  } catch {
    sendJson(res, 200, { feedback: null, source: "fallback" });
  }
}
