import test from "node:test";
import assert from "node:assert/strict";
import { LESSONS } from "../data/dialogues";
import {
  normalizeSpeech,
  evaluateSpeechAttempt,
  calculateStars,
  detectBrowserEnvironment,
  type TurnProgressRecord,
} from "./dialogueEngine";

const mainLesson = LESSONS[0];

test("ignores capitalization and punctuation differences", () => {
  const turn1 = mainLesson.turns[0];
  const res = evaluateSpeechAttempt("what brings you to korea", turn1, 0);
  assert.equal(res.outcome, "exact_success");
  assert.equal(res.canAdvance, true);
  assert.equal(res.showMisleadingTip, false);

  const turn2 = mainLesson.turns[1];
  const res2 = evaluateSpeechAttempt("NICE how is korea so far", turn2, 0);
  assert.equal(res2.outcome, "exact_success");
  assert.equal(res2.showMisleadingTip, false);
});

test("saying nothing returns no_speech with Let's try again message", () => {
  const turn1 = mainLesson.turns[0];
  const res = evaluateSpeechAttempt("   ", turn1, 0);
  assert.equal(res.outcome, "no_speech");
  assert.equal(res.nextFailureCount, 0);
  assert.match(res.fallbackFeedback, /Let's try again/i);
  assert.match(res.fallbackFeedback, /Please retry/i);
});

test("detects small missing word as intelligible partial_success", () => {
  const turn1 = mainLesson.turns[0];
  const res = evaluateSpeechAttempt("What bring you Korea", turn1, 0);
  assert.equal(res.outcome, "partial_success");
  assert.equal(res.canAdvance, true);
  assert.equal(res.showMisleadingTip, false);
  assert.match(res.fallbackFeedback, /becomes better with "to"/i);
});

test("detects misleading sentences across all 5 turns and explains why", () => {
  const misleadingInputs = [
    "Why are you in korea?",
    "How is korea?",
    "What did you do?",
    "What food did you eat?",
    "Goodbye.",
  ];

  mainLesson.turns.forEach((turn, idx) => {
    const res = evaluateSpeechAttempt(misleadingInputs[idx], turn, 0);
    assert.equal(
      res.outcome,
      "misleading",
      `Expected Turn ${turn.id} input "${misleadingInputs[idx]}" to be misleading`
    );
    assert.equal(res.showMisleadingTip, true);
    assert.equal(res.canAdvance, true);
  });
});

test("progresses feedback through 1st recast -> 2nd elicitation -> 3rd chunking without forbidden terms", () => {
  const turn1 = mainLesson.turns[0];

  const attempt1 = evaluateSpeechAttempt("I like apples", turn1, 0);
  assert.equal(attempt1.outcome, "recast");
  assert.equal(attempt1.nextFailureCount, 1);
  assert.match(attempt1.fallbackFeedback, /Nice try! You can say/i);

  const attempt2 = evaluateSpeechAttempt("Where are you going", turn1, attempt1.nextFailureCount);
  assert.equal(attempt2.outcome, "elicitation");
  assert.equal(attempt2.nextFailureCount, 2);
  assert.match(attempt2.fallbackFeedback, /W___ brings you to Korea\?/);

  const attempt3 = evaluateSpeechAttempt("Hello friend", turn1, attempt2.nextFailureCount);
  assert.equal(attempt3.outcome, "chunking");
  assert.equal(attempt3.nextFailureCount, 3);
  assert.match(attempt3.fallbackFeedback, /What \/ brings you \/ to Korea\?/);

  for (const r of [attempt1, attempt2, attempt3]) {
    assert.doesNotMatch(r.fallbackFeedback, /\bwrong\b|%|tongue|lip|mouth/i);
  }
});

test("star rules award 3 for flawless, 2 for standard completion, 1 if misleading sentence used", () => {
  const flawless: TurnProgressRecord[] = mainLesson.turns.map((t) => ({
    turnId: t.id,
    completed: true,
    skipped: false,
    flawlessFirstTry: true,
    everUsedMisleading: false,
    attempts: 1,
    lastSpoken: t.targetSentence,
    lastOutcome: "exact_success",
  }));
  assert.equal(calculateStars(flawless).stars, 3);

  const retried: TurnProgressRecord[] = flawless.map((r, idx) =>
    idx === 2 ? { ...r, flawlessFirstTry: false, attempts: 2 } : r
  );
  assert.equal(calculateStars(retried).stars, 2);

  const withMisleading: TurnProgressRecord[] = flawless.map((r, idx) =>
    idx === 0 ? { ...r, everUsedMisleading: true } : r
  );
  assert.equal(calculateStars(withMisleading).stars, 1);
});

test("browser guidance detects KakaoTalk, Instagram, and unsupported browsers", () => {
  const kakao = detectBrowserEnvironment("Mozilla/5.0 KAKAOTALK 10.5.0", true);
  assert.equal(kakao.isInAppBrowser, true);
  assert.match(kakao.guidanceMessageEn ?? "", /Please open it in Chrome/);

  const insta = detectBrowserEnvironment("Mozilla/5.0 Instagram 302.0", true);
  assert.equal(insta.isInAppBrowser, true);

  const noSpeech = detectBrowserEnvironment("Mozilla/5.0 Firefox/128.0", false);
  assert.equal(noSpeech.isSupported, false);
  assert.match(noSpeech.guidanceMessageEn ?? "", /Please open it in Chrome/);

  const chrome = detectBrowserEnvironment("Mozilla/5.0 Chrome/130.0.0.0", true);
  assert.equal(chrome.isSupported, true);
  assert.equal(chrome.guidanceMessageEn, null);
});

test("normalizes British/American favourite spelling", () => {
  assert.equal(
    normalizeSpeech("What was your favourite thing?"),
    "what was your favorite thing"
  );
});
