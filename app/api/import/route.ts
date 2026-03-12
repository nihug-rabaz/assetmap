import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";

const API_URL =
  "https://script.googleusercontent.com/macros/echo?user_content_key=AY5xjrTH8wCPy1xybz_TfQgVBSrZZzIsy4TkeW7z1aOV4br3YSx-y1486MNZuTNJC0Qc80pJ4J19gc5j_uhu_6n8ryzWbyOZFch5wjweoCheuC9bYeoVZlDGL2eUcjB7uX4RQ4QfVU1-LOFYpXyNJ7kHPqc9dvNBjmECiONIOVajFQ47TNtCJ10M5mE41mFlZSj2Xayy-hP_tcsLVWu8GQUABFx9Pfr9vVHwpzEh_O6eyPrAJ6Xxk-BbtscoKhMR3WwDJMfI65C_XNI_Zl_v3GNIx-oJil4DKhjouFEDW5Gm&lib=MUsyy__Y2hRmqp7KqBS8pDEVbNHHkxU_r";

export async function POST() {
  try {
    const sql = neon(process.env.DATABASE_URL!);

    console.log("Fetching data from API...");
    const response = await fetch(API_URL);
    const data = await response.json();

    console.log("Clearing existing data...");
    await sql`DELETE FROM assets`;
    await sql`DELETE FROM inventory`;
    await sql`DELETE FROM rooms`;

    console.log("Importing rooms...");
    let roomCount = 0;
    let assetCount = 0;

    for (const [roomName, roomData] of Object.entries(data.rooms || {})) {
      const room = roomData as { rows: number; cols: number; assets: Record<string, unknown> };

      const [dbRoom] = await sql<[{ id: number }]>`
        INSERT INTO rooms (name, rows, cols)
        VALUES (${roomName}, ${room.rows || 6}, ${room.cols || 8})
        ON CONFLICT (name) DO UPDATE
        SET rows = EXCLUDED.rows,
            cols = EXCLUDED.cols
        RETURNING id
      `;
      const roomId = dbRoom.id;
      roomCount++;

      for (const [cellId, assetData] of Object.entries(room.assets || {})) {
        if (/^\d+-\d+$/.test(cellId)) {
          const asset = assetData as { name: string; type: string; sku: string | number; monSku: string | number };
          const [row, col] = cellId.split("-").map(Number);

          await sql`
            INSERT INTO assets (room_id, cell_row, cell_col, name, type, sku, mon_sku)
            VALUES (${roomId}, ${row}, ${col}, ${asset.name || ""}, ${asset.type || "STATION"}, ${String(asset.sku || "")}, ${String(asset.monSku || "")})
          `;
          assetCount++;
        }
      }
    }

    console.log("Importing inventory...");
    const inventory = data.inventory || {};
    let inventoryCount = 0;

    for (const sku of inventory.station || []) {
      await sql`INSERT INTO inventory (category, sku) VALUES ('PC', ${sku})`;
      inventoryCount++;
    }
    for (const sku of inventory.tv || []) {
      await sql`INSERT INTO inventory (category, sku) VALUES ('TV', ${sku})`;
      inventoryCount++;
    }
    for (const sku of inventory.printer || []) {
      await sql`INSERT INTO inventory (category, sku) VALUES ('PRINTER', ${sku})`;
      inventoryCount++;
    }

    return NextResponse.json({
      success: true,
      message: "Data imported successfully",
      stats: {
        rooms: roomCount,
        assets: assetCount,
        inventory: inventoryCount,
      },
    });
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
