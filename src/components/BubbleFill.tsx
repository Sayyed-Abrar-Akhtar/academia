"use client";

import React, { useEffect, useState } from "react";
import { clsx } from "clsx";

interface BubbleFillProps {
  type?: "display" | "interactive";
  percentage?: number; // 0 to 100
  totalBubbles?: number; // default 10
  options?: { value: string; label: string }[];
  selectedValue?: string;
  onSelect?: (value: string) => void;
  disabled?: boolean;
}

export function BubbleFill({
  type = "display",
  percentage = 0,
  totalBubbles = 10,
  options = [],
  selectedValue,
  onSelect,
  disabled = false,
}: BubbleFillProps) {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && typeof window.matchMedia === "function") {
      const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      setReduceMotion(mediaQuery.matches);
      const listener = (e: MediaQueryListEvent) => setReduceMotion(e.matches);
      mediaQuery.addEventListener("change", listener);
      return () => mediaQuery.removeEventListener("change", listener);
    }
  }, []);

  if (type === "display") {
    const filledCount = Math.round((percentage / 100) * totalBubbles);

    return (
      <div className="flex items-center gap-1.5 font-mono text-sm" aria-label={`Progress: ${percentage}%`}>
        <div className="flex gap-1">
          {Array.from({ length: totalBubbles }).map((_, idx) => {
            const isFilled = idx < filledCount;
            return (
              <span
                key={idx}
                className={clsx(
                  "w-3.5 h-3.5 rounded-full border border-marigold inline-block transition-all relative overflow-hidden",
                  isFilled ? "bg-marigold" : "bg-transparent",
                  !reduceMotion && isFilled && "animate-pulse"
                )}
                style={{
                  animationDuration: isFilled ? `${0.4 + idx * 0.05}s` : undefined,
                }}
              />
            );
          })}
        </div>
        <span className="ml-2 text-foreground/80">{percentage}%</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {options.map((opt) => {
        const isSelected = selectedValue === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            disabled={disabled}
            onClick={() => onSelect?.(opt.value)}
            className={clsx(
              "flex items-center text-left w-full p-3.5 rounded-lg border transition-all duration-200 outline-none",
              isSelected
                ? "bg-surface border-marigold text-[#EDEDED]"
                : "border-neutral-800 bg-transparent text-neutral-400 hover:border-neutral-700 hover:text-neutral-200",
              disabled && "opacity-60 cursor-not-allowed"
            )}
          >
            <div className="relative mr-4 flex-shrink-0">
              <span
                className={clsx(
                  "w-6 h-6 rounded-full border-2 flex items-center justify-center font-mono text-xs font-bold transition-all duration-300",
                  isSelected
                    ? "border-marigold bg-marigold text-black"
                    : "border-neutral-600 bg-transparent text-neutral-400"
                )}
              >
                {opt.label}
              </span>
              {isSelected && !reduceMotion && (
                <span className="absolute inset-0 rounded-full bg-marigold opacity-20 animate-ping" />
              )}
            </div>

            <span className="font-sans text-base">{opt.value}</span>
          </button>
        );
      })}
    </div>
  );
}
