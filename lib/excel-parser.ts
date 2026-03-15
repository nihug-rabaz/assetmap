import type { Asset, AssetType, Database, Room } from "@/lib/types";

const ASSET_TYPES = ["STATION", "PC", "MONITOR", "PRINTER", "TV", "UC", "SWITCH"] as const;
const TYPE_ALIASES: Record<string, AssetType> = {
  "תחנת עבודה": "STATION",
  "pc": "STATION",
  "מסך": "MONITOR",
  "מדפסת": "PRINTER",
  "טלוויזיה": "TV",
  "טלפון": "UC",
  "סוויץ": "SWITCH",
  "סוויץ'": "SWITCH",
};

function normalizeType(value: string): AssetType {
  const v = String(value || "").trim().toUpperCase();
  if (ASSET_TYPES.includes(v as AssetType)) return v as AssetType;
  const alias = TYPE_ALIASES[String(value || "").trim()] ?? TYPE_ALIASES[(value || "").trim().toLowerCase()];
  return alias || "STATION";
}

function cellId(row: number, col: number): string {
  return `${row}-${col}`;
}

function findCol(header: string[], names: string[]): number {
  for (const n of names) {
    const idx = header.findIndex((h) => {
      const s = String(h ?? "").trim();
      const lower = s.toLowerCase();
      const nLower = n.toLowerCase();
      return s && (s.includes(n) || lower.includes(nLower) || (n.length <= 2 && s === n));
    });
    if (idx >= 0) return idx;
  }
  return -1;
}

export function parseExcelToDatabase(xlsxModule: { read: (b: ArrayBuffer, o: object) => { SheetNames: string[]; Sheets: object }; utils: { sheet_to_json: (s: object, o: object) => string[][] } }, buffer: ArrayBuffer): Database {
  const wb = xlsxModule.read(buffer, { type: "array", raw: true });
  const firstSheet = wb.SheetNames[0];
  if (!firstSheet) {
    return { rooms: {}, inventory: { PC: [], MONITOR: [], TV: [], PRINTER: [], UC: [], SWITCH: [] } };
  }
  const sheet = wb.Sheets[firstSheet];
  const rows = xlsxModule.utils.sheet_to_json(sheet as object, { header: 1, defval: "" }) as string[][];
  if (!rows.length) {
    return { rooms: {}, inventory: { PC: [], MONITOR: [], TV: [], PRINTER: [], UC: [], SWITCH: [] } };
  }
  const header = rows[0].map((c) => String(c ?? "").trim());
  const roomCol = findCol(header, ["חדר", "room"]) >= 0 ? findCol(header, ["חדר", "room"]) : 0;
  const rowCol = findCol(header, ["שורה", "row"]) >= 0 ? findCol(header, ["שורה", "row"]) : 1;
  const colCol = findCol(header, ["עמודה", "col"]) >= 0 ? findCol(header, ["עמודה", "col"]) : 2;
  const nameCol = findCol(header, ["שם", "name"]) >= 0 ? findCol(header, ["שם", "name"]) : 3;
  const typeCol = findCol(header, ["סוג", "type"]) >= 0 ? findCol(header, ["סוג", "type"]) : 4;
  const skuCol = findCol(header, ["מק\"ט", "sku"]) >= 0 ? findCol(header, ["מק\"ט", "sku"]) : 5;
  const monCol = findCol(header, ["מק\"ט מסך", "מסך", "mon"]) >= 0 ? findCol(header, ["מק\"ט מסך", "מסך", "mon"]) : 6;

  const rooms: Record<string, Room> = {};
  const pcSet = new Set<string>();
  const monitorSet = new Set<string>();
  const tvSet = new Set<string>();
  const printerSet = new Set<string>();
  const ucSet = new Set<string>();
  const switchSet = new Set<string>();

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;
    const roomName = String(row[roomCol] ?? "").trim();
    if (!roomName) continue;
    const r = Math.max(0, parseInt(String(row[rowCol] ?? 0), 10) || 0);
    const c = Math.max(0, parseInt(String(row[colCol] ?? 0), 10) || 0);
    const name = String(row[nameCol] ?? "").trim() || `עמדה ${r}-${c}`;
    const type = normalizeType(String(row[typeCol] ?? "STATION"));
    const sku = String(row[skuCol] ?? "").trim();
    const monSku = String(row[monCol] ?? "").trim();

    if (!rooms[roomName]) {
      rooms[roomName] = { rows: 6, cols: 8, assets: {}, entranceCellId: "0-0" };
    }
    const cid = cellId(r, c);
    rooms[roomName].assets[cid] = { name, type, sku, monSku };

    if (sku) {
      if (type === "PRINTER") printerSet.add(sku);
      else if (type === "UC") ucSet.add(sku);
      else if (type === "SWITCH") switchSet.add(sku);
      else pcSet.add(sku);
    }
    if (monSku) {
      if (type === "TV") tvSet.add(monSku);
      else monitorSet.add(monSku);
    }
  }

  return {
    rooms,
    inventory: {
      PC: Array.from(pcSet),
      MONITOR: Array.from(monitorSet),
      TV: Array.from(tvSet),
      PRINTER: Array.from(printerSet),
      UC: Array.from(ucSet),
      SWITCH: Array.from(switchSet),
    },
  };
}
