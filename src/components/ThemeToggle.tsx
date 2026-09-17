"use client";

import React, { useEffect, useState } from "react";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const isDark = document.documentElement.classList.contains("dark");
    setTheme(isDark ? "dark" : "light");

    const observer = new MutationObserver(() => {
      const darkActive = document.documentElement.classList.contains("dark");
      setTheme(darkActive ? "dark" : "light");
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  function toggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);

    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
      try {
        localStorage.setItem("govproc-theme", "dark");
      } catch {}
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
      try {
        localStorage.setItem("govproc-theme", "light");
      } catch {}
    }
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`theme-toggle-btn group relative flex h-9 items-center gap-1.5 rounded-xl border px-3 py-1 text-xs font-semibold transition-all duration-200 cursor-pointer ${
        mounted && theme === "light"
          ? "border-slate-300 bg-white text-slate-800 hover:border-slate-400 hover:bg-slate-100 shadow-sm"
          : "border-slate-800 bg-slate-900/90 text-amber-300 hover:border-slate-700 hover:bg-slate-800 hover:text-amber-200 shadow-sm"
      } ${className}`}
      aria-label="Toggle light/dark theme"
      title={mounted ? `Switch to ${theme === "dark" ? "light" : "dark"} mode` : "Toggle theme"}
    >
      <span className="text-sm transition-transform duration-200 group-hover:scale-110">
        {mounted && theme === "light" ? "☀️" : "🌙"}
      </span>
      <span className="text-[11px] font-bold tracking-wide">
        {mounted && theme === "light" ? "Light" : "Dark"}
      </span>
    </button>
  );
}
