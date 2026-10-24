import React from 'react';
import { Play, RotateCcw, Home, Volume2, VolumeX } from 'lucide-react';
import { soundManager } from '../game/audio';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onMenu: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  onMenu,
}) => {
  const [isMuted, setIsMuted] = React.useState(soundManager.getIsMuted());
  const [engineVolume, setEngineVolume] = React.useState(Math.round(soundManager.getEngineVolume() * 100));

  const toggleSound = () => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
  };

  const handleEngineVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setEngineVolume(val);
    soundManager.setEngineVolume(val / 100);
  };

  return (
    <div className="absolute inset-0 z-30 pointer-events-auto bg-slate-950/80 backdrop-blur-none flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-sm bg-slate-950 border border-cyan-500/40 p-6 shadow-2xl text-center">
        <div className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest mb-1">
          SIMULATION SUSPENDED
        </div>
        <h2 className="text-2xl font-black text-white tracking-wider font-mono mb-6">
          PAUSED
        </h2>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => {
              soundManager.playClick();
              onResume();
            }}
            className="w-full flex items-center justify-center gap-2 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm tracking-wider transition-all active:scale-98"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            <span>RESUME RUN</span>
          </button>

          <button
            onClick={() => {
              soundManager.playClick();
              onRestart();
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold text-xs tracking-wider transition-colors"
          >
            <RotateCcw className="w-4 h-4 text-cyan-400" />
            <span>RESTART RUN</span>
          </button>

          <button
            onClick={toggleSound}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold text-xs tracking-wider transition-colors"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
            <span>{isMuted ? 'UNMUTE AUDIO' : 'MUTE AUDIO'}</span>
          </button>

          {/* Dedicated Engine Volume Setting */}
          <div className="w-full p-3 bg-slate-900/90 border border-slate-800 text-left">
            <div className="flex items-center justify-between text-[11px] font-bold text-cyan-400 mb-1.5 uppercase tracking-wider">
              <span>PLAYER ENGINE SOUND</span>
              <span className="font-mono text-white">{engineVolume}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={engineVolume}
              onChange={handleEngineVolumeChange}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 focus:outline-none"
            />
          </div>

          <button
            onClick={() => {
              soundManager.playClick();
              onMenu();
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold text-xs tracking-wider transition-colors mt-2"
          >
            <Home className="w-4 h-4 text-cyan-400" />
            <span>EXIT TO MAIN MENU</span>
          </button>
        </div>
      </div>
    </div>
  );
};
