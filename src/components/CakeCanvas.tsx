import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react';
import {
  CAKE_HEIGHT,
  DEBRIS_GRAVITY,
  getAngularSpeedForFloor,
  getFlavorForFloor,
  GRAVITY,
  GROUND_Y,
  INITIAL_CAKE_WIDTH,
  LOGICAL_HEIGHT,
  LOGICAL_WIDTH,
  MAX_CAKE_WIDTH,
  MAX_POWERUP_CHARGES,
  MIN_SURVIVAL_WIDTH,
  PENDULUM_MAX_ANGLE,
  PENDULUM_PIVOT_X,
  PENDULUM_PIVOT_Y,
  PENDULUM_ROPE_LENGTH,
  PERFECT_TOLERANCE,
  WIDEN_AMOUNT,
} from '../constants/flavors';
import {
  drawActiveCake,
  drawBackdrop,
  drawDebris,
  drawEffects,
  drawGround,
  drawPendulum,
  drawShieldAura,
  drawStackedLayer,
} from '../engine/cakeRenderer';
import {
  ActiveCake,
  FloatingText,
  GameRunSummary,
  GameStatus,
  LiveHudState,
  Particle,
  ParticleShape,
  PowerUpInventory,
  PowerUpType,
  ShockwaveRing,
  SlicedDebris,
  StackedLayer,
} from '../types/game';
import { soundFx } from '../utils/sound';

export interface CakeCanvasHandle {
  usePowerUp: (type: PowerUpType) => void;
}

interface CakeCanvasProps {
  status: GameStatus;
  runId: number;
  bestScore: number;
  onHudChange: (hud: LiveHudState) => void;
  onGameOver: (summary: GameRunSummary) => void;
}

const PARTICLE_COLORS = ['#F43F7E', '#FBBF24', '#38BDF8', '#4ADE80', '#A78BFA', '#FB7185'];
const PARTICLE_SHAPES: ParticleShape[] = ['star', 'heart', 'sprinkle', 'circle'];

const POWERUP_LABELS: Record<PowerUpType, string> = {
  autoAlign: '自動對齊',
  widen: '加寬蛋糕',
  shield: '防護盾',
};

export const CakeCanvas = forwardRef<CakeCanvasHandle, CakeCanvasProps>(
  ({ status, runId, bestScore, onHudChange, onGameOver }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const statusRef = useRef<GameStatus>(status);
    const bestScoreRef = useRef<number>(bestScore);
    const logicalHeightRef = useRef<number>(LOGICAL_HEIGHT);
    statusRef.current = status;
    bestScoreRef.current = bestScore;

    const engineRef = useRef({
      stack: [] as StackedLayer[],
      activeCake: null as ActiveCake | null,
      debris: [] as SlicedDebris[],
      particles: [] as Particle[],
      rings: [] as ShockwaveRing[],
      texts: [] as FloatingText[],
      cameraY: 0,
      targetCameraY: 0,
      pendulumPhase: 0,
      score: 0,
      combo: 0,
      maxCombo: 0,
      perfectCount: 0,
      currentWidth: INITIAL_CAKE_WIDTH,
      powerUps: { autoAlign: 1, widen: 1, shield: 1 } as PowerUpInventory,
      shieldActive: false,
      time: 0,
      missTimer: 0,
      shakeTimer: 0,
      shakeMagnitude: 0,
      nextLayerId: 1,
    });

    const emitHud = useCallback(() => {
      const eng = engineRef.current;
      const floors = eng.stack.length;
      const currentFlavor = eng.activeCake?.flavor ?? getFlavorForFloor(floors);
      const nextFlavor = getFlavorForFloor(floors + 1);
      const speedMultiplier = Number(
        (getAngularSpeedForFloor(floors) / getAngularSpeedForFloor(0)).toFixed(1)
      );

      onHudChange({
        score: eng.score,
        floors,
        combo: eng.combo,
        maxCombo: eng.maxCombo,
        perfectCount: eng.perfectCount,
        currentWidth: Math.round(eng.currentWidth),
        speedMultiplier,
        currentFlavor,
        nextFlavor,
        powerUps: { ...eng.powerUps },
        shieldActive: eng.shieldActive,
      });
    }, [onHudChange]);

    const spawnActiveCake = useCallback(() => {
      const eng = engineRef.current;
      const floorIdx = eng.stack.length;
      const flavor = getFlavorForFloor(floorIdx);
      const angle = PENDULUM_MAX_ANGLE * Math.sin(eng.pendulumPhase);
      const heightOffset = logicalHeightRef.current - LOGICAL_HEIGHT;
      const effectiveCamY = eng.targetCameraY - heightOffset;
      const centerX = PENDULUM_PIVOT_X + Math.sin(angle) * PENDULUM_ROPE_LENGTH;
      const topY = effectiveCamY + PENDULUM_PIVOT_Y + Math.cos(angle) * PENDULUM_ROPE_LENGTH;

      eng.activeCake = {
        phase: 'SWINGING',
        x: centerX - eng.currentWidth / 2,
        y: topY,
        width: eng.currentWidth,
        height: CAKE_HEIGHT,
        vx: 0,
        vy: 0,
        rotation: 0,
        vRotation: 0,
        tiltAngle: angle * 0.25,
        flavor,
      };
    }, []);

    const resetRun = useCallback(() => {
      const eng = engineRef.current;
      eng.stack = [];
      eng.debris = [];
      eng.particles = [];
      eng.rings = [];
      eng.texts = [];
      eng.cameraY = 0;
      eng.targetCameraY = 0;
      eng.pendulumPhase = -Math.PI * 0.25;
      eng.score = 0;
      eng.combo = 0;
      eng.maxCombo = 0;
      eng.perfectCount = 0;
      eng.currentWidth = INITIAL_CAKE_WIDTH;
      eng.powerUps = { autoAlign: 1, widen: 1, shield: 1 };
      eng.shieldActive = false;
      eng.missTimer = 0;
      eng.shakeTimer = 0;
      eng.shakeMagnitude = 0;
      eng.nextLayerId = 1;

      spawnActiveCake();
      emitHud();
    }, [emitHud, spawnActiveCake]);

    useEffect(() => {
      resetRun();
    }, [runId, resetRun]);

    const spawnBurstParticles = (
      cx: number,
      y: number,
      count: number,
      colors: string[],
      ringColor?: string,
      maxRadius = 95
    ) => {
      const eng = engineRef.current;
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
        const speed = 110 + Math.random() * 200;
        eng.particles.push({
          x: cx + (Math.random() - 0.5) * 32,
          y: y + (Math.random() - 0.5) * 10,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 90,
          size: 5 + Math.random() * 5.2,
          color: colors[i % colors.length],
          shape: PARTICLE_SHAPES[i % PARTICLE_SHAPES.length],
          rotation: Math.random() * Math.PI * 2,
          vRotation: (Math.random() - 0.5) * 10,
          life: 0.7 + Math.random() * 0.4,
          maxLife: 1.1,
        });
      }

      if (ringColor) {
        eng.rings.push({
          x: cx,
          y,
          radius: 14,
          maxRadius,
          color: ringColor,
          life: 0.45,
          maxLife: 0.45,
        });
      }
    };

    const spawnSliceCrumbs = (seamX: number, y: number, color: string) => {
      const eng = engineRef.current;
      for (let i = 0; i < 9; i++) {
        eng.particles.push({
          x: seamX,
          y: y + Math.random() * 20,
          vx: (Math.random() - 0.5) * 130,
          vy: -50 - Math.random() * 110,
          size: 3.5 + Math.random() * 3,
          color: i % 2 === 0 ? color : '#FFF7FA',
          shape: i % 3 === 0 ? 'sprinkle' : 'circle',
          rotation: Math.random() * Math.PI,
          vRotation: (Math.random() - 0.5) * 8,
          life: 0.45 + Math.random() * 0.25,
          maxLife: 0.7,
        });
      }
    };

    const grantBonusPowerUp = (cx: number, y: number) => {
      const eng = engineRef.current;
      const types: PowerUpType[] = ['autoAlign', 'widen', 'shield'];
      const available = types.filter((t) => eng.powerUps[t] < MAX_POWERUP_CHARGES);
      if (available.length === 0) return;
      available.sort((a, b) => eng.powerUps[a] - eng.powerUps[b]);
      const chosen = available[0];
      eng.powerUps[chosen] += 1;
      eng.texts.push({
        x: cx,
        y: y - 42,
        text: `獲得道具：${POWERUP_LABELS[chosen]}`,
        color: '#0EA5E9',
        life: 1.25,
        maxLife: 1.25,
      });
    };

    const dropActiveCake = useCallback(() => {
      if (statusRef.current !== 'PLAYING') return;
      const eng = engineRef.current;
      if (!eng.activeCake || eng.activeCake.phase !== 'SWINGING') return;

      eng.activeCake.phase = 'FALLING';
      eng.activeCake.vy = 320;
      eng.activeCake.tiltAngle = 0;
      soundFx.playDrop();
    }, []);

    const activatePowerUp = useCallback(
      (type: PowerUpType) => {
        if (statusRef.current !== 'PLAYING') return;
        const eng = engineRef.current;
        if (eng.powerUps[type] <= 0) return;

        if (type === 'autoAlign') {
          if (!eng.activeCake || eng.activeCake.phase !== 'SWINGING') return;
          eng.powerUps.autoAlign -= 1;

          const targetX =
            eng.stack.length === 0
              ? (LOGICAL_WIDTH - eng.activeCake.width) / 2
              : eng.stack[eng.stack.length - 1].x;

          eng.activeCake.x = targetX;
          eng.activeCake.tiltAngle = 0;
          eng.activeCake.phase = 'FALLING';
          eng.activeCake.vy = 420;

          const cx = targetX + eng.activeCake.width / 2;
          spawnBurstParticles(
            cx,
            eng.activeCake.y + CAKE_HEIGHT / 2,
            14,
            ['#FBBF24', '#F43F7E', '#FFFFFF'],
            '#FBBF24',
            75
          );
          eng.texts.push({
            x: cx,
            y: eng.activeCake.y - 12,
            text: '自動對齊！',
            color: '#D97706',
            life: 0.9,
            maxLife: 0.9,
          });
          soundFx.playPowerUp();
          emitHud();
        } else if (type === 'widen') {
          if (!eng.activeCake || eng.activeCake.phase === 'MISSING') return;
          eng.powerUps.widen -= 1;

          const nextWidth = Math.min(MAX_CAKE_WIDTH, eng.currentWidth + WIDEN_AMOUNT);
          eng.currentWidth = nextWidth;

          // Widen active cake centered around its position
          const activeCenter = eng.activeCake.x + eng.activeCake.width / 2;
          eng.activeCake.width = nextWidth;
          eng.activeCake.x = Math.max(
            8,
            Math.min(LOGICAL_WIDTH - nextWidth - 8, activeCenter - nextWidth / 2)
          );

          // Also widen top supporting layer so the widened drop won't immediately get sliced
          if (eng.stack.length > 0) {
            const topLayer = eng.stack[eng.stack.length - 1];
            const topCenter = topLayer.x + topLayer.width / 2;
            const targetTopW = Math.min(MAX_CAKE_WIDTH, Math.max(topLayer.width, nextWidth));
            topLayer.width = targetTopW;
            topLayer.x = Math.max(
              8,
              Math.min(LOGICAL_WIDTH - targetTopW - 8, topCenter - targetTopW / 2)
            );
            topLayer.squish = 1;
            topLayer.faceOverride = 'bliss';
            topLayer.faceOverrideTimer = 0.6;

            spawnBurstParticles(
              topLayer.x + topLayer.width / 2,
              topLayer.y + CAKE_HEIGHT / 2,
              14,
              ['#F43F7E', '#FFE4EE', '#FBBF24'],
              '#F43F7E',
              85
            );
          }

          eng.texts.push({
            x: eng.activeCake.x + eng.activeCake.width / 2,
            y: eng.activeCake.y - 12,
            text: '蛋糕加寬！',
            color: '#F43F7E',
            life: 0.9,
            maxLife: 0.9,
          });
          soundFx.playPowerUp();
          emitHud();
        } else if (type === 'shield') {
          if (eng.shieldActive) return;
          eng.powerUps.shield -= 1;
          eng.shieldActive = true;

          const targetLayer = eng.stack[eng.stack.length - 1];
          const effectX = targetLayer
            ? targetLayer.x + targetLayer.width / 2
            : LOGICAL_WIDTH / 2;
          const effectY = targetLayer ? targetLayer.y : GROUND_Y - 24;

          spawnBurstParticles(
            effectX,
            effectY,
            14,
            ['#38BDF8', '#BAE6FD', '#FFFFFF'],
            '#0EA5E9',
            90
          );
          eng.texts.push({
            x: effectX,
            y: effectY - 22,
            text: '防護盾啟動！',
            color: '#0284C7',
            life: 0.95,
            maxLife: 0.95,
          });
          soundFx.playPowerUp();
          emitHud();
        }
      },
      [emitHud]
    );

    useImperativeHandle(
      ref,
      () => ({
        usePowerUp: activatePowerUp,
      }),
      [activatePowerUp]
    );

    // Keyboard shortcuts: Space/Enter/ArrowDown drop, 1/2/3 power-ups
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (statusRef.current !== 'PLAYING') return;
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'BUTTON') return;

        if (e.code === 'Space' || e.code === 'ArrowDown' || e.code === 'Enter') {
          e.preventDefault();
          dropActiveCake();
        } else if (e.key === '1') {
          e.preventDefault();
          activatePowerUp('autoAlign');
        } else if (e.key === '2') {
          e.preventDefault();
          activatePowerUp('widen');
        } else if (e.key === '3') {
          e.preventDefault();
          activatePowerUp('shield');
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, [activatePowerUp, dropActiveCake]);

    // Main 60fps animation & physics loop
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      let animId = 0;
      let lastTs = performance.now();

      const syncCanvasDpr = () => {
        const rect = canvas.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          const computedLogicalH = Math.max(
            520,
            Math.min(960, Math.round(LOGICAL_WIDTH * (rect.height / rect.width)))
          );
          logicalHeightRef.current = computedLogicalH;
        }
        const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
        const targetW = Math.round(LOGICAL_WIDTH * dpr);
        const targetH = Math.round(logicalHeightRef.current * dpr);
        if (canvas.width !== targetW || canvas.height !== targetH) {
          canvas.width = targetW;
          canvas.height = targetH;
        }
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      };

      const handleLanding = (cake: ActiveCake) => {
        const eng = engineRef.current;
        const isFirstLayer = eng.stack.length === 0;

        if (isFirstLayer) {
          const clampedX = Math.max(10, Math.min(LOGICAL_WIDTH - cake.width - 10, cake.x));
          const placedY = GROUND_Y - CAKE_HEIGHT;

          eng.stack.push({
            id: eng.nextLayerId++,
            floor: 1,
            x: clampedX,
            y: placedY,
            width: cake.width,
            height: CAKE_HEIGHT,
            flavor: cake.flavor,
            squish: 1,
            faceOverrideTimer: 0,
            isPerfect: false,
          });

          eng.score += 10;
          eng.texts.push({
            x: clampedX + cake.width / 2,
            y: placedY - 12,
            text: '+10',
            subtext: '第 1 層開疊！',
            color: '#F43F7E',
            life: 0.9,
            maxLife: 0.9,
          });

          soundFx.playLand(false);
          eng.shakeTimer = 0.08;
          eng.shakeMagnitude = 2.5;
          spawnActiveCake();
          emitHud();
          return;
        }

        const prevLayer = eng.stack[eng.stack.length - 1];
        const deltaX = cake.x - prevLayer.x;
        const absDelta = Math.abs(deltaX);

        const overlapLeft = Math.max(cake.x, prevLayer.x);
        const overlapRight = Math.min(cake.x + cake.width, prevLayer.x + prevLayer.width);
        const overlapWidth = overlapRight - overlapLeft;
        const placedY = prevLayer.y - CAKE_HEIGHT;

        // Miss check with Protective Shield rescue
        if (overlapWidth < MIN_SURVIVAL_WIDTH) {
          if (eng.shieldActive) {
            eng.shieldActive = false;
            eng.combo = 0;
            eng.score += 10;
            eng.currentWidth = prevLayer.width;

            eng.stack.push({
              id: eng.nextLayerId++,
              floor: eng.stack.length + 1,
              x: prevLayer.x,
              y: placedY,
              width: prevLayer.width,
              height: CAKE_HEIGHT,
              flavor: cake.flavor,
              squish: 1,
              faceOverride: 'surprised',
              faceOverrideTimer: 0.7,
              isPerfect: false,
            });

            const cx = prevLayer.x + prevLayer.width / 2;
            spawnBurstParticles(
              cx,
              placedY + CAKE_HEIGHT / 2,
              22,
              ['#38BDF8', '#7DD3FC', '#FBBF24', '#FFFFFF'],
              '#0EA5E9',
              115
            );
            eng.texts.push({
              x: cx,
              y: placedY - 16,
              text: '防護盾救援成功！',
              subtext: '+10',
              color: '#0284C7',
              life: 1.15,
              maxLife: 1.15,
            });
            soundFx.playShieldSave();
            eng.shakeTimer = 0.1;
            eng.shakeMagnitude = 3.2;

            const currentLogicalH = logicalHeightRef.current;
            eng.targetCameraY = Math.min(0, placedY - LOGICAL_HEIGHT + currentLogicalH * 0.38);
            spawnActiveCake();
            emitHud();
            return;
          }

          cake.phase = 'MISSING';
          const cakeCenter = cake.x + cake.width / 2;
          const prevCenter = prevLayer.x + prevLayer.width / 2;
          cake.vx = cakeCenter < prevCenter ? -75 : 75;
          cake.vRotation = cakeCenter < prevCenter ? -3.4 : 3.4;
          eng.missTimer = 0.48;
          soundFx.playGameOver();
          return;
        }

        // Perfect alignment!
        if (absDelta <= PERFECT_TOLERANCE) {
          const snappedX = prevLayer.x;
          const snappedW = prevLayer.width;

          eng.combo += 1;
          eng.perfectCount += 1;
          eng.maxCombo = Math.max(eng.maxCombo, eng.combo);

          const gained = 10 + eng.combo * 5;
          eng.score += gained;
          eng.currentWidth = snappedW;

          eng.stack.push({
            id: eng.nextLayerId++,
            floor: eng.stack.length + 1,
            x: snappedX,
            y: placedY,
            width: snappedW,
            height: CAKE_HEIGHT,
            flavor: cake.flavor,
            squish: 1,
            faceOverride: 'bliss',
            faceOverrideTimer: 0.55,
            isPerfect: true,
          });

          const cx = snappedX + snappedW / 2;
          spawnBurstParticles(
            cx,
            placedY + CAKE_HEIGHT * 0.5,
            Math.min(40, 18 + eng.combo * 4),
            PARTICLE_COLORS,
            eng.combo >= 3 ? '#F59E0B' : '#F43F7E',
            95 + Math.min(eng.combo * 8, 45)
          );

          eng.texts.push({
            x: cx,
            y: placedY - 14,
            text: eng.combo >= 2 ? `PERFECT! ×${eng.combo}` : 'PERFECT!',
            subtext: `+${gained}`,
            color: eng.combo >= 3 ? '#F59E0B' : '#F43F7E',
            life: 1.05,
            maxLife: 1.05,
          });

          if (eng.combo > 0 && eng.combo % 3 === 0) {
            grantBonusPowerUp(cx, placedY);
          } else if (eng.stack.length % 8 === 0) {
            grantBonusPowerUp(cx, placedY);
          }

          soundFx.playPerfect(eng.combo);
          eng.shakeTimer = 0.09;
          eng.shakeMagnitude = 3;
        } else {
          // Classic Hardcore Slice: permanently trim overhang and spawn falling debris
          const cutOnLeft = cake.x < prevLayer.x;
          const debrisX = cutOnLeft ? cake.x : overlapRight;
          const debrisWidth = cake.width - overlapWidth;

          if (debrisWidth > 0.8) {
            eng.debris.push({
              x: debrisX,
              y: placedY,
              width: debrisWidth,
              height: CAKE_HEIGHT,
              vx: cutOnLeft ? -95 : 95,
              vy: -70,
              rotation: 0,
              vRotation: cutOnLeft ? -4.2 : 4.2,
              flavor: cake.flavor,
              alpha: 1,
            });
            spawnSliceCrumbs(cutOnLeft ? overlapLeft : overlapRight, placedY + 10, cake.flavor.spongeShade);
          }

          eng.combo = 0;
          eng.score += 10;
          eng.currentWidth = overlapWidth;

          eng.stack.push({
            id: eng.nextLayerId++,
            floor: eng.stack.length + 1,
            x: overlapLeft,
            y: placedY,
            width: overlapWidth,
            height: CAKE_HEIGHT,
            flavor: cake.flavor,
            squish: 1,
            faceOverride: 'surprised',
            faceOverrideTimer: 0.45,
            isPerfect: false,
          });

          const cx = overlapLeft + overlapWidth / 2;
          eng.texts.push({
            x: cx,
            y: placedY - 10,
            text: '+10',
            color: '#6B4C54',
            life: 0.75,
            maxLife: 0.75,
          });

          if (eng.stack.length % 8 === 0) {
            grantBonusPowerUp(cx, placedY);
          }

          soundFx.playLand(true);
          eng.shakeTimer = 0.07;
          eng.shakeMagnitude = 2;
        }

        const currentLogicalH = logicalHeightRef.current;
        eng.targetCameraY = Math.min(0, placedY - LOGICAL_HEIGHT + currentLogicalH * 0.38);

        spawnActiveCake();
        emitHud();
      };

      const tick = (now: number) => {
        const rawDt = (now - lastTs) / 1000;
        lastTs = now;
        const dt = Math.min(rawDt, 0.05);
        const eng = engineRef.current;

        syncCanvasDpr();
        const logicalHeight = logicalHeightRef.current;
        const heightOffset = logicalHeight - LOGICAL_HEIGHT;
        const effectiveCamY = eng.cameraY - heightOffset;

        const currentStatus = statusRef.current;
        if (currentStatus === 'PLAYING' || currentStatus === 'TITLE_MENU') {
          eng.time += dt;
        }

        if (currentStatus === 'TITLE_MENU' && eng.activeCake?.phase === 'SWINGING') {
          eng.pendulumPhase += dt * 1.65;
          const angle = PENDULUM_MAX_ANGLE * 0.7 * Math.sin(eng.pendulumPhase);
          const centerX = PENDULUM_PIVOT_X + Math.sin(angle) * PENDULUM_ROPE_LENGTH;
          const topY = effectiveCamY + PENDULUM_PIVOT_Y + Math.cos(angle) * PENDULUM_ROPE_LENGTH;
          eng.activeCake.x = centerX - eng.activeCake.width / 2;
          eng.activeCake.y = topY;
          eng.activeCake.tiltAngle = angle * 0.25;
        }

        if (currentStatus === 'PLAYING') {
          eng.cameraY += (eng.targetCameraY - eng.cameraY) * Math.min(1, dt * 6.5);
          const playingCamY = eng.cameraY - heightOffset;

          const cake = eng.activeCake;
          if (cake) {
            if (cake.phase === 'SWINGING') {
              const speed = getAngularSpeedForFloor(eng.stack.length);
              eng.pendulumPhase += dt * speed;
              const angle = PENDULUM_MAX_ANGLE * Math.sin(eng.pendulumPhase);
              const centerX = PENDULUM_PIVOT_X + Math.sin(angle) * PENDULUM_ROPE_LENGTH;
              const topY = playingCamY + PENDULUM_PIVOT_Y + Math.cos(angle) * PENDULUM_ROPE_LENGTH;
              cake.x = centerX - cake.width / 2;
              cake.y = topY;
              cake.tiltAngle = Math.cos(eng.pendulumPhase) * 0.16;
            } else if (cake.phase === 'FALLING') {
              cake.vy += GRAVITY * dt;
              cake.y += cake.vy * dt;

              const targetY =
                eng.stack.length === 0
                  ? GROUND_Y - CAKE_HEIGHT
                  : eng.stack[eng.stack.length - 1].y - CAKE_HEIGHT;

              if (cake.y >= targetY) {
                cake.y = targetY;
                handleLanding(cake);
              }
            } else if (cake.phase === 'MISSING') {
              cake.vy += GRAVITY * dt;
              cake.x += cake.vx * dt;
              cake.y += cake.vy * dt;
              cake.rotation += cake.vRotation * dt;

              eng.missTimer -= dt;
              if (eng.missTimer <= 0) {
                eng.activeCake = null;
                onGameOver({
                  score: eng.score,
                  floors: eng.stack.length,
                  maxCombo: eng.maxCombo,
                  perfectCount: eng.perfectCount,
                  finalWidth: Math.round(eng.currentWidth),
                  isNewBest: eng.score > 0 && eng.score > bestScoreRef.current,
                });
              }
            }
          }

          for (const layer of eng.stack) {
            if (layer.squish > 0) {
              layer.squish = Math.max(0, layer.squish - dt * 5.2);
            }
            if (layer.faceOverrideTimer > 0) {
              layer.faceOverrideTimer = Math.max(0, layer.faceOverrideTimer - dt);
            }
          }

          for (let i = eng.debris.length - 1; i >= 0; i--) {
            const d = eng.debris[i];
            d.vy += DEBRIS_GRAVITY * dt;
            d.x += d.vx * dt;
            d.y += d.vy * dt;
            d.rotation += d.vRotation * dt;
            d.alpha = Math.max(0, d.alpha - dt * 0.75);
            if (d.y - playingCamY > logicalHeight + 140 || d.alpha <= 0) {
              eng.debris.splice(i, 1);
            }
          }

          for (let i = eng.particles.length - 1; i >= 0; i--) {
            const p = eng.particles[i];
            p.vy += 420 * dt;
            p.vx *= 1 - dt * 1.4;
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.rotation += p.vRotation * dt;
            p.life -= dt;
            if (p.life <= 0) {
              eng.particles.splice(i, 1);
            }
          }

          for (let i = eng.rings.length - 1; i >= 0; i--) {
            const r = eng.rings[i];
            r.life -= dt;
            const progress = 1 - r.life / r.maxLife;
            r.radius = 12 + (r.maxRadius - 12) * (1 - Math.pow(1 - progress, 2));
            if (r.life <= 0) {
              eng.rings.splice(i, 1);
            }
          }

          for (let i = eng.texts.length - 1; i >= 0; i--) {
            const ft = eng.texts[i];
            ft.y -= 42 * dt;
            ft.life -= dt;
            if (ft.life <= 0) {
              eng.texts.splice(i, 1);
            }
          }

          if (eng.shakeTimer > 0) {
            eng.shakeTimer = Math.max(0, eng.shakeTimer - dt);
          }
        }

        // Render frame
        const renderCamY = eng.cameraY - heightOffset;
        ctx.save();
        if (eng.shakeTimer > 0) {
          const sx = (Math.random() - 0.5) * eng.shakeMagnitude * 2;
          const sy = (Math.random() - 0.5) * eng.shakeMagnitude * 2;
          ctx.translate(sx, sy);
        }

        drawBackdrop(ctx, eng.cameraY, eng.time, logicalHeight);
        drawGround(ctx, renderCamY, logicalHeight);

        for (const layer of eng.stack) {
          drawStackedLayer(ctx, layer, renderCamY, logicalHeight);
        }

        if (eng.shieldActive) {
          const topLayer = eng.stack[eng.stack.length - 1];
          if (topLayer) {
            drawShieldAura(
              ctx,
              topLayer.x,
              topLayer.y,
              topLayer.width,
              topLayer.height,
              renderCamY,
              eng.time
            );
          } else if (eng.activeCake) {
            drawShieldAura(
              ctx,
              eng.activeCake.x,
              eng.activeCake.y,
              eng.activeCake.width,
              eng.activeCake.height,
              renderCamY,
              eng.time
            );
          }
        }

        for (const d of eng.debris) {
          drawDebris(ctx, d, renderCamY, logicalHeight);
        }

        if (eng.activeCake) {
          drawPendulum(ctx, eng.activeCake, renderCamY);
          drawActiveCake(ctx, eng.activeCake, renderCamY);
        }

        drawEffects(ctx, eng.particles, eng.rings, eng.texts, renderCamY);
        ctx.restore();

        animId = requestAnimationFrame(tick);
      };

      animId = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(animId);
    }, [emitHud, onGameOver, spawnActiveCake]);

    return (
      <canvas
        ref={canvasRef}
        onPointerDown={(e) => {
          if (statusRef.current === 'PLAYING') {
            e.preventDefault();
            dropActiveCake();
          }
        }}
        className="h-full w-full block touch-none select-none cursor-pointer"
        aria-label="蛋糕疊疊樂遊戲畫布，點擊螢幕投放蛋糕"
      />
    );
  }
);

CakeCanvas.displayName = 'CakeCanvas';
