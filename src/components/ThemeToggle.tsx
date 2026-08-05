"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

type Theme = "light" | "dark";

function getInitialTheme(): Theme {
  const storedTheme = window.localStorage.getItem("theme");

  if (storedTheme === "light" || storedTheme === "dark") {
    return storedTheme;
  }

  return window.matchMedia("(prefers-color-scheme: dark)")
    .matches
    ? "dark"
    : "light";
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const initialTheme = getInitialTheme();

      setTheme(initialTheme);
      document.documentElement.dataset.theme = initialTheme;
      setMounted(true);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, []);

  function toggleTheme() {
    const nextTheme = theme === "light" ? "dark" : "light";

    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    window.localStorage.setItem("theme", nextTheme);
  }

  return (
    <button
      className="theme-toggle"
      type="button"
      onClick={toggleTheme}
      aria-label={
        theme === "dark"
          ? "Attiva tema chiaro"
          : "Attiva tema scuro"
      }
      title={
        theme === "dark"
          ? "Tema chiaro"
          : "Tema scuro"
      }
    >
      {!mounted || theme === "light" ? (
        <Moon
          aria-hidden="true"
          size={22}
          strokeWidth={1.8}
        />
      ) : (
        <Sun
          aria-hidden="true"
          size={22}
          strokeWidth={1.8}
        />
      )}
    </button>
  );
}
