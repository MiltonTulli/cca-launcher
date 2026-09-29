"use client";

import Image from "next/image";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-label="GitHub">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

const LINKS = {
  uniswapCca: "https://cca.uniswap.org/",
  github: "https://github.com/MiltonTulli/cca-launcher",
};

export function Footer() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const logoSrc = mounted && resolvedTheme === "dark" ? "/tullim-logo-dark.svg" : "/tullim-logo.svg";

  return (
    <footer className="border-t border-border bg-background mt-auto">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        {/* Desktop */}
        <div className="hidden md:flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <Image src={logoSrc} alt="tullim" width={28} height={28} className="h-7 w-7" />
            <span className="text-xs text-muted-foreground">&copy; {new Date().getFullYear()} tullim</span>
          </div>

          <nav className="flex items-center gap-6">
            <a
              href={LINKS.uniswapCca}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Uniswap CCA
            </a>
            <a
              href={LINKS.github}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              GitHub
            </a>
          </nav>

          <div className="flex items-center gap-4">
            <a
              href={LINKS.github}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="GitHub"
            >
              <GitHubIcon className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Mobile */}
        <div className="md:hidden py-4">
          <div className="flex items-center justify-between">
            <Image src={logoSrc} alt="tullim" width={24} height={24} className="h-6 w-6" />
            <div className="flex items-center gap-4">
              <a
                href={LINKS.uniswapCca}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Uniswap CCA
              </a>
              <a
                href={LINKS.github}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="GitHub"
              >
                <GitHubIcon className="w-4 h-4" />
              </a>
            </div>
          </div>
          <span className="text-xs text-muted-foreground mt-2 block">
            &copy; {new Date().getFullYear()} tullim
          </span>
        </div>
      </div>
    </footer>
  );
}
