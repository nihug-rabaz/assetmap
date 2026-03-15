import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";
import { normalizeGershayim } from "@/lib/utils";

export async function GET() {
  try {
    const sql = neon(process.env.DATABASE_URL!);

    const roomRows = await sql<{ id: number; name: string; rows: number; cols: number; entrance_row: number | null; entrance_col: number | null }[]>`
      SELECT id, name, rows, cols, entrance_row, entrance_col FROM rooms
    `;

    const assetRows = await sql<{ room_id: number; cell_row: number; cell_col: number; name: string; type: string; sku: string; mon_sku: string }[]>`
      SELECT room_id, cell_row, cell_col, name, type, sku, mon_sku FROM assets
    `;

    const rooms: Record<string, { rows: number; cols: number; assets: Record<string, { name: string; type: string; sku: string; monSku: string }>; entranceCellId: string | null }> = {};

    for (const r of roomRows) {
      const entranceCellId =
        r.entrance_row != null && r.entrance_col != null ? `${r.entrance_row}-${r.entrance_col}` : null;
      const roomKey = normalizeGershayim(r.name);
      rooms[roomKey] = {
        rows: r.rows ?? 6,
        cols: r.cols ?? 8,
        assets: {},
        entranceCellId,
      };
    }

    for (const a of assetRows) {
      const room = roomRows.find((r) => r.id === a.room_id);
      if (!room) continue;
      const cellId = `${a.cell_row}-${a.cell_col}`;
      const roomKey = normalizeGershayim(room.name);
      rooms[roomKey].assets[cellId] = {
        name: a.name ?? "",
        type: a.type ?? "STATION",
        sku: a.sku ?? "",
        monSku: a.mon_sku ?? "",
      };
    }

    return NextResponse.json({ rooms });
  } catch (error) {
    console.error("GET /api/rooms error:", error);
    return NextResponse.json({ rooms: {} }, { status: 200 });
  }
}
