import React from "react";
import { BubbleFill } from "./BubbleFill";

interface AdmitCardProps {
  name: string;
  rollNo: string;
  exam: string;
  focus: string;
  masteryPercentage: number;
}

export function AdmitCard({
  name,
  rollNo,
  exam,
  focus,
  masteryPercentage,
}: AdmitCardProps) {
  return (
    <div className="relative border border-neutral-800 bg-surface text-foreground rounded-md shadow-lg overflow-hidden max-w-md w-full">
      <div className="border-b border-neutral-800 bg-neutral-900 px-4 py-2 flex justify-between items-center text-xs font-mono text-neutral-400">
        <span>┌─ ADMIT CARD ─────────────────┐</span>
        <span className="text-marigold font-bold text-[10px] tracking-widest uppercase">OFFICIAL STUB</span>
      </div>

      <div className="p-5 font-mono space-y-4 text-sm relative">
        <div className="grid grid-cols-[80px_1fr] items-center">
          <span className="text-neutral-500 font-semibold text-xs tracking-wider">NAME</span>
          <span className="text-[#EDEDED] font-sans font-medium">{name}</span>
        </div>

        <div className="grid grid-cols-[80px_1fr] items-center">
          <span className="text-neutral-500 font-semibold text-xs tracking-wider">ROLL_NO</span>
          <span className="text-marigold font-bold">{rollNo}</span>
        </div>

        <div className="grid grid-cols-[80px_1fr] items-center">
          <span className="text-neutral-500 font-semibold text-xs tracking-wider">EXAM</span>
          <span className="text-[#EDEDED] font-medium">{exam}</span>
        </div>

        <div className="grid grid-cols-[80px_1fr] items-center">
          <span className="text-neutral-500 font-semibold text-xs tracking-wider">FOCUS</span>
          <span className="text-[#EDEDED] font-medium font-sans">{focus}</span>
        </div>

        <div className="pt-3 border-t border-neutral-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span className="text-neutral-500 font-semibold text-xs tracking-wider uppercase">MASTERY</span>
          <BubbleFill type="display" percentage={masteryPercentage} totalBubbles={10} />
        </div>

        <div className="absolute right-0 top-0 bottom-0 w-3 flex flex-col justify-between py-2 pointer-events-none">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-[#0A0A0A] -mr-0.75 self-end border border-neutral-800 border-r-0"
            />
          ))}
        </div>
      </div>

      <div className="bg-neutral-900/50 border-t border-neutral-800 px-4 py-1.5 flex justify-between items-center text-[10px] font-mono text-neutral-500">
        <span>STATUS: ELIGIBLE</span>
        <span>NEPAL MEDICAL COMMISSION</span>
      </div>
    </div>
  );
}
