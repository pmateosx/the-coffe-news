import { STAMP_TYPES, type Stamp } from "@/db/schema";
import type { StampSummary } from "@/components/stamp-bar";

export function summarizeStamps(stampRows: Stamp[], memberId: string | null): StampSummary {
  const summary = Object.fromEntries(
    STAMP_TYPES.map((type) => [type, { count: 0, mine: false }]),
  ) as StampSummary;
  for (const stamp of stampRows) {
    summary[stamp.stampType].count += 1;
    if (memberId && stamp.memberId === memberId) summary[stamp.stampType].mine = true;
  }
  return summary;
}
