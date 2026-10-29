import type { DialogueTurn } from "../data/dialogues";

export type EvaluationOutcome =
  | "no_speech"
  | "exact_success"
  | "partial_success"
  | "misleading"
  | "recast"
  | "elicitation"
  | "chunking";

export interface WordMatchToken {
  word: string;
  matched: boolean;
}

export interface EvaluationResult {
  outcome: EvaluationOutcome;
  normalizedSpoken: string;
  targetTokens: WordMatchToken[];
  missingWords: string[];
  nextFailureCount: number;
  canAdvance: boolean;
  /** Strictly false on first-try success per Section 8 */
  showMisleadingTip: boolean;
  fallbackFeedback: string;
}

export interface TurnProgressRecord {
  turnId: number;
  completed: boolean;
  skipped: boolean;
  flawlessFirstTry: boolean;
  everUsedMisleading: boolean;
  attempts: number;
  lastSpoken: string;
  lastOutcome: EvaluationOutcome | null;
}

export interface BrowserGuidance {
  isSupported: boolean;
  isInAppBrowser: boolean;
  inAppName: string | null;
  guidanceMessageEn: string | null;
  guidanceMessageKo: string | null;
}

const SPELLING_EQUIVALENTS: Record<string, string> = {
  favourite: "favorite",
  favourites: "favorites",
  kimchee: "kimchi",
  travelling: "traveling",
  ok: "okay",
};

/**
 * Normalizes spoken or target English text by ignoring capitalization and punctuation,
 * expanding simple contractions where helpful, and unifying UK/US spelling variants.
 */
export function normalizeSpeech(input: string): string {
  if (!input) return "";
  const cleaned = input
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) return "";

  return cleaned
    .split(" ")
    .map((word) => SPELLING_EQUIVALENTS[word] ?? word)
    .join(" ");
}

export function tokenizeWords(input: string): string[] {
  const norm = normalizeSpeech(input);
  return norm ? norm.split(" ") : [];
}

function wordsMatchLoosely(spokenWord: string, targetWord: string): boolean {
  if (spokenWord === targetWord) return true;
  // Accept minor singular/plural/3rd-person inflection ("bring" vs "brings") for intelligibility
  if (spokenWord + "s" === targetWord || targetWord + "s" === spokenWord) {
    return true;
  }
  return false;
}

export function compareWordsWithTarget(
  spoken: string,
  target: string
): {
  tokens: WordMatchToken[];
  missingWords: string[];
  exactAllMatched: boolean;
  matchedCount: number;
} {
  const spokenWords = tokenizeWords(spoken);
  const originalTargetWords = target
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  const usedIndices = new Set<number>();
  const tokens: WordMatchToken[] = [];
  const missingWords: string[] = [];

  for (const rawWord of originalTargetWords) {
    const cleanTarget = normalizeSpeech(rawWord);
    if (!cleanTarget) continue;

    let foundIdx = -1;
    for (let i = 0; i < spokenWords.length; i++) {
      if (!usedIndices.has(i) && wordsMatchLoosely(spokenWords[i], cleanTarget)) {
        foundIdx = i;
        break;
      }
    }

    if (foundIdx !== -1) {
      usedIndices.add(foundIdx);
      tokens.push({ word: rawWord, matched: true });
    } else {
      tokens.push({ word: rawWord, matched: false });
      missingWords.push(rawWord.replace(/[.,!?]/g, ""));
    }
  }

  const matchedCount = tokens.filter((t) => t.matched).length;
  const exactAllMatched = tokens.length > 0 && missingWords.length === 0;

  return {
    tokens,
    missingWords,
    exactAllMatched,
    matchedCount,
  };
}

function containsKeyPhrase(spokenNorm: string, spokenWords: string[], keyPhrase: string): boolean {
  const normPhrase = normalizeSpeech(keyPhrase);
  if (!normPhrase) return true;
  if (normPhrase.includes(" ")) {
    return spokenNorm.includes(normPhrase);
  }
  return spokenWords.some((w) => wordsMatchLoosely(w, normPhrase));
}

export function isMisleadingMatch(spoken: string, turn: DialogueTurn): boolean {
  const norm = normalizeSpeech(spoken);
  if (!norm) return false;

  const normTarget = normalizeSpeech(turn.targetSentence);
  if (norm === normTarget) return false;

  const spokenWords = norm.split(" ");
  const hasAllKeyWords = turn.keyWords.every((kw) =>
    containsKeyPhrase(norm, spokenWords, kw)
  );
  if (hasAllKeyWords) {
    return false;
  }

  const normMisleading = normalizeSpeech(turn.misleadingSentence);
  if (norm === normMisleading) {
    return true;
  }

  for (const pattern of turn.misleadingPatterns) {
    const normPattern = normalizeSpeech(pattern);
    if (norm === normPattern) {
      return true;
    }
    // Catch direct "why ... korea" for Turn 1 misleading pattern
    if (normPattern.startsWith("why ") && norm.startsWith("why ") && norm.includes("korea")) {
      return true;
    }
    if (
      normPattern.length >= 10 &&
      (norm.includes(normPattern) || normPattern.includes(norm)) &&
      Math.abs(norm.length - normPattern.length) <= 8
    ) {
      return true;
    }
  }

  return false;
}

export function evaluateSpeechAttempt(
  spoken: string,
  turn: DialogueTurn,
  currentFailureCount: number
): EvaluationResult {
  const normalizedSpoken = normalizeSpeech(spoken);

  // 1. Empty / silent input -> "Let's try again" + "Please Retry"
  if (!normalizedSpoken) {
    return {
      outcome: "no_speech",
      normalizedSpoken: "",
      targetTokens: turn.targetSentence
        .trim()
        .split(/\s+/)
        .map((word) => ({ word, matched: false })),
      missingWords: [],
      nextFailureCount: currentFailureCount,
      canAdvance: false,
      showMisleadingTip: false,
      fallbackFeedback:
        "Let's try again! Please retry and speak clearly into the mic. (소리가 들리지 않았어요. 다시 한번 편하게 말해 볼까요?)",
    };
  }

  const comparison = compareWordsWithTarget(spoken, turn.targetSentence);

  // 2. Full target match (ignoring capitalization and punctuation)
  if (comparison.exactAllMatched) {
    return {
      outcome: "exact_success",
      normalizedSpoken,
      targetTokens: comparison.tokens,
      missingWords: [],
      nextFailureCount: currentFailureCount,
      canAdvance: true,
      showMisleadingTip: false,
      fallbackFeedback:
        "Perfect! I am enjoying this conversation. (좋아요! 더 이야기해 볼까요?)",
    };
  }

  // 3. Misleading sentence check (technically grammatical, culturally awkward)
  if (isMisleadingMatch(spoken, turn)) {
    return {
      outcome: "misleading",
      normalizedSpoken,
      targetTokens: comparison.tokens,
      missingWords: comparison.missingWords,
      nextFailureCount: currentFailureCount,
      canAdvance: true,
      showMisleadingTip: true,
      fallbackFeedback: `Good effort! ${turn.misleadingReasonEn} Try "${turn.targetSentence}" (${turn.misleadingReasonKo})`,
    };
  }

  // 4. Intelligible partial success: all key words present (or >= 75% words + key words) with 1-2 small words missing
  const spokenWords = normalizedSpoken.split(" ");
  const hasAllKeyWords = turn.keyWords.every((kw) =>
    containsKeyPhrase(normalizedSpoken, spokenWords, kw)
  );
  const ratio =
    comparison.tokens.length > 0
      ? comparison.matchedCount / comparison.tokens.length
      : 0;

  if (
    hasAllKeyWords &&
    comparison.missingWords.length >= 1 &&
    comparison.missingWords.length <= 2 &&
    ratio >= 0.55
  ) {
    const missingHint = comparison.missingWords[0];
    return {
      outcome: "partial_success",
      normalizedSpoken,
      targetTokens: comparison.tokens,
      missingWords: comparison.missingWords,
      nextFailureCount: currentFailureCount,
      canAdvance: true,
      showMisleadingTip: false,
      fallbackFeedback: `Good! But it becomes better with "${missingHint}". (잘했어요! "${missingHint}"를 넣어 이렇게 말하면 더 좋아요!)`,
    };
  }

  // 5. Progressive scaffolding on failure: 1st recast -> 2nd elicitation -> 3rd chunking
  const nextFailure = currentFailureCount + 1;

  if (nextFailure === 1) {
    return {
      outcome: "recast",
      normalizedSpoken,
      targetTokens: comparison.tokens,
      missingWords: comparison.missingWords,
      nextFailureCount: nextFailure,
      canAdvance: false,
      showMisleadingTip: false,
      fallbackFeedback: `Nice try! You can say, "${turn.targetSentence}" (좋은 시도예요! 이렇게 말해 볼까요?)`,
    };
  }

  if (nextFailure === 2) {
    return {
      outcome: "elicitation",
      normalizedSpoken,
      targetTokens: comparison.tokens,
      missingWords: comparison.missingWords,
      nextFailureCount: nextFailure,
      canAdvance: false,
      showMisleadingTip: false,
      fallbackFeedback: `You're almost there! "${turn.elicitationMask}" (${turn.elicitationHintKo})`,
    };
  }

  return {
    outcome: "chunking",
    normalizedSpoken,
    targetTokens: comparison.tokens,
    missingWords: comparison.missingWords,
    nextFailureCount: nextFailure,
    canAdvance: false,
    showMisleadingTip: false,
    fallbackFeedback: `Good effort! Let's try again in chunks: (${turn.chunks.join(" / ")}) (포기하지 마세요! 끊어서 천천히 말해 볼까요?)`,
  };
}

/**
 * Calculates 1–3 stars strictly rewarding completion and pragmatic choice per Section 6:
 * - 3 stars: Finished the dialogue flawlessly (target sentence)
 * - 2 stars: Finished the whole dialogue
 * - 1 star: Finished the whole dialogue, but used a misleading sentence
 */
export function calculateStars(records: TurnProgressRecord[]): {
  stars: 1 | 2 | 3;
  reasonEn: string;
  reasonKo: string;
} {
  const anyMisleading = records.some((r) => r.everUsedMisleading);
  if (anyMisleading) {
    return {
      stars: 1,
      reasonEn:
        "You finished the whole dialogue! Next time, swap direct phrases for warmer small-talk openers.",
      reasonKo:
        "대화를 끝까지 완주했어요! 다음에는 오해를 줄일 수 있는 더 부드러운 표현으로 도전해 봐요.",
    };
  }

  const allFlawless =
    records.length > 0 &&
    records.every((r) => r.completed && !r.skipped && r.flawlessFirstTry);

  if (allFlawless) {
    return {
      stars: 3,
      reasonEn:
        "Flawless small talk! You completed every turn naturally with friendly target expressions.",
      reasonKo:
        "완벽한 스몰토크였어요! 다섯 가지 주제를 모두 자연스럽고 친근한 표현으로 소화했어요.",
    };
  }

  return {
    stars: 2,
    reasonEn:
      "Great job finishing the whole dialogue! Practicing a second round will make these phrases effortless.",
    reasonKo:
      "전체 대화를 멋지게 완주했어요! 한 번 더 연습하면 입에서 훨씬 편하게 나올 거예요.",
  };
}

export function detectBrowserEnvironment(
  userAgent: string,
  hasSpeechApi: boolean
): BrowserGuidance {
  const ua = userAgent || "";
  let inAppName: string | null = null;

  if (/KAKAOTALK/i.test(ua)) {
    inAppName = "KakaoTalk";
  } else if (/Instagram/i.test(ua)) {
    inAppName = "Instagram";
  } else if (/FBAN|FBAV/i.test(ua)) {
    inAppName = "Facebook";
  } else if (/NAVER\(/i.test(ua)) {
    inAppName = "Naver";
  } else if (/Line\//i.test(ua)) {
    inAppName = "LINE";
  }

  if (inAppName) {
    return {
      isSupported: hasSpeechApi,
      isInAppBrowser: true,
      inAppName,
      guidanceMessageEn: `You opened this app inside ${inAppName}, where voice recognition may not work properly. Please open it in Chrome.`,
      guidanceMessageKo: `${inAppName} 인앱 브라우저에서는 음성 인식이 제한될 수 있어요. Chrome 브라우저로 열어 주세요.`,
    };
  }

  if (!hasSpeechApi) {
    return {
      isSupported: false,
      isInAppBrowser: false,
      inAppName: null,
      guidanceMessageEn:
        "Voice recognition is not supported in this browser. Please open it in Chrome.",
      guidanceMessageKo:
        "현재 브라우저에서는 음성 인식을 지원하지 않아요. Chrome에서 열어 주세요.",
    };
  }

  return {
    isSupported: true,
    isInAppBrowser: false,
    inAppName: null,
    guidanceMessageEn: null,
    guidanceMessageKo: null,
  };
}
