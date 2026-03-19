"use client";

import { useState, useEffect, useMemo } from "react";
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
import type { Asset, AssetType, Database } from "@/lib/types";
import { ASSET_TYPES } from "@/lib/types";
import { BarcodeScanner } from "@/components/barcode-scanner";
import { ConfirmDialog } from "@/components/confirm-dialog";

interface AssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomName?: string;
  cellId?: string;
  asset?: Asset;
  inventory: Database["inventory"];
  onSave: (asset: Asset) => void;
  onDelete: () => void;
  onSetAsEntrance?: () => void;
}

export function AssetModal({
  isOpen,
  onClose,
  roomName,
  cellId,
  asset,
  inventory,
  onSave,
  onDelete,
  onSetAsEntrance,
}: AssetModalProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState<AssetType>("STATION");
  const [sku, setSku] = useState("");
  const [monSku, setMonSku] = useState("");
  const [scanTarget, setScanTarget] = useState<"sku" | "mon" | null>(null);
  const [lastCheck, setLastCheck] = useState<{
    status: string;
    notes: string | null;
    checked_by: string | null;
    checked_at: string;
  } | null>(null);
  const [checkStatus, setCheckStatus] = useState<"OK" | "NOT_OK">("OK");
  const [checkNotes, setCheckNotes] = useState("");
  const [checkBy, setCheckBy] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (asset) {
      setName(asset.name);
      setType(asset.type);
      setSku(asset.sku);
      setMonSku(asset.monSku);
    } else {
      setName("");
      setType("STATION");
      setSku("");
      setMonSku("");
    }
  }, [asset, isOpen]);

  useEffect(() => {
    if (!roomName || !cellId || !isOpen) {
      setLastCheck(null);
      return;
    }
    fetch(`/api/checks/${encodeURIComponent(roomName)}/${cellId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          setLastCheck(data);
        } else {
          setLastCheck(null);
        }
      })
      .catch(() => setLastCheck(null));
  }, [roomName, cellId, isOpen]);

  const { showPcSku, showMonSku, pcLabel, pcOptions, monOptions } = useMemo(() => {
    let showPc = false;
    let showMon = false;
    let label = "מק\"ט";
    let pcOpts: string[] = [];
    let monOpts: string[] = [];

    switch (type) {
      case "STATION":
        showPc = true;
        showMon = true;
        label = "מק\"ט PC";
        pcOpts = inventory.PC || [];
        monOpts = inventory.MONITOR || [];
        break;
      case "PC":
        showPc = true;
        label = "מק\"ט PC";
        pcOpts = inventory.PC || [];
        break;
      case "MONITOR":
        showMon = true;
        monOpts = inventory.MONITOR || [];
        break;
      case "TV":
        showMon = true;
        monOpts = inventory.TV || [];
        break;
      case "PRINTER":
        showPc = true;
        label = "מק\"ט PRINTER";
        pcOpts = inventory.PRINTER || [];
        break;
      case "UC":
        showPc = true;
        label = "מק\"ט UC";
        pcOpts = inventory.UC || [];
        break;
      case "SWITCH":
        showPc = true;
        label = "מק\"ט SWITCH";
        pcOpts = inventory.SWITCH || [];
        break;
    }

    return {
      showPcSku: showPc,
      showMonSku: showMon,
      pcLabel: label,
      pcOptions: pcOpts,
      monOptions: monOpts,
    };
  }, [type, inventory]);

  useEffect(() => {
    setSku("");
    setMonSku("");
  }, [type]);

  const handleSave = () => {
    if (!name.trim()) {
      setFormError("חובה להזין שם עמדה");
      return;
    }
    setFormError(null);
    onSave({
      name: name.trim(),
      type,
      sku,
      monSku,
    });
    onClose();
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[999]"
        onClick={onClose}
      />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-card p-6 rounded-3xl z-[1100] w-[330px] border border-[var(--glass-border)] shadow-2xl">
        <h3 className="text-lg font-bold text-foreground mb-4">הגדרת עמדה</h3>

        <Label className="text-muted-foreground text-sm">שם עמדה / תפקיד</Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={"לדוגמא: קמב\"ץ"}
          className="mt-2 bg-[var(--bg-dark)] border-[var(--glass-border)] text-foreground"
        />
        {formError && <div className="mt-2 text-xs text-[var(--danger)]">{formError}</div>}

        <Label className="text-muted-foreground text-sm mt-4 block">סוג ציוד</Label>
        <Select value={type} onValueChange={(v) => setType(v as AssetType)}>
          <SelectTrigger className="mt-2 bg-[var(--bg-dark)] border-[var(--glass-border)] text-foreground">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-card border-[var(--glass-border)]">
            {ASSET_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value} className="text-foreground">
                {t.icon} {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {showPcSku && (
          <>
            <Label className="text-muted-foreground text-sm mt-4 block">{pcLabel}</Label>
            <div className="flex gap-2 mt-2">
              <Select value={sku || undefined} onValueChange={setSku}>
                <SelectTrigger className="flex-1 bg-[var(--bg-dark)] border-[var(--glass-border)] text-foreground">
                  <SelectValue placeholder={"בחר מק\"ט"} />
                </SelectTrigger>
                <SelectContent className="bg-card border-[var(--glass-border)]">
                  {pcOptions
                    .filter((s) => s && s.trim().length > 0)
                    .map((s) => (
                      <SelectItem key={s} value={s} className="text-foreground">
                        {s}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="outline"
                className="px-3 bg-[var(--bg-dark)] border-[var(--glass-border)] text-foreground"
                onClick={() => setScanTarget("sku")}
              >
                סריקה
              </Button>
            </div>
            <Input
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder="סרוק או הקלד מק&quot;ט..."
              className="mt-2 bg-[var(--bg-dark)] border-[var(--glass-border)] text-foreground tracking-widest text-center"
            />
          </>
        )}

        {showMonSku && (
          <>
            <Label className="text-muted-foreground text-sm mt-4 block">{"מק\"ט מסך"}</Label>
            <div className="flex gap-2 mt-2">
              <Select value={monSku || undefined} onValueChange={setMonSku}>
                <SelectTrigger className="flex-1 bg-[var(--bg-dark)] border-[var(--glass-border)] text-foreground">
                  <SelectValue placeholder={"בחר מק\"ט מסך"} />
                </SelectTrigger>
                <SelectContent className="bg-card border-[var(--glass-border)]">
                  {monOptions
                    .filter((s) => s && s.trim().length > 0)
                    .map((s) => (
                      <SelectItem key={s} value={s} className="text-foreground">
                        {s}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="outline"
                className="px-3 bg-[var(--bg-dark)] border-[var(--glass-border)] text-foreground"
                onClick={() => setScanTarget("mon")}
              >
                סריקה
              </Button>
            </div>
            <Input
              value={monSku}
              onChange={(e) => setMonSku(e.target.value)}
              placeholder="סרוק או הקלד מק&quot;ט מסך..."
              className="mt-2 bg-[var(--bg-dark)] border-[var(--glass-border)] text-foreground tracking-widest text-center"
            />
          </>
        )}

        {asset && (
          <div className="mt-4 pt-4 border-t border-[var(--glass-border)] space-y-3">
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground font-medium">בדיקה יומית</div>
              {lastCheck ? (
                <div className="text-[11px] text-muted-foreground space-y-0.5">
                  <div>
                    סטטוס אחרון:{" "}
                    <span
                      className={
                        lastCheck.status === "OK" ? "text-emerald-400 font-semibold" : "text-red-400 font-semibold"
                      }
                    >
                      {lastCheck.status === "OK" ? "תקין" : "לא תקין"}
                    </span>
                  </div>
                  <div>בוצע ע״י: {lastCheck.checked_by || "-"}</div>
                  <div>
                    בתאריך:{" "}
                    {new Date(lastCheck.checked_at).toLocaleString("he-IL", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </div>
                  {lastCheck.notes && <div>פירוט: {lastCheck.notes}</div>}
                </div>
              ) : (
                <div className="text-[11px] text-muted-foreground">
                  לא קיימת עדיין בדיקה עבור עמדה זו.
                </div>
              )}
            </div>
            {roomName && cellId && (
              <div className="flex flex-col gap-2 text-[11px]">
                <div className="flex gap-2">
                  <select
                    value={checkStatus}
                    onChange={(e) => setCheckStatus(e.target.value as "OK" | "NOT_OK")}
                    className="flex-1 bg-[var(--bg-dark)] border-[var(--glass-border)] text-foreground rounded px-2 py-1"
                  >
                    <option value="OK">תקין</option>
                    <option value="NOT_OK">לא תקין</option>
                  </select>
                  <Input
                    value={checkBy}
                    onChange={(e) => setCheckBy(e.target.value)}
                    placeholder="שם מבצע הבדיקה"
                    className="flex-1 bg-[var(--bg-dark)] border-[var(--glass-border)] text-foreground"
                  />
                </div>
                <Input
                  value={checkNotes}
                  onChange={(e) => setCheckNotes(e.target.value)}
                  placeholder="פירוט הבדיקה..."
                  className="bg-[var(--bg-dark)] border-[var(--glass-border)] text-foreground"
                />
                <Button
                  type="button"
                  size="sm"
                  className="bg-emerald-500 text-black font-extrabold hover:bg-emerald-500/90"
                  onClick={async () => {
                    if (!roomName || !cellId) return;
                    await fetch(
                      `/api/checks/${encodeURIComponent(roomName)}/${cellId}`,
                      {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          status: checkStatus,
                          notes: checkNotes || null,
                          checkedBy: checkBy || null,
                        }),
                      }
                    )
                      .then((r) => (r.ok ? r.json() : null))
                      .then((data) => {
                        if (data) {
                          setLastCheck(data);
                          setCheckNotes("");
                        }
                      })
                      .catch(() => {});
                  }}
                >
                  שמור בדיקה יומית
                </Button>
              </div>
            )}
            {onSetAsEntrance && cellId && (
              <Button
                type="button"
                onClick={() => {
                  onSetAsEntrance();
                  onClose();
                }}
                variant="outline"
                className="w-full border-[var(--primary)] text-[var(--primary)] hover:bg-[var(--primary)]/10"
              >
                הגדר ככניסה 🚪
              </Button>
            )}
            <Button
              onClick={handleDelete}
              className="w-full bg-[var(--danger)] text-white font-extrabold hover:bg-[var(--danger)]/90"
            >
              {"מחק תא 🗑️"}
            </Button>
          </div>
        )}

        <Button
          onClick={handleSave}
          className="w-full mt-4 bg-[var(--primary)] text-black font-extrabold hover:bg-[var(--primary)]/90"
        >
          שמור עמדה
        </Button>
        <Button
          onClick={onClose}
          variant="outline"
          className="w-full mt-2 bg-secondary border-[var(--glass-border)] text-foreground"
        >
          ביטול
        </Button>
      </div>
      {scanTarget && (
        <BarcodeScanner
          onResult={(code) => {
            if (scanTarget === "sku") {
              setSku(code);
            } else {
              setMonSku(code);
            }
            setScanTarget(null);
          }}
          onClose={() => setScanTarget(null)}
        />
      )}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="מחיקת תא"
        description="למחוק את התא? הפעולה לא ניתנת לשחזור."
        confirmText="מחק"
        cancelText="ביטול"
        onCancel={() => setShowDeleteConfirm(false)}
        onConfirm={() => {
          setShowDeleteConfirm(false);
          onDelete();
          onClose();
        }}
      />
    </>
  );
}
