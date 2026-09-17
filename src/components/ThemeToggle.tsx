"use client";

import { useEffect, useState } from "react";

export type ThemeToggleProps = {
  className?: string;
};

export function ThemeToggle({ className = "" }: ThemeToggleProps) {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Determine current theme from document class or localStorage
    const isDark = document.documentElement.classList.contains("dark");
    const saved = localStorage.getItem("govproc-theme");
    if (saved === "light" || (!saved && !isDark)) {
      setTheme("light");
    } else {
      setTheme("dark");
    }

    const handleThemeChange = (e: Event) => {
      const customEvent = e as CustomEvent<"dark" | "light">;
      if (customEvent.detail) {
        setTheme(customEvent.detail);
      }
    };

    window.addEventListener("theme-change", handleThemeChange);
    return () => window.removeEventListener("theme-change", handleThemeChange);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    try {
      localStorage.setItem("govproc-theme", nextTheme);
    } catch (_) {}

    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
    }

    window.dispatchEvent(
      new CustomEvent<"dark" | "light">("theme-change", { detail: nextTheme })
    );
  };

  if (!mounted) {
    return (
      <button
        aria-label="Toggle Theme"
        className={`flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-400 transition hover:border-slate-700 hover:text-slate-200 ${className}`}
      >
        <span className="h-4 w-4 rounded-full bg-slate-700/50 animate-pulse" />
      </button>
    );
  }

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-300 transition-all duration-200 hover:border-blue-500/50 hover:bg-slate-800 hover:text-white hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500/40 ${className}`}
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      aria-label={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
    >
      {isDark ? (
        // Sun Icon for Dark Mode (click to switch to light)
        <svg
          className="h-4 w-4 text-amber-400 transition-transform duration-300 hover:rotate-45"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      ) : (
        // Moon Icon for Light Mode (click to switch to dark)
        <svg
          className="h-4 w-4 text-indigo-600 transition-transform duration-300 hover:-rotate-12"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
      )}
    </button>
  );
}
