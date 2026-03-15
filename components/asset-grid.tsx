"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { GridCell } from "./grid-cell";
import type { Room } from "@/lib/types";

interface AssetGridProps {
  room: Room;
  pendingAddCellId: string | null;
  onCellClick: (cellId: string) => void;
  onMoveAsset: (fromCellId: string, toCellId: string) => void;
  onMoveEntrance: (toCellId: string) => void;
}

export function AssetGrid({
  room,
  pendingAddCellId,
  onCellClick,
  onMoveAsset,
  onMoveEntrance,
}: AssetGridProps) {
  const [dragSource, setDragSource] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const handleLongPress = useCallback((cellId: string) => {
    setDragSource(cellId);
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!dragSource || !e.touches.length) return;
      const touch = e.touches[0];
      const el = document.elementFromPoint(touch.clientX, touch.clientY);
      const cellEl = el?.closest("[data-cell-id]");
      const targetId = cellEl?.getAttribute("data-cell-id") ?? null;
      setDropTarget((prev) => (targetId && targetId !== dragSource ? targetId : null));
    },
    [dragSource]
  );

  useEffect(() => {
    if (!dragSource || !gridRef.current) return;
    const el = gridRef.current;
    const preventScroll = (e: TouchEvent) => e.touches.length === 1 && e.preventDefault();
    el.addEventListener("touchmove", preventScroll, { passive: false });
    return () => el.removeEventListener("touchmove", preventScroll);
  }, [dragSource]);

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

  const handlePress = useCallback(
    (cellId: string) => {
      if (dragSource) {
        if (dragSource !== cellId) {
          if (room.entranceCellId === dragSource) {
            onMoveEntrance(cellId);
          } else {
            onMoveAsset(dragSource, cellId);
          }
        }
        setDragSource(null);
        setDropTarget(null);
      } else {
        onCellClick(cellId);
      }
    },
    [dragSource, room.entranceCellId, onCellClick, onMoveAsset, onMoveEntrance]
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
          isPendingAdd={pendingAddCellId === cellId}
          onPress={() => handlePress(cellId)}
          onLongPress={() => handleLongPress(cellId)}
          onDragEnter={() => handleDragEnter(cellId)}
          onDragLeave={handleDragLeave}
        />
      );
    }
  }

  return (
    <div
      ref={gridRef}
      className="flex-1 overflow-auto px-2 py-4 sm:px-4 sm:py-6 md:p-8"
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${room.cols}, 72px)`,
        gap: 6,
        justifyContent: "center",
        alignContent: "start",
      }}
      onTouchMove={dragSource ? handleTouchMove : undefined}
    >
      {cells}
    </div>
  );
}
