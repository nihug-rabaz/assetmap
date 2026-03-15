import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  context: { params: Promise<{ roomName: string }> }
) {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const { roomName } = await context.params;
    const body = await request.json();
    const cellId: string | null = body?.cellId ?? null;
    const decodedRoomName = decodeURIComponent(roomName);

    if (!cellId) {
      await sql`
        UPDATE rooms
        SET entrance_row = NULL,
            entrance_col = NULL
        WHERE name = ${decodedRoomName}
      `;
      return NextResponse.json({ success: true });
    }

    const parts = cellId.split("-");
    if (parts.length !== 2) {
      return NextResponse.json(
        { success: false, error: "Invalid cellId" },
        { status: 400 }
      );
    }

    const [row, col] = parts.map(Number);

    await sql`
      UPDATE rooms
      SET entrance_row = ${row},
          entrance_col = ${col}
      WHERE name = ${decodedRoomName}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

