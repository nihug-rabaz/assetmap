"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload } from "lucide-react";
import { normalizeGershayim } from "@/lib/utils";

const SECTION_ORDER = [
  "חמ״ל רבצ״ר",
  "חד״ן רבצ״ר",
  "מכלול תאים",
  "מאנ״ח",
  "תר״ח לאומי",
  "תר״ח לטרון",
];

function dedupeByNormalized(rooms: string[]): string[] {
  const seen = new Set<string>();
  return rooms.filter((r) => {
    const n = normalizeGershayim(r);
    if (seen.has(n)) return false;
    seen.add(n);
    return true;
  });
}

function sortRoomsBySections(rooms: string[]): string[] {
  const deduped = dedupeByNormalized(rooms);
  const byNormalized = new Map<string, string>();
  for (const r of deduped) byNormalized.set(normalizeGershayim(r), r);
  const inOrder: string[] = [];
  for (const s of SECTION_ORDER) {
    const n = normalizeGershayim(s);
    if (byNormalized.has(n)) inOrder.push(byNormalized.get(n)!);
  }
  const rest = deduped.filter((r) => !inOrder.includes(r));
  return [...inOrder, ...rest];
}

interface LobbyProps {
  rooms: string[];
  onEnterRoom: (roomName: string) => void;
  onCreateRoom: (roomName: string) => void;
  onOpenReport: () => void;
  onImportExcel: (file: File) => Promise<{ addedRooms: number; addedAssets: number }>;
}

export function Lobby({ rooms, onEnterRoom, onCreateRoom, onOpenReport, onImportExcel }: LobbyProps) {
  const [newRoomName, setNewRoomName] = useState("");
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCreate = () => {
    const trimmed = newRoomName.trim();
    if (!trimmed) return;
    onCreateRoom(trimmed);
    setNewRoomName("");
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !file.name.match(/\.(xlsx|xls)$/i)) return;
    setImporting(true);
    setImportResult(null);
    try {
      const { addedRooms, addedAssets } = await onImportExcel(file);
      setImportResult(`נוסף: ${addedRooms} חדרים, ${addedAssets} עמדות`);
    } catch {
      setImportResult("שגיאה בייבוא");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-8 p-5">
      <img src="/entrance-icon.png" alt="" className="w-24 h-24 sm:w-28 sm:h-28 object-contain mb-2" aria-hidden />
      <h1 className="text-4xl font-black text-foreground">
        AssetMap <span className="text-[var(--primary)]">Latrun</span>
      </h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-4xl">
        {sortRoomsBySections(rooms).map((room) => (
          <button
            key={room}
            onClick={() => onEnterRoom(room)}
            className="bg-card p-8 rounded-2xl border border-[var(--glass-border)] cursor-pointer transition-all duration-200 text-center shadow-lg hover:-translate-y-1 hover:border-[var(--primary)] hover:shadow-[0_0_25px_rgba(0,242,255,0.15)]"
          >
            <h3 className="text-lg font-bold text-foreground">{normalizeGershayim(room)}</h3>
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
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={handleFileChange}
        />
        <Button
          variant="outline"
          onClick={handleImportClick}
          disabled={importing}
          className="w-full bg-secondary border-[var(--glass-border)] text-foreground gap-2"
        >
          <Upload className="w-4 h-4" />
          {importing ? "מייבא..." : "ייבוא מאקסל (מוסיף רק מה שחסר)"}
        </Button>
        {importResult && (
          <p className="text-sm text-[var(--primary)]">{importResult}</p>
        )}
      </div>
    </div>
  );
}
