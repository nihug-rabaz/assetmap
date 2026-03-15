import type { Asset, Database, Room } from "@/lib/types";
import { getDefaultEntranceCell } from "@/lib/utils";

export function mergeDatabase(existing: Database, incoming: Database): Database {
  const rooms: Record<string, Room> = { ...existing.rooms };

  for (const [roomName, incRoom] of Object.entries(incoming.rooms)) {
    const current = rooms[roomName];
    const base: Room = current
      ? { ...current, assets: { ...current.assets } }
      : { rows: incRoom.rows || 6, cols: incRoom.cols || 8, assets: {}, entranceCellId: getDefaultEntranceCell(incRoom.rows || 6, incRoom.cols || 8, {}) };

    for (const [cellId, asset] of Object.entries(incRoom.assets)) {
      if (!/^\d+-\d+$/.test(cellId)) continue;
      if (!base.assets[cellId]) {
        base.assets[cellId] = { ...asset } as Asset;
      }
    }
    if (!current?.entranceCellId && base.entranceCellId == null) {
      base.entranceCellId = getDefaultEntranceCell(base.rows, base.cols, base.assets);
    }
    rooms[roomName] = base;
  }

  const inventory = { ...existing.inventory };
  const categories = ["PC", "MONITOR", "TV", "PRINTER", "UC", "SWITCH"] as const;
  for (const cat of categories) {
    const set = new Set<string>([...(existing.inventory[cat] || []), ...(incoming.inventory[cat] || [])].filter(Boolean));
    inventory[cat] = Array.from(set);
  }

  return { rooms, inventory };
}
