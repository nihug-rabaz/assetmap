"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { AssetGrid } from "./asset-grid";
import { SettingsModal } from "./settings-modal";
import { AssetModal } from "./asset-modal";
import type { Asset, Database, Room } from "@/lib/types";
import { ArrowRight, Settings } from "lucide-react";

interface RoomViewProps {
  roomName: string;
  room: Room;
  inventory: Database["inventory"];
  onBack: () => void;
  onSetAsset: (cellId: string, asset: Asset) => void;
  onDeleteAsset: (cellId: string) => void;
  onMoveAsset: (fromCellId: string, toCellId: string) => void;
  onUpdateDimensions: (rows: number, cols: number) => void;
  onUpdateInventory: (type: keyof Database["inventory"], items: string[]) => void;
  onSetEntrance: (cellId: string) => void;
}

export function RoomView({
  roomName,
  room,
  inventory,
  onBack,
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

  const handleCellClick = useCallback(
    (cellId: string) => {
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
      if (hasAsset || isEntrance) {
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
    [room.assets, room.entranceCellId, moveSourceCellId, pendingAddCellId, onSetEntrance, onMoveAsset]
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
      <div className="h-16 bg-card/95 flex items-center justify-between px-5 border-b border-[var(--glass-border)] backdrop-blur-lg z-50">
        <Button
          onClick={onBack}
          variant="outline"
          className="bg-secondary border-[var(--glass-border)] text-foreground gap-2"
        >
          <ArrowRight className="w-4 h-4" />
          חזרה
        </Button>

        <h3 className="text-lg font-bold text-[var(--primary)]">{roomName}</h3>

        <div className="flex gap-2">
          <Button
            onClick={() => setSettingsOpen(true)}
            variant="outline"
            size="icon"
            className="bg-secondary border-[var(--glass-border)] text-foreground"
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
      />
    </div>
  );
}
