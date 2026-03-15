"use client";

import { useMemo, useState } from "react";
import type { Database } from "@/lib/types";
import { normalizeGershayim } from "@/lib/utils";
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

type FilterField = "room" | "cell" | "name" | "type" | "sku" | "monSku";
type FilterOp = "equals" | "contains" | "startsWith";

interface ActiveFilter {
  id: number;
  field: FilterField;
  op: FilterOp;
  value: string;
}

export function DeviceReport({ db, onBack }: DeviceReportProps) {
  const [roomFilter, setRoomFilter] = useState<string>("ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [sortField, setSortField] = useState<"room" | "cell" | "name" | "type" | "sku" | "monSku">(
    "room"
  );
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [filters, setFilters] = useState<ActiveFilter[]>([]);
  const [nextFilterId, setNextFilterId] = useState(1);

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

  const filteredAndSorted = useMemo(() => {
    let data = rows;

    if (roomFilter !== "ALL") {
      data = data.filter((r) => r.room === roomFilter);
    }
    if (typeFilter !== "ALL") {
      data = data.filter((r) => r.type === typeFilter);
    }

    for (const f of filters) {
      const value = f.value.trim();
      if (!value) continue;
      data = data.filter((r) => {
        const fieldValue = String(r[f.field] || "");
        if (f.op === "equals") {
          return fieldValue === value;
        }
        if (f.op === "startsWith") {
          return fieldValue.startsWith(value);
        }
        return fieldValue.includes(value);
      });
    }

    const sorted = [...data].sort((a, b) => {
      const av = a[sortField] || "";
      const bv = b[sortField] || "";
      const cmp = String(av).localeCompare(String(bv), "he");
      return sortDirection === "asc" ? cmp : -cmp;
    });

    return sorted;
  }, [rows, roomFilter, typeFilter, sortField, sortDirection, filters]);

  const csvHref = useMemo(() => {
    const header = ["room", "cell", "name", "type", "sku", "monSku"];
    const lines = [header.join(",")];
    for (const r of filteredAndSorted) {
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
  }, [filteredAndSorted]);

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

      <div className="flex flex-col gap-3 flex-1 bg-card rounded-2xl border border-[var(--glass-border)] p-3">
        <div className="flex flex-wrap gap-2 items-center justify-between">
          <div className="flex flex-wrap gap-2">
            <select
              value={roomFilter}
              onChange={(e) => setRoomFilter(e.target.value)}
              className="bg-[var(--bg-dark)] border-[var(--glass-border)] text-foreground text-sm px-3 py-1.5 rounded-md"
            >
              <option value="ALL">כל החדרים</option>
              {Array.from(new Set(rows.map((r) => r.room))).map((room) => (
                <option key={room} value={room}>
                  {normalizeGershayim(room)}
                </option>
              ))}
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-[var(--bg-dark)] border-[var(--glass-border)] text-foreground text-sm px-3 py-1.5 rounded-md"
            >
              <option value="ALL">כל הסוגים</option>
              {Array.from(new Set(rows.map((r) => r.type))).map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1" />
        </div>

        <div className="flex flex-wrap items-center gap-2 bg-[var(--bg-dark)]/40 border border-[var(--glass-border)] rounded-xl px-3 py-2 text-xs">
          {filters.map((f) => (
            <div
              key={f.id}
              className="flex items-center gap-1 bg-card/60 border border-[var(--glass-border)] rounded-full px-2 py-1"
            >
              <button
                onClick={() =>
                  setFilters((prev) => prev.filter((existing) => existing.id !== f.id))
                }
                className="text-muted-foreground mr-1"
              >
                ×
              </button>
              <span>where</span>
              <select
                value={f.field}
                onChange={(e) =>
                  setFilters((prev) =>
                    prev.map((existing) =>
                      existing.id === f.id
                        ? { ...existing, field: e.target.value as FilterField }
                        : existing
                    )
                  )
                }
                className="bg-transparent border border-[var(--glass-border)] rounded px-1"
              >
                <option value="room">room</option>
                <option value="cell">cell</option>
                <option value="name">name</option>
                <option value="type">type</option>
                <option value="sku">sku</option>
                <option value="monSku">monSku</option>
              </select>
              <select
                value={f.op}
                onChange={(e) =>
                  setFilters((prev) =>
                    prev.map((existing) =>
                      existing.id === f.id
                        ? { ...existing, op: e.target.value as FilterOp }
                        : existing
                    )
                  )
                }
                className="bg-transparent border border-[var(--glass-border)] rounded px-1"
              >
                <option value="equals">equals</option>
                <option value="contains">contains</option>
                <option value="startsWith">starts with</option>
              </select>
              {f.field === "room" || f.field === "type" ? (
                <select
                  value={f.value}
                  onChange={(e) =>
                    setFilters((prev) =>
                      prev.map((existing) =>
                        existing.id === f.id ? { ...existing, value: e.target.value } : existing
                      )
                    )
                  }
                  className="bg-transparent border border-[var(--glass-border)] rounded px-1"
                >
                  <option value="">-- any --</option>
                  {Array.from(
                    new Set(
                      rows.map((r) => (f.field === "room" ? r.room : r.type)).filter((v) => v)
                    )
                  ).map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  value={f.value}
                  onChange={(e) =>
                    setFilters((prev) =>
                      prev.map((existing) =>
                        existing.id === f.id ? { ...existing, value: e.target.value } : existing
                      )
                    )
                  }
                  className="bg-transparent border border-[var(--glass-border)] rounded px-1"
                />
              )}
            </div>
          ))}

          <Button
            size="sm"
            variant="outline"
            className="text-xs"
            onClick={() => {
              setFilters((prev) => [
                ...prev,
                { id: nextFilterId, field: "room", op: "equals", value: "" },
              ]);
              setNextFilterId((id) => id + 1);
            }}
          >
            + Add filter
          </Button>
          {filters.length > 0 && (
            <button
              onClick={() => setFilters([])}
              className="text-muted-foreground hover:text-foreground ml-2"
            >
              Clear filters
            </button>
          )}
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                className="cursor-pointer text-right"
                onClick={() => {
                  setSortDirection((prev) =>
                    sortField === "room" ? (prev === "asc" ? "desc" : "asc") : "asc"
                  );
                  setSortField("room");
                }}
              >
                חדר {sortField === "room" ? (sortDirection === "asc" ? "↑" : "↓") : ""}
              </TableHead>
              <TableHead
                className="cursor-pointer text-right"
                onClick={() => {
                  setSortDirection((prev) =>
                    sortField === "cell" ? (prev === "asc" ? "desc" : "asc") : "asc"
                  );
                  setSortField("cell");
                }}
              >
                תא {sortField === "cell" ? (sortDirection === "asc" ? "↑" : "↓") : ""}
              </TableHead>
              <TableHead
                className="cursor-pointer text-right"
                onClick={() => {
                  setSortDirection((prev) =>
                    sortField === "name" ? (prev === "asc" ? "desc" : "asc") : "asc"
                  );
                  setSortField("name");
                }}
              >
                שם {sortField === "name" ? (sortDirection === "asc" ? "↑" : "↓") : ""}
              </TableHead>
              <TableHead
                className="cursor-pointer text-right"
                onClick={() => {
                  setSortDirection((prev) =>
                    sortField === "type" ? (prev === "asc" ? "desc" : "asc") : "asc"
                  );
                  setSortField("type");
                }}
              >
                סוג {sortField === "type" ? (sortDirection === "asc" ? "↑" : "↓") : ""}
              </TableHead>
              <TableHead
                className="cursor-pointer text-right"
                onClick={() => {
                  setSortDirection((prev) =>
                    sortField === "sku" ? (prev === "asc" ? "desc" : "asc") : "asc"
                  );
                  setSortField("sku");
                }}
              >
                מק&quot;ט {sortField === "sku" ? (sortDirection === "asc" ? "↑" : "↓") : ""}
              </TableHead>
              <TableHead
                className="cursor-pointer text-right"
                onClick={() => {
                  setSortDirection((prev) =>
                    sortField === "monSku" ? (prev === "asc" ? "desc" : "asc") : "asc"
                  );
                  setSortField("monSku");
                }}
              >
                מק&quot;ט מסך {sortField === "monSku" ? (sortDirection === "asc" ? "↑" : "↓") : ""}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSorted.map((row, idx) => (
              <TableRow key={`${row.room}-${row.cell}-${idx}`}>
                <TableCell>{normalizeGershayim(row.room)}</TableCell>
                <TableCell>{row.cell}</TableCell>
                <TableCell>{row.name}</TableCell>
                <TableCell>{row.type === "ENTRANCE" ? "🚪 " + row.name : row.type}</TableCell>
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

