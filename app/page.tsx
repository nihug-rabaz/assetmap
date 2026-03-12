"use client";

import { useState, useCallback } from "react";
import { Lobby } from "@/components/lobby";
import { RoomView } from "@/components/room-view";
import { DeviceReport } from "@/components/device-report";
import { useAssetStore } from "@/hooks/use-asset-store";
import type { Asset, Database } from "@/lib/types";

export default function Home() {
  const [currentRoom, setCurrentRoom] = useState<string | null>(null);
  const [showReport, setShowReport] = useState(false);
  const {
    db,
    isLoaded,
    isLoading,
    error,
    getRoom,
    setAsset,
    deleteAsset,
    moveAsset,
    updateRoomDimensions,
    setInventory,
    createRoom,
    setRoomEntrance,
  } = useAssetStore();

  const handleEnterRoom = useCallback((roomName: string) => {
    setCurrentRoom(roomName);
  }, []);

  const handleCreateRoom = useCallback(
    (roomName: string) => {
      createRoom(roomName);
      setCurrentRoom(roomName);
    },
    [createRoom]
  );

  const handleBack = useCallback(() => {
    setCurrentRoom(null);
  }, []);

  const handleSetAsset = useCallback(
    (cellId: string, asset: Asset) => {
      if (currentRoom) {
        setAsset(currentRoom, cellId, asset);
      }
    },
    [currentRoom, setAsset]
  );

  const handleDeleteAsset = useCallback(
    (cellId: string) => {
      if (currentRoom) {
        deleteAsset(currentRoom, cellId);
      }
    },
    [currentRoom, deleteAsset]
  );

  const handleMoveAsset = useCallback(
    (fromCellId: string, toCellId: string) => {
      if (currentRoom) {
        moveAsset(currentRoom, fromCellId, toCellId);
      }
    },
    [currentRoom, moveAsset]
  );

  const handleUpdateDimensions = useCallback(
    (rows: number, cols: number) => {
      if (currentRoom) {
        updateRoomDimensions(currentRoom, rows, cols);
      }
    },
    [currentRoom, updateRoomDimensions]
  );

  const handleUpdateInventory = useCallback(
    (type: keyof Database["inventory"], items: string[]) => {
      setInventory(type, items);
    },
    [setInventory]
  );

  if (!isLoaded || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-[var(--bg-dark)]">
        <div className="w-12 h-12 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
        <div className="text-[var(--primary)] text-xl">טוען נתונים מהשרת...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-[var(--bg-dark)]">
        <div className="text-[var(--danger)] text-xl">{error}</div>
      </div>
    );
  }

  if (!currentRoom) {
    const roomNames = Object.keys(db.rooms);
    if (showReport) {
      return <DeviceReport db={db} onBack={() => setShowReport(false)} />;
    }
    return (
      <Lobby
        rooms={roomNames}
        onEnterRoom={handleEnterRoom}
        onCreateRoom={handleCreateRoom}
        onOpenReport={() => setShowReport(true)}
      />
    );
  }

  const room = getRoom(currentRoom);

  return (
    <RoomView
      roomName={currentRoom}
      room={room}
      inventory={db.inventory}
      onBack={handleBack}
      onSetAsset={handleSetAsset}
      onDeleteAsset={handleDeleteAsset}
      onMoveAsset={handleMoveAsset}
      onUpdateDimensions={handleUpdateDimensions}
      onUpdateInventory={handleUpdateInventory}
      onSetEntrance={(cellId) => setRoomEntrance(currentRoom, cellId)}
    />
  );
}
