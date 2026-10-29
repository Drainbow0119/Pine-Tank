import { useState } from "react";
import { Check, Compass, Sparkles } from "lucide-react";
import type { DialogueLesson } from "../data/dialogues";
import type { TurnProgressRecord } from "../utils/dialogueEngine";

interface DialogueSidebarProps {
  lessons: DialogueLesson[];
  activeLessonId: string;
  onSelectLesson: (lessonId: string) => void;
  currentTurnIndex: number;
  onJumpToTurn: (index: number) => void;
  records: TurnProgressRecord[];
}

export function DialogueSidebar({
  lessons,
  activeLessonId,
  onSelectLesson,
  currentTurnIndex,
  onJumpToTurn,
  records,
}: DialogueSidebarProps) {
  const [bannerImgFailed, setBannerImgFailed] = useState(false);
  const activeLesson =
    lessons.find((l) => l.id === activeLessonId) || lessons[0];
  const currentTurn = activeLesson.turns[currentTurnIndex];

  return (
    <aside aria-label="Conversation roadmap and scenario context" className="space-y-5">
      {/* Scenic Cafe Illustration Card */}
      <div className="bg-white border border-[#E7E5DF] rounded-3xl overflow-hidden">
        <div className="aspect-[16/9] w-full bg-[#F3F1EA] relative overflow-hidden">
          {!bannerImgFailed ? (
            <img
              src="/src/assets/images/seoul_cafe_postcard_1793235439009.jpg"
              alt="Sunlit cafe table in Seoul overlooking Namsan"
              referrerPolicy="no-referrer"
              onError={() => setBannerImgFailed(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#F0FDFA] to-[#FEF3C7] p-6 text-center">
              <Compass className="w-8 h-8 text-[#0F766E] mb-2" aria-hidden="true" />
              <p className="font-display font-bold text-[#18181B]">
                Seoul Small-Talk Lounge
              </p>
            </div>
          )}
        </div>

        <div className="p-5">
          <div className="flex items-center gap-1.5 text-xs text-[#57534E]">
            <span>Scenario Setting</span>
            <span aria-hidden="true">·</span>
            <span>5 Turns</span>
          </div>
          <p className="text-sm font-medium text-[#18181B] mt-1">
            {activeLesson.settingDescription}
          </p>

          {/* Interactive Scenario Switcher */}
          <div className="mt-4 flex items-center gap-1 p-1 bg-[#F3F1EA] rounded-xl">
            {lessons.map((item, index) => {
              const selected = item.id === activeLessonId;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectLesson(item.id)}
                  className={`flex-1 min-h-[38px] px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap truncate cursor-pointer ${
                    selected
                      ? "bg-white text-[#18181B] shadow-xs"
                      : "text-[#57534E] hover:text-[#18181B]"
                  }`}
                >
                  {index === 0 ? "Scenario 1: Traveler" : "Scenario 2: Directions"}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 5-Topic Dialogue Flow Tracker */}
      <div className="bg-white border border-[#E7E5DF] rounded-3xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display text-base font-bold text-[#18181B]">
            5-Turn Small Talk Flow
          </h3>
          <span className="font-mono tabular-nums text-xs text-[#57534E]">
            {records.filter((r) => r.completed).length}/{activeLesson.turns.length} done
          </span>
        </div>

        <div className="divide-y divide-[#F3F1EA]">
          {activeLesson.turns.map((turn, idx) => {
            const rec = records[idx];
            const isCurrent = idx === currentTurnIndex;
            const isDone = rec?.completed;

            return (
              <button
                key={turn.id}
                type="button"
                onClick={() => onJumpToTurn(idx)}
                className={`w-full min-h-[52px] py-2.5 px-2 text-left flex items-center justify-between gap-3 transition-colors rounded-xl cursor-pointer ${
                  isCurrent ? "bg-[#F0FDFA]" : "hover:bg-[#FAF9F5]"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`w-6 h-6 rounded-full font-mono tabular-nums text-xs font-semibold flex items-center justify-center shrink-0 ${
                      isDone
                        ? "bg-[#0F766E] text-white"
                        : isCurrent
                          ? "border-2 border-[#0F766E] text-[#0F766E]"
                          : "bg-[#F3F1EA] text-[#57534E]"
                    }`}
                  >
                    {isDone ? <Check className="w-3.5 h-3.5" aria-hidden="true" /> : turn.id}
                  </span>
                  <div className="min-w-0">
                    <p
                      className={`text-sm truncate ${
                        isCurrent
                          ? "font-bold text-[#0F766E]"
                          : "font-medium text-[#18181B]"
                      }`}
                    >
                      {turn.summaryLabel}
                    </p>
                    <p className="text-xs text-[#57534E] truncate">
                      {turn.themeKo}
                    </p>
                  </div>
                </div>

                <span className="text-xs text-[#57534E] whitespace-nowrap shrink-0">
                  {isCurrent ? "Active" : isDone ? "Done" : `Turn ${turn.id}`}
                </span>
              </button>
            );
          })}
        </div>

        {/* Key Words Focus (Safe to show; never reveals Misleading Sentence ahead of time) */}
        <div className="mt-4 pt-4 border-t border-[#E7E5DF]">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#18181B]">
            <Sparkles className="w-3.5 h-3.5 text-[#0F766E]" aria-hidden="true" />
            <span>Current Key Words:</span>
            <span className="font-normal text-[#0F766E]">
              {currentTurn.keyWords.join(" · ")}
            </span>
          </div>
          <p className="text-xs text-[#57534E] mt-1 leading-relaxed">
            Focus on communicating friendly meaning. Native-like accent is not graded—if your partner understands you, you succeed!
          </p>
        </div>
      </div>
    </aside>
  );
}
