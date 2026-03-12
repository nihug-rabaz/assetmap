"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Database, Room } from "@/lib/types";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: Room;
  inventory: Database["inventory"];
  onSave: (rows: number, cols: number, inventoryType: keyof Database["inventory"], items: string[]) => void;
}

type InventoryType = keyof Database["inventory"];

const INVENTORY_TYPES: { value: InventoryType; label: string }[] = [
  { value: "PC", label: "PC (מארזים)" },
  { value: "MONITOR", label: "MONITOR (מסכים)" },
  { value: "TV", label: "TV (טלוויזיות)" },
  { value: "PRINTER", label: "PRINTER (מדפסות)" },
  { value: "UC", label: "UC (טלפוניה)" },
  { value: "SWITCH", label: "SWITCH (סוויצ'ים)" },
];

export function SettingsModal({ isOpen, onClose, room, inventory, onSave }: SettingsModalProps) {
  const [rows, setRows] = useState(room.rows);
  const [cols, setCols] = useState(room.cols);
  const [inventoryType, setInventoryType] = useState<InventoryType>("PC");
  const [inventoryText, setInventoryText] = useState("");

  useEffect(() => {
    setRows(room.rows);
    setCols(room.cols);
  }, [room]);

  useEffect(() => {
    setInventoryText((inventory[inventoryType] || []).join(", "));
  }, [inventoryType, inventory]);

  const handleSave = () => {
    const items = inventoryText
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s);
    onSave(rows, cols, inventoryType, items);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[999]"
        onClick={onClose}
      />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-card p-6 rounded-3xl z-[1000] w-[330px] border border-[var(--glass-border)] shadow-2xl">
        <h3 className="text-lg font-bold text-foreground mb-4">הגדרות חדר ומלאי</h3>

        <Label className="text-muted-foreground text-sm">ממדי הטבלה (שורות x עמודות)</Label>
        <div className="flex gap-3 mt-2">
          <Input
            type="number"
            value={rows}
            onChange={(e) => setRows(parseInt(e.target.value) || 1)}
            placeholder="שורות"
            className="bg-[var(--bg-dark)] border-[var(--glass-border)] text-foreground"
          />
          <Input
            type="number"
            value={cols}
            onChange={(e) => setCols(parseInt(e.target.value) || 1)}
            placeholder="עמודות"
            className="bg-[var(--bg-dark)] border-[var(--glass-border)] text-foreground"
          />
        </div>

        <hr className="border-[var(--glass-border)] my-4" />

        <Label className="text-muted-foreground text-sm">{'ניהול מלאי מק"טים (גלובלי)'}</Label>
        <Select
          value={inventoryType}
          onValueChange={(v) => setInventoryType(v as InventoryType)}
        >
          <SelectTrigger className="mt-2 bg-[var(--bg-dark)] border-[var(--glass-border)] text-foreground">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-card border-[var(--glass-border)]">
            {INVENTORY_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value} className="text-foreground">
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Textarea
          value={inventoryText}
          onChange={(e) => setInventoryText(e.target.value)}
          placeholder="הכנס מקטים מופרדים בפסיקים..."
          rows={5}
          className="mt-2 bg-[var(--bg-dark)] border-[var(--glass-border)] text-foreground resize-none"
        />

        <Button
          onClick={handleSave}
          className="w-full mt-4 bg-[var(--primary)] text-black font-extrabold hover:bg-[var(--primary)]/90"
        >
          שמור הגדרות
        </Button>
      </div>
    </>
  );
}
