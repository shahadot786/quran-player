import { LanguageToggle } from "./language-toggle";
import { Logo } from "./logo";
import { SearchCommand } from "./search-command";
import { ThemeToggle } from "./theme-toggle";

export function MobileHeader() {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-2 border-b bg-background/85 px-4 backdrop-blur-md lg:hidden">
      <Logo />
      <div className="flex items-center gap-1">
        <SearchCommand variant="icon" />
        <LanguageToggle />
        <ThemeToggle />
      </div>
    </header>
  );
}
