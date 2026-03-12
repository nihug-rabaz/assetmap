"use client";

import { useMemo } from "react";
import type { Database } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface DeviceReportProps {
  db: Database;
  onBack: () => void;
}

export function DeviceReport({ db, onBack }: DeviceReportProps) {
  const rows = useMemo(() => {
    const list: {
      room: string;
      cell: string;
      name: string;
      type: string;
      sku: string;
      monSku: string;
    }[] = [];

    for (const [roomName, room] of Object.entries(db.rooms)) {
      if (room.entranceCellId) {
        list.push({
          room: roomName,
          cell: room.entranceCellId,
          name: "כניסה",
          type: "ENTRANCE",
          sku: "",
          monSku: "",
        });
      }

      for (const [cellId, asset] of Object.entries(room.assets)) {
        list.push({
          room: roomName,
          cell: cellId,
          name: asset.name,
          type: asset.type,
          sku: asset.sku,
          monSku: asset.monSku,
        });
      }
    }

    return list;
  }, [db.rooms]);

  const csvHref = useMemo(() => {
    const header = ["room", "cell", "name", "type", "sku", "monSku"];
    const lines = [header.join(",")];
    for (const r of rows) {
      const line = [
        r.room,
        r.cell,
        r.name.replace(/"/g, "'"),
        r.type,
        r.sku,
        r.monSku,
      ]
        .map((v) => `"${v}"`)
        .join(",");
      lines.push(line);
    }
    const csv = lines.join("\n");
    return `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;
  }, [rows]);

  return (
    <div className="flex flex-col min-h-screen bg-[var(--bg-dark)] p-4 gap-4">
      <div className="flex items-center justify-between gap-2">
        <Button
          variant="outline"
          onClick={onBack}
          className="bg-secondary border-[var(--glass-border)] text-foreground"
        >
          חזרה
        </Button>
        <h2 className="text-lg font-bold text-[var(--primary)]">דוח ציוד</h2>
        <a href={csvHref} download="devices-report.csv">
          <Button className="bg-[var(--primary)] text-black font-extrabold hover:bg-[var(--primary)]/90">
            הורדת CSV
          </Button>
        </a>
      </div>

      <div className="flex-1 bg-card rounded-2xl border border-[var(--glass-border)] p-3">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>חדר</TableHead>
              <TableHead>תא</TableHead>
              <TableHead>שם</TableHead>
              <TableHead>סוג</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>MON SKU</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, idx) => (
              <TableRow key={`${row.room}-${row.cell}-${idx}`}>
                <TableCell>{row.room}</TableCell>
                <TableCell>{row.cell}</TableCell>
                <TableCell>{row.name}</TableCell>
                <TableCell>{row.type}</TableCell>
                <TableCell>{row.sku}</TableCell>
                <TableCell>{row.monSku}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

