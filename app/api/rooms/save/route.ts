import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";
import type { AssetType } from "@/lib/types";

type IncomingDb = {
  rooms: Record<
    string,
    {
      rows: number;
      cols: number;
      assets: Record<
        string,
        {
          name: string;
          type: AssetType | string;
          sku: string;
          monSku: string;
        }
      >;
      entranceCellId: string | null | undefined;
    }
  >;
};

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as IncomingDb;
    const sql = neon(process.env.DATABASE_URL!);

    const client = sql;

    await client`BEGIN`;

    await client`DELETE FROM assets`;
    await client`DELETE FROM rooms`;

    const roomIdByName = new Map<string, number>();

    for (const [name, room] of Object.entries(payload.rooms || {})) {
      const result = await client<{ id: number }[]>`
        INSERT INTO rooms (name, rows, cols, entrance_row, entrance_col)
        VALUES (${name}, ${room.rows}, ${room.cols},
                ${room.entranceCellId ? Number(room.entranceCellId.split("-")[0]) : null},
                ${room.entranceCellId ? Number(room.entranceCellId.split("-")[1]) : null})
        RETURNING id
      `;
      const id = result[0]?.id;
      if (!id) continue;
      roomIdByName.set(name, id);

      for (const [cellId, asset] of Object.entries(room.assets || {})) {
        const [rowStr, colStr] = cellId.split("-");
        const cellRow = Number(rowStr);
        const cellCol = Number(colStr);
        if (!Number.isFinite(cellRow) || !Number.isFinite(cellCol)) continue;

        await client`
          INSERT INTO assets (room_id, cell_row, cell_col, name, type, sku, mon_sku)
          VALUES (${id}, ${cellRow}, ${cellCol}, ${asset.name}, ${asset.type}, ${asset.sku}, ${asset.monSku})
        `;
      }
    }

    await client`COMMIT`;

    return NextResponse.json({ success: true });
  } catch (error) {
    try {
      const sql = neon(process.env.DATABASE_URL!);
      await sql`ROLLBACK`;
    } catch {
    }
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

