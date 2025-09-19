import { useTimezone } from "@/components/timezone/TimezoneProvider";

export function DeviceTzHint() {
  const { timeZone: appTz } = useTimezone();
  const deviceTz = Intl.DateTimeFormat().resolvedOptions().timeZone;

  if (!appTz || appTz === deviceTz) return null;

  return (
    <p className="mt-1 text-xs text-muted-foreground">
      Your device time: ({deviceTz}); App timezone: {appTz}.
    </p>
  );
}
