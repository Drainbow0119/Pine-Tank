import { useState } from "react";
import { AlertTriangle, Keyboard } from "lucide-react";
import type { BrowserGuidance } from "../utils/dialogueEngine";

interface BrowserNoticeBannerProps {
  browserGuidance: BrowserGuidance;
  micPermissionDenied: boolean;
  onManualSpeechSubmit: (spoken: string) => void;
}

export function BrowserNoticeBanner({
  browserGuidance,
  micPermissionDenied,
  onManualSpeechSubmit,
}: BrowserNoticeBannerProps) {
  const [showKeyboardFallback, setShowKeyboardFallback] = useState(false);
  const [typedText, setTypedText] = useState("");

  const hasWarning =
    Boolean(browserGuidance.guidanceMessageEn) || micPermissionDenied;

  if (!hasWarning) {
    return null;
  }

  const titleEn = micPermissionDenied
    ? "Microphone permission was denied. Please allow microphone access in your browser settings, or open it in Chrome."
    : browserGuidance.guidanceMessageEn;

  const titleKo = micPermissionDenied
    ? "마이크 권한이 거부되었어요. 브라우저 주소창 왼쪽 설정에서 마이크를 허용하거나 Chrome에서 열어 주세요."
    : browserGuidance.guidanceMessageKo;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onManualSpeechSubmit(typedText);
    setTypedText("");
  };

  return (
    <section
      aria-label="Browser and microphone notice"
      className="mb-4 rounded-2xl bg-[#FFFBEB] border border-[#FDE68A] p-4 text-sm text-[#78350F]"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <AlertTriangle
            className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <div>
            <p className="font-semibold text-[#78350F]">{titleEn}</p>
            {titleKo && (
              <p className="text-xs text-[#92400E] mt-0.5">{titleKo}</p>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowKeyboardFallback((prev) => !prev)}
          className="min-h-[40px] px-3 py-1.5 rounded-xl bg-white border border-[#FCD34D] text-xs font-semibold text-[#78350F] hover:bg-[#FEF3C7] transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 self-start sm:self-center cursor-pointer"
        >
          <Keyboard className="w-3.5 h-3.5" aria-hidden="true" />
          <span>{showKeyboardFallback ? "Hide Text Input" : "Practice by Typing"}</span>
        </button>
      </div>

      {showKeyboardFallback && (
        <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
          <label htmlFor="fallback-speech-input" className="sr-only">
            Type what you would say aloud
          </label>
          <input
            id="fallback-speech-input"
            type="text"
            value={typedText}
            onChange={(e) => setTypedText(e.target.value)}
            placeholder="Type the sentence here if your mic is unavailable..."
            className="flex-1 min-h-[44px] px-3.5 rounded-xl bg-white border border-[#FCD34D] text-sm text-[#18181B] placeholder:text-[#A8A29E] focus:outline-2 focus:outline-[#0F766E]"
          />
          <button
            type="submit"
            className="min-h-[44px] px-4 rounded-xl bg-[#0F766E] text-white text-sm font-semibold hover:bg-[#115E59] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Check
          </button>
        </form>
      )}
    </section>
  );
}
