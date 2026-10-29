import { Volume2, ArrowRight, MessageSquareHeart } from "lucide-react";
import type { DialogueLesson } from "../data/dialogues";

interface TipsViewProps {
  lesson: DialogueLesson;
  onPlaySentence: (text: string, tag: string) => void;
  activeAudioTag: string | null;
  onBackToPractice: () => void;
}

export function TipsView({
  lesson,
  onPlaySentence,
  activeAudioTag,
  onBackToPractice,
}: TipsViewProps) {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <section className="bg-white border border-[#E7E5DF] rounded-3xl p-6 sm:p-8">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <div className="flex items-center gap-2">
            <MessageSquareHeart
              className="w-5 h-5 text-[#0F766E]"
              aria-hidden="true"
            />
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#18181B]">
              Small Talk Pragmatics Guide
            </h1>
          </div>

          <button
            type="button"
            onClick={onBackToPractice}
            className="min-h-[42px] px-4 py-2 rounded-xl bg-[#0F766E] text-white text-sm font-semibold hover:bg-[#115E59] transition-colors inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <span>Practice Speaking</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <p className="text-sm sm:text-base text-[#57534E] leading-relaxed">
          Many Korean learners already know enough English grammar—what makes small talk feel nervous is worrying whether a sentence sounds too blunt. Here is how small changes make your English sound warm and friendly:
        </p>

        <div className="mt-6 divide-y divide-[#E7E5DF]">
          {lesson.turns.map((turn) => {
            const tag = `tip-audio-${turn.id}`;
            return (
              <div key={turn.id} className="py-5 first:pt-2 last:pb-1 space-y-2">
                <div className="flex items-center gap-1.5 text-xs text-[#57534E]">
                  <span className="font-mono tabular-nums font-semibold text-[#0F766E]">
                    0{turn.id}.
                  </span>
                  <span className="font-semibold text-[#18181B]">
                    {turn.summaryLabel}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{turn.themeKo}</span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="font-display text-lg sm:text-xl font-bold text-[#0F766E]">
                      Say: &ldquo;{turn.targetSentence}&rdquo;
                    </p>
                    <p className="text-xs text-[#57534E] mt-0.5">
                      Instead of blunt phrasing like &ldquo;{turn.misleadingSentence}&rdquo; — {turn.misleadingReasonEn}
                    </p>
                    <p className="text-xs text-[#57534E] mt-0.5">
                      ({turn.misleadingReasonKo})
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => onPlaySentence(turn.targetSentence, tag)}
                    className={`min-h-[42px] px-3.5 py-2 rounded-xl border text-xs font-semibold transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 self-start sm:self-center cursor-pointer ${
                      activeAudioTag === tag
                        ? "bg-[#0F766E] text-white border-[#0F766E]"
                        : "bg-[#FAF9F5] text-[#18181B] border-[#D6D3CD] hover:bg-[#F3F1EA]"
                    }`}
                  >
                    <Volume2 className="w-4 h-4" aria-hidden="true" />
                    <span>Listen (0.9x)</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
