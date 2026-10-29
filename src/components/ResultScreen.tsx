import { Star, RotateCcw, ArrowRight, Volume2, Sparkles } from "lucide-react";
import type { DialogueLesson } from "../data/dialogues";
import {
  calculateStars,
  type TurnProgressRecord,
} from "../utils/dialogueEngine";

interface ResultScreenProps {
  lesson: DialogueLesson;
  records: TurnProgressRecord[];
  onPlaySentence: (text: string, tag: string) => void;
  activeAudioTag: string | null;
  onRetryDialogue: () => void;
  onRetrySingleTurn: (turnIndex: number) => void;
  onNextLesson: () => void;
  nextLessonLabel: string;
}

export function ResultScreen({
  lesson,
  records,
  onPlaySentence,
  activeAudioTag,
  onRetryDialogue,
  onRetrySingleTurn,
  onNextLesson,
  nextLessonLabel,
}: ResultScreenProps) {
  const { stars, reasonEn, reasonKo } = calculateStars(records);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* ================= TOP: Well done! + Completion Stars ================= */}
      <section
        aria-label="Lesson completion summary"
        data-testid="result-screen"
        className="bg-white border border-[#E7E5DF] rounded-3xl p-6 sm:p-8 text-center"
      >
        <div
          aria-label={`${stars} out of 3 stars earned`}
          className="inline-flex items-center justify-center gap-2 mb-3"
        >
          {[1, 2, 3].map((idx) => (
            <Star
              key={idx}
              className={`w-9 h-9 ${
                idx <= stars
                  ? "fill-[#F59E0B] text-[#D97706]"
                  : "fill-[#F3F1EA] text-[#D6D3CD]"
              }`}
              aria-hidden="true"
            />
          ))}
        </div>

        <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#18181B]">
          Well done!
        </h1>
        <p className="text-base sm:text-lg font-medium text-[#18181B] mt-2 max-w-xl mx-auto">
          {reasonEn}
        </p>
        <p className="text-sm text-[#57534E] mt-1 max-w-xl mx-auto">
          ({reasonKo})
        </p>

        <div className="mt-5 pt-4 border-t border-[#F3F1EA] flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-[#57534E]">
          <span>⭐⭐⭐ Flawless target dialogue</span>
          <span aria-hidden="true">·</span>
          <span>⭐⭐ Completed whole dialogue</span>
          <span aria-hidden="true">·</span>
          <span>⭐ Completed with direct phrasing to polish</span>
        </div>
      </section>

      {/* ================= MIDDLE: Tips for Real-Life Use ================= */}
      <section
        aria-label="Tips for real-life small talk"
        className="bg-white border border-[#E7E5DF] rounded-3xl p-6 sm:p-8"
      >
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-5 h-5 text-[#0F766E]" aria-hidden="true" />
          <h2 className="font-display text-xl sm:text-2xl font-bold text-[#18181B]">
            Tips for Real-Life Use
          </h2>
        </div>
        <p className="text-sm text-[#57534E] mb-5">
          Small talk is about sounding warm and curious—not grammar perfection. Review your 5 expressions below:
        </p>

        <div className="divide-y divide-[#E7E5DF]">
          {lesson.turns.map((turn, idx) => {
            const rec = records[idx];
            const tag = `result-turn-${turn.id}`;
            return (
              <div
                key={turn.id}
                className="py-4 first:pt-1 last:pb-1 flex flex-col sm:flex-row sm:items-start justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-1.5 text-xs text-[#57534E]">
                    <span className="font-mono tabular-nums font-semibold text-[#0F766E]">
                      0{turn.id}.
                    </span>
                    <span>{turn.summaryLabel}</span>
                    {rec?.lastSpoken && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span>You said: &ldquo;{rec.lastSpoken}&rdquo;</span>
                      </>
                    )}
                  </div>

                  <p className="font-display text-lg font-bold text-[#18181B]">
                    &ldquo;{turn.targetSentence}&rdquo;{" "}
                    <span className="font-sans text-sm font-normal text-[#57534E]">
                      ({turn.targetMeaningKo})
                    </span>
                  </p>

                  <p className="text-sm text-[#18181B]">{turn.realLifeTipEn}</p>
                  <p className="text-xs text-[#57534E]">({turn.realLifeTipKo})</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => onPlaySentence(turn.targetSentence, tag)}
                    aria-label={`Listen to ${turn.targetSentence}`}
                    className={`min-h-[40px] px-3 py-2 rounded-xl border text-xs font-semibold transition-colors inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                      activeAudioTag === tag
                        ? "bg-[#0F766E] text-white border-[#0F766E]"
                        : "bg-[#FAF9F5] text-[#18181B] border-[#D6D3CD] hover:bg-[#F3F1EA]"
                    }`}
                  >
                    <Volume2 className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Listen</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onRetrySingleTurn(idx)}
                    className="min-h-[40px] px-3 py-2 rounded-xl text-xs font-semibold text-[#0F766E] hover:bg-[#F0FDFA] transition-colors whitespace-nowrap cursor-pointer"
                  >
                    Retry Turn {turn.id}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ================= BOTTOM: Retry Question & Next Lesson ================= */}
      <section
        aria-label="Next steps"
        className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-6"
      >
        <button
          type="button"
          onClick={onRetryDialogue}
          className="min-h-[48px] px-5 py-3 rounded-2xl bg-white border border-[#D6D3CD] text-sm font-semibold text-[#18181B] hover:bg-[#F3F1EA] transition-colors inline-flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" aria-hidden="true" />
          <span>Retry Dialogue</span>
        </button>

        <button
          type="button"
          onClick={onNextLesson}
          className="min-h-[48px] px-6 py-3 rounded-2xl bg-[#0F766E] text-white text-sm font-semibold hover:bg-[#115E59] transition-colors inline-flex items-center justify-center gap-2 whitespace-nowrap shadow-sm cursor-pointer"
        >
          <span>{nextLessonLabel}</span>
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </button>
      </section>
    </div>
  );
}
