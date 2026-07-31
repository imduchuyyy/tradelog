export default function Loading() {
  return (
    <main className="flex min-h-screen items-center justify-center overflow-hidden bg-background p-6">
      <div className="relative flex h-72 w-full max-w-md items-center justify-center rounded-[6px] border border-border bg-card/80 shadow-2xl shadow-black/30">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:32px_32px] opacity-25" />
        <div className="absolute inset-x-6 top-6 flex items-center justify-between opacity-60">
          {Array.from({ length: 18 }).map((_, index) => (
            <span
              key={index}
              className="h-1 w-1 rounded-full bg-muted-foreground/50 animate-pulse"
              style={{ animationDelay: `${index * 70}ms` }}
            />
          ))}
        </div>

        <div className="relative flex h-36 items-end gap-3">
          {[
            { body: "h-12", wick: "h-20", tone: "bg-success", delay: "0ms" },
            { body: "h-20", wick: "h-28", tone: "bg-success", delay: "120ms" },
            { body: "h-14", wick: "h-24", tone: "bg-destructive", delay: "240ms" },
            { body: "h-24", wick: "h-32", tone: "bg-success", delay: "360ms" },
            { body: "h-16", wick: "h-28", tone: "bg-destructive", delay: "480ms" },
            { body: "h-28", wick: "h-36", tone: "bg-success", delay: "600ms" },
          ].map((candle, index) => (
            <div key={index} className="relative flex w-6 justify-center">
              <div className={`absolute bottom-0 w-px ${candle.wick} bg-muted-foreground/50`} />
              <div
                className={`relative mt-auto w-4 ${candle.body} ${candle.tone} animate-pulse rounded-[2px] shadow-[0_0_18px_color-mix(in_oklab,var(--success)_35%,transparent)]`}
                style={{ animationDelay: candle.delay }}
              />
            </div>
          ))}
        </div>

        <svg
          aria-hidden="true"
          viewBox="0 0 320 90"
          className="absolute bottom-8 h-20 w-[80%] overflow-visible text-success"
        >
          <path
            d="M4 70 C 42 68, 40 28, 72 34 S 118 76, 154 48 S 208 18, 238 28 S 276 62, 316 20"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="2"
            className="[stroke-dasharray:420] [stroke-dashoffset:420] animate-[draw-trade-line_1.8s_ease-in-out_infinite] drop-shadow-[0_0_10px_var(--success)]"
          />
        </svg>

        <div className="absolute bottom-6 h-px w-40 animate-pulse bg-gradient-to-r from-transparent via-success to-transparent" />
      </div>
    </main>
  );
}
