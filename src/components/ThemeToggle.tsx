"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

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
    const initialTheme = getInitialTheme();

    // Il tema dipende da API disponibili solo dopo il mount nel browser.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(initialTheme);
    document.documentElement.dataset.theme = initialTheme;
    document.documentElement.classList.toggle(
      "dark",
      initialTheme === "dark",
    );
    setMounted(true);
  }, []);

  function toggleTheme() {
    const nextTheme = theme === "light" ? "dark" : "light";

    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    document.documentElement.classList.toggle(
      "dark",
      nextTheme === "dark",
    );
    window.localStorage.setItem("theme", nextTheme);
  }

  return (
    <Button
      variant="ghost"
      size="icon-lg"
      className="size-12 shrink-0 rounded-full border border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white"
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
    </Button>
  );
}
