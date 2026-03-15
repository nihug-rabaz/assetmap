"use client";

import { useCallback, useEffect, useState } from "react";
import type { Asset, AssetType, Database, Room } from "@/lib/types";
import { parseExcelToDatabase } from "@/lib/excel-parser";
import { mergeDatabase } from "@/lib/merge-database";

const API_URL =
  "https://script.googleusercontent.com/macros/echo?user_content_key=AY5xjrTH8wCPy1xybz_TfQgVBSrZZzIsy4TkeW7z1aOV4br3YSx-y1486MNZuTNJC0Qc80pJ4J19gc5j_uhu_6n8ryzWbyOZFch5wjweoCheuC9bYeoVZlDGL2eUcjB7uX4RQ4QfVU1-LOFYpXyNJ7kHPqc9dvNBjmECiONIOVajFQ47TNtCJ10M5mE41mFlZSj2Xayy-hP_tcsLVWu8GQUABFx9Pfr9vVHwpzEh_O6eyPrAJ6Xxk-BbtscoKhMR3WwDJMfI65C_XNI_Zl_v3GNIx-oJil4DKhjouFEDW5Gm&lib=MUsyy__Y2hRmqp7KqBS8pDEVbNHHkxU_r";

const STORAGE_KEY = "assetMap_Latrun_Final";

const initialDatabase: Database = {
  rooms: {},
  inventory: { PC: [], MONITOR: [], TV: [], PRINTER: [], UC: [], SWITCH: [] },
};

// Transform API data to our format
function transformApiData(apiData: Record<string, unknown>): Database {
  const rooms: Record<string, Room> = {};

  const pcSet = new Set<string>();
  const monitorSet = new Set<string>();
  const tvSet = new Set<string>();
  const printerSet = new Set<string>();
  const ucSet = new Set<string>();
  const switchSet = new Set<string>();

  const apiRooms = apiData.rooms as Record<
    string,
    { rows: number; cols: number; assets: Record<string, unknown> }
  >;

  for (const [roomName, roomData] of Object.entries(apiRooms)) {
    const assets: Record<string, Asset> = {};

    for (const [cellId, assetData] of Object.entries(roomData.assets || {})) {
      // Only include valid cell IDs (format: "row-col")
      if (/^\d+-\d+$/.test(cellId)) {
        const data = assetData as {
          name: string;
          type: string;
          sku: string | number;
          monSku: string | number;
        };
        const asset: Asset = {
          name: data.name || "",
          type: (data.type as AssetType) || "STATION",
          sku: String(data.sku || ""),
          monSku: String(data.monSku || ""),
        };
        assets[cellId] = asset;

        if (asset.sku) {
          if (asset.type === "PRINTER") {
            printerSet.add(asset.sku);
          } else if (asset.type === "UC") {
            ucSet.add(asset.sku);
          } else if (asset.type === "SWITCH") {
            switchSet.add(asset.sku);
          } else {
            pcSet.add(asset.sku);
          }
        }

        if (asset.monSku) {
          if (asset.type === "TV") {
            tvSet.add(asset.monSku);
          } else {
            monitorSet.add(asset.monSku);
          }
        }
      }
    }

    rooms[roomName] = {
      rows: roomData.rows || 6,
      cols: roomData.cols || 8,
      assets,
      entranceCellId: null,
    };
  }

  const apiInventory = apiData.inventory as Record<string, string[]> | undefined;

  for (const sku of apiInventory?.station || []) {
    if (sku) pcSet.add(String(sku));
  }
  for (const sku of apiInventory?.tv || []) {
    if (sku) tvSet.add(String(sku));
  }
  for (const sku of apiInventory?.printer || []) {
    if (sku) printerSet.add(String(sku));
  }

  return {
    rooms,
    inventory: {
      PC: Array.from(pcSet),
      MONITOR: Array.from(monitorSet),
      TV: Array.from(tvSet),
      PRINTER: Array.from(printerSet),
      UC: Array.from(ucSet),
      SWITCH: Array.from(switchSet),
    },
  };
}

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
        const response = await fetch(API_URL);
        if (!response.ok) {
          throw new Error("Failed to fetch data");
        }
        const apiData = await response.json();
        const transformedData = transformApiData(apiData);

        try {
          const entrancesRes = await fetch("/api/rooms/entrances");
          if (entrancesRes.ok) {
            const entrances = (await entrancesRes.json()) as {
              room: string;
              cellId: string;
            }[];
            for (const entry of entrances) {
              if (transformedData.rooms[entry.room]) {
                transformedData.rooms[entry.room].entranceCellId = entry.cellId;
              }
            }
          }
        } catch {
        }

        setDb(transformedData);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(transformedData));
      } catch (err) {
        console.error("Error fetching data:", err);
        // Fallback to localStorage
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          try {
            setDb(JSON.parse(saved));
          } catch {
            setDb(initialDatabase);
          }
        }
        setError("לא ניתן לטעון נתונים מהשרת, משתמש בנתונים מקומיים");
      } finally {
        setIsLoading(false);
        setIsLoaded(true);
      }
    }

    fetchData();
  }, []);

  const saveLocal = useCallback((newDb: Database) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newDb));
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
    (roomName: string, rows = 6, cols = 8) => {
      const existing = db.rooms[roomName];
      const room: Room = existing || { rows, cols, assets: {}, entranceCellId: "0-0" };
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
