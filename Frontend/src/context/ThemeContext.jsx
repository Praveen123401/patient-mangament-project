import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export const ACCENTS = [
  { key: "blue", label: "Blue", hex: "#2563eb" },
  { key: "teal", label: "Teal", hex: "#0d9488" },
  { key: "green", label: "Green", hex: "#16a34a" },
  { key: "purple", label: "Purple", hex: "#7c3aed" },
  { key: "rose", label: "Rose", hex: "#e11d48" },
  { key: "orange", label: "Orange", hex: "#ea580c" },
];

const MODES = ["light", "dark", "system"];
const MODE_KEY = "pms-mode";
const ACCENT_KEY = "pms-accent";

const read = (key, allowed, fallback) => {
  try {
    const v = localStorage.getItem(key);
    return allowed.includes(v) ? v : fallback;
  } catch {
    return fallback;
  }
};
const save = (key, value) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* storage blocked: the choice just won't be remembered */
  }
};
const systemDark = () => !!window.matchMedia?.("(prefers-color-scheme: dark)").matches;

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [mode, setModeState] = useState(() => read(MODE_KEY, MODES, "light"));
  const [accentKey, setAccentKey] = useState(() => read(ACCENT_KEY, ACCENTS.map((a) => a.key), "blue"));
  const [prefersDark, setPrefersDark] = useState(systemDark);

  // follow the computer's setting while "System" is selected
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (e) => setPrefersDark(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const resolved = mode === "system" ? (prefersDark ? "dark" : "light") : mode;

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", resolved);
    root.setAttribute("data-accent", accentKey);
  }, [resolved, accentKey]);

  const setMode = useCallback((m) => {
    setModeState(m);
    save(MODE_KEY, m);
  }, []);
  const setAccent = useCallback((k) => {
    setAccentKey(k);
    save(ACCENT_KEY, k);
  }, []);
  const reset = useCallback(() => {
    setMode("light");
    setAccent("blue");
  }, [setMode, setAccent]);

  const accent = ACCENTS.find((a) => a.key === accentKey) || ACCENTS[0];

  const value = useMemo(
    () => ({ mode, setMode, resolved, accent, setAccent, reset }),
    [mode, setMode, resolved, accent, setAccent, reset]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);