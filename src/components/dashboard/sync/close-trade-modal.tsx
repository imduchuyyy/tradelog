"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Flag, Loader2, Check, ArrowLeft, MoveRight } from "lucide-react";
import { closeTradeJournal } from "@/app/actions";
import { cn } from "@/lib/utils";

/* eslint-disable @typescript-eslint/no-explicit-any */

interface CloseTradeModalProps {
  trades: any[];
  onComplete: () => void;
}

const WIN_EXIT_REASONS = ["Take Profit Hit", "Trailing Stop Hit", "Manual Close (Target Reached)", "Manual Close (Early)", "Time Based", "Other"];
const LOSE_EXIT_REASONS = ["Stop Loss Hit", "Manual Panic Close", "Manual Close (Invalidation)", "Time Based", "Other"];

const WIN_PSYCHOLOGIES = ["Satisfied", "Relieved", "Greedy", "Confident", "Other"];
const LOSE_PSYCHOLOGIES = ["Frustrated", "Anxious", "Regretful", "Accepting", "Revenge", "Other"];

const WIN_MISTAKES = ["None", "Closed Too Early", "Took Too Much Risk", "Ignored Trading Plan", "Other"];
const LOSE_MISTAKES = ["None", "Moved Stop Loss", "Revenge Trading", "Overleveraged", "Hesitated to Close", "Other"];

const WIN_LESSONS = ["Stick To Plan", "Let Winners Run", "Trust The Setup", "Trim Profits Early", "Other"];
const LOSE_LESSONS = ["Respect Stop Loss", "Need More Patience", "Wait For Confirmation", "Reduce Position Size", "Other"];

export function CloseTradeModal({ trades, onComplete }: CloseTradeModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(trades.length > 0);

  const currentTrade = trades[currentIndex];
  const isLast = currentIndex === trades.length - 1;

  const [step, setStep] = useState(1);
  const TOTAL_STEPS = 4;

  // Form State
  const [formData, setFormData] = useState({
    exitReason: "",
    customExitReason: "",
    exitPsychology: "",
    customExitPsychology: "",
    mistakes: "",
    customMistakes: "",
    lessons: "",
    customLessons: ""
  });

  useEffect(() => {
    if (currentTrade) {
      setStep(1);
      
      const isWin = (currentTrade.pnl || 0) > 0;
      const ER = isWin ? WIN_EXIT_REASONS : LOSE_EXIT_REASONS;
      const EP = isWin ? WIN_PSYCHOLOGIES : LOSE_PSYCHOLOGIES;
      const M = isWin ? WIN_MISTAKES : LOSE_MISTAKES;
      const L = isWin ? WIN_LESSONS : LOSE_LESSONS;

      const r = currentTrade.exitReason || "";
      const p = currentTrade.exitPsychology || "";
      const m = currentTrade.mistakes || "";
      const l = currentTrade.lessons || "";

      setFormData({
        exitReason: ER.includes(r) ? r : (r ? "Other" : ""),
        customExitReason: ER.includes(r) ? "" : r,
        exitPsychology: EP.includes(p) ? p : (p ? "Other" : ""),
        customExitPsychology: EP.includes(p) ? "" : p,
        mistakes: M.includes(m) ? m : (m ? "Other" : ""),
        customMistakes: M.includes(m) ? "" : m,
        lessons: L.includes(l) ? l : (l ? "Other" : ""),
        customLessons: L.includes(l) ? "" : l,
      });
    }
  }, [currentTrade]);

  if (!currentTrade) return null;

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

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await closeTradeJournal({
        tradeId: currentTrade.id,
        exitReason: formData.exitReason === "Other" ? formData.customExitReason : formData.exitReason || null,
        exitPsychology: formData.exitPsychology === "Other" ? formData.customExitPsychology : formData.exitPsychology || null,
        mistakes: formData.mistakes === "Other" ? formData.customMistakes : formData.mistakes || null,
        lessons: formData.lessons === "Other" ? formData.customLessons : formData.lessons || null,
      });

      handleNextTrade();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    handleNextTrade();
  };

  const isWin = currentTrade && (currentTrade.pnl || 0) > 0;
  const activeExitReasons = isWin ? WIN_EXIT_REASONS : LOSE_EXIT_REASONS;
  const activePsychologies = isWin ? WIN_PSYCHOLOGIES : LOSE_PSYCHOLOGIES;
  const activeMistakes = isWin ? WIN_MISTAKES : LOSE_MISTAKES;
  const activeLessons = isWin ? WIN_LESSONS : LOSE_LESSONS;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { setOpen(false); onComplete(); } }}>
      <DialogContent className="max-w-md p-0 overflow-hidden bg-card/95 backdrop-blur-xl border-border/40 shadow-2xl">
        <div className={cn("p-6 border-b border-border/20 bg-gradient-to-br", isWin ? "from-green-500/10 to-emerald-500/5" : "from-red-500/10 to-orange-500/5")}>
          <div className="flex items-center justify-between mb-2">
            <div className={cn("flex items-center gap-2", isWin ? "text-green-500" : "text-red-500")}>
              {step > 1 && (
                <button onClick={() => setStep(s => s - 1)} className={cn("mr-2 p-1 rounded-full transition-colors text-muted-foreground", isWin ? "hover:bg-green-500/10 hover:text-green-500" : "hover:bg-red-500/10 hover:text-red-500")}>
                  <ArrowLeft className="w-4 h-4"/>
                </button>
              )}
              <Flag className="w-5 h-5"/>
              <DialogTitle className="text-lg font-bold">Exit Survey</DialogTitle>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                Trade {currentIndex + 1} of {trades.length}
              </span>
              <div className="flex gap-1">
                {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                  <div key={i} className={cn("h-1 w-4 rounded-full", i + 1 <= step ? (isWin ? "bg-green-500" : "bg-red-500") : "bg-muted-foreground/20")} />
                ))}
              </div>
            </div>
          </div>
          <DialogDescription className="text-sm">
            Reflect on closing <strong className="text-foreground">{currentTrade.symbol}</strong>.
          </DialogDescription>
        </div>

        <div className="p-6">
          {step === 1 && (
            <div className="space-y-3 animate-in fade-in slide-in-from-right-4 duration-300">
              <Label className="uppercase text-[10px] tracking-wider font-semibold text-muted-foreground">Exit Reason</Label>
              <div className="flex flex-wrap gap-2">
                {activeExitReasons.map(reason => (
                  <button
                    key={reason}
                    onClick={() => setFormData(f => ({ ...f, exitReason: reason === f.exitReason ? "" : reason }))}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-medium transition-colors border",
                      formData.exitReason === reason 
                        ? (isWin ? "bg-green-500/10 border-green-500/30 text-green-500" : "bg-red-500/10 border-red-500/30 text-red-500")
                        : "bg-muted/20 border-border/40 text-muted-foreground hover:bg-muted/50"
                    )}
                  >
                    {reason}
                  </button>
                ))}
              </div>
              {formData.exitReason === "Other" && (
                <Input
                  placeholder="Type reason here"
                  value={formData.customExitReason}
                  className="h-9 mt-2 text-sm bg-muted/20 border-border/50"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(f => ({ ...f, customExitReason: e.target.value }))}
                />
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3 animate-in fade-in slide-in-from-right-4 duration-300">
              <Label className="uppercase text-[10px] tracking-wider font-semibold text-muted-foreground">Emotion at Exit</Label>
              <div className="flex flex-wrap gap-2">
                {activePsychologies.map(psy => (
                  <button
                    key={psy}
                    onClick={() => setFormData(f => ({ ...f, exitPsychology: psy === f.exitPsychology ? "" : psy }))}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-medium transition-colors border",
                      formData.exitPsychology === psy 
                        ? (isWin ? "bg-green-500/10 border-green-500/30 text-green-500" : "bg-red-500/10 border-red-500/30 text-red-500")
                        : "bg-muted/20 border-border/40 text-muted-foreground hover:bg-muted/50"
                    )}
                  >
                    {psy}
                  </button>
                ))}
              </div>
              {formData.exitPsychology === "Other" && (
                <Input
                  placeholder="Type emotion here"
                  value={formData.customExitPsychology}
                  className="h-9 mt-2 text-sm bg-muted/20 border-border/50"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(f => ({ ...f, customExitPsychology: e.target.value }))}
                />
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3 animate-in fade-in slide-in-from-right-4 duration-300">
              <Label className="uppercase text-[10px] tracking-wider font-semibold text-muted-foreground">Any Mistakes?</Label>
              <div className="flex flex-wrap gap-2">
                {activeMistakes.map(mistake => (
                  <button
                    key={mistake}
                    onClick={() => setFormData(f => ({ ...f, mistakes: mistake === f.mistakes ? "" : mistake }))}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-medium transition-colors border",
                      formData.mistakes === mistake 
                        ? (isWin ? "bg-green-500/10 border-green-500/30 text-green-500" : "bg-red-500/10 border-red-500/30 text-red-500")
                        : "bg-muted/20 border-border/40 text-muted-foreground hover:bg-muted/50"
                    )}
                  >
                    {mistake}
                  </button>
                ))}
              </div>
              {formData.mistakes === "Other" && (
                <Input
                  placeholder="Type mistakes here"
                  value={formData.customMistakes}
                  className="h-9 mt-2 text-sm bg-muted/20 border-border/50"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(f => ({ ...f, customMistakes: e.target.value }))}
                />
              )}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-3 animate-in fade-in slide-in-from-right-4 duration-300">
              <Label className="uppercase text-[10px] tracking-wider font-semibold text-muted-foreground">Lessons Learned</Label>
              <div className="flex flex-wrap gap-2">
                {activeLessons.map(lesson => (
                  <button
                    key={lesson}
                    onClick={() => setFormData(f => ({ ...f, lessons: lesson === f.lessons ? "" : lesson }))}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-medium transition-colors border",
                      formData.lessons === lesson 
                        ? (isWin ? "bg-green-500/10 border-green-500/30 text-green-500" : "bg-red-500/10 border-red-500/30 text-red-500")
                        : "bg-muted/20 border-border/40 text-muted-foreground hover:bg-muted/50"
                    )}
                  >
                    {lesson}
                  </button>
                ))}
              </div>
              {formData.lessons === "Other" && (
                <Input
                  placeholder="Type lessons here"
                  value={formData.customLessons}
                  className="h-9 mt-2 text-sm bg-muted/20 border-border/50"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(f => ({ ...f, customLessons: e.target.value }))}
                />
              )}
            </div>
          )}
        </div>

        <div className="p-4 bg-muted/10 border-t border-border/20 flex gap-3">
          <Button variant="ghost" onClick={handleSkip} disabled={loading} className="w-24 text-muted-foreground hover:text-foreground">
            Skip Trade
          </Button>
          <Button onClick={handleNext} disabled={loading} className={cn("flex-1 gap-2 text-white shadow-lg", isWin ? "bg-green-600 hover:bg-green-700 shadow-green-500/20" : "bg-red-600 hover:bg-red-700 shadow-red-500/20")}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : step === TOTAL_STEPS ? (isLast ? <Check className="w-4 h-4"/> : <MoveRight className="w-4 h-4"/>) : <MoveRight className="w-4 h-4"/>}
            {step === TOTAL_STEPS ? (isLast ? "Done" : "Next Trade") : "Next Question"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
