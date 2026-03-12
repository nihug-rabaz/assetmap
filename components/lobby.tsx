"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface LobbyProps {
  rooms: string[];
  onEnterRoom: (roomName: string) => void;
  onCreateRoom: (roomName: string) => void;
  onOpenReport: () => void;
}

export function Lobby({ rooms, onEnterRoom, onCreateRoom, onOpenReport }: LobbyProps) {
  const [newRoomName, setNewRoomName] = useState("");

  const handleCreate = () => {
    const trimmed = newRoomName.trim();
    if (!trimmed) return;
    onCreateRoom(trimmed);
    setNewRoomName("");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-8 p-5">
      <h1 className="text-4xl font-black text-foreground">
        AssetMap <span className="text-[var(--primary)]">Latrun</span>
      </h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-4xl">
        {rooms.map((room) => (
          <button
            key={room}
            onClick={() => onEnterRoom(room)}
            className="bg-card p-8 rounded-2xl border border-[var(--glass-border)] cursor-pointer transition-all duration-200 text-center shadow-lg hover:-translate-y-1 hover:border-[var(--primary)] hover:shadow-[0_0_25px_rgba(0,242,255,0.15)]"
          >
            <h3 className="text-lg font-bold text-foreground">{room}</h3>
          </button>
        ))}
      </div>
      <div className="w-full max-w-md mt-6 flex flex-col gap-2">
        <div className="flex gap-2">
        <Input
          value={newRoomName}
          onChange={(e) => setNewRoomName(e.target.value)}
          placeholder="שם חדר חדש..."
          className="bg-[var(--bg-dark)] border-[var(--glass-border)] text-foreground"
        />
        <Button
          onClick={handleCreate}
          className="bg-[var(--primary)] text-black font-extrabold hover:bg-[var(--primary)]/90"
        >
          צור חדר
        </Button>
        </div>
        <Button
          variant="outline"
          onClick={onOpenReport}
          className="w-full bg-secondary border-[var(--glass-border)] text-foreground"
        >
          דוח ציוד (טבלה + CSV)
        </Button>
      </div>
    </div>
  );
}
