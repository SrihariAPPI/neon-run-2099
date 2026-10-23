import { CarSpec, PlayerStats } from '../types/game';

export const INITIAL_CARS: CarSpec[] = [
  {
    id: 'kairo-s1',
    name: 'KAIRO S1',
    tagline: 'Balanced Starter Tuner. Agile and responsive midnight runner.',
    topSpeed: 230,
    acceleration: 1.0,
    handling: 1.0,
    price: 0,
    bodyColor: '#00f5ff',
    underglowColor: '#00e5ff',
    silhouette: 'coupe',
    unlocked: true,
  },
  {
    id: 'vanta-gt',
    name: 'VANTA GT',
    tagline: 'Sleek Grand Tourer. Supreme stability at triple-digit speeds.',
    topSpeed: 265,
    acceleration: 1.18,
    handling: 1.1,
    price: 2500,
    bodyColor: '#f43f5e',
    underglowColor: '#ff0055',
    silhouette: 'gt',
    unlocked: false,
  },
  {
    id: 'razor-v8',
    name: 'RAZOR V8',
    tagline: 'Aggressive Cyber Muscle. Unforgiving torque and roaring acceleration.',
    topSpeed: 290,
    acceleration: 1.4,
    handling: 0.95,
    price: 6000,
    bodyColor: '#eab308',
    underglowColor: '#f59e0b',
    silhouette: 'muscle',
    unlocked: false,
  },
  {
    id: 'phantom-x',
    name: 'PHANTOM X',
    tagline: 'Exotic Apex Prototype. Experimental magnet-aerodynamic hypercar.',
    topSpeed: 330,
    acceleration: 1.65,
    handling: 1.35,
    price: 12000,
    bodyColor: '#8b5cf6',
    underglowColor: '#a855f7',
    silhouette: 'hyper',
    unlocked: false,
  },
];

export const PAINT_PALETTE = [
  { name: 'Neon Cyan', color: '#00f5ff' },
  { name: 'Tokyo Sunset', color: '#f43f5e' },
  { name: 'Cyber Violet', color: '#8b5cf6' },
  { name: 'Solar Amber', color: '#eab308' },
  { name: 'Acid Green', color: '#10b981' },
  { name: 'Stealth Noir', color: '#18181b' },
  { name: 'Ghost Pearl', color: '#f8fafc' },
];

export const UNDERGLOW_PALETTE = [
  { name: 'Electric Cyan', color: '#00e5ff' },
  { name: 'Neon Magenta', color: '#ff007f' },
  { name: 'Hyper Violet', color: '#a855f7' },
  { name: 'Solar Amber', color: '#f59e0b' },
  { name: 'Matrix Emerald', color: '#22c55e' },
  { name: 'Vanta White', color: '#ffffff' },
];

const STORAGE_KEY = 'neon_run_2099_save_v1';

export interface SaveData {
  stats: PlayerStats;
  selectedCarId: string;
  unlockedCarIds: string[];
  carPaints: Record<string, string>;
  carUnderglows: Record<string, string>;
}

export function loadSaveData(): SaveData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        stats: {
          credits: parsed.stats?.credits ?? 500,
          highScore: parsed.stats?.highScore ?? 0,
          bestDistance: parsed.stats?.bestDistance ?? 0,
          totalRuns: parsed.stats?.totalRuns ?? 0,
        },
        selectedCarId: parsed.selectedCarId ?? 'kairo-s1',
        unlockedCarIds: parsed.unlockedCarIds ?? ['kairo-s1'],
        carPaints: parsed.carPaints ?? {},
        carUnderglows: parsed.carUnderglows ?? {},
      };
    }
  } catch {
    // fallback
  }

  return {
    stats: {
      credits: 500,
      highScore: 0,
      bestDistance: 0,
      totalRuns: 0,
    },
    selectedCarId: 'kairo-s1',
    unlockedCarIds: ['kairo-s1'],
    carPaints: {},
    carUnderglows: {},
  };
}

export function saveGameData(data: SaveData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}
