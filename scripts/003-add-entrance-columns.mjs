import { neon } from "@neondatabase/serverless";

async function addEntranceColumns() {
  const connectionString =
    process.env.DATABASE_URL ||
    "postgresql://neondb_owner:npg_G2tKpTXmoBu7@ep-bitter-queen-a4ofezvy-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

  const sql = neon(connectionString);

  await sql`ALTER TABLE rooms ADD COLUMN IF NOT EXISTS entrance_row INTEGER`;
  await sql`ALTER TABLE rooms ADD COLUMN IF NOT EXISTS entrance_col INTEGER`;
}

addEntranceColumns().catch((err) => {
  console.error(err);
  process.exit(1);
});

