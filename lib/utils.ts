import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

const GERSHAYIM = "\u05F4";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function normalizeGershayim(str: string): string {
  if (!str || typeof str !== "string") return str;
  return str
    .replace(/\u0027/g, GERSHAYIM)
    .replace(/\u05F3/g, GERSHAYIM);
}

export function getDefaultEntranceCell(rows: number, cols: number, assets: Record<string, unknown>): string {
  if (!assets["0-0"]) return "0-0";
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cellId = `${r}-${c}`;
      if (!assets[cellId]) return cellId;
    }
  }
  return "0-0";
}
