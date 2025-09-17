"use client";

import { useTimezone } from "@/components/timezone/TimezoneProvider";
import { formatDateFull, formatDateShort } from "@/lib/utils/datetime";

export default function TableDateCell({
  iso,
  showTime = false,
}: {
  iso?: string | null;
  showTime?: boolean;
}) {
  const { timeZone } = useTimezone();
  const text = formatDateShort(iso, { showTime, timeZone });
  const title = formatDateFull(iso, timeZone);

  return <span title={title}>{text}</span>;
}
