"use client";

import { useState, useEffect } from "react";
import { useTimezone } from "./TimezoneProvider";

/**
 * A timezone selection component that allows users to choose from available timezones
 * or use automatic timezone detection.
 *
 * @returns A JSX element containing a labeled select dropdown for timezone selection
 *
 * @remarks
 * - Uses the `useTimezone` hook to manage timezone state
 * - Automatically populates timezone options using `Intl.supportedValuesOf`
 * - Falls back to the current timezone if `supportedValuesOf` is not available
 * - Includes an "auto" option that uses the browser's detected timezone
 * - When "auto" is selected, the timezone value is set to `undefined`
 *
 * @example
 * ```tsx
 * function App() {
 *   return (
 *     <div>
 *       <TimezoneSelect />
 *     </div>
 *   );
 * }
 * ```
 */
export default function TimezoneSelect() {
  const { timeZone, setTimeZone } = useTimezone();
  const [list, setList] = useState<string[]>([]);

  useEffect(() => {
    // Modern browsers expose supported TZs
    const tzs =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (Intl as any).supportedValuesOf?.("timeZone") ??
      [Intl.DateTimeFormat().resolvedOptions().timeZone].filter(Boolean);
    setList(["auto", ...tzs]);
  }, []);

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-gray-500">Timezone</span>
      <select
        className="border rounded px-2 py-1"
        value={timeZone ?? "auto"}
        onChange={(e) =>
          setTimeZone(e.target.value === "auto" ? undefined : e.target.value)
        }
      >
        {list.map((tz) => (
          <option key={tz} value={tz}>
            {tz === "auto"
              ? `Auto (${Intl.DateTimeFormat().resolvedOptions().timeZone})`
              : tz}
          </option>
        ))}
      </select>
    </label>
  );
}
