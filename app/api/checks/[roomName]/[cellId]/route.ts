import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";

function getConnection() {
  return neon(process.env.DATABASE_URL!);
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ roomName: string; cellId: string }> }
) {
  try {
    const { roomName, cellId } = await context.params;
    const decodedRoomName = decodeURIComponent(roomName);
    const [rowStr, colStr] = cellId.split("-");
    const cellRow = Number(rowStr);
    const cellCol = Number(colStr);

    const sql = getConnection();
    const rows = await sql<{
      status: string;
      notes: string | null;
      checked_by: string | null;
      checked_at: string;
    }[]>`
      SELECT status, notes, checked_by, checked_at
      FROM asset_checks
      WHERE room_name = ${decodedRoomName}
        AND cell_row = ${cellRow}
        AND cell_col = ${cellCol}
      ORDER BY checked_at DESC
      LIMIT 1
    `;

    if (!rows.length) {
      return NextResponse.json(null);
    }

    return NextResponse.json(rows[0]);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ roomName: string; cellId: string }> }
) {
  try {
    const { roomName, cellId } = await context.params;
    const decodedRoomName = decodeURIComponent(roomName);
    const [rowStr, colStr] = cellId.split("-");
    const cellRow = Number(rowStr);
    const cellCol = Number(colStr);

    const body = await request.json();
    const status: string = body.status;
    const notes: string | null = body.notes ?? null;
    const checkedBy: string | null = body.checkedBy ?? null;

    if (!status) {
      return NextResponse.json(
        { success: false, error: "Missing status" },
        { status: 400 }
      );
    }

    const sql = getConnection();
    const [inserted] = await sql<{
      status: string;
      notes: string | null;
      checked_by: string | null;
      checked_at: string;
    }[]>`
      INSERT INTO asset_checks (room_name, cell_row, cell_col, status, notes, checked_by)
      VALUES (${decodedRoomName}, ${cellRow}, ${cellCol}, ${status}, ${notes}, ${checkedBy})
      RETURNING status, notes, checked_by, checked_at
    `;

    return NextResponse.json(inserted);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

