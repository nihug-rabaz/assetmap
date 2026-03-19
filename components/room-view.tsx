"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { AssetGrid } from "./asset-grid";
import { SettingsModal } from "./settings-modal";
import { AssetModal } from "./asset-modal";
import type { Asset, Database, Room } from "@/lib/types";
import { normalizeGershayim } from "@/lib/utils";
import { ArrowRight, Minus, Settings } from "lucide-react";

interface RoomViewProps {
  roomName: string;
  room: Room;
  inventory: Database["inventory"];
  onBack: () => void;
  onDeleteRoom: () => void;
  onSetAsset: (cellId: string, asset: Asset) => void;
  onDeleteAsset: (cellId: string) => void;
  onMoveAsset: (fromCellId: string, toCellId: string) => void;
  onUpdateDimensions: (rows: number, cols: number) => void;
  onUpdateInventory: (type: keyof Database["inventory"], items: string[]) => void;
  onSetEntrance: (cellId: string | null) => void;
}

export function RoomView({
  roomName,
  room,
  inventory,
  onBack,
  onDeleteRoom,
  onSetAsset,
  onDeleteAsset,
  onMoveAsset,
  onUpdateDimensions,
  onUpdateInventory,
  onSetEntrance,
}: RoomViewProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [assetModalOpen, setAssetModalOpen] = useState(false);
  const [selectedCellId, setSelectedCellId] = useState<string | null>(null);
  const [pendingAddCellId, setPendingAddCellId] = useState<string | null>(null);
  const [moveSourceCellId, setMoveSourceCellId] = useState<string | null>(null);
  const [selectingEntrance, setSelectingEntrance] = useState(false);

  const handleCellClick = useCallback(
    (cellId: string) => {
      if (selectingEntrance) {
        onSetEntrance(cellId);
        setSelectingEntrance(false);
        return;
      }
      const hasAsset = !!room.assets[cellId];
      const isEntrance = room.entranceCellId === cellId;
      if (moveSourceCellId !== null) {
        if (cellId === moveSourceCellId) {
          setMoveSourceCellId(null);
          return;
        }
        const wasEntrance = room.entranceCellId === moveSourceCellId;
        if (wasEntrance) {
          onSetEntrance(cellId);
        } else {
          onMoveAsset(moveSourceCellId, cellId);
        }
        setMoveSourceCellId(null);
        return;
      }
      if (hasAsset) {
        setSelectedCellId(cellId);
        setAssetModalOpen(true);
        setPendingAddCellId(null);
        setMoveSourceCellId(null);
        return;
      }
      if (isEntrance) {
        setMoveSourceCellId(cellId);
        setPendingAddCellId(null);
        return;
      }
      if (cellId === pendingAddCellId) {
        setSelectedCellId(cellId);
        setAssetModalOpen(true);
        setPendingAddCellId(null);
      } else {
        setPendingAddCellId(cellId);
      }
    },
    [room.assets, room.entranceCellId, moveSourceCellId, pendingAddCellId, selectingEntrance, onSetEntrance, onMoveAsset]
  );

  const handleSaveAsset = useCallback(
    (asset: Asset) => {
      if (selectedCellId) {
        onSetAsset(selectedCellId, asset);
      }
    },
    [selectedCellId, onSetAsset]
  );

  const handleDeleteAsset = useCallback(() => {
    if (selectedCellId) {
      onDeleteAsset(selectedCellId);
    }
  }, [selectedCellId, onDeleteAsset]);

  const handleSettingsSave = useCallback(
    (rows: number, cols: number, inventoryType: keyof Database["inventory"], items: string[]) => {
      onUpdateDimensions(rows, cols);
      onUpdateInventory(inventoryType, items);
    },
    [onUpdateDimensions, onUpdateInventory]
  );

  const selectedAsset = selectedCellId ? room.assets[selectedCellId] : undefined;

  return (
    <div className="flex flex-col h-screen">
      {/* Top Bar */}
      <div className="h-14 sm:h-16 bg-card/95 flex items-center justify-between px-2 sm:px-5 border-b border-[var(--glass-border)] backdrop-blur-lg z-50 gap-2">
        <div className="flex items-center gap-1 sm:gap-2">
          <Button
            onClick={onBack}
            variant="outline"
            className="bg-secondary border-[var(--glass-border)] text-foreground gap-2 text-xs sm:text-sm px-3 sm:px-4"
          >
            <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
            חזרה
          </Button>
        </div>

        <h3 className="flex-1 text-sm sm:text-lg font-bold text-[var(--primary)] text-center truncate px-1">
          {normalizeGershayim(roomName)}
        </h3>

        <div className="flex items-center gap-1 sm:gap-2 justify-end">
          <Button
            onClick={() => setSelectingEntrance((p) => !p)}
            variant={selectingEntrance ? "default" : "outline"}
            size="sm"
            className="bg-secondary border-[var(--glass-border)] text-foreground gap-1 text-[10px] sm:text-xs px-2 sm:px-3"
          >
            סמן כניסה
          </Button>
          {room.entranceCellId && (
            <Button
              onClick={() => onSetEntrance(null)}
              variant="outline"
              size="sm"
              className="bg-secondary border-[var(--glass-border)] text-foreground gap-1 text-[10px] sm:text-xs px-2 sm:px-3"
            >
              <Minus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              הסר כניסה
            </Button>
          )}
          <Button
            onClick={() => setSettingsOpen(true)}
            variant="outline"
            size="icon"
            className="bg-secondary border-[var(--glass-border)] text-foreground w-8 h-8 sm:w-9 sm:h-9"
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Grid */}
      <AssetGrid
        room={room}
        pendingAddCellId={pendingAddCellId}
        onCellClick={handleCellClick}
        onMoveAsset={onMoveAsset}
        onMoveEntrance={onSetEntrance}
      />

      {/* Modals */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        room={room}
        inventory={inventory}
        onSave={handleSettingsSave}
        onDeleteRoom={onDeleteRoom}
      />

      <AssetModal
        isOpen={assetModalOpen}
        onClose={() => {
          setAssetModalOpen(false);
          setSelectedCellId(null);
        }}
        roomName={roomName}
        cellId={selectedCellId || undefined}
        asset={selectedAsset}
        inventory={inventory}
        onSave={handleSaveAsset}
        onDelete={handleDeleteAsset}
        onSetAsEntrance={
          selectedCellId
            ? () => {
                onSetEntrance(selectedCellId);
                setAssetModalOpen(false);
                setSelectedCellId(null);
              }
            : undefined
        }
      />
    </div>
  );
}
