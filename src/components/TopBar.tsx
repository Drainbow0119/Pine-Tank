import { RotateCcw } from "lucide-react";

export type AppScreenView = "start" | "practice" | "tips" | "result";

interface TopBarProps {
  activeScreen: AppScreenView;
  onSelectScreen: (screen: AppScreenView) => void;
  onRestart: () => void;
}

export function TopBar({
  activeScreen,
  onSelectScreen,
  onRestart,
}: TopBarProps) {
  const navItems: { id: AppScreenView; label: string }[] = [
    { id: "start", label: "Start Screen" },
    { id: "practice", label: "Practice Screen" },
    { id: "tips", label: "Real-Life Tips" },
    { id: "result", label: "Result Screen" },
  ];

  return (
    <header className="sticky top-0 z-30 bg-[#FAF9F5]/95 backdrop-blur-md border-b border-[#E7E5DF]">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-8 px-4 sm:px-6 h-14">
        {/* Zone 1: Single-line Brand Wordmark */}
        <button
          type="button"
          onClick={() => onSelectScreen("start")}
          className="font-display text-base sm:text-lg font-bold tracking-tight text-[#18181B] hover:text-[#0F766E] transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F766E]"
        >
          I&apos;m Pine🍍, Tank you🔫!
        </button>

        {/* Zone 2: Clean single-line text navigation links */}
        <nav
          aria-label="Primary sections"
          className="hidden md:flex items-center gap-6 text-sm font-medium text-[#57534E]"
        >
          {navItems.map((item) => {
            const isActive = activeScreen === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectScreen(item.id)}
                aria-current={isActive ? "page" : undefined}
                className={`py-1 whitespace-nowrap shrink-0 transition-colors cursor-pointer border-b-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F766E] ${
                  isActive
                    ? "text-[#18181B] border-[#0F766E] font-semibold"
                    : "border-transparent hover:text-[#18181B] hover:border-[#D6D3CD]"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onRestart}
            className="min-h-[40px] px-3.5 py-2 text-xs sm:text-sm font-semibold text-[#18181B] bg-white border border-[#D6D3CD] rounded-xl hover:bg-[#F3F1EA] transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F766E]"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Restart</span>
          </button>
        </div>
      </div>
    </header>
  );
}
