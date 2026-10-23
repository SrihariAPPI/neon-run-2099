import { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine } from './game/engine';
import { INITIAL_CARS, loadSaveData, saveGameData, SaveData } from './game/cars';
import { CameraView, GameMode, NearMissEvent, RunData } from './types/game';
import { HUD } from './components/HUD';
import { MainMenu } from './components/MainMenu';
import { GarageModal } from './components/GarageModal';
import { ResultsModal } from './components/ResultsModal';
import { PauseModal } from './components/PauseModal';
import { TouchControls } from './components/TouchControls';

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // Persistence State
  const [saveData, setSaveData] = useState<SaveData>(() => loadSaveData());

  // Game UI State
  const [gameMode, setGameMode] = useState<GameMode>('MENU');
  const [cameraView, setCameraView] = useState<CameraView>('CHASE');
  const [nearMisses, setNearMisses] = useState<NearMissEvent[]>([]);

  // Live Run Telemetry
  const [runData, setRunData] = useState<RunData>({
    speed: 0,
    distance: 0,
    overtakes: 0,
    nearMisses: 0,
    score: 0,
    nitroRemaining: 1,
    isNitroActive: false,
    gear: 1,
    rpm: 0.1,
    actualRpm: 950,
    isShifting: false,
    maxSpeedReached: 0,
  });

  // Game Over / Crash summary
  const [finalRun, setFinalRun] = useState<RunData | null>(null);
  const [creditsEarned, setCreditsEarned] = useState(0);
  const [isNewBest, setIsNewBest] = useState(false);

  // Active Car configuration
  const currentCar = INITIAL_CARS.find(c => c.id === saveData.selectedCarId) || INITIAL_CARS[0];
  const customPaint = saveData.carPaints[currentCar.id] || currentCar.bodyColor;
  const customUnderglow = saveData.carUnderglows[currentCar.id] || currentCar.underglowColor;

  // Near miss notifications handler
  const handleNearMiss = useCallback((points: number, text: string) => {
    const id = Date.now() + Math.random();
    setNearMisses(prev => [...prev, { id, points, text, timestamp: Date.now() }]);
    setTimeout(() => {
      setNearMisses(prev => prev.filter(item => item.id !== id));
    }, 1800);
  }, []);

  const handleOvertake = useCallback(() => {
    // Handled in engine, updates telemetry
  }, []);

  const handleCrash = useCallback((finalStats: RunData) => {
    setGameMode('GAMEOVER');
    setFinalRun(finalStats);

    const earned = Math.round(finalStats.distance * 0.4 + finalStats.nearMisses * 150 + finalStats.overtakes * 50);
    setCreditsEarned(earned);

    setSaveData(prev => {
      const isBest = finalStats.distance > prev.stats.bestDistance;
      setIsNewBest(isBest);
      const nextSave: SaveData = {
        ...prev,
        stats: {
          credits: prev.stats.credits + earned,
          highScore: Math.max(prev.stats.highScore, finalStats.score),
          bestDistance: Math.max(prev.stats.bestDistance, finalStats.distance),
          totalRuns: prev.stats.totalRuns + 1,
        },
      };
      saveGameData(nextSave);
      return nextSave;
    });
  }, []);

  // Initialize Three.js Engine once on mount
  useEffect(() => {
    if (!canvasMountRef.current) return;

    const engine = new GameEngine(canvasMountRef.current, currentCar, {
      onRunUpdate: (data) => setRunData(data),
      onNearMiss: handleNearMiss,
      onOvertake: handleOvertake,
      onCrash: handleCrash,
    });
    engineRef.current = engine;

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, [handleNearMiss, handleOvertake, handleCrash]);

  // Sync Car Spec & Paint when changed
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setCarSpec(currentCar, customPaint, customUnderglow);
    }
  }, [currentCar, customPaint, customUnderglow]);

  // Sync Camera Mode
  const handleCycleCamera = () => {
    if (engineRef.current) {
      engineRef.current.cycleCamera();
      let nextCam: CameraView = 'CHASE';
      if (cameraView === 'CHASE') nextCam = 'COCKPIT';
      else if (cameraView === 'COCKPIT') nextCam = 'BUMPER';
      setCameraView(nextCam);
    }
  };

  // Keyboard shortcut listener for Pause (Escape)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (gameMode === 'PLAYING') {
          engineRef.current?.setMode('PAUSED');
          setGameMode('PAUSED');
        } else if (gameMode === 'PAUSED') {
          engineRef.current?.setMode('PLAYING');
          setGameMode('PLAYING');
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [gameMode]);

  // Game Flow Actions
  const handleStartRun = () => {
    setGameMode('PLAYING');
    engineRef.current?.startRun();
  };

  const handlePause = () => {
    engineRef.current?.setMode('PAUSED');
    setGameMode('PAUSED');
  };

  const handleResume = () => {
    engineRef.current?.setMode('PLAYING');
    setGameMode('PLAYING');
  };

  const handleRestart = () => {
    setGameMode('PLAYING');
    engineRef.current?.startRun();
  };

  const handleReturnToMenu = () => {
    setGameMode('MENU');
    engineRef.current?.setMode('MENU');
  };

  const handleOpenGarage = () => {
    setGameMode('GARAGE');
    engineRef.current?.setMode('GARAGE');
  };

  // Garage Customization Actions
  const handleSelectCar = (carId: string) => {
    setSaveData(prev => {
      const next = { ...prev, selectedCarId: carId };
      saveGameData(next);
      return next;
    });
  };

  const handleUnlockCar = (carId: string, price: number) => {
    if (saveData.stats.credits < price) return;
    setSaveData(prev => {
      const next: SaveData = {
        ...prev,
        stats: {
          ...prev.stats,
          credits: prev.stats.credits - price,
        },
        unlockedCarIds: [...prev.unlockedCarIds, carId],
        selectedCarId: carId,
      };
      saveGameData(next);
      return next;
    });
  };

  const handleUpdatePaint = (carId: string, color: string) => {
    setSaveData(prev => {
      const next: SaveData = {
        ...prev,
        carPaints: {
          ...prev.carPaints,
          [carId]: color,
        },
      };
      saveGameData(next);
      return next;
    });
  };

  const handleUpdateUnderglow = (carId: string, color: string) => {
    setSaveData(prev => {
      const next: SaveData = {
        ...prev,
        carUnderglows: {
          ...prev.carUnderglows,
          [carId]: color,
        },
      };
      saveGameData(next);
      return next;
    });
  };

  const handleTouchInput = useCallback((steer: number, throttle: number, brake: number, nitro: boolean) => {
    engineRef.current?.setVirtualInputs(steer, throttle, brake, nitro);
  }, []);

  return (
    <div className="relative w-full h-full bg-slate-950 overflow-hidden font-mono">
      {/* 3D WebGL Canvas Mount Container */}
      <div ref={canvasMountRef} className="absolute inset-0 w-full h-full z-0" />

      {/* Atmospheric Vignette & Speed Flare Overlays */}
      <div className="absolute inset-0 cyber-vignette pointer-events-none z-5" />
      {runData.speed > 160 && (
        <div className="absolute inset-0 speed-lines pointer-events-none z-5" />
      )}

      {/* Main Menu Screen */}
      {gameMode === 'MENU' && (
        <MainMenu
          currentCar={currentCar}
          stats={saveData.stats}
          onStartRun={handleStartRun}
          onOpenGarage={handleOpenGarage}
        />
      )}

      {/* Active Driving HUD */}
      {gameMode === 'PLAYING' && (
        <>
          <HUD
            runData={runData}
            cameraView={cameraView}
            onCycleCamera={handleCycleCamera}
            onPause={handlePause}
            nearMisses={nearMisses}
          />
          <TouchControls onInput={handleTouchInput} />
        </>
      )}

      {/* Garage Screen */}
      {gameMode === 'GARAGE' && (
        <GarageModal
          currentCarId={saveData.selectedCarId}
          unlockedCarIds={saveData.unlockedCarIds}
          stats={saveData.stats}
          carPaints={saveData.carPaints}
          carUnderglows={saveData.carUnderglows}
          onSelectCar={handleSelectCar}
          onUnlockCar={handleUnlockCar}
          onUpdatePaint={handleUpdatePaint}
          onUpdateUnderglow={handleUpdateUnderglow}
          onClose={handleReturnToMenu}
        />
      )}

      {/* Pause Modal */}
      {gameMode === 'PAUSED' && (
        <PauseModal
          onResume={handleResume}
          onRestart={handleRestart}
          onMenu={handleReturnToMenu}
        />
      )}

      {/* Crash / Run Results Modal */}
      {gameMode === 'GAMEOVER' && finalRun && (
        <ResultsModal
          finalRun={finalRun}
          creditsEarned={creditsEarned}
          isNewBest={isNewBest}
          onRetry={handleRestart}
          onGarage={handleOpenGarage}
          onMenu={handleReturnToMenu}
        />
      )}
    </div>
  );
}
