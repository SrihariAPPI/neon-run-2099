import React from 'react';
import { ArrowLeft, ArrowRight, Zap } from 'lucide-react';

interface TouchControlsProps {
  onInput: (steer: number, throttle: number, brake: number, nitro: boolean) => void;
}

export const TouchControls: React.FC<TouchControlsProps> = ({ onInput }) => {
  const [steer, setSteer] = React.useState(0);
  const [throttle, setThrottle] = React.useState(0);
  const [brake, setBrake] = React.useState(0);
  const [nitro, setNitro] = React.useState(false);

  React.useEffect(() => {
    onInput(steer, throttle, brake, nitro);
  }, [steer, throttle, brake, nitro, onInput]);

  return (
    <div className="absolute inset-x-0 bottom-16 sm:bottom-20 z-20 pointer-events-none px-4 flex justify-between items-end">
      {/* Steering (Left / Right) */}
      <div className="flex gap-2 pointer-events-auto">
        <button
          onTouchStart={() => setSteer(-1)}
          onTouchEnd={() => setSteer(0)}
          onMouseDown={() => setSteer(-1)}
          onMouseUp={() => setSteer(0)}
          onMouseLeave={() => setSteer(0)}
          className="w-16 h-16 bg-slate-900/80 active:bg-cyan-600/50 border border-cyan-500/40 text-cyan-300 flex items-center justify-center text-xl active:scale-95 transition-transform"
        >
          <ArrowLeft className="w-8 h-8" />
        </button>

        <button
          onTouchStart={() => setSteer(1)}
          onTouchEnd={() => setSteer(0)}
          onMouseDown={() => setSteer(1)}
          onMouseUp={() => setSteer(0)}
          onMouseLeave={() => setSteer(0)}
          className="w-16 h-16 bg-slate-900/80 active:bg-cyan-600/50 border border-cyan-500/40 text-cyan-300 flex items-center justify-center text-xl active:scale-95 transition-transform"
        >
          <ArrowRight className="w-8 h-8" />
        </button>
      </div>

      {/* Pedals & Nitro */}
      <div className="flex gap-2 pointer-events-auto items-end">
        {/* Nitro */}
        <button
          onTouchStart={() => setNitro(true)}
          onTouchEnd={() => setNitro(false)}
          onMouseDown={() => setNitro(true)}
          onMouseUp={() => setNitro(false)}
          onMouseLeave={() => setNitro(false)}
          className="w-12 h-12 bg-sky-950/80 active:bg-cyan-500/80 border border-cyan-400 text-cyan-200 flex items-center justify-center text-xs font-bold active:scale-95 transition-transform"
        >
          <Zap className="w-6 h-6 fill-cyan-400 text-cyan-400" />
        </button>

        {/* Brake */}
        <button
          onTouchStart={() => setBrake(1)}
          onTouchEnd={() => setBrake(0)}
          onMouseDown={() => setBrake(1)}
          onMouseUp={() => setBrake(0)}
          onMouseLeave={() => setBrake(0)}
          className="w-14 h-16 bg-rose-950/80 active:bg-rose-600/60 border border-rose-500/50 text-rose-300 flex items-center justify-center text-xs font-black active:scale-95 transition-transform uppercase tracking-wider"
        >
          BRAKE
        </button>

        {/* Gas */}
        <button
          onTouchStart={() => setThrottle(1)}
          onTouchEnd={() => setThrottle(0)}
          onMouseDown={() => setThrottle(1)}
          onMouseUp={() => setThrottle(0)}
          onMouseLeave={() => setThrottle(0)}
          className="w-16 h-20 bg-emerald-950/80 active:bg-emerald-600/60 border border-emerald-500/60 text-emerald-300 flex items-center justify-center text-xs font-black active:scale-95 transition-transform uppercase tracking-wider"
        >
          GAS
        </button>
      </div>
    </div>
  );
};
