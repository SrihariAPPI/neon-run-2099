import React from 'react';
import { CarSpec, PlayerStats } from '../types/game';
import { Play, Wrench, Trophy, Gauge, Shield, Zap, Volume2, VolumeX } from 'lucide-react';
import { soundManager } from '../game/audio';

interface MainMenuProps {
  currentCar: CarSpec;
  stats: PlayerStats;
  onStartRun: () => void;
  onOpenGarage: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  currentCar,
  stats,
  onStartRun,
  onOpenGarage,
}) => {
  const [isMuted, setIsMuted] = React.useState(soundManager.getIsMuted());

  const handleStart = () => {
    soundManager.init();
    soundManager.resume();
    soundManager.playClick();
    onStartRun();
  };

  const handleGarage = () => {
    soundManager.init();
    soundManager.resume();
    soundManager.playClick();
    onOpenGarage();
  };

  const handleToggleSound = () => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
  };

  const handleRevPreview = () => {
    soundManager.init();
    soundManager.resume();
    soundManager.previewEngineRev(currentCar.id);
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-between p-6 sm:p-10 select-none">
      {/* Top Header: Game Title & Credits */}
      <div className="flex items-start justify-between w-full">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold tracking-widest uppercase">
            <span className="w-2 h-2 bg-cyan-400" />
            MIDNIGHT HIGHWAY RACER • VANTA CITY
          </div>
          <h1 className="text-4xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-fuchsia-500 tracking-tighter mt-1 font-mono">
            NEON RUN: 2099
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mt-1 tracking-wide">
            High-octane arcade driving through elevated rain-slick megacity expressways.
          </p>
        </div>

        {/* Top Right: Player Stats Card & Audio Toggle */}
        <div className="flex items-start gap-3 pointer-events-auto">
          <button
            onClick={handleToggleSound}
            className="p-3 bg-slate-950/85 border border-cyan-500/40 hover:border-cyan-400 text-cyan-300 hover:text-white transition-all shadow-lg flex items-center gap-2 text-xs font-bold"
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
            <span className="hidden sm:inline">{isMuted ? 'AUDIO MUTED' : 'AUDIO ON'}</span>
          </button>

          <div className="bg-slate-950/85 border border-cyan-500/30 p-3 sm:p-4 text-right">
            <div className="text-[10px] text-slate-400 uppercase tracking-widest">CREDITS BALANCE</div>
            <div className="text-xl sm:text-2xl font-black text-amber-400 tracking-wider">
              {stats.credits.toLocaleString()} <span className="text-xs text-amber-400/80">CR</span>
            </div>

            <div className="flex items-center justify-end gap-3 mt-2 pt-2 border-t border-slate-800 text-xs text-slate-400">
              <div className="flex items-center gap-1">
                <Trophy className="w-3.5 h-3.5 text-cyan-400" />
                <span>{stats.bestDistance.toLocaleString()} M</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Center Left: Current Selected Machine Card */}
      <div className="w-full max-w-sm bg-slate-950/80 border border-slate-800 p-4 sm:p-5 mt-auto mb-4 pointer-events-auto">
        <div className="flex items-center justify-between">
          <div className="text-xs text-cyan-400 font-bold uppercase tracking-widest">SELECTED MACHINE</div>
          <span className="px-2 py-0.5 text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 uppercase">
            {currentCar.silhouette}
          </span>
        </div>
        <div className="text-2xl font-black text-white mt-1 tracking-wide">{currentCar.name}</div>
        <p className="text-xs text-slate-400 mt-1 line-clamp-2">{currentCar.tagline}</p>

        {/* Stats Bars */}
        <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-800 text-xs">
          <div>
            <div className="flex items-center gap-1 text-[10px] text-slate-400">
              <Gauge className="w-3 h-3 text-cyan-400" /> TOP SPEED
            </div>
            <div className="font-bold text-slate-200 mt-0.5">{currentCar.topSpeed} KM/H</div>
          </div>
          <div>
            <div className="flex items-center gap-1 text-[10px] text-slate-400">
              <Zap className="w-3 h-3 text-amber-400" /> ACCEL
            </div>
            <div className="font-bold text-slate-200 mt-0.5">{(currentCar.acceleration * 10).toFixed(1)}/10</div>
          </div>
          <div>
            <div className="flex items-center gap-1 text-[10px] text-slate-400">
              <Shield className="w-3 h-3 text-rose-400" /> HANDLING
            </div>
            <div className="font-bold text-slate-200 mt-0.5">{(currentCar.handling * 10).toFixed(1)}/10</div>
          </div>
        </div>

        {/* Quick Engine Rev Test Button */}
        <button
          onClick={handleRevPreview}
          className="w-full mt-3 py-2 px-3 bg-slate-900/90 hover:bg-slate-800 border border-cyan-500/30 hover:border-cyan-400 text-cyan-300 text-xs font-bold tracking-wider flex items-center justify-center gap-2 transition-all active:scale-98"
        >
          <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
          <span>TEST ENGINE ROAR</span>
        </button>
      </div>

      {/* Bottom Dock: Play Action, Garage & Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 w-full pointer-events-auto">
        {/* Actions */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={handleStart}
            className="flex-1 sm:flex-none flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-cyan-500 to-sky-600 hover:from-cyan-400 hover:to-sky-500 text-slate-950 font-black text-lg tracking-wider transition-all duration-150 active:scale-95 shadow-lg shadow-cyan-500/20"
          >
            <Play className="w-5 h-5 fill-slate-950" />
            <span>START MIDNIGHT RUN</span>
          </button>

          <button
            onClick={handleGarage}
            className="flex items-center justify-center gap-2 px-6 py-4 bg-slate-900/90 hover:bg-slate-800 border border-cyan-500/40 text-cyan-300 font-bold tracking-wide transition-all duration-150 active:scale-95"
          >
            <Wrench className="w-5 h-5" />
            <span className="hidden sm:inline">GARAGE & TUNING</span>
          </button>
        </div>

        {/* Keyboard Controls Guide Badge */}
        <div className="bg-slate-950/80 border border-slate-800 px-4 py-2.5 flex items-center gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 text-slate-200 text-[10px]">W</kbd>
            <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 text-slate-200 text-[10px]">A</kbd>
            <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 text-slate-200 text-[10px]">S</kbd>
            <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 text-slate-200 text-[10px]">D</kbd>
            <span className="ml-1">DRIVE</span>
          </div>
          <div className="h-3 w-px bg-slate-700" />
          <div className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 text-slate-200 text-[10px]">SPACE</kbd>
            <span className="ml-1 text-cyan-400">NITRO</span>
          </div>
          <div className="h-3 w-px bg-slate-700" />
          <div className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 text-slate-200 text-[10px]">C</kbd>
            <span className="ml-1">CAM</span>
          </div>
        </div>
      </div>
    </div>
  );
};
