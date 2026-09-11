import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export function parseMmssToSeconds(val: string): number | null {
  if (!val || typeof val !== "string") return null;
  const parts = val.trim().split(":").map(Number);
  if (parts.some(isNaN)) return null;
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return null;
}

export function secondsToTimestamp(sec: number): string {
  const total = Math.max(0, Math.round(sec));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function matchExactTimestamp(
  quoteText: string,
  transcriptSegments: Array<{ start: number; end: number; text: string }>
): { start: string; end: string } | null {
  if (!quoteText || !transcriptSegments || transcriptSegments.length === 0) return null;
  const qClean = quoteText.toLowerCase().replace(/[^\w\s]/g, "").trim();
  if (qClean.split(/\s+/).length < 3) return null;

  let bestMatch: { start: number; end: number; score: number } | null = null;
  for (let i = 0; i < transcriptSegments.length; i++) {
    let windowText = "";
    for (let j = i; j < Math.min(i + 5, transcriptSegments.length); j++) {
      windowText += " " + transcriptSegments[j].text.toLowerCase().replace(/[^\w\s]/g, "");
      if (windowText.includes(qClean) || qClean.includes(transcriptSegments[j].text.toLowerCase().trim())) {
        return {
          start: secondsToTimestamp(transcriptSegments[i].start),
          end: secondsToTimestamp(transcriptSegments[j].end),
        };
      }
    }
  }
  return null;
}
