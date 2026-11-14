export type GameStatus = 'TITLE_MENU' | 'PLAYING' | 'PAUSED' | 'GAME_OVER';

export type FaceExpression = 'happy' | 'uwu' | 'wink' | 'surprised' | 'bliss';

export type ToppingType = 'strawberry' | 'sprinkles' | 'stars' | 'blueberry' | 'matcha_leaf' | 'caramel_pearl';

export interface CakeFlavor {
  id: string;
  name: string;
  spongeColor: string;
  spongeShade: string;
  frostingColor: string;
  frostingHighlight: string;
  accentColor: string;
  cheekColor: string;
  expression: FaceExpression;
  topping: ToppingType;
}

export interface StackedLayer {
  id: number;
  floor: number;
  x: number;
  y: number;
  width: number;
  height: number;
  flavor: CakeFlavor;
  squish: number; // 0..1 landing squash animation
  faceOverride?: FaceExpression;
  faceOverrideTimer: number;
  isPerfect: boolean;
}

export interface ActiveCake {
  phase: 'SWINGING' | 'FALLING' | 'MISSING';
  x: number;
  y: number;
  width: number;
  height: number;
  vx: number;
  vy: number;
  rotation: number;
  vRotation: number;
  tiltAngle: number;
  flavor: CakeFlavor;
}

export interface SlicedDebris {
  x: number;
  y: number;
  width: number;
  height: number;
  vx: number;
  vy: number;
  rotation: number;
  vRotation: number;
  flavor: CakeFlavor;
  alpha: number;
}

export type ParticleShape = 'star' | 'heart' | 'circle' | 'sprinkle';

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  shape: ParticleShape;
  rotation: number;
  vRotation: number;
  life: number;
  maxLife: number;
}

export interface ShockwaveRing {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  color: string;
  life: number;
  maxLife: number;
}

export interface FloatingText {
  x: number;
  y: number;
  text: string;
  subtext?: string;
  color: string;
  life: number;
  maxLife: number;
}

export interface GameRunSummary {
  score: number;
  floors: number;
  maxCombo: number;
  perfectCount: number;
  finalWidth: number;
  isNewBest: boolean;
}

export interface LeaderboardEntry {
  id: string;
  nickname: string;
  score: number;
  floors: number;
  maxCombo: number;
  createdAt: string;
}

export type PowerUpType = 'autoAlign' | 'widen' | 'shield';

export interface PowerUpInventory {
  autoAlign: number;
  widen: number;
  shield: number;
}

export interface LiveHudState {
  score: number;
  floors: number;
  combo: number;
  maxCombo: number;
  perfectCount: number;
  currentWidth: number;
  speedMultiplier: number;
  currentFlavor: CakeFlavor;
  nextFlavor: CakeFlavor;
  powerUps: PowerUpInventory;
  shieldActive: boolean;
}
