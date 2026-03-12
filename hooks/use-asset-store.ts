"use client";

import { useCallback, useEffect, useState } from "react";
import type { Asset, Database, Room } from "@/lib/types";

const STORAGE_KEY = "assetMap_Latrun_Final";

const initialDatabase: Database = {
  rooms: {},
  inventory: { PC: [], MONITOR: [], TV: [], PRINTER: [], UC: [] },
};

export function useAssetStore() {
  const [db, setDb] = useState<Database>(initialDatabase);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setDb(JSON.parse(saved));
      } catch {
        setDb(initialDatabase);
      }
    }
    setIsLoaded(true);
  }, []);

  const saveLocal = useCallback((newDb: Database) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newDb));
  }, []);

  const getRoom = useCallback(
    (roomName: string): Room => {
      return db.rooms[roomName] || { rows: 6, cols: 8, assets: {} };
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
    getRoom,
    setRoom,
    setAsset,
    deleteAsset,
    moveAsset,
    updateRoomDimensions,
    setInventory,
  };
}
