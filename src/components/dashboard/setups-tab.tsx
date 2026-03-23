"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Edit, Plus, Trash2 } from "lucide-react";
import { createSetup, updateSetup, deleteSetup } from "@/app/actions";
import { cn } from "@/lib/utils";

/* eslint-disable @typescript-eslint/no-explicit-any */
interface SetupsTabProps {
  setups: any[];
  trades: any[];
}

const COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#f97316",
];

export function SetupsTab({ setups, trades }: SetupsTabProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editSetup, setEditSetup] = useState<any>(null);

  // Calculate stats per setup (M:N — trade has setups array)
  const setupStats = setups.map((setup: any) => {
    const setupTrades = trades.filter(
      (t: any) =>
        t.status === "closed" &&
        t.setups?.some((s: any) => s.id === setup.id)
    );
    const wins = setupTrades.filter((t: any) => t.pnl && t.pnl > 0);
    const winRate =
      setupTrades.length > 0
        ? ((wins.length / setupTrades.length) * 100).toFixed(1)
        : "N/A";
    const totalPnl = setupTrades.reduce(
      (sum: number, t: any) => sum + (t.pnl || 0),
      0
    );

    return {
      ...setup,
      tradeCount: setupTrades.length,
      winRate,
      totalPnl,
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Trade Setups</h2>
          <p className="text-sm text-muted-foreground">
            Manage your setups to tag trades with strategy names
          </p>
        </div>
        <Dialog
          open={createOpen}
          onOpenChange={setCreateOpen}
        >
          <DialogTrigger
            render={
              <Button
                size="sm"
                className="gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0"
              />
            }
          >
            <Plus className="h-3.5 w-3.5" />
            Add Setup
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Setup</DialogTitle>
            </DialogHeader>
            <form
              action={async (formData) => {
                await createSetup(formData);
                setCreateOpen(false);
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="e.g. EMA Pullback"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex gap-2">
                  {COLORS.map((color) => (
                    <label key={color} className="cursor-pointer">
                      <input
                        type="radio"
                        name="color"
                        value={color}
                        defaultChecked={color === COLORS[0]}
                        className="sr-only peer"
                      />
                      <div
                        className="h-8 w-8 rounded-full border-2 border-transparent peer-checked:border-foreground transition-all"
                        style={{ backgroundColor: color }}
                      />
                    </label>
                  ))}
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0"
              >
                Create Setup
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit dialog */}
      <Dialog
        open={!!editSetup}
        onOpenChange={(open) => {
          if (!open) setEditSetup(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Setup</DialogTitle>
          </DialogHeader>
          {editSetup && (
            <form
              action={async (formData) => {
                await updateSetup(editSetup.id, formData);
                setEditSetup(null);
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="edit-name">Name *</Label>
                <Input
                  id="edit-name"
                  name="name"
                  defaultValue={editSetup.name}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex gap-2">
                  {COLORS.map((color) => (
                    <label key={color} className="cursor-pointer">
                      <input
                        type="radio"
                        name="color"
                        value={color}
                        defaultChecked={
                          color === (editSetup.color || COLORS[0])
                        }
                        className="sr-only peer"
                      />
                      <div
                        className="h-8 w-8 rounded-full border-2 border-transparent peer-checked:border-foreground transition-all"
                        style={{ backgroundColor: color }}
                      />
                    </label>
                  ))}
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0"
              >
                Save Changes
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Setups grid */}
      {setupStats.length === 0 ? (
        <Card className="border-border/40 bg-card/50">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-muted-foreground">
              No setups yet. Create your first trading setup to start tracking
              performance by strategy.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {setupStats.map((setup: any) => (
            <Card
              key={setup.id}
              className="border-border/40 bg-card/50 overflow-hidden"
            >
              <div
                className="h-1"
                style={{ backgroundColor: setup.color || COLORS[0] }}
              />
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <CardTitle className="text-base">{setup.name}</CardTitle>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => setEditSetup(setup)}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <form action={deleteSetup.bind(null, setup.id)}>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      type="submit"
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </form>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Win Rate</p>
                    <p className="text-sm font-semibold">{setup.winRate}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">PnL</p>
                    <p
                      className={cn(
                        "text-sm font-semibold",
                        setup.totalPnl >= 0 ? "text-green-500" : "text-red-500"
                      )}
                    >
                      ${setup.totalPnl.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Trades</p>
                    <p className="text-sm font-semibold">
                      {setup.tradeCount}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
