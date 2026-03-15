"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";
import { ASSET_ICONS, type Asset } from "@/lib/types";

const TAP_MOVE_THRESHOLD_PX = 12;

interface GridCellProps {
  cellId: string;
  asset?: Asset;
  isDragging: boolean;
  isDropTarget: boolean;
  isEntrance: boolean;
  isPendingAdd: boolean;
  onPress: () => void;
  onLongPress: () => void;
  onDragEnter: () => void;
  onDragLeave: () => void;
}

export function GridCell({
  cellId,
  asset,
  isDragging,
  isDropTarget,
  isEntrance,
  isPendingAdd,
  onPress,
  onLongPress,
  onDragEnter,
  onDragLeave,
}: GridCellProps) {
  const pressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPressRef = useRef(false);
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const movedRef = useRef(false);

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    isLongPressRef.current = false;
    movedRef.current = false;
    const x = "touches" in e ? e.touches[0].clientX : e.clientX;
    const y = "touches" in e ? e.touches[0].clientY : e.clientY;
    startRef.current = { x, y };
    if (asset || isEntrance) {
      pressTimerRef.current = setTimeout(() => {
        isLongPressRef.current = true;
        onLongPress();
      }, 550);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!startRef.current) return;
    const x = e.touches[0].clientX;
    const y = e.touches[0].clientY;
    const dx = Math.abs(x - startRef.current.x);
    const dy = Math.abs(y - startRef.current.y);
    if (dx > TAP_MOVE_THRESHOLD_PX || dy > TAP_MOVE_THRESHOLD_PX) {
      movedRef.current = true;
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!startRef.current) return;
    const dx = Math.abs(e.clientX - startRef.current.x);
    const dy = Math.abs(e.clientY - startRef.current.y);
    if (dx > TAP_MOVE_THRESHOLD_PX || dy > TAP_MOVE_THRESHOLD_PX) {
      movedRef.current = true;
    }
  };

  const handleEnd = (e: React.MouseEvent | React.TouchEvent) => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
    if (!isLongPressRef.current && !movedRef.current) {
      onPress();
    }
    startRef.current = null;
  };

  const handleCancel = () => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
    startRef.current = null;
  };

  return (
    <div
      data-cell-id={cellId}
      className={cn(
        "w-[72px] h-[72px] sm:w-[80px] sm:h-[80px] rounded-xl flex flex-col items-center justify-center cursor-pointer relative transition-all duration-100 select-none",
        "bg-white/[0.03] border border-white/[0.05]",
        asset && "bg-[#1c2135] border-[var(--glass-border)] shadow-lg",
        isEntrance && "ring-2 ring-[var(--primary)] ring-offset-2 ring-offset-transparent",
        isDragging && "opacity-50 scale-90 border-2 border-dashed border-[var(--primary)] z-10",
        isDropTarget && "!bg-[rgba(0,242,255,0.15)] !border-2 !border-[var(--primary)]"
      )}
      onMouseDown={handleStart}
      onMouseMove={handleMouseMove}
      onMouseUp={handleEnd}
      onMouseLeave={handleCancel}
      onTouchStart={handleStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleEnd}
      onTouchCancel={handleCancel}
      onMouseEnter={onDragEnter}
      onDragLeave={onDragLeave}
    >
      {isPendingAdd ? (
        <span className="text-3xl font-light text-[var(--primary)] pointer-events-none">+</span>
      ) : isEntrance ? (
        <>
          <img src="/entrance-icon.png" alt="" className="w-10 h-10 sm:w-11 sm:h-11 mb-1 object-contain pointer-events-none" />
          <span className="text-[10px] font-extrabold text-[var(--primary)] text-center pointer-events-none px-1 truncate max-w-full">
            כניסה
          </span>
        </>
      ) : (
        <>
          {asset && (
            <>
              <span className="text-2xl mb-1 pointer-events-none">
                {ASSET_ICONS[asset.type] || "❓"}
              </span>
              <span className="text-[10px] font-extrabold text-[var(--primary)] text-center pointer-events-none px-1 truncate max-w-full">
                {asset.name}
              </span>
            </>
          )}
        </>
      )}
    </div>
  );
}
