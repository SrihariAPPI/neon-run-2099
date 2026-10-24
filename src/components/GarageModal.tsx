import React from 'react';
import { CarSpec, PlayerStats } from '../types/game';
import { INITIAL_CARS, PAINT_PALETTE, UNDERGLOW_PALETTE } from '../game/cars';
import { ArrowLeft, Lock, Unlock, Gauge, Zap, Shield, Sparkles } from 'lucide-react';
import { soundManager } from '../game/audio';

interface GarageModalProps {
  currentCarId: string;
  unlockedCarIds: string[];
  stats: PlayerStats;
  carPaints: Record<string, string>;
  carUnderglows: Record<string, string>;
  onSelectCar: (carId: string) => void;
  onUnlockCar: (carId: string, price: number) => void;
  onUpdatePaint: (carId: string, color: string) => void;
  onUpdateUnderglow: (carId: string, color: string) => void;
  onClose: () => void;
}

export const GarageModal: React.FC<GarageModalProps> = ({
  currentCarId,
  unlockedCarIds,
  stats,
  carPaints,
  carUnderglows,
  onSelectCar,
  onUnlockCar,
  onUpdatePaint,
  onUpdateUnderglow,
  onClose,
}) => {
  const [activeTab, setActiveTab] = React.useState<'CARS' | 'PAINT' | 'UNDERGLOW'>('CARS');

  const selectedCar = INITIAL_CARS.find(c => c.id === currentCarId) || INITIAL_CARS[0];
  const isUnlocked = unlockedCarIds.includes(currentCarId);
  const currentPaint = carPaints[currentCarId] || selectedCar.bodyColor;
  const currentUnderglow = carUnderglows[currentCarId] || selectedCar.underglowColor;

  return (
    <div className="absolute inset-0 z-30 pointer-events-auto bg-slate-950/60 flex flex-col justify-between p-4 sm:p-8 select-none">
      {/* Top Bar */}
      <div className="flex items-center justify-between w-full">
        <button
          onClick={() => {
            soundManager.playClick();
            onClose();
          }}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-cyan-400" />
          <span>BACK TO MAIN MENU</span>
        </button>

        <div className="flex items-center gap-6 bg-slate-950/90 border border-slate-800 px-4 py-2 text-xs">
          <div className="text-slate-400">CREDITS:</div>
          <div className="text-amber-400 font-bold text-base sm:text-lg">
            {stats.credits.toLocaleString()} CR
          </div>
        </div>
      </div>

      {/* Center Tabs & Selector Panel (Docked at Bottom-Center per Skill Directive) */}
      <div className="w-full max-w-3xl mx-auto bg-slate-950/90 border border-cyan-500/30 p-4 sm:p-6 mb-2">
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 mb-4 gap-2">
          <button
            onClick={() => {
              soundManager.playClick();
              setActiveTab('CARS');
            }}
            className={`px-4 py-2 text-xs font-bold tracking-wider transition-colors border-b-2 ${
              activeTab === 'CARS'
                ? 'border-cyan-400 text-cyan-400 bg-cyan-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            VEHICLE ROSTER
          </button>
          <button
            onClick={() => {
              soundManager.playClick();
              setActiveTab('PAINT');
            }}
            className={`px-4 py-2 text-xs font-bold tracking-wider transition-colors border-b-2 ${
              activeTab === 'PAINT'
                ? 'border-cyan-400 text-cyan-400 bg-cyan-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            CUSTOM PAINT
          </button>
          <button
            onClick={() => {
              soundManager.playClick();
              setActiveTab('UNDERGLOW');
            }}
            className={`px-4 py-2 text-xs font-bold tracking-wider transition-colors border-b-2 ${
              activeTab === 'UNDERGLOW'
                ? 'border-cyan-400 text-cyan-400 bg-cyan-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            NEON UNDERGLOW
          </button>
        </div>

        {/* Tab Content: Cars Roster */}
        {activeTab === 'CARS' && (
          <div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {INITIAL_CARS.map(car => {
                const unlocked = unlockedCarIds.includes(car.id);
                const isSelected = car.id === currentCarId;

                return (
                  <button
                    key={car.id}
                    onClick={() => {
                      soundManager.playClick();
                      onSelectCar(car.id);
                    }}
                    className={`p-3 text-left border transition-all ${
                      isSelected
                        ? 'border-cyan-400 bg-cyan-950/30'
                        : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 uppercase">{car.silhouette}</span>
                      {unlocked ? (
                        <Unlock className="w-3.5 h-3.5 text-cyan-400" />
                      ) : (
                        <Lock className="w-3.5 h-3.5 text-amber-500" />
                      )}
                    </div>
                    <div className="font-bold text-sm text-white mt-1">{car.name}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{car.topSpeed} KM/H</div>

                    {!unlocked && (
                      <div className="mt-2 text-[10px] font-bold text-amber-400">
                        {car.price.toLocaleString()} CR
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Selected Car Details & Unlock Action */}
            <div className="mt-4 pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="text-lg font-black text-white">{selectedCar.name}</div>
                <div className="text-xs text-slate-400 max-w-md">{selectedCar.tagline}</div>
                {/* Stats */}
                <div className="flex flex-wrap items-center gap-3 mt-2.5 text-xs">
                  <div className="flex items-center gap-1 text-slate-300">
                    <Gauge className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{selectedCar.topSpeed} KM/H</span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-300">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>{(selectedCar.acceleration * 10).toFixed(1)}/10</span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-300">
                    <Shield className="w-3.5 h-3.5 text-rose-400" />
                    <span>{(selectedCar.handling * 10).toFixed(1)}/10</span>
                  </div>
                </div>
              </div>

              {!isUnlocked && (
                <button
                  onClick={() => onUnlockCar(selectedCar.id, selectedCar.price)}
                  disabled={stats.credits < selectedCar.price}
                  className={`px-6 py-3 font-bold text-xs tracking-wider uppercase transition-all ${
                    stats.credits >= selectedCar.price
                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 active:scale-95'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  UNLOCK FOR {selectedCar.price.toLocaleString()} CR
                </button>
              )}
            </div>
          </div>
        )}

        {/* Tab Content: Custom Paint */}
        {activeTab === 'PAINT' && (
          <div>
            <div className="text-xs text-slate-400 mb-3 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              SELECT BODY FINISH FOR {selectedCar.name}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {PAINT_PALETTE.map(paint => {
                const isCurrent = currentPaint === paint.color;
                return (
                  <button
                    key={paint.name}
                    onClick={() => {
                      soundManager.playClick();
                      onUpdatePaint(currentCarId, paint.color);
                    }}
                    className={`flex items-center gap-3 p-3 border transition-all ${
                      isCurrent
                        ? 'border-cyan-400 bg-cyan-950/30'
                        : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                    }`}
                  >
                    <span
                      className="w-5 h-5 rounded-none border border-slate-600 shadow-sm"
                      style={{ backgroundColor: paint.color }}
                    />
                    <span className="text-xs font-bold text-slate-200">{paint.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab Content: Neon Underglow */}
        {activeTab === 'UNDERGLOW' && (
          <div>
            <div className="text-xs text-slate-400 mb-3 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              SELECT NEON UNDERGLOW FOR {selectedCar.name}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {UNDERGLOW_PALETTE.map(glow => {
                const isCurrent = currentUnderglow === glow.color;
                return (
                  <button
                    key={glow.name}
                    onClick={() => {
                      soundManager.playClick();
                      onUpdateUnderglow(currentCarId, glow.color);
                    }}
                    className={`flex items-center gap-3 p-3 border transition-all ${
                      isCurrent
                        ? 'border-cyan-400 bg-cyan-950/30'
                        : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                    }`}
                  >
                    <span
                      className="w-5 h-5 border border-slate-600 shadow-md"
                      style={{ backgroundColor: glow.color, boxShadow: `0 0 10px ${glow.color}` }}
                    />
                    <span className="text-xs font-bold text-slate-200">{glow.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
