import React from 'react';
import { RunData } from '../types/game';
import { RotateCcw, Wrench, Home, Trophy, Zap, Gauge, AlertTriangle } from 'lucide-react';
import { soundManager } from '../game/audio';

interface ResultsModalProps {
  finalRun: RunData;
  creditsEarned: number;
  isNewBest: boolean;
  onRetry: () => void;
  onGarage: () => void;
  onMenu: () => void;
}

export const ResultsModal: React.FC<ResultsModalProps> = ({
  finalRun,
  creditsEarned,
  isNewBest,
  onRetry,
  onGarage,
  onMenu,
}) => {
  return (
    <div className="absolute inset-0 z-30 pointer-events-auto bg-slate-950/80 backdrop-blur-none flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-md bg-slate-950 border border-cyan-500/40 p-6 sm:p-8 shadow-2xl relative">
        {/* Crash / Run Complete Badge */}
        <div className="flex items-center gap-2 text-rose-500 font-extrabold text-xs tracking-widest uppercase mb-1">
          <AlertTriangle className="w-4 h-4" />
          <span>RUN TERMINATED — IMPACT REGISTERED</span>
        </div>

        <h2 className="text-3xl font-black text-white tracking-tight font-mono">
          RUN TELEMETRY
        </h2>

        {isNewBest && (
          <div className="mt-3 px-3 py-1.5 bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold text-xs flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>NEW PERSONAL BEST DISTANCE!</span>
          </div>
        )}

        {/* Telemetry Breakdown */}
        <div className="grid grid-cols-2 gap-3 my-6">
          <div className="bg-slate-900/80 border border-slate-800 p-3">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Trophy className="w-3 h-3 text-cyan-400" /> DISTANCE
            </div>
            <div className="text-xl font-black text-white mt-1">
              {finalRun.distance.toLocaleString()} <span className="text-xs text-cyan-400">M</span>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-3">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Gauge className="w-3 h-3 text-cyan-400" /> TOP SPEED
            </div>
            <div className="text-xl font-black text-white mt-1">
              {finalRun.maxSpeedReached} <span className="text-xs text-cyan-400">KM/H</span>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-3">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Zap className="w-3 h-3 text-rose-400" /> NEAR MISSES
            </div>
            <div className="text-xl font-black text-rose-400 mt-1">
              {finalRun.nearMisses}
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-3">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-400" /> OVERTAKES
            </div>
            <div className="text-xl font-black text-amber-400 mt-1">
              {finalRun.overtakes}
            </div>
          </div>
        </div>

        {/* Total Credits Earned Banner */}
        <div className="bg-gradient-to-r from-amber-500/20 to-cyan-500/20 border border-amber-500/30 p-4 flex items-center justify-between mb-6">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            CREDITS AWARDED
          </span>
          <span className="text-2xl font-black text-amber-400 tracking-wider">
            +{creditsEarned.toLocaleString()} CR
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2">
          <button
            onClick={() => {
              soundManager.playClick();
              onRetry();
            }}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-cyan-500 to-sky-600 hover:from-cyan-400 hover:to-sky-500 text-slate-950 font-black tracking-wider text-sm transition-all active:scale-98"
          >
            <RotateCcw className="w-4 h-4" />
            <span>RETRY MIDNIGHT RUN</span>
          </button>

          <div className="grid grid-cols-2 gap-2 mt-1">
            <button
              onClick={() => {
                soundManager.playClick();
                onGarage();
              }}
              className="flex items-center justify-center gap-1.5 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold transition-colors"
            >
              <Wrench className="w-3.5 h-3.5 text-cyan-400" />
              <span>GARAGE</span>
            </button>

            <button
              onClick={() => {
                soundManager.playClick();
                onMenu();
              }}
              className="flex items-center justify-center gap-1.5 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold transition-colors"
            >
              <Home className="w-3.5 h-3.5 text-cyan-400" />
              <span>MAIN MENU</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
