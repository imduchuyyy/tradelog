"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  Check,
  Loader2,
  Sparkles,
  SkipForward,
} from "lucide-react";
import { journalTrade, skipJournalTrade } from "@/app/actions";
import { cn } from "@/lib/utils";
import type { SyncedNewTrade } from "@/lib/exchange";

/* eslint-disable @typescript-eslint/no-explicit-any */

interface NewTradesModalProps {
  trades: SyncedNewTrade[];
  setups: any[];
  onComplete: () => void;
}

const MARKET_CONDITIONS = [
  { value: "trending", label: "Trending" },
  { value: "ranging", label: "Ranging" },
  { value: "volatile", label: "Volatile" },
  { value: "calm", label: "Calm" },
  { value: "breakout", label: "Breakout" },
];

export function NewTradesModal({
  trades,
  setups,
  onComplete,
}: NewTradesModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(trades.length > 0);

  // Form state
  const [setupId, setSetupId] = useState<string>("");
  const [customSetup, setCustomSetup] = useState("");
  const [confidence, setConfidence] = useState<number>(5);
  const [marketCondition, setMarketCondition] = useState("");
  const [setupReason, setSetupReason] = useState("");
  const [psychology, setPsychology] = useState("");
  const [notes, setNotes] = useState("");

  // All setups including any newly created ones during this session
  const [allSetups, setAllSetups] = useState(setups);

  const currentTrade = trades[currentIndex];
  const isLast = currentIndex === trades.length - 1;
  const total = trades.length;

  const resetForm = () => {
    setSetupId("");
    setCustomSetup("");
    setConfidence(5);
    setMarketCondition("");
    setSetupReason("");
    setPsychology("");
    setNotes("");
  };

  const handleSubmit = async () => {
    if (!currentTrade) return;
    setLoading(true);

    try {
      await journalTrade({
        tradeId: currentTrade.id,
        setupId: setupId === "__custom__" ? null : setupId || null,
        customSetupName:
          setupId === "__custom__" ? customSetup : null,
        confidenceLevel: confidence,
        marketCondition: marketCondition || null,
        setupReason: setupReason || null,
        psychology: psychology || null,
        notes: notes || null,
      });

      // If a custom setup was created, add it to the list for subsequent trades
      if (setupId === "__custom__" && customSetup.trim()) {
        setAllSetups((prev) => [
          ...prev,
          { id: `custom-${Date.now()}`, name: customSetup.trim() },
        ]);
      }

      if (isLast) {
        setOpen(false);
        onComplete();
      } else {
        setCurrentIndex((i) => i + 1);
        resetForm();
      }
    } catch (err) {
      console.error("Failed to journal trade:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    if (!currentTrade) return;
    setLoading(true);

    try {
      await skipJournalTrade(currentTrade.id);

      if (isLast) {
        setOpen(false);
        onComplete();
      } else {
        setCurrentIndex((i) => i + 1);
        resetForm();
      }
    } catch (err) {
      console.error("Failed to skip trade:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!currentTrade) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { setOpen(false); onComplete(); } }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div>
              <DialogTitle>New Trade Detected</DialogTitle>
              <DialogDescription className="text-xs">
                Trade {currentIndex + 1} of {total} — Tell us about this trade
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Trade summary card */}
        <div className="rounded-lg border border-border/60 bg-muted/30 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-base">
              {currentTrade.symbol}
            </span>
            <Badge
              variant="outline"
              className={cn(
                "text-xs",
                currentTrade.side === "long"
                  ? "border-green-500/30 text-green-500"
                  : "border-red-500/30 text-red-500"
              )}
            >
              {currentTrade.side.toUpperCase()}
            </Badge>
          </div>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Entry Price</p>
              <p className="font-medium">${currentTrade.entryPrice}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Quantity</p>
              <p className="font-medium">{currentTrade.quantity}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Leverage</p>
              <p className="font-medium">{currentTrade.leverage}x</p>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            {currentTrade.exchangeName} &middot;{" "}
            {new Date(currentTrade.entryDate).toLocaleString()}
          </div>
        </div>

        {/* Journal form */}
        <div className="space-y-4">
          {/* Setup selection with custom input */}
          <div className="space-y-2">
            <Label className="text-sm">Setup / Strategy</Label>
            <select
              value={setupId}
              onChange={(e) => {
                setSetupId(e.target.value);
                if (e.target.value !== "__custom__") setCustomSetup("");
              }}
              className="flex h-9 w-full rounded-lg border border-border/60 bg-background px-3 text-sm"
            >
              <option value="">No setup</option>
              {allSetups.map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
              <option value="__custom__">+ Create new setup...</option>
            </select>
            {setupId === "__custom__" && (
              <Input
                value={customSetup}
                onChange={(e) => setCustomSetup(e.target.value)}
                placeholder="Enter new setup name"
                className="mt-1"
                autoFocus
              />
            )}
          </div>

          {/* Confidence level */}
          <div className="space-y-2">
            <Label className="text-sm">
              Confidence Level: <span className="font-bold text-primary">{confidence}</span>/10
            </Label>
            <input
              type="range"
              min={1}
              max={10}
              value={confidence}
              onChange={(e) => setConfidence(parseInt(e.target.value))}
              className="w-full accent-blue-500"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>Low</span>
              <span>Medium</span>
              <span>High</span>
            </div>
          </div>

          {/* Market condition */}
          <div className="space-y-2">
            <Label className="text-sm">Market Condition</Label>
            <div className="flex flex-wrap gap-1.5">
              {MARKET_CONDITIONS.map((mc) => (
                <button
                  key={mc.value}
                  type="button"
                  onClick={() =>
                    setMarketCondition(
                      marketCondition === mc.value ? "" : mc.value
                    )
                  }
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                    marketCondition === mc.value
                      ? "border-blue-500/50 bg-blue-500/10 text-blue-500"
                      : "border-border/60 text-muted-foreground hover:bg-muted"
                  )}
                >
                  {mc.label}
                </button>
              ))}
            </div>
          </div>

          {/* Setup reason */}
          <div className="space-y-2">
            <Label className="text-sm">Why did you enter this trade?</Label>
            <Textarea
              value={setupReason}
              onChange={(e) => setSetupReason(e.target.value)}
              placeholder="What signal or setup triggered this trade?"
              rows={2}
              className="resize-none"
            />
          </div>

          {/* Psychology */}
          <div className="space-y-2">
            <Label className="text-sm">Psychology / Mindset</Label>
            <Textarea
              value={psychology}
              onChange={(e) => setPsychology(e.target.value)}
              placeholder="How were you feeling? Any emotional bias?"
              rows={2}
              className="resize-none"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label className="text-sm">Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional observations..."
              rows={2}
              className="resize-none"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            onClick={handleSkip}
            disabled={loading}
            className="gap-2 text-muted-foreground"
          >
            <SkipForward className="h-3.5 w-3.5" />
            Skip
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0"
          >
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : isLast ? (
              <Check className="h-3.5 w-3.5" />
            ) : (
              <ArrowRight className="h-3.5 w-3.5" />
            )}
            {isLast ? "Save & Finish" : "Save & Next"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
