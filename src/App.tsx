/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { LESSONS, type DialogueLesson } from "./data/dialogues";
import {
  evaluateSpeechAttempt,
  type EvaluationResult,
  type TurnProgressRecord,
} from "./utils/dialogueEngine";
import { useSpeechTools } from "./hooks/useSpeechTools";
import { TopBar, type AppScreenView } from "./components/TopBar";
import { BrowserNoticeBanner } from "./components/BrowserNoticeBanner";
import { SpeakingStage } from "./components/SpeakingStage";
import { DialogueSidebar } from "./components/DialogueSidebar";
import { ResultScreen } from "./components/ResultScreen";
import { TipsView } from "./components/TipsView";

function createInitialRecords(lesson: DialogueLesson): TurnProgressRecord[] {
  return lesson.turns.map((turn) => ({
    turnId: turn.id,
    completed: false,
    skipped: false,
    flawlessFirstTry: false,
    everUsedMisleading: false,
    attempts: 0,
    lastSpoken: "",
    lastOutcome: null,
  }));
}

export default function App() {
  const [activeLessonId, setActiveLessonId] = useState<string>(LESSONS[0].id);
  const [activeScreen, setActiveScreen] = useState<AppScreenView>(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("screen") === "practice") return "practice";
      if (params.get("screen") === "result") return "result";
    }
    return "start";
  });

  const activeLesson =
    LESSONS.find((l) => l.id === activeLessonId) || LESSONS[0];

  const [turnIndex, setTurnIndex] = useState<number>(0);
  const [records, setRecords] = useState<TurnProgressRecord[]>(() =>
    createInitialRecords(activeLesson)
  );
  const [failureCount, setFailureCount] = useState<number>(0);
  const [spokenText, setSpokenText] = useState<string>("");
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [coachFeedback, setCoachFeedback] = useState<string | null>(null);
  const [isFetchingFeedback, setIsFetchingFeedback] = useState<boolean>(false);

  const currentTurn = activeLesson.turns[turnIndex] || activeLesson.turns[0];
  const failureCountRef = useRef(failureCount);
  const currentTurnRef = useRef(currentTurn);
  const turnIndexRef = useRef(turnIndex);
  const hasUserInteractedRef = useRef(false);

  useEffect(() => {
    failureCountRef.current = failureCount;
  }, [failureCount]);

  useEffect(() => {
    currentTurnRef.current = currentTurn;
    turnIndexRef.current = turnIndex;
  }, [currentTurn, turnIndex]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  }, [activeScreen]);

  const handleEvaluateTranscript = useCallback(async (transcript: string) => {
    const turn = currentTurnRef.current;
    const idx = turnIndexRef.current;
    const result = evaluateSpeechAttempt(
      transcript,
      turn,
      failureCountRef.current
    );

    setSpokenText(transcript);
    setEvaluation(result);
    setFailureCount(result.nextFailureCount);
    // Immediately display deterministic Section 7 feedback so app works smoothly with zero latency,
    // then upgrade with Gemini coaching sentence if available.
    setCoachFeedback(result.fallbackFeedback);

    if (result.outcome !== "no_speech") {
      setRecords((prev) =>
        prev.map((rec, i) => {
          if (i !== idx) return rec;
          const nextAttempts = rec.attempts + 1;
          const isCompleted =
            rec.completed ||
            result.outcome === "exact_success" ||
            result.outcome === "partial_success" ||
            result.outcome === "misleading";
          const isFlawlessFirst =
            nextAttempts === 1 &&
            result.outcome === "exact_success" &&
            !rec.everUsedMisleading;

          return {
            ...rec,
            completed: isCompleted,
            flawlessFirstTry: rec.attempts === 0 ? isFlawlessFirst : rec.flawlessFirstTry,
            everUsedMisleading:
              rec.everUsedMisleading || result.outcome === "misleading",
            attempts: nextAttempts,
            lastSpoken: transcript,
            lastOutcome: result.outcome,
          };
        })
      );
    }

    // Request personalized Section 7 feedback from Gemini server proxy (falls back gracefully if offline/unconfigured)
    if (result.outcome !== "no_speech") {
      setIsFetchingFeedback(true);
      try {
        const res = await fetch("/api/feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            targetSentence: turn.targetSentence,
            spokenText: transcript,
            outcome: result.outcome,
            missingWord: result.missingWords[0] || "",
            elicitationMask: turn.elicitationMask,
            chunks: turn.chunks,
            misleadingSentence: turn.misleadingSentence,
            misleadingReasonEn: turn.misleadingReasonEn,
            misleadingReasonKo: turn.misleadingReasonKo,
          }),
        });
        if (res.ok) {
          const data = (await res.json()) as { feedback?: string | null };
          if (data.feedback && data.feedback.trim().length > 0) {
            setCoachFeedback(data.feedback);
          }
        }
      } catch {
        // Keep Section 7 table fallback feedback
      } finally {
        setIsFetchingFeedback(false);
      }
    }
  }, []);

  const {
    micState,
    liveTranscript,
    isModelAudioPlaying,
    activeAudioTag,
    micPermissionDenied,
    browserGuidance,
    speakText,
    stopModelAudio,
    startListening,
    stopListening,
    resetMicToReady,
  } = useSpeechTools(handleEvaluateTranscript);

  const clearTurnFeedbackState = useCallback(() => {
    setFailureCount(0);
    setSpokenText("");
    setEvaluation(null);
    setCoachFeedback(null);
    setIsFetchingFeedback(false);
    resetMicToReady();
  }, [resetMicToReady]);

  // Read partner's opening situation prompt aloud once on initial load (Section 5.1)
  useEffect(() => {
    const firstPrompt = LESSONS[0]?.turns[0]?.partnerPromptEn;
    if (firstPrompt) {
      speakText(firstPrompt, 0.9, "partner-prompt", true);
    }
  }, [speakText]);

  // Read partner's prompt aloud once when moving to a new turn after user interaction (Section 5.1)
  const moveToTurn = useCallback(
    (nextIdx: number, lessonObj: DialogueLesson = activeLesson) => {
      clearTurnFeedbackState();
      setTurnIndex(nextIdx);
      const nextTurn = lessonObj.turns[nextIdx];
      if (nextTurn && hasUserInteractedRef.current) {
        speakText(nextTurn.partnerPromptEn, 0.9, "partner-prompt");
      }
    },
    [activeLesson, clearTurnFeedbackState, speakText]
  );

  const handleMicTap = () => {
    hasUserInteractedRef.current = true;
    if (micState === "listening") {
      stopListening();
    } else {
      setEvaluation(null);
      setCoachFeedback(null);
      startListening();
    }
  };

  const handleTryAgain = () => {
    hasUserInteractedRef.current = true;
    setSpokenText("");
    setEvaluation(null);
    setCoachFeedback(null);
    resetMicToReady();
  };

  const handleNextTurn = () => {
    hasUserInteractedRef.current = true;
    setRecords((prev) =>
      prev.map((rec, i) => (i === turnIndex ? { ...rec, completed: true } : rec))
    );

    if (turnIndex + 1 < activeLesson.turns.length) {
      moveToTurn(turnIndex + 1);
    } else {
      stopModelAudio();
      resetMicToReady();
      setActiveScreen("result");
    }
  };

  const handleSkipTurn = () => {
    hasUserInteractedRef.current = true;
    setRecords((prev) =>
      prev.map((rec, i) =>
        i === turnIndex ? { ...rec, completed: true, skipped: true } : rec
      )
    );

    if (turnIndex + 1 < activeLesson.turns.length) {
      moveToTurn(turnIndex + 1);
    } else {
      stopModelAudio();
      resetMicToReady();
      setActiveScreen("result");
    }
  };

  const handleSelectLesson = (lessonId: string, targetScreen: AppScreenView = "start") => {
    hasUserInteractedRef.current = true;
    const found = LESSONS.find((l) => l.id === lessonId) || LESSONS[0];
    stopModelAudio();
    clearTurnFeedbackState();
    setActiveLessonId(found.id);
    setTurnIndex(0);
    setRecords(createInitialRecords(found));
    setActiveScreen(targetScreen);
    speakText(found.turns[0].partnerPromptEn, 0.9, "partner-prompt");
  };

  const handleRestartCurrent = () => {
    hasUserInteractedRef.current = true;
    stopModelAudio();
    clearTurnFeedbackState();
    setTurnIndex(0);
    setRecords(createInitialRecords(activeLesson));
    if (activeScreen === "result" || activeScreen === "tips") {
      setActiveScreen("start");
    }
    speakText(activeLesson.turns[0].partnerPromptEn, 0.9, "partner-prompt");
  };

  const handleNextLessonFromResult = () => {
    hasUserInteractedRef.current = true;
    if (activeLessonId === LESSONS[0].id) {
      // Move to Bonus Scenario 2 in Practice Mode so student builds confidence in a new scenario
      handleSelectLesson(LESSONS[1].id, "practice");
    } else {
      handleSelectLesson(LESSONS[0].id, "start");
    }
  };

  const mobileTabs: { id: AppScreenView; label: string }[] = [
    { id: "start", label: "Start" },
    { id: "practice", label: "Practice" },
    { id: "tips", label: "Tips" },
    { id: "result", label: "Result" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F5] text-[#18181B]">
      <TopBar
        activeScreen={activeScreen}
        onSelectScreen={(screen) => {
          hasUserInteractedRef.current = true;
          stopModelAudio();
          setActiveScreen(screen);
        }}
        onRestart={handleRestartCurrent}
      />

      {/* Mobile Compact Mode Switcher (Non-sticky so sticky height stays strictly <= 15%) */}
      <div className="md:hidden max-w-6xl w-full mx-auto px-4 pt-3">
        <div
          role="tablist"
          aria-label="Screen mode selector"
          className="grid grid-cols-4 gap-1 p-1 bg-[#EAE8E1] rounded-xl"
        >
          {mobileTabs.map((tab) => {
            const active = activeScreen === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => {
                  hasUserInteractedRef.current = true;
                  stopModelAudio();
                  setActiveScreen(tab.id);
                }}
                className={`min-h-[40px] rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                  active
                    ? "bg-white text-[#18181B] shadow-xs"
                    : "text-[#57534E] hover:text-[#18181B]"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-5 sm:py-8">
        <BrowserNoticeBanner
          browserGuidance={browserGuidance}
          micPermissionDenied={micPermissionDenied}
          onManualSpeechSubmit={(text) => {
            hasUserInteractedRef.current = true;
            handleEvaluateTranscript(text);
          }}
        />

        {(activeScreen === "start" || activeScreen === "practice") && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-7">
              <SpeakingStage
                mode={activeScreen}
                lesson={activeLesson}
                turn={currentTurn}
                turnIndex={turnIndex}
                totalTurns={activeLesson.turns.length}
                micState={micState}
                liveTranscript={liveTranscript}
                spokenText={spokenText}
                evaluation={evaluation}
                coachFeedback={coachFeedback}
                isFetchingFeedback={isFetchingFeedback}
                isModelAudioPlaying={isModelAudioPlaying}
                activeAudioTag={activeAudioTag}
                onPlayPartnerPrompt={() => {
                  hasUserInteractedRef.current = true;
                  speakText(currentTurn.partnerPromptEn, 0.9, "partner-prompt");
                }}
                onPlayTargetNormal={() => {
                  hasUserInteractedRef.current = true;
                  speakText(currentTurn.targetSentence, 0.9, "target-normal");
                }}
                onPlayTargetSlow={() => {
                  hasUserInteractedRef.current = true;
                  speakText(currentTurn.targetSentence, 0.7, "target-slow");
                }}
                onPlayPartnerReply={() => {
                  hasUserInteractedRef.current = true;
                  speakText(currentTurn.partnerReplyEn, 0.9, "partner-reply");
                }}
                onMicTap={handleMicTap}
                onTryAgain={handleTryAgain}
                onNextTurn={handleNextTurn}
                onSkipTurn={handleSkipTurn}
                onSwitchMode={(nextMode) => {
                  hasUserInteractedRef.current = true;
                  setActiveScreen(nextMode);
                }}
              />
            </div>

            <div className="lg:col-span-5">
              <DialogueSidebar
                lessons={LESSONS}
                activeLessonId={activeLessonId}
                onSelectLesson={(id) => handleSelectLesson(id, activeScreen)}
                currentTurnIndex={turnIndex}
                onJumpToTurn={(idx) => {
                  hasUserInteractedRef.current = true;
                  moveToTurn(idx);
                }}
                records={records}
              />
            </div>
          </div>
        )}

        {activeScreen === "tips" && (
          <TipsView
            lesson={activeLesson}
            onPlaySentence={(text, tag) => {
              hasUserInteractedRef.current = true;
              speakText(text, 0.9, tag);
            }}
            activeAudioTag={activeAudioTag}
            onBackToPractice={() => setActiveScreen("practice")}
          />
        )}

        {activeScreen === "result" && (
          <ResultScreen
            lesson={activeLesson}
            records={records}
            onPlaySentence={(text, tag) => {
              hasUserInteractedRef.current = true;
              speakText(text, 0.9, tag);
            }}
            activeAudioTag={activeAudioTag}
            onRetryDialogue={handleRestartCurrent}
            onRetrySingleTurn={(idx) => {
              hasUserInteractedRef.current = true;
              setActiveScreen("start");
              moveToTurn(idx);
            }}
            onNextLesson={handleNextLessonFromResult}
            nextLessonLabel={
              activeLessonId === LESSONS[0].id
                ? "Next Lesson: Helping with Directions"
                : "Back to Lesson 1: Traveler in Seoul"
            }
          />
        )}
      </main>

      <footer className="border-t border-[#E7E5DF] bg-[#FAF9F5] py-4 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#57534E]">
          <span>I&apos;m Pine🍍, Tank you🔫! · Small Talk Speaking Coach</span>
          <span>
            No personal data collected · Voice is converted to text in-browser and never recorded or saved
          </span>
        </div>
      </footer>
    </div>
  );
}
