import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const sql = neon(process.env.DATABASE_URL!);

    const rows = await sql<{
      name: string;
      entrance_row: number | null;
      entrance_col: number | null;
    }[]>`
      SELECT name, entrance_row, entrance_col
      FROM rooms
      WHERE entrance_row IS NOT NULL AND entrance_col IS NOT NULL
    `;

    const result = rows.map((r) => ({
      room: r.name,
      cellId: `${r.entrance_row}-${r.entrance_col}`,
    }));

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

