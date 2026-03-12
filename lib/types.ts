export type AssetType = 'STATION' | 'PC' | 'MONITOR' | 'PRINTER' | 'TV' | 'UC' | 'SWITCH';

export interface Asset {
  name: string;
  type: AssetType;
  sku: string;
  monSku: string;
}

export interface Room {
  rows: number;
  cols: number;
  assets: Record<string, Asset>;
  entranceCellId?: string | null;
}

export interface Inventory {
  PC: string[];
  MONITOR: string[];
  TV: string[];
  PRINTER: string[];
  UC: string[];
  SWITCH: string[];
}

export interface Database {
  rooms: Record<string, Room>;
  inventory: Inventory;
}

export const ASSET_TYPES: { value: AssetType; label: string; icon: string }[] = [
  { value: 'STATION', label: 'תחנת עבודה (PC + מסך)', icon: '💻' },
  { value: 'PC', label: 'PC עצמאי', icon: '🖥️' },
  { value: 'MONITOR', label: 'מסך עצמאי', icon: '📺' },
  { value: 'PRINTER', label: 'מדפסת', icon: '🖨️' },
  { value: 'TV', label: 'טלוויזיה', icon: '📡' },
  { value: 'UC', label: 'טלפון UC', icon: '📞' },
  { value: 'SWITCH', label: 'סוויץ׳', icon: '🔀' },
];

export const ASSET_ICONS: Record<AssetType, string> = {
  STATION: '💻',
  PC: '🖥️',
  MONITOR: '📺',
  PRINTER: '🖨️',
  TV: '📡',
  UC: '📞',
  SWITCH: '🔀',
};
