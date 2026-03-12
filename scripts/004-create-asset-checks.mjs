import { neon } from "@neondatabase/serverless";

async function main() {
  const connectionString =
    process.env.DATABASE_URL ||
    "postgresql://neondb_owner:npg_G2tKpTXmoBu7@ep-bitter-queen-a4ofezvy-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

  const sql = neon(connectionString);

  await sql`
    CREATE TABLE IF NOT EXISTS asset_checks (
      id SERIAL PRIMARY KEY,
      room_name VARCHAR(255) NOT NULL,
      cell_row INTEGER NOT NULL,
      cell_col INTEGER NOT NULL,
      status VARCHAR(20) NOT NULL,
      notes TEXT,
      checked_by VARCHAR(255),
      checked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_asset_checks_room_cell
    ON asset_checks(room_name, cell_row, cell_col, checked_at DESC)
  `;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

