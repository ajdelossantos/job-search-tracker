"use client";

import * as React from "react";

type Ctx = {
  timeZone: string | undefined; // undefined = use browser default
  setTimeZone: (tz: string | undefined) => void;
};

const TZContext = React.createContext<Ctx | null>(null);
const LS_KEY = "jst.timezone";

export function useTimezone() {
  const ctx = React.useContext(TZContext);
  if (!ctx)
    throw new Error("useTimezone must be used within <TimezoneProvider>");
  return ctx;
}

/**
 * Provider component that manages timezone state and persistence.
 *
 * Provides timezone context to child components with automatic hydration from localStorage
 * and browser detection. When no timezone is explicitly set, it defaults to 'auto' mode
 * which uses the browser's detected timezone.
 *
 * @param props - The component props
 * @param props.children - React child components that will have access to the timezone context
 * @returns JSX element wrapping children with timezone context
 *
 * @example
 * ```tsx
 * <TimezoneProvider>
 *   <App />
 * </TimezoneProvider>
 * ```
 */
export default function TimezoneProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [timeZone, setTimeZone] = React.useState<string | undefined>(undefined);

  // hydrate from localStorage or browser
  React.useEffect(() => {
    const saved =
      typeof window !== "undefined" ? localStorage.getItem(LS_KEY) : null;
    if (saved === "auto") {
      setTimeZone(undefined);
    } else if (saved) {
      setTimeZone(saved);
    } else {
      setTimeZone(undefined); // auto
    }
  }, []);

  const set = React.useCallback((tz: string | undefined) => {
    setTimeZone(tz);
    if (typeof window !== "undefined") {
      localStorage.setItem(LS_KEY, tz ?? "auto");
    }
  }, []);

  return (
    <TZContext.Provider value={{ timeZone, setTimeZone: set }}>
      {children}
    </TZContext.Provider>
  );
}
