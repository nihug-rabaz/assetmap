"use client";

import { cn } from "@/lib/utils";
import { ASSET_ICONS, type Asset } from "@/lib/types";

interface GridCellProps {
  cellId: string;
  asset?: Asset;
  isDragging: boolean;
  isDropTarget: boolean;
  isEntrance: boolean;
  onPress: () => void;
  onLongPress: () => void;
  onDrop: () => void;
  onDragEnter: () => void;
  onDragLeave: () => void;
}

export function GridCell({
  cellId,
  asset,
  isDragging,
  isDropTarget,
  isEntrance,
  onPress,
  onLongPress,
  onDrop,
  onDragEnter,
  onDragLeave,
}: GridCellProps) {
  let pressTimer: ReturnType<typeof setTimeout> | null = null;
  let isLongPress = false;

  const handleStart = () => {
    isLongPress = false;
    if (asset) {
      pressTimer = setTimeout(() => {
        isLongPress = true;
        onLongPress();
      }, 550);
    }
  };

  const handleEnd = () => {
    if (pressTimer) {
      clearTimeout(pressTimer);
    }
    if (!isLongPress) {
      onPress();
    }
  };

  const handleCancel = () => {
    if (pressTimer) {
      clearTimeout(pressTimer);
    }
  };

  return (
    <div
      className={cn(
        "w-[72px] h-[72px] sm:w-[80px] sm:h-[80px] rounded-xl flex flex-col items-center justify-center cursor-pointer relative transition-all duration-100 select-none",
        "bg-white/[0.03] border border-white/[0.05]",
        asset && "bg-[#1c2135] border-[var(--glass-border)] shadow-lg",
        isEntrance && "ring-2 ring-[var(--primary)] ring-offset-2 ring-offset-transparent",
        isDragging && "opacity-50 scale-90 border-2 border-dashed border-[var(--primary)] z-10",
        isDropTarget && "!bg-[rgba(0,242,255,0.15)] !border-2 !border-[var(--primary)]"
      )}
      onMouseDown={handleStart}
      onMouseUp={handleEnd}
      onMouseLeave={handleCancel}
      onTouchStart={handleStart}
      onTouchEnd={handleEnd}
      onTouchCancel={handleCancel}
      onMouseEnter={onDragEnter}
      onClick={onDrop}
      onDragLeave={onDragLeave}
    >
      {isEntrance ? (
        <>
          <span className="text-2xl mb-1 pointer-events-none">🚪</span>
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
