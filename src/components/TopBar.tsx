import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Button } from "./Button";
import { Icon } from "./Icon";
import { useTheme } from "../lib/theme";
import { useNovels } from "../lib/novels";

const SAVE_LABEL: Record<string, string> = {
  idle: "",
  saving: "저장 중…",
  saved: "저장됨",
  error: "저장 실패",
};

export function TopBar({ children, showSave = false }: { children?: ReactNode; showSave?: boolean }): ReactNode {
  const { theme, toggle } = useTheme();
  const { saveState } = useNovels();

  return (
    <header className="topbar">
      <Link to="/" className="topbar__brand" aria-label="서재로">
        <span>종이결</span>
        <span className="topbar__brand-mark">paper grain</span>
      </Link>
      <span className="topbar__spacer" />
      {showSave && (
        <span className="topbar__status" data-state={saveState} aria-live="polite">
          {SAVE_LABEL[saveState]}
        </span>
      )}
      {children}
      <Button
        variant="ghost"
        iconOnly
        onClick={toggle}
        aria-label={theme === "dark" ? "밝은 화면으로" : "어두운 화면으로"}
        title={theme === "dark" ? "밝은 화면으로" : "어두운 화면으로"}
      >
        <Icon name={theme === "dark" ? "sun" : "moon"} />
      </Button>
    </header>
  );
}
