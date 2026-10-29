import { useState, useEffect } from "react";
import {
  Volume2,
  Turtle,
  Mic,
  RotateCcw,
  ArrowRight,
  SkipForward,
  Lightbulb,
  CheckCircle2,
  MessageCircle,
  ShieldCheck,
  Eye,
  EyeOff,
} from "lucide-react";
import type { DialogueLesson, DialogueTurn } from "../data/dialogues";
import type { EvaluationResult } from "../utils/dialogueEngine";
import type { MicButtonState } from "../hooks/useSpeechTools";

interface SpeakingStageProps {
  mode: "start" | "practice";
  lesson: DialogueLesson;
  turn: DialogueTurn;
  turnIndex: number;
  totalTurns: number;
  micState: MicButtonState;
  liveTranscript: string;
  spokenText: string;
  evaluation: EvaluationResult | null;
  coachFeedback: string | null;
  isFetchingFeedback: boolean;
  isModelAudioPlaying: boolean;
  activeAudioTag: string | null;
  onPlayPartnerPrompt: () => void;
  onPlayTargetNormal: () => void;
  onPlayTargetSlow: () => void;
  onPlayPartnerReply: () => void;
  onMicTap: () => void;
  onTryAgain: () => void;
  onNextTurn: () => void;
  onSkipTurn: () => void;
  onSwitchMode: (mode: "start" | "practice") => void;
}

export function SpeakingStage({
  mode,
  lesson,
  turn,
  turnIndex,
  totalTurns,
  micState,
  liveTranscript,
  spokenText,
  evaluation,
  coachFeedback,
  isFetchingFeedback,
  isModelAudioPlaying,
  activeAudioTag,
  onPlayPartnerPrompt,
  onPlayTargetNormal,
  onPlayTargetSlow,
  onPlayPartnerReply,
  onMicTap,
  onTryAgain,
  onNextTurn,
  onSkipTurn,
  onSwitchMode,
}: SpeakingStageProps) {
  const [hintStep, setHintStep] = useState<number>(0);
  const [maskTargetInPractice, setMaskTargetInPractice] = useState<boolean>(false);
  const [mascotImgFailed, setMascotImgFailed] = useState<boolean>(false);

  useEffect(() => {
    setHintStep(0);
  }, [turn.id, lesson.id, mode]);

  const isTurnUnderstood =
    evaluation?.outcome === "exact_success" ||
    evaluation?.outcome === "partial_success" ||
    evaluation?.outcome === "misleading";

  const displayedStudentText =
    micState === "listening" ? liveTranscript : spokenText;

  const micLabel =
    micState === "listening"
      ? "Listening"
      : micState === "done"
        ? "Done"
        : "Ready";

  const upcomingTurns = lesson.turns.slice(turnIndex);

  return (
    <div className="space-y-5">
      {/* Start Screen Introductory Context & Mandatory Privacy Notice */}
      {mode === "start" && (
        <section
          aria-label="Start screen overview and voice privacy notice"
          className="bg-white border border-[#E7E5DF] rounded-2xl p-4 sm:p-5"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl overflow-hidden bg-[#F3F1EA] shrink-0 flex items-center justify-center">
                {!mascotImgFailed ? (
                  <img
                    src="/src/assets/images/pineapple_mascot_emblem_1793235439299.jpg"
                    alt="Pine small-talk mascot emblem"
                    referrerPolicy="no-referrer"
                    onError={() => setMascotImgFailed(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-xl" aria-hidden="true">
                    🍍
                  </span>
                )}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-1.5 text-xs text-[#57534E]">
                  <span>Small Talk Assistant</span>
                  <span aria-hidden="true">·</span>
                  <span>{lesson.cefrLevel}</span>
                  <span aria-hidden="true">·</span>
                  <span>Listen → Speak → Feedback</span>
                </div>
                <h1 className="font-display text-lg sm:text-xl font-bold text-[#18181B] mt-0.5">
                  {lesson.title}
                </h1>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onSwitchMode("practice")}
              className="hidden sm:inline-flex min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-semibold text-[#0F766E] bg-[#F0FDFA] hover:bg-[#CCFBF1] transition-colors items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>Practice Screen</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>

          <p className="mt-3 pt-3 border-t border-[#F3F1EA] flex items-center gap-2 text-xs text-[#57534E]">
            <ShieldCheck
              className="w-4 h-4 text-[#0F766E] shrink-0"
              aria-hidden="true"
            />
            <span>
              Your voice is processed to turn it into text and is not recorded or saved.
            </span>
          </p>
        </section>
      )}

      {/* Main Top / Middle / Bottom Interactive Stage Card */}
      <section
        aria-label={
          mode === "start" ? "Guided speaking stage" : "Partner practice stage"
        }
        className="bg-white border border-[#E7E5DF] rounded-3xl p-5 sm:p-6"
      >
        {/* ================= TOP ZONE ================= */}
        <div>
          {/* Unboxed Theme & Turn Metadata */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#57534E]">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-mono tabular-nums font-medium text-[#0F766E]">
                Turn {turnIndex + 1} of {totalTurns}
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-medium text-[#18181B]">{turn.themeEn}</span>
              <span aria-hidden="true">·</span>
              <span>{turn.themeKo}</span>
            </div>

            {mode === "practice" && (
              <button
                type="button"
                onClick={() => setMaskTargetInPractice((prev) => !prev)}
                className="min-h-[36px] px-2.5 py-1 rounded-lg text-xs font-medium text-[#57534E] hover:text-[#18181B] hover:bg-[#F3F1EA] transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
              >
                {maskTargetInPractice ? (
                  <>
                    <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Show Sentence</span>
                  </>
                ) : (
                  <>
                    <EyeOff className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Memory Recall</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Screen 2 Specific Top Requirement: Coming up conversations in summary */}
          {mode === "practice" && (
            <div className="mt-3 pt-3 border-t border-[#F3F1EA]">
              <p className="text-xs font-semibold text-[#57534E] mb-2">
                Coming up in this conversation:
              </p>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#57534E]">
                {upcomingTurns.map((uTurn, idx) => (
                  <span key={uTurn.id} className="inline-flex items-center gap-2">
                    <span
                      className={
                        idx === 0
                          ? "font-semibold text-[#0F766E]"
                          : "text-[#57534E]"
                      }
                    >
                      {uTurn.id}. {uTurn.summaryLabel}
                    </span>
                    {idx < upcomingTurns.length - 1 && (
                      <span aria-hidden="true" className="text-[#D6D3CD]">
                        →
                      </span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* AI Partner Speech Bubble + Korean Meaning */}
          <div className="mt-4 bg-[#F6F5F0] rounded-2xl p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-1.5 text-xs text-[#57534E] mb-1">
                  <MessageCircle
                    className="w-3.5 h-3.5 text-[#0F766E]"
                    aria-hidden="true"
                  />
                  <span className="font-semibold text-[#18181B]">
                    {lesson.partnerName}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{lesson.partnerRole}</span>
                </div>
                <p className="text-base sm:text-lg font-semibold text-[#18181B] leading-snug">
                  &ldquo;{turn.partnerPromptEn}&rdquo;
                </p>
                <p className="text-sm text-[#57534E] mt-1">
                  ({turn.partnerPromptKo})
                </p>
              </div>

              <button
                type="button"
                onClick={onPlayPartnerPrompt}
                aria-label={`Replay partner prompt: ${turn.partnerPromptEn}`}
                className={`min-h-[44px] min-w-[44px] px-3 rounded-xl border text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                  activeAudioTag === "partner-prompt"
                    ? "bg-[#0F766E] text-white border-[#0F766E]"
                    : "bg-white text-[#18181B] border-[#D6D3CD] hover:bg-[#FAF9F5]"
                }`}
              >
                <Volume2 className="w-4 h-4" aria-hidden="true" />
                <span className="hidden sm:inline">Partner</span>
              </button>
            </div>
          </div>
        </div>

        {/* ================= MIDDLE ZONE ================= */}
        <div className="my-4 py-4 border-y border-[#E7E5DF] text-center">
          <p className="text-xs font-medium text-[#57534E] mb-1.5">
            Your turn to say ({turn.targetMeaningKo})
          </p>

          {/* Target Sentence — Largest Text on Screen */}
          {mode === "practice" && maskTargetInPractice && hintStep < 3 ? (
            <h2 className="font-display text-2xl sm:text-4xl font-bold tracking-tight text-[#18181B] leading-tight max-w-2xl mx-auto">
              {hintStep >= 2 ? turn.elicitationMask : "Speak the response from memory!"}
            </h2>
          ) : (
            <h2
              data-testid="target-sentence"
              className="font-display text-2xl sm:text-4xl font-bold tracking-tight text-[#18181B] leading-tight max-w-2xl mx-auto"
            >
              {turn.targetSentence}
            </h2>
          )}

          {/* Word-by-word comparison visual after student speaks */}
          {evaluation && evaluation.outcome !== "no_speech" && (
            <div
              aria-label="Word by word comparison"
              className="mt-3 flex flex-wrap items-center justify-center gap-2 text-sm"
            >
              {evaluation.targetTokens.map((tok, idx) => (
                <span
                  key={`${tok.word}-${idx}`}
                  className={
                    tok.matched
                      ? "font-semibold text-[#0F766E] underline decoration-[#0F766E]/40 underline-offset-4"
                      : "text-[#78716C] underline decoration-dashed decoration-[#D97706] underline-offset-4"
                  }
                >
                  {tok.matched ? `✓ ${tok.word}` : tok.word}
                </span>
              ))}
            </div>
          )}

          {/* Listen & Slow Audio Controls */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={onPlayTargetNormal}
              className={`min-h-[44px] px-4 py-2 rounded-xl border text-sm font-semibold transition-colors inline-flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F766E] ${
                activeAudioTag === "target-normal"
                  ? "bg-[#0F766E] text-white border-[#0F766E]"
                  : "bg-[#FAF9F5] text-[#18181B] border-[#D6D3CD] hover:bg-[#F3F1EA]"
              }`}
            >
              <Volume2
                className={`w-4 h-4 shrink-0 ${
                  activeAudioTag === "target-normal" ? "text-white" : "text-[#0F766E]"
                }`}
                aria-hidden="true"
              />
              <span>{mode === "practice" ? "Speak (Listen)" : "Listen"}</span>
            </button>

            <button
              type="button"
              onClick={onPlayTargetSlow}
              className={`min-h-[44px] px-4 py-2 rounded-xl border text-sm font-semibold transition-colors inline-flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F766E] ${
                activeAudioTag === "target-slow"
                  ? "bg-[#0F766E] text-white border-[#0F766E]"
                  : "bg-[#FAF9F5] text-[#18181B] border-[#D6D3CD] hover:bg-[#F3F1EA]"
              }`}
            >
              <Turtle
                className={`w-4 h-4 shrink-0 ${
                  activeAudioTag === "target-slow" ? "text-white" : "text-[#D97706]"
                }`}
                aria-hidden="true"
              />
              <span>Slow</span>
            </button>
          </div>
        </div>

        {/* ================= BOTTOM ZONE ================= */}
        <div className="flex flex-col items-center">
          {/* Large Round [🎤 Mic] Button (Ready -> Listening -> Done) */}
          <button
            type="button"
            onClick={onMicTap}
            disabled={isModelAudioPlaying}
            aria-label={`Mic: ${
              isModelAudioPlaying ? "Disabled while audio is playing" : micLabel
            }`}
            data-testid="mic-button"
            className={`w-22 h-22 sm:w-24 sm:h-24 rounded-full flex flex-col items-center justify-center gap-1 font-semibold transition-transform active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0F766E] ${
              isModelAudioPlaying
                ? "bg-[#E7E5DF] text-[#78716C] cursor-not-allowed opacity-75"
                : micState === "listening"
                  ? "bg-[#DC2626] text-white shadow-lg shadow-[#DC2626]/25 cursor-pointer"
                  : micState === "done"
                    ? "bg-[#115E59] text-white shadow-md cursor-pointer hover:bg-[#0F766E]"
                    : "bg-[#0F766E] text-white shadow-md hover:bg-[#115E59] cursor-pointer"
            }`}
          >
            <Mic className="w-6 h-6" aria-hidden="true" />
            <span className="text-xs tracking-tight whitespace-nowrap">
              {isModelAudioPlaying ? "Playing..." : micLabel}
            </span>
          </button>

          <p className="mt-2.5 text-xs text-[#57534E] text-center">
            {isModelAudioPlaying
              ? "Wait until model audio finishes playing..."
              : micState === "listening"
                ? "Speak now — stops automatically after 1.5s of silence (or tap to finish)"
                : "Tap the mic and speak naturally in English"}
          </p>

          {/* Screen 2 Specific Bottom Requirement: Hint Button */}
          {mode === "practice" && (
            <div className="mt-3 flex flex-col items-center w-full max-w-lg">
              <button
                type="button"
                onClick={() => setHintStep((prev) => (prev >= 3 ? 1 : prev + 1))}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-[#FFFBEB] border border-[#FDE68A] text-xs sm:text-sm font-semibold text-[#92400E] hover:bg-[#FEF3C7] transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Lightbulb className="w-4 h-4 text-[#D97706]" aria-hidden="true" />
                <span>
                  {hintStep === 0
                    ? "Show Hint"
                    : hintStep === 1
                      ? "More Clue (First Letter)"
                      : hintStep === 2
                        ? "Show Chunked Rhythm"
                        : "Restart Hint"}
                </span>
              </button>

              {hintStep > 0 && (
                <div
                  role="region"
                  aria-label="Speaking hint"
                  className="mt-2.5 w-full rounded-xl bg-[#FFFBEB] p-3.5 text-center text-sm text-[#78350F]"
                >
                  {hintStep === 1 && (
                    <p>
                      <span className="font-semibold">Key words:</span>{" "}
                      {turn.keyWords.join(", ")} · ({turn.targetMeaningKo})
                    </p>
                  )}
                  {hintStep === 2 && (
                    <p>
                      <span className="font-semibold">First-letter clue:</span>{" "}
                      {turn.elicitationMask} ({turn.elicitationHintKo})
                    </p>
                  )}
                  {hintStep >= 3 && (
                    <p>
                      <span className="font-semibold">Speak in chunks:</span> (
                      {turn.chunks.join(" / ")})
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Student Recognized Speech Display */}
          {(micState === "listening" || displayedStudentText) && (
            <div
              data-testid="student-spoken-text"
              className="mt-4 w-full max-w-xl rounded-2xl bg-[#F6F5F0] px-4 py-3 text-center"
            >
              <span className="text-xs font-medium text-[#57534E] block mb-0.5">
                You said:
              </span>
              <p className="text-base font-semibold text-[#18181B]">
                {displayedStudentText
                  ? `"${displayedStudentText}"`
                  : "Listening for your voice..."}
              </p>
            </div>
          )}

          {/* Feedback Box (Section 7 rules: Praise first, <= 2 sentences, English + Korean, never shows misleading sentence on 1st-try success) */}
          {(coachFeedback || isFetchingFeedback) && (
            <div
              role="status"
              aria-live="polite"
              data-testid="feedback-box"
              className={`mt-4 w-full max-w-xl rounded-2xl p-4 sm:p-5 ${
                evaluation?.outcome === "exact_success" ||
                evaluation?.outcome === "partial_success"
                  ? "bg-[#F0FDFA] text-[#134E4A]"
                  : "bg-[#FFFBEB] text-[#78350F]"
              }`}
            >
              <div className="flex items-start gap-3">
                <CheckCircle2
                  className={`w-5 h-5 shrink-0 mt-0.5 ${
                    evaluation?.outcome === "exact_success" ||
                    evaluation?.outcome === "partial_success"
                      ? "text-[#0F766E]"
                      : "text-[#D97706]"
                  }`}
                  aria-hidden="true"
                />
                <div className="flex-1 text-left">
                  <p className="text-xs font-semibold opacity-80 mb-1">
                    Pine&apos;s Coaching Feedback
                  </p>
                  <p className="text-sm sm:text-base font-medium leading-relaxed">
                    {isFetchingFeedback && !coachFeedback
                      ? "Listening to your meaning..."
                      : coachFeedback}
                  </p>

                  {/* Partner's Natural Reply once understood */}
                  {isTurnUnderstood && (
                    <div className="mt-3 pt-3 border-t border-black/10 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs opacity-80">
                          {lesson.partnerName} replies:
                        </p>
                        <p className="text-sm sm:text-base font-bold">
                          &ldquo;{turn.partnerReplyEn}&rdquo;{" "}
                          <span className="font-normal text-xs sm:text-sm opacity-85">
                            ({turn.partnerReplyKo})
                          </span>
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={onPlayPartnerReply}
                        aria-label={`Play partner reply: ${turn.partnerReplyEn}`}
                        className="min-h-[40px] min-w-[40px] px-2.5 rounded-xl bg-white/80 hover:bg-white text-xs font-semibold inline-flex items-center justify-center gap-1 shrink-0 cursor-pointer"
                      >
                        <Volume2 className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons: [Try Again] [Next ->] [Skip] */}
          <div className="mt-6 pt-5 border-t border-[#F3F1EA] w-full flex flex-wrap items-center justify-center sm:justify-between gap-3">
            <button
              type="button"
              onClick={onTryAgain}
              className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#FAF9F5] border border-[#D6D3CD] text-sm font-semibold text-[#18181B] hover:bg-[#F3F1EA] transition-colors inline-flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" aria-hidden="true" />
              <span>Try Again</span>
            </button>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onSkipTurn}
                className="min-h-[44px] px-4 py-2.5 rounded-xl text-sm font-medium text-[#57534E] hover:text-[#18181B] hover:bg-[#F3F1EA] transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span>Skip</span>
                <SkipForward className="w-4 h-4" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={onNextTurn}
                className={`min-h-[44px] px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors inline-flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer ${
                  isTurnUnderstood
                    ? "bg-[#0F766E] text-white hover:bg-[#115E59] shadow-sm"
                    : "bg-[#18181B] text-white hover:bg-[#27272A]"
                }`}
              >
                <span>
                  {turnIndex + 1 === totalTurns ? "Finish" : "Next"}
                </span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
