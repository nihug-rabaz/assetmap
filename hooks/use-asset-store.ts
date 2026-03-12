"use client";

import { useCallback, useEffect, useState } from "react";
import type { Asset, AssetType, Database, Room } from "@/lib/types";

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
        assets[cellId] = {
          name: data.name || "",
          type: (data.type as AssetType) || "STATION",
          sku: String(data.sku || ""),
          monSku: String(data.monSku || ""),
        };
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

  return {
    rooms,
    inventory: {
      PC: apiInventory?.station || [],
      MONITOR: [],
      TV: apiInventory?.tv || [],
      PRINTER: apiInventory?.printer || [],
      UC: [],
      SWITCH: [],
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
      const room: Room = existing || { rows, cols, assets: {}, entranceCellId: null };
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
  };
}
