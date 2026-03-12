"use client";

import { useState, useCallback } from "react";
import { GridCell } from "./grid-cell";
import type { Room } from "@/lib/types";

interface AssetGridProps {
  room: Room;
  onCellClick: (cellId: string) => void;
  onMoveAsset: (fromCellId: string, toCellId: string) => void;
  isSelectingEntrance?: boolean;
  onSelectEntrance?: (cellId: string) => void;
}

export function AssetGrid({
  room,
  onCellClick,
  onMoveAsset,
  isSelectingEntrance,
  onSelectEntrance,
}: AssetGridProps) {
  const [dragSource, setDragSource] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);

  const handleLongPress = useCallback((cellId: string) => {
    setDragSource(cellId);
  }, []);

  const handleDragEnter = useCallback(
    (cellId: string) => {
      if (dragSource && cellId !== dragSource) {
        setDropTarget(cellId);
      }
    },
    [dragSource]
  );

  const handleDragLeave = useCallback(() => {
    setDropTarget(null);
  }, []);

  const handleDrop = useCallback(
    (cellId: string) => {
      if (dragSource && dragSource !== cellId) {
        onMoveAsset(dragSource, cellId);
        setDragSource(null);
        setDropTarget(null);
      }
    },
    [dragSource, onMoveAsset]
  );

  const handlePress = useCallback(
    (cellId: string) => {
      if (isSelectingEntrance && onSelectEntrance) {
        onSelectEntrance(cellId);
        return;
      }
      if (dragSource) {
        if (dragSource !== cellId) {
          onMoveAsset(dragSource, cellId);
        }
        setDragSource(null);
        setDropTarget(null);
      } else {
        onCellClick(cellId);
      }
    },
    [dragSource, onCellClick, onMoveAsset, isSelectingEntrance, onSelectEntrance]
  );

  const cells = [];
  for (let r = 0; r < room.rows; r++) {
    for (let c = 0; c < room.cols; c++) {
      const cellId = `${r}-${c}`;
      const asset = room.assets[cellId];
      cells.push(
        <GridCell
          key={cellId}
          cellId={cellId}
          asset={asset}
          isDragging={dragSource === cellId}
          isDropTarget={dropTarget === cellId}
          isEntrance={room.entranceCellId === cellId}
          onPress={() => handlePress(cellId)}
          onLongPress={() => handleLongPress(cellId)}
          onDrop={() => handleDrop(cellId)}
          onDragEnter={() => handleDragEnter(cellId)}
          onDragLeave={handleDragLeave}
        />
      );
    }
  }

  return (
    <div
      className="flex-1 overflow-auto px-2 py-4 sm:px-4 sm:py-6 md:p-8"
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${room.cols}, 72px)`,
        gap: 6,
        justifyContent: "center",
        alignContent: "start",
      }}
    >
      {cells}
    </div>
  );
}
