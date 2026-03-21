"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Check, Loader2, Target, MoveRight, ArrowLeft } from "lucide-react";
import { journalTrade, skipJournalTrade } from "@/app/actions";
import { cn } from "@/lib/utils";

/* eslint-disable @typescript-eslint/no-explicit-any */

interface NewTradesModalProps {
  trades: any[];
  setups: any[];
  onComplete: () => void;
}

const MARKET_CONDITIONS = ["Trending", "Ranging", "Volatile", "Breakout", "Other"];
const PSYCHOLOGIES = ["Focused", "Anxious", "FOMO", "Confident", "Revenge", "Other"];
const REASONS = ["Support Bounce", "Resistance Breakout", "Trend Continuation", "News Event", "Other"];

export function NewTradesModal({ trades, setups, onComplete }: NewTradesModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(trades.length > 0);

  const [step, setStep] = useState(1);
  const TOTAL_STEPS = 6;

  // Form State
  const [formData, setFormData] = useState({
    setupId: "",
    customSetup: "",
    confidence: 5,
    setupReason: "",
    customReason: "",
    marketCondition: "",
    customMarketCondition: "",
    psychology: "",
    customPsychology: "",
    notes: ""
  });

  const [allSetups, setAllSetups] = useState(setups);

  const currentTrade = trades[currentIndex];
  const isLast = currentIndex === trades.length - 1;

  useEffect(() => {
    if (currentTrade) {
      setStep(1);
      
      const r = currentTrade.setupReason || "";
      const m = currentTrade.marketCondition || "";
      const p = currentTrade.psychology || "";

      setFormData({
        setupId: currentTrade.setupId || "",
        customSetup: "",
        confidence: currentTrade.confidenceLevel || 5,
        setupReason: REASONS.includes(r) ? r : (r ? "Other" : ""),
        customReason: REASONS.includes(r) ? "" : r,
        marketCondition: MARKET_CONDITIONS.includes(m) ? m : (m ? "Other" : ""),
        customMarketCondition: MARKET_CONDITIONS.includes(m) ? "" : m,
        psychology: PSYCHOLOGIES.includes(p) ? p : (p ? "Other" : ""),
        customPsychology: PSYCHOLOGIES.includes(p) ? "" : p,
        notes: currentTrade.notes || ""
      });
    }
  }, [currentTrade]);

  if (!currentTrade) return null;

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await journalTrade({
        tradeId: currentTrade.id,
        setupId: formData.setupId === "__custom__" ? null : formData.setupId || null,
        customSetupName: formData.setupId === "__custom__" ? formData.customSetup : null,
        confidenceLevel: formData.confidence,
        marketCondition: formData.marketCondition === "Other" ? formData.customMarketCondition : formData.marketCondition || null, 
        psychology: formData.psychology === "Other" ? formData.customPsychology : formData.psychology || null,
        setupReason: formData.setupReason === "Other" ? formData.customReason : formData.setupReason || null,
        notes: formData.notes || null,
      });

      if (formData.setupId === "__custom__" && formData.customSetup.trim()) {
        setAllSetups((prev) => [...prev, { id: `custom-${Date.now()}`, name: formData.customSetup.trim() }]);
      }

      handleNextTrade();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (step < TOTAL_STEPS) {
      setStep(s => s + 1);
    } else {
      handleSubmit();
    }
  };

  const handleNextTrade = () => {
    if (isLast) {
      setOpen(false);
      onComplete();
    } else {
      setCurrentIndex((i) => i + 1);
    }
  };

  const handleSkip = async () => {
    setLoading(true);
    try {
      if (currentTrade.needsJournal) {
        await skipJournalTrade(currentTrade.id);
      }
      handleNextTrade();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { setOpen(false); onComplete(); } }}>
      <DialogContent className="max-w-md p-0 overflow-hidden bg-card/95 backdrop-blur-xl border-border/40 shadow-2xl">
        {/* Header Block */}
        <div className="bg-gradient-to-br from-blue-500/10 to-indigo-500/5 p-6 border-b border-border/20">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-blue-500">
              {step > 1 && (
                <button onClick={() => setStep(s => s - 1)} className="mr-2 hover:bg-blue-500/10 p-1 rounded-full text-muted-foreground hover:text-blue-500 transition-colors">
                  <ArrowLeft className="w-4 h-4"/>
                </button>
              )}
              <Target className="w-5 h-5"/>
              <DialogTitle className="text-lg font-bold">Entry Survey</DialogTitle>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                Trade {currentIndex + 1} of {trades.length}
              </span>
              <div className="flex gap-1">
                {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                  <div key={i} className={cn("h-1 w-4 rounded-full", i + 1 <= step ? "bg-blue-500" : "bg-muted-foreground/20")} />
                ))}
              </div>
            </div>
          </div>
          <DialogDescription className="text-sm">
            Log your intent for <strong className="text-foreground">{currentTrade.symbol}</strong> ({currentTrade.side.toUpperCase()}).
          </DialogDescription>
        </div>

        {/* Survey Form */}
        <div className="p-6">
          {step === 1 && (
            <div className="space-y-3 animate-in fade-in slide-in-from-right-4 duration-300">
              <Label className="uppercase text-[10px] tracking-wider font-semibold text-muted-foreground">Setup Strategy</Label>
              <select
                value={formData.setupId}
                onChange={(e) => {
                  setFormData(f => ({ ...f, setupId: e.target.value, customSetup: e.target.value !== "__custom__" ? "" : f.customSetup }));
                }}
                className="flex h-10 w-full rounded-md border border-border/50 bg-muted/20 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">No Strategy</option>
                {allSetups.map((s: any) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
                <option value="__custom__">+ Create custom...</option>
              </select>
              {formData.setupId === "__custom__" && (
                <Input
                  value={formData.customSetup}
                  onChange={(e) => setFormData(f => ({ ...f, customSetup: e.target.value }))}
                  placeholder="Name your new setup"
                  autoFocus
                  className="h-10 bg-muted/20 border-border/50"
                />
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center justify-between">
                <Label className="uppercase text-[10px] tracking-wider font-semibold text-muted-foreground">Confidence Level</Label>
                <span className={cn(
                  "font-bold text-sm",
                  formData.confidence >= 8 ? "text-green-500" : formData.confidence >= 5 ? "text-yellow-500" : "text-red-500"
                )}>{formData.confidence} / 10</span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                step={1}
                value={formData.confidence}
                onChange={(e) => setFormData(f => ({ ...f, confidence: parseInt(e.target.value) }))}
                className="w-full accent-blue-500"
              />
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3 animate-in fade-in slide-in-from-right-4 duration-300">
              <Label className="uppercase text-[10px] tracking-wider font-semibold text-muted-foreground">Why enter now?</Label>
              <div className="flex flex-wrap gap-2">
                {REASONS.map(reason => (
                  <button
                    key={reason}
                    onClick={() => setFormData(f => ({ ...f, setupReason: reason === f.setupReason ? "" : reason }))}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-medium transition-colors border",
                      formData.setupReason === reason 
                        ? "bg-blue-500/10 border-blue-500/30 text-blue-500" 
                        : "bg-muted/20 border-border/40 text-muted-foreground hover:bg-muted/50"
                    )}
                  >
                    {reason}
                  </button>
                ))}
              </div>
              {formData.setupReason === "Other" && (
                <Input
                  placeholder="Type reason here"
                  value={formData.customReason}
                  className="h-9 mt-2 text-sm bg-muted/20 border-border/50"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(f => ({ ...f, customReason: e.target.value }))}
                />
              )}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-3 animate-in fade-in slide-in-from-right-4 duration-300">
              <Label className="uppercase text-[10px] tracking-wider font-semibold text-muted-foreground">Market Condition</Label>
              <div className="flex flex-wrap gap-2">
                {MARKET_CONDITIONS.map(cond => (
                  <button
                    key={cond}
                    onClick={() => setFormData(f => ({ ...f, marketCondition: cond === f.marketCondition ? "" : cond }))}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-medium transition-colors border",
                      formData.marketCondition === cond 
                        ? "bg-blue-500/10 border-blue-500/30 text-blue-500" 
                        : "bg-muted/20 border-border/40 text-muted-foreground hover:bg-muted/50"
                    )}
                  >
                    {cond}
                  </button>
                ))}
              </div>
              {formData.marketCondition === "Other" && (
                <Input
                  placeholder="Type market condition here"
                  value={formData.customMarketCondition}
                  className="h-9 mt-2 text-sm bg-muted/20 border-border/50"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(f => ({ ...f, customMarketCondition: e.target.value }))}
                />
              )}
            </div>
          )}

          {step === 5 && (
            <div className="space-y-3 animate-in fade-in slide-in-from-right-4 duration-300">
              <Label className="uppercase text-[10px] tracking-wider font-semibold text-muted-foreground">Psychology</Label>
              <div className="flex flex-wrap gap-2">
                {PSYCHOLOGIES.map(psy => (
                  <button
                    key={psy}
                    onClick={() => setFormData(f => ({ ...f, psychology: psy === f.psychology ? "" : psy }))}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-medium transition-colors border",
                      formData.psychology === psy 
                        ? "bg-blue-500/10 border-blue-500/30 text-blue-500" 
                        : "bg-muted/20 border-border/40 text-muted-foreground hover:bg-muted/50"
                    )}
                  >
                    {psy}
                  </button>
                ))}
              </div>
              {formData.psychology === "Other" && (
                <Input
                  placeholder="Type psychology here"
                  value={formData.customPsychology}
                  className="h-9 mt-2 text-sm bg-muted/20 border-border/50"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(f => ({ ...f, customPsychology: e.target.value }))}
                />
              )}
            </div>
          )}

          {step === 6 && (
            <div className="space-y-3 animate-in fade-in slide-in-from-right-4 duration-300">
              <Label className="uppercase text-[10px] tracking-wider font-semibold text-muted-foreground">Additional Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData(f => ({ ...f, notes: e.target.value }))}
                placeholder="Any other observations?"
                rows={2}
                className="resize-none bg-muted/20 border-border/50 focus:bg-background transition-colors"
              />
            </div>
          )}
        </div>

        {/* Action Footer */}
        <div className="p-4 bg-muted/10 border-t border-border/20 flex gap-3">
          <Button variant="ghost" onClick={handleSkip} disabled={loading} className="w-24 text-muted-foreground hover:text-foreground">
            Skip Trade
          </Button>
          <Button onClick={handleNext} disabled={loading} className="flex-1 gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : step === TOTAL_STEPS ? (isLast ? <Check className="w-4 h-4"/> : <MoveRight className="w-4 h-4"/>) : <MoveRight className="w-4 h-4"/>}
            {step === TOTAL_STEPS ? (isLast ? "Finish" : "Next Trade") : "Next Detail"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
