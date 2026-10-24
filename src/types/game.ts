export type GameMode = 'MENU' | 'PLAYING' | 'PAUSED' | 'GAMEOVER' | 'GARAGE';

export type CameraView = 'CHASE' | 'COCKPIT' | 'HOOD';

export interface CarSpec {
  id: string;
  name: string;
  tagline: string;
  topSpeed: number; // in km/h
  acceleration: number; // multiplier
  handling: number; // steer response
  price: number;
  bodyColor: string;
  underglowColor: string;
  silhouette: 'coupe' | 'gt' | 'muscle' | 'hyper';
  unlocked: boolean;
}

export interface PlayerStats {
  credits: number;
  highScore: number;
  bestDistance: number;
  totalRuns: number;
}

export interface RunData {
  speed: number; // km/h
  distance: number; // meters
  overtakes: number;
  nearMisses: number;
  score: number;
  nitroRemaining: number; // 0 to 1
  isNitroActive: boolean;
  gear: number;
  rpm: number; // 0 to 1 normalized
  actualRpm: number; // e.g. 1000 - 8500
  isShifting: boolean;
  maxSpeedReached: number;
}

export interface NearMissEvent {
  id: number;
  points: number;
  text: string;
  timestamp: number;
}

export interface AudioSettings {
  masterVolume: number;
  engineVolume: number;
  sfxVolume: number;
  musicVolume: number;
  muted: boolean;
}
