"use client";

import { useCallback, useEffect, useState } from "react";
import type { Asset, AssetType, Database, Room } from "@/lib/types";
import { parseExcelToDatabase } from "@/lib/excel-parser";
import { mergeDatabase } from "@/lib/merge-database";
import { getDefaultEntranceCell, normalizeGershayim } from "@/lib/utils";

const STORAGE_KEY = "assetMap_Latrun_DB_v2";

const initialDatabase: Database = {
  rooms: {},
  inventory: { PC: [], MONITOR: [], TV: [], PRINTER: [], UC: [], SWITCH: [] },
};

export function useAssetStore() {
  const [db, setDb] = useState<Database>(initialDatabase);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      setError(null);

      try {
        const dbRes = await fetch("/api/rooms");
        if (dbRes.ok) {
          try {
            const dbData = (await dbRes.json()) as {
              rooms: Record<
                string,
                {
                  rows: number;
                  cols: number;
                  assets: Record<
                    string,
                    { name: string; type: string; sku: string; monSku: string }
                  >;
                  entranceCellId: string | null;
                }
              >;
            };
            const rooms = dbData.rooms || {};
            if (Object.keys(rooms).length > 0) {
              const pcSet = new Set<string>();
              const monitorSet = new Set<string>();
              const tvSet = new Set<string>();
              const printerSet = new Set<string>();
              const ucSet = new Set<string>();
              const switchSet = new Set<string>();
              const normalizedRooms: Record<string, Room> = {};
              for (const [rawName, r] of Object.entries(rooms)) {
                const roomName = normalizeGershayim(rawName);
                const assets: Record<string, Asset> = {};
                for (const [cellId, a] of Object.entries(r.assets || {})) {
                  if (!/^\d+-\d+$/.test(cellId)) continue;
                  const asset: Asset = {
                    name: a.name,
                    type: (a.type as AssetType) || "STATION",
                    sku: a.sku ?? "",
                    monSku: a.monSku ?? "",
                  };
                  assets[cellId] = asset;
                  if (asset.sku) {
                    if (asset.type === "PRINTER") printerSet.add(asset.sku);
                    else if (asset.type === "UC") ucSet.add(asset.sku);
                    else if (asset.type === "SWITCH") switchSet.add(asset.sku);
                    else pcSet.add(asset.sku);
                  }
                  if (asset.monSku) {
                    if (asset.type === "TV") tvSet.add(asset.monSku);
                    else monitorSet.add(asset.monSku);
                  }
                }
                normalizedRooms[roomName] = {
                  rows: r.rows ?? 6,
                  cols: r.cols ?? 8,
                  assets,
                  entranceCellId:
                    r.entranceCellId ?? getDefaultEntranceCell(r.rows ?? 6, r.cols ?? 8, assets),
                };
              }
              const fromDb: Database = {
                rooms: normalizedRooms,
                inventory: {
                  PC: Array.from(pcSet),
                  MONITOR: Array.from(monitorSet),
                  TV: Array.from(tvSet),
                  PRINTER: Array.from(printerSet),
                  UC: Array.from(ucSet),
                  SWITCH: Array.from(switchSet),
                },
              };
              setDb(fromDb);
              localStorage.setItem(STORAGE_KEY, JSON.stringify(fromDb));
              setIsLoading(false);
              setIsLoaded(true);
              return;
            }
          } catch {
            // ignore parse errors and fall back below
          }
        }
      } catch {
      }

      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved) as Database;
          const normalizedRooms: Record<string, Room> = {};
          for (const [key, room] of Object.entries(parsed.rooms || {})) {
            normalizedRooms[normalizeGershayim(key)] = room;
          }
          setDb({ ...parsed, rooms: normalizedRooms });
        } else {
          setDb(initialDatabase);
        }
      } catch {
        setDb(initialDatabase);
      }

      setError("לא ניתן לטעון נתונים מהשרת, משתמש בנתונים מקומיים");
      setIsLoading(false);
      setIsLoaded(true);
    }

    fetchData();
  }, []);

  const saveLocal = useCallback((newDb: Database) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newDb));
    fetch("/api/rooms/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rooms: newDb.rooms }),
    }).catch(() => {});
  }, []);

  const getRoom = useCallback(
    (roomName: string): Room => {
      return db.rooms[roomName] || { rows: 6, cols: 8, assets: {}, entranceCellId: null };
    },
    [db.rooms]
  );

  const setRoom = useCallback(
    (roomName: string, room: Room) => {
      const newDb = {
        ...db,
        rooms: { ...db.rooms, [roomName]: room },
      };
      setDb(newDb);
      saveLocal(newDb);
    },
    [db, saveLocal]
  );

  const createRoom = useCallback(
    (name: string, rowsCount = 6, colsCount = 8) => {
      const roomName = normalizeGershayim(name);
      const existing = db.rooms[roomName];
      const assets = existing?.assets ?? {};
      const defaultEntrance = getDefaultEntranceCell(rowsCount, colsCount, assets);
      const room: Room = existing || { rows: rowsCount, cols: colsCount, assets: {}, entranceCellId: defaultEntrance };
      const newDb = {
        ...db,
        rooms: { ...db.rooms, [roomName]: room },
      };
      setDb(newDb);
      saveLocal(newDb);
    },
    [db, saveLocal]
  );

  const setAsset = useCallback(
    (roomName: string, cellId: string, asset: Asset) => {
      const room = getRoom(roomName);
      const newRoom = {
        ...room,
        assets: { ...room.assets, [cellId]: asset },
      };
      setRoom(roomName, newRoom);
    },
    [getRoom, setRoom]
  );

  const deleteAsset = useCallback(
    (roomName: string, cellId: string) => {
      const room = getRoom(roomName);
      const newAssets = { ...room.assets };
      delete newAssets[cellId];
      const newRoom = { ...room, assets: newAssets };
      setRoom(roomName, newRoom);
    },
    [getRoom, setRoom]
  );

  const moveAsset = useCallback(
    (roomName: string, fromCellId: string, toCellId: string) => {
      const room = getRoom(roomName);
      const asset = room.assets[fromCellId];
      if (!asset) return;

      const newAssets = { ...room.assets };
      delete newAssets[fromCellId];
      newAssets[toCellId] = asset;

      const newRoom = { ...room, assets: newAssets };
      setRoom(roomName, newRoom);
    },
    [getRoom, setRoom]
  );

  const updateRoomDimensions = useCallback(
    (roomName: string, rows: number, cols: number) => {
      const room = getRoom(roomName);
      const newRoom = { ...room, rows, cols };
      setRoom(roomName, newRoom);
    },
    [getRoom, setRoom]
  );

  const setRoomEntrance = useCallback(
    (roomName: string, cellId: string | null) => {
      const room = getRoom(roomName);
      const newRoom = { ...room, entranceCellId: cellId };
      setRoom(roomName, newRoom);
      const encodedName = encodeURIComponent(roomName);
      const payload = { cellId };
      fetch(`/api/rooms/${encodedName}/entrance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).catch(() => {});
    },
    [getRoom, setRoom]
  );

  const setInventory = useCallback(
    (type: keyof Database["inventory"], items: string[]) => {
      const newDb = {
        ...db,
        inventory: { ...db.inventory, [type]: items },
      };
      setDb(newDb);
      saveLocal(newDb);
    },
    [db, saveLocal]
  );

  const mergeFromExcel = useCallback(
    async (file: File): Promise<{ addedRooms: number; addedAssets: number }> => {
      const buffer = await file.arrayBuffer();
      const xlsxModule = await import("xlsx");
      const xlsx = (xlsxModule as { default?: typeof xlsxModule }).default ?? xlsxModule;
      const parsed = parseExcelToDatabase(xlsx, buffer);
      let addedRooms = 0;
      let addedAssets = 0;
      for (const name of Object.keys(parsed.rooms)) {
        if (!db.rooms[name]) addedRooms++;
        const existing = db.rooms[name];
        for (const [cid, asset] of Object.entries(parsed.rooms[name].assets)) {
          if (!existing?.assets[cid]) addedAssets++;
        }
      }
      const merged = mergeDatabase(db, parsed);
      setDb(merged);
      saveLocal(merged);
      return { addedRooms, addedAssets };
    },
    [db, saveLocal]
  );

  return {
    db,
    isLoaded,
    isLoading,
    error,
    getRoom,
    setRoom,
    setAsset,
    deleteAsset,
    moveAsset,
    updateRoomDimensions,
    setInventory,
    createRoom,
    setRoomEntrance,
    mergeFromExcel,
  };
}
