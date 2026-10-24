import React from 'react';
import { CameraView, NearMissEvent, RunData } from '../types/game';
import { Camera, Volume2, VolumeX, Pause } from 'lucide-react';
import { soundManager } from '../game/audio';

interface HUDProps {
  runData: RunData;
  cameraView: CameraView;
  onCycleCamera: () => void;
  onPause: () => void;
  nearMisses: NearMissEvent[];
}

export const HUD: React.FC<HUDProps> = ({
  runData,
  cameraView,
  onCycleCamera,
  onPause,
  nearMisses,
}) => {
  const [isMuted, setIsMuted] = React.useState(soundManager.getIsMuted());

  const toggleSound = () => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
  };

  const speedPercent = Math.min(100, (runData.speed / 340) * 100);
  const nitroPercent = Math.round(runData.nitroRemaining * 100);

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden z-10 flex flex-col justify-between p-4 sm:p-6">
      {/* Top Bar: Distance, Credits, Audio and Pause */}
      <div className="flex items-center justify-between w-full">
        {/* Distance & Score */}
        <div className="flex items-center gap-4 sm:gap-6 bg-slate-950/80 border border-cyan-500/30 px-4 py-2.5 backdrop-blur-none">
          <div>
            <div className="text-[10px] text-cyan-400/80 tracking-widest uppercase">DISTANCE</div>
            <div className="text-xl sm:text-2xl font-bold tracking-wider text-slate-100">
              {runData.distance.toLocaleString()} <span className="text-xs text-cyan-400">M</span>
            </div>
          </div>
          <div className="h-7 w-px bg-cyan-500/20" />
          <div>
            <div className="text-[10px] text-amber-400/80 tracking-widest uppercase">CREDITS</div>
            <div className="text-xl sm:text-2xl font-bold tracking-wider text-amber-400">
              {runData.score.toLocaleString()} <span className="text-xs text-amber-400/70">CR</span>
            </div>
          </div>
        </div>

        {/* Floating Near-Miss Alerts in Top Center */}
        <div className="absolute left-1/2 -translate-x-1/2 top-6 flex flex-col items-center gap-2 pointer-events-none">
          {nearMisses.slice(-2).map((item) => (
            <div
              key={item.id}
              className="px-4 py-1.5 bg-gradient-to-r from-rose-500/90 to-amber-500/90 text-white font-extrabold text-sm sm:text-base tracking-widest border border-rose-300/40 shadow-lg"
            >
              ⚡ {item.text}
            </div>
          ))}
        </div>

        {/* Controls: Camera Mode, Audio, Pause */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={onCycleCamera}
            className="flex items-center gap-2 px-3 py-2 bg-slate-950/80 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-950/40 hover:border-cyan-400 transition-colors text-xs font-semibold"
            title="Cycle Camera View (C)"
          >
            <Camera className="w-4 h-4" />
            <span className="hidden sm:inline">{cameraView}</span>
            <kbd className="hidden sm:inline px-1 py-0.5 text-[9px] bg-slate-800 text-slate-400 border border-slate-700">C</kbd>
          </button>

          <button
            onClick={toggleSound}
            className="p-2 bg-slate-950/80 border border-cyan-500/30 text-slate-300 hover:bg-cyan-950/40 hover:text-cyan-300 transition-colors"
            title="Mute Audio"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>

          <button
            onClick={onPause}
            className="p-2 bg-slate-950/80 border border-cyan-500/30 text-slate-300 hover:bg-cyan-950/40 hover:text-cyan-300 transition-colors"
            title="Pause (Esc)"
          >
            <Pause className="w-4 h-4 text-slate-200" />
          </button>
        </div>
      </div>

      {/* Bottom Telemetry Cluster: Speedometer, Gear, RPM, Nitro */}
      <div className="flex items-end justify-between w-full">
        {/* Left Side: Overtakes Counter */}
        <div className="bg-slate-950/80 border border-cyan-500/30 px-3 py-2 text-xs">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider">OVERTAKES</div>
          <div className="text-lg font-bold text-cyan-300">{runData.overtakes}</div>
        </div>

        {/* Center: Digital Cyber Speedometer & Dynamic Tachometer */}
        <div className="flex flex-col items-center bg-slate-950/85 border-t-2 border-x border-b border-cyan-500/40 px-6 py-3 w-72 sm:w-80">
          {/* Shift light & Gear indicator header */}
          <div className="flex items-center justify-between w-full mb-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-slate-400 font-bold uppercase">GEAR</span>
              <span className={`font-mono font-black px-2 py-0.5 text-xs transition-colors ${
                runData.isShifting
                  ? 'bg-amber-500 text-slate-950 font-black'
                  : 'bg-slate-800 text-cyan-300 border border-slate-700'
              }`}>
                {runData.isShifting ? 'SHIFT' : runData.gear}
              </span>
            </div>

            {/* Shift Light warning */}
            {runData.actualRpm >= 7900 && (
              <span className="text-[9px] font-black tracking-widest text-white px-1.5 py-0.5 bg-rose-600 border border-rose-400">
                UP!
              </span>
            )}

            <div className="text-[11px] font-mono font-bold text-slate-300">
              <span className={runData.actualRpm > 7800 ? 'text-rose-400 font-black' : 'text-slate-200'}>
                {runData.actualRpm.toLocaleString()}
              </span>
              <span className="text-[9px] text-slate-400 ml-0.5">RPM</span>
            </div>
          </div>

          {/* Speed display */}
          <div className="flex items-baseline gap-1 my-0.5">
            <span className="text-5xl sm:text-6xl font-black tracking-tighter text-cyan-400 font-mono">
              {runData.speed}
            </span>
            <span className="text-xs font-bold text-slate-400 tracking-widest">KM/H</span>
          </div>

          {/* Dynamic RPM Tachometer Bar (Segmented Look) */}
          <div className="w-full h-2.5 bg-slate-900 border border-slate-800 overflow-hidden relative">
            <div
              className={`h-full transition-all duration-75 ${
                runData.actualRpm > 7900
                  ? 'bg-gradient-to-r from-cyan-500 via-amber-400 to-rose-600'
                  : runData.actualRpm > 6000
                  ? 'bg-gradient-to-r from-cyan-500 via-sky-400 to-amber-400'
                  : 'bg-gradient-to-r from-cyan-500 to-sky-400'
              }`}
              style={{ width: `${Math.min(100, (runData.rpm * 100))}%` }}
            />
          </div>

          {/* Speed bar & Nitro Status */}
          <div className="flex items-center justify-between w-full mt-2 text-xs">
            <div className="flex items-center gap-1">
              <span className="text-[9px] text-slate-400 font-mono">SPD</span>
              <div className="w-16 h-1.5 bg-slate-900 border border-slate-800 overflow-hidden">
                <div
                  className="h-full bg-cyan-400 transition-all duration-75"
                  style={{ width: `${speedPercent}%` }}
                />
              </div>
            </div>

            {/* Nitro bar */}
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-bold tracking-wider ${runData.isNitroActive ? 'text-cyan-300 font-black' : 'text-slate-400'}`}>
                N2O
              </span>
              <div className="w-16 h-1.5 bg-slate-900 border border-slate-700 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-100"
                  style={{ width: `${nitroPercent}%` }}
                />
              </div>
              <span className="text-[10px] font-mono text-cyan-300">{nitroPercent}%</span>
            </div>
          </div>
        </div>

        {/* Right Side: Near Misses Counter */}
        <div className="bg-slate-950/80 border border-rose-500/30 px-3 py-2 text-xs text-right">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider">NEAR MISS</div>
          <div className="text-lg font-bold text-rose-400">{runData.nearMisses}</div>
        </div>
      </div>
    </div>
  );
};
