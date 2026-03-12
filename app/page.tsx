"use client";

import { useState, useCallback } from "react";
import { Lobby } from "@/components/lobby";
import { RoomView } from "@/components/room-view";
import { useAssetStore } from "@/hooks/use-asset-store";
import type { Asset, Database } from "@/lib/types";

export default function Home() {
  const [currentRoom, setCurrentRoom] = useState<string | null>(null);
  const {
    db,
    isLoaded,
    getRoom,
    setAsset,
    deleteAsset,
    moveAsset,
    updateRoomDimensions,
    setInventory,
  } = useAssetStore();

  const handleEnterRoom = useCallback((roomName: string) => {
    setCurrentRoom(roomName);
  }, []);

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

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-[var(--primary)] text-xl">טוען...</div>
      </div>
    );
  }

  if (!currentRoom) {
    return <Lobby onEnterRoom={handleEnterRoom} />;
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
    />
  );
}
