import { neon } from "@neondatabase/serverless";

const API_URL =
  "https://script.googleusercontent.com/macros/echo?user_content_key=AY5xjrTH8wCPy1xybz_TfQgVBSrZZzIsy4TkeW7z1aOV4br3YSx-y1486MNZuTNJC0Qc80pJ4J19gc5j_uhu_6n8ryzWbyOZFch5wjweoCheuC9bYeoVZlDGL2eUcjB7uX4RQ4QfVU1-LOFYpXyNJ7kHPqc9dvNBjmECiONIOVajFQ47TNtCJ10M5mE41mFlZSj2Xayy-hP_tcsLVWu8GQUABFx9Pfr9vVHwpzEh_O6eyPrAJ6Xxk-BbtscoKhMR3WwDJMfI65C_XNI_Zl_v3GNIx-oJil4DKhjouFEDW5Gm&lib=MUsyy__Y2hRmqp7KqBS8pDEVbNHHkxU_r";

async function importData() {
  const sql = neon(process.env.DATABASE_URL);

  console.log("Fetching data from API...");
  const response = await fetch(API_URL);
  const data = await response.json();

  console.log("Clearing existing data...");
  await sql`DELETE FROM assets`;
  await sql`DELETE FROM inventory`;
  await sql`DELETE FROM rooms`;

  console.log("Importing rooms...");
  for (const [roomName, roomData] of Object.entries(data.rooms)) {
    const [room] = await sql`
      INSERT INTO rooms (name, rows, cols)
      VALUES (${roomName}, ${roomData.rows || 6}, ${roomData.cols || 8})
      ON CONFLICT (name) DO UPDATE
      SET rows = EXCLUDED.rows,
          cols = EXCLUDED.cols
      RETURNING id
    `;
    const roomId = room.id;
    console.log(`  - Imported room: ${roomName}`);

    for (const [cellId, assetData] of Object.entries(roomData.assets || {})) {
      if (/^\d+-\d+$/.test(cellId)) {
        const [row, col] = cellId.split("-").map(Number);
        await sql`
          INSERT INTO assets (room_id, cell_row, cell_col, name, type, sku, mon_sku)
          VALUES (
            ${roomId},
            ${row},
            ${col},
            ${assetData.name || ""},
            ${assetData.type || "STATION"},
            ${String(assetData.sku || "")},
            ${String(assetData.monSku || "")}
          )
        `;
      }
    }
    const assetCount = Object.keys(roomData.assets || {}).filter((id) =>
      /^\d+-\d+$/.test(id)
    ).length;
    console.log(`    - Imported ${assetCount} assets`);
  }

  // Import inventory
  console.log("Importing inventory...");
  const inventory = data.inventory || {};

  for (const sku of inventory.station || []) {
    await sql`INSERT INTO inventory (category, sku) VALUES ('PC', ${sku})`;
  }
  console.log(`  - Imported ${(inventory.station || []).length} PC items`);

  for (const sku of inventory.tv || []) {
    await sql`INSERT INTO inventory (category, sku) VALUES ('TV', ${sku})`;
  }
  console.log(`  - Imported ${(inventory.tv || []).length} TV items`);

  for (const sku of inventory.printer || []) {
    await sql`INSERT INTO inventory (category, sku) VALUES ('PRINTER', ${sku})`;
  }
  console.log(`  - Imported ${(inventory.printer || []).length} PRINTER items`);

  console.log("Data import complete!");
}

importData().catch(console.error);
