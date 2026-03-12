"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { AssetGrid } from "./asset-grid";
import { SettingsModal } from "./settings-modal";
import { AssetModal } from "./asset-modal";
import type { Asset, Database, Room } from "@/lib/types";
import { ArrowRight, Settings, RefreshCw } from "lucide-react";

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
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "success" | "error">("idle");
  const [selectingEntrance, setSelectingEntrance] = useState(false);

  const handleCellClick = useCallback((cellId: string) => {
    setSelectedCellId(cellId);
    setAssetModalOpen(true);
  }, []);

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

  const handleSync = useCallback(() => {
    setSyncStatus("syncing");
    // Simulate sync
    setTimeout(() => {
      setSyncStatus("success");
      setTimeout(() => setSyncStatus("idle"), 2000);
    }, 1000);
  }, []);

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
            onClick={() => setSelectingEntrance((prev) => !prev)}
            variant={selectingEntrance ? "default" : "outline"}
            className="bg-secondary border-[var(--glass-border)] text-foreground gap-2"
          >
            {selectingEntrance ? "סמן ריבוע כניסה" : "בחירת כניסה"}
          </Button>
          <Button
            onClick={handleSync}
            variant="outline"
            className="bg-secondary border-[var(--glass-border)] text-foreground gap-2"
          >
            {syncStatus === "syncing" ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : syncStatus === "success" ? (
              "✅"
            ) : syncStatus === "error" ? (
              "❌"
            ) : (
              <>
                סנכרון
                <RefreshCw className="w-4 h-4" />
              </>
            )}
          </Button>
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
        onCellClick={handleCellClick}
        onMoveAsset={onMoveAsset}
        isSelectingEntrance={selectingEntrance}
        onSelectEntrance={(cellId) => {
          onSetEntrance(cellId);
          setSelectingEntrance(false);
        }}
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
