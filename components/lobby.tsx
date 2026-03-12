"use client";

import { ROOMS } from "@/lib/types";

interface LobbyProps {
  onEnterRoom: (roomName: string) => void;
}

export function Lobby({ onEnterRoom }: LobbyProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-8 p-5">
      <h1 className="text-4xl font-black text-foreground">
        AssetMap <span className="text-[var(--primary)]">Latrun</span>
      </h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-4xl">
        {ROOMS.map((room) => (
          <button
            key={room}
            onClick={() => onEnterRoom(room)}
            className="bg-card p-8 rounded-2xl border border-[var(--glass-border)] cursor-pointer transition-all duration-200 text-center shadow-lg hover:-translate-y-1 hover:border-[var(--primary)] hover:shadow-[0_0_25px_rgba(0,242,255,0.15)]"
          >
            <h3 className="text-lg font-bold text-foreground">{room}</h3>
          </button>
        ))}
      </div>
    </div>
  );
}
