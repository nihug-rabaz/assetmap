-- Create rooms table
CREATE TABLE IF NOT EXISTS rooms (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  rows INTEGER NOT NULL DEFAULT 6,
  cols INTEGER NOT NULL DEFAULT 8,
  entrance_row INTEGER,
  entrance_col INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE rooms ADD COLUMN IF NOT EXISTS entrance_row INTEGER;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS entrance_col INTEGER;

-- Create assets table
CREATE TABLE IF NOT EXISTS assets (
  id SERIAL PRIMARY KEY,
  room_id INTEGER REFERENCES rooms(id) ON DELETE CASCADE,
  cell_row INTEGER NOT NULL,
  cell_col INTEGER NOT NULL,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'STATION',
  sku VARCHAR(255),
  mon_sku VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(room_id, cell_row, cell_col)
);

-- Create inventory table
CREATE TABLE IF NOT EXISTS inventory (
  id SERIAL PRIMARY KEY,
  category VARCHAR(50) NOT NULL,
  sku VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(category, sku)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_assets_room_id ON assets(room_id);
CREATE INDEX IF NOT EXISTS idx_assets_cell ON assets(room_id, cell_row, cell_col);
CREATE INDEX IF NOT EXISTS idx_inventory_category ON inventory(category);
