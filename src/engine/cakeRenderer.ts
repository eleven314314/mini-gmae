import {
  GROUND_Y,
  LOGICAL_WIDTH,
  PENDULUM_PIVOT_X,
  PENDULUM_PIVOT_Y,
} from '../constants/flavors';
import {
  ActiveCake,
  CakeFlavor,
  FaceExpression,
  FloatingText,
  Particle,
  ShockwaveRing,
  SlicedDebris,
  StackedLayer,
} from '../types/game';

function lerpColor(hexA: string, hexB: string, t: number): string {
  const clamped = Math.max(0, Math.min(1, t));
  const a = parseInt(hexA.slice(1), 16);
  const b = parseInt(hexB.slice(1), 16);
  const ar = (a >> 16) & 255;
  const ag = (a >> 8) & 255;
  const ab = a & 255;
  const br = (b >> 16) & 255;
  const bg = (b >> 8) & 255;
  const bb = b & 255;
  const r = Math.round(ar + (br - ar) * clamped);
  const g = Math.round(ag + (bg - ag) * clamped);
  const bl = Math.round(ab + (bb - ab) * clamped);
  return `rgb(${r}, ${g}, ${bl})`;
}

export function drawBackdrop(
  ctx: CanvasRenderingContext2D,
  cameraY: number,
  time: number,
  logicalHeight: number
) {
  // cameraY grows negative as tower goes up; altitude is positive pixels climbed
  const altitude = Math.max(0, -cameraY);

  let topColor = '#FFF3F6';
  let bottomColor = '#FFFBF7';

  if (altitude < 500) {
    const t = altitude / 500;
    topColor = lerpColor('#FFF3F6', '#EBF6FC', t);
    bottomColor = lerpColor('#FFFBF7', '#FDEFF5', t);
  } else if (altitude < 1300) {
    const t = (altitude - 500) / 800;
    topColor = lerpColor('#EBF6FC', '#EAE4FC', t);
    bottomColor = lerpColor('#FDEFF5', '#F7ECF9', t);
  } else {
    const t = Math.min(1, (altitude - 1300) / 1100);
    topColor = lerpColor('#EAE4FC', '#31254A', t);
    bottomColor = lerpColor('#F7ECF9', '#5A457A', t);
  }

  const grad = ctx.createLinearGradient(0, 0, 0, logicalHeight);
  grad.addColorStop(0, topColor);
  grad.addColorStop(1, bottomColor);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, LOGICAL_WIDTH, logicalHeight);

  // Falling kawaii pastel starlight rain in the background
  const starColors = ['#FBBF24', '#F472B6', '#38BDF8', '#A78BFA', '#F59E0B'];
  const starCount = 28;
  const wrapHeight = logicalHeight + 64;
  ctx.save();
  for (let i = 0; i < starCount; i++) {
    const seedX = ((i * 89 + 23) % (LOGICAL_WIDTH - 24)) + 12;
    const speed = 48 + (i % 5) * 13; // 48..100 px/s downward rain
    const sway = Math.sin(time * 1.3 + i * 1.7) * 9;
    const sx = ((seedX + sway + time * (i % 2 === 0 ? 5 : -4)) % LOGICAL_WIDTH + LOGICAL_WIDTH) % LOGICAL_WIDTH;
    const sy = ((i * 113 + time * speed + altitude * 0.16) % wrapHeight) - 32;

    const twinkle = 0.78 + 0.22 * Math.sin(time * 3.1 + i * 1.9);
    const baseOpacity = altitude > 900 ? 0.94 : 0.82;
    const radius = 5.5 + (i % 4) * 2.1; // 5.5..11.8px clearly visible stars
    const color = starColors[i % starColors.length];

    // Clear soft starlight rain tail
    ctx.globalAlpha = baseOpacity * twinkle * 0.45;
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(1.6, radius * 0.32);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx - (i % 2 === 0 ? 2.5 : -2), sy - (16 + (i % 3) * 8));
    ctx.stroke();

    // Bright star body with soft white outline for crisp contrast
    ctx.globalAlpha = baseOpacity * twinkle;
    ctx.fillStyle = color;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = 1.2;
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(time * (i % 2 === 0 ? 0.9 : -0.8) + i);
    drawStarShape(ctx, 0, 0, i % 3 === 0 ? 5 : 4, radius, radius * 0.48);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();

  // Soft parallax clouds
  ctx.save();
  const cloudOpacity = Math.max(0.18, 0.85 - Math.max(0, altitude - 1100) / 1000);
  ctx.globalAlpha = cloudOpacity;
  const clouds = [
    { baseX: 68, baseY: 165, scale: 0.9, speed: 6 },
    { baseX: 295, baseY: 255, scale: 1.05, speed: -4.5 },
    { baseX: 155, baseY: 380, scale: 0.75, speed: 3.5 },
  ];

  for (const c of clouds) {
    const cx = ((c.baseX + time * c.speed) % (LOGICAL_WIDTH + 120) + LOGICAL_WIDTH + 120) % (LOGICAL_WIDTH + 120) - 60;
    const cy = ((c.baseY + altitude * 0.22) % (logicalHeight + 80)) - 30;
    drawCloud(ctx, cx, cy, c.scale);
  }
  ctx.restore();
}

function drawCloud(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.78)';
  ctx.beginPath();
  ctx.arc(0, 0, 18, 0, Math.PI * 2);
  ctx.arc(18, -4, 22, 0, Math.PI * 2);
  ctx.arc(38, 2, 16, 0, Math.PI * 2);
  ctx.arc(-16, 4, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawGround(
  ctx: CanvasRenderingContext2D,
  cameraY: number,
  logicalHeight: number
) {
  const screenGroundY = GROUND_Y - cameraY;
  if (screenGroundY > logicalHeight + 60) return;

  ctx.save();

  // Pastel bakery tablecloth surface
  ctx.fillStyle = '#FFEAF0';
  ctx.fillRect(0, screenGroundY, LOGICAL_WIDTH, logicalHeight - screenGroundY + 120);

  // Subtle vertical pastel stripes on tablecloth
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  for (let x = 0; x < LOGICAL_WIDTH; x += 28) {
    ctx.fillRect(x, screenGroundY, 14, logicalHeight - screenGroundY + 120);
  }

  // Table top trim line
  ctx.fillStyle = '#F7CAD8';
  ctx.fillRect(0, screenGroundY, LOGICAL_WIDTH, 4);

  // Ceramic cake stand / lace doily guide centered on table
  const plateW = 248;
  const plateX = (LOGICAL_WIDTH - plateW) / 2;
  ctx.fillStyle = '#FFFFFF';
  ctx.strokeStyle = '#E8C5D0';
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.roundRect(plateX, screenGroundY - 6, plateW, 12, 6);
  ctx.fill();
  ctx.stroke();

  // Pedestal base under plate
  ctx.fillStyle = '#FCE1EA';
  ctx.beginPath();
  ctx.moveTo(LOGICAL_WIDTH / 2 - 28, screenGroundY + 6);
  ctx.lineTo(LOGICAL_WIDTH / 2 + 28, screenGroundY + 6);
  ctx.lineTo(LOGICAL_WIDTH / 2 + 44, screenGroundY + 34);
  ctx.lineTo(LOGICAL_WIDTH / 2 - 44, screenGroundY + 34);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

export function drawPendulum(
  ctx: CanvasRenderingContext2D,
  cake: ActiveCake,
  cameraY: number
) {
  if (cake.phase !== 'SWINGING') return;

  const attachX = cake.x + cake.width / 2;
  const attachY = cake.y - cameraY;

  ctx.save();

  // Satin ribbon rope
  ctx.strokeStyle = '#F4729E';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(PENDULUM_PIVOT_X, PENDULUM_PIVOT_Y);
  ctx.lineTo(attachX, attachY);
  ctx.stroke();

  // Inner cream ribbon highlight
  ctx.strokeStyle = '#FFE4EE';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PENDULUM_PIVOT_X, PENDULUM_PIVOT_Y);
  ctx.lineTo(attachX, attachY);
  ctx.stroke();

  // Cute bow clasp at attachment point
  ctx.translate(attachX, attachY);
  ctx.rotate(cake.tiltAngle * 0.5);

  ctx.fillStyle = '#F43F7E';
  ctx.beginPath();
  ctx.ellipse(-6, -3, 6, 3.8, -0.35, 0, Math.PI * 2);
  ctx.ellipse(6, -3, 6, 3.8, 0.35, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#FBBF24';
  ctx.beginPath();
  ctx.arc(0, -3, 3.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

export function drawStackedLayer(
  ctx: CanvasRenderingContext2D,
  layer: StackedLayer,
  cameraY: number,
  logicalHeight: number
) {
  const screenY = layer.y - cameraY;
  if (screenY > logicalHeight + 80 || screenY + layer.height < -80) return;

  const squishAmount = Math.sin(layer.squish * Math.PI) * 0.15;
  const scaleX = 1 + squishAmount * 0.85;
  const scaleY = 1 - squishAmount;

  drawCakeBody(ctx, {
    x: layer.x,
    y: screenY,
    width: layer.width,
    height: layer.height,
    flavor: layer.flavor,
    expression: layer.faceOverrideTimer > 0 && layer.faceOverride ? layer.faceOverride : layer.flavor.expression,
    scaleX,
    scaleY,
    rotation: 0,
    alpha: 1,
    anchorBottom: true,
  });
}

export function drawActiveCake(
  ctx: CanvasRenderingContext2D,
  cake: ActiveCake,
  cameraY: number
) {
  const screenY = cake.y - cameraY;
  drawCakeBody(ctx, {
    x: cake.x,
    y: screenY,
    width: cake.width,
    height: cake.height,
    flavor: cake.flavor,
    expression: cake.phase === 'MISSING' ? 'surprised' : cake.flavor.expression,
    scaleX: 1,
    scaleY: 1,
    rotation: cake.phase === 'SWINGING' ? cake.tiltAngle * 0.45 : cake.rotation,
    alpha: 1,
    anchorBottom: false,
  });
}

export function drawDebris(
  ctx: CanvasRenderingContext2D,
  debris: SlicedDebris,
  cameraY: number,
  logicalHeight: number
) {
  const screenY = debris.y - cameraY;
  if (screenY > logicalHeight + 120) return;
  drawCakeBody(ctx, {
    x: debris.x,
    y: screenY,
    width: debris.width,
    height: debris.height,
    flavor: debris.flavor,
    expression: 'surprised',
    scaleX: 1,
    scaleY: 1,
    rotation: debris.rotation,
    alpha: debris.alpha,
    anchorBottom: false,
    hideFace: true,
  });
}

interface DrawCakeOptions {
  x: number;
  y: number;
  width: number;
  height: number;
  flavor: CakeFlavor;
  expression: FaceExpression;
  scaleX: number;
  scaleY: number;
  rotation: number;
  alpha: number;
  anchorBottom: boolean;
  hideFace?: boolean;
}

function drawCakeBody(ctx: CanvasRenderingContext2D, opts: DrawCakeOptions) {
  const { x, y, width, height, flavor, expression, scaleX, scaleY, rotation, alpha, anchorBottom, hideFace } = opts;
  if (width <= 0.5) return;

  ctx.save();
  ctx.globalAlpha = alpha;

  const pivotX = x + width / 2;
  const pivotY = anchorBottom ? y + height : y + height / 2;
  ctx.translate(pivotX, pivotY);
  if (rotation !== 0) ctx.rotate(rotation);
  if (scaleX !== 1 || scaleY !== 1) ctx.scale(scaleX, scaleY);

  const localX = -width / 2;
  const localY = anchorBottom ? -height : -height / 2;
  const radius = Math.min(9, width / 2.2);

  // Main sponge body
  ctx.fillStyle = flavor.spongeColor;
  ctx.beginPath();
  ctx.roundRect(localX, localY + 4, width, height - 4, radius);
  ctx.fill();

  // Subtle sponge shading at bottom
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(localX, localY + 4, width, height - 4, radius);
  ctx.clip();
  ctx.fillStyle = flavor.spongeShade;
  ctx.fillRect(localX, localY + height - 8, width, 9);

  // Cream filling stripe across middle
  ctx.fillStyle = 'rgba(255, 255, 255, 0.52)';
  ctx.fillRect(localX, localY + height * 0.54, width, 4);
  ctx.restore();

  // Soft cocoa outline for sponge
  ctx.strokeStyle = '#6B4C54';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.roundRect(localX, localY + 4, width, height - 4, radius);
  ctx.stroke();

  // Scalloped frosting cap along top
  drawFrostingCap(ctx, localX, localY, width, flavor);

  // Cute toppings if wide enough
  if (width >= 32) {
    drawToppings(ctx, localX, localY, width, flavor);
  }

  // Kawaii face centered on sponge if wide enough
  if (!hideFace && width >= 36) {
    drawKawaiiFace(ctx, 0, localY + height * 0.62, width, expression, flavor.cheekColor);
  }

  ctx.restore();
}

function drawFrostingCap(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  flavor: CakeFlavor
) {
  const capRadius = Math.min(8, width / 2.2);
  const dripDepth = 6.5;
  const scallopCount = Math.max(2, Math.round(width / 18));
  const step = width / scallopCount;

  ctx.save();
  ctx.fillStyle = flavor.frostingColor;
  ctx.strokeStyle = '#6B4C54';
  ctx.lineWidth = 1.5;
  ctx.lineJoin = 'round';

  ctx.beginPath();
  ctx.moveTo(x + capRadius, y);
  ctx.lineTo(x + width - capRadius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + capRadius);
  ctx.lineTo(x + width, y + 12);

  // Scalloped cream waves right-to-left
  for (let i = scallopCount - 1; i >= 0; i--) {
    const startX = x + (i + 1) * step;
    const endX = x + i * step;
    const midX = (startX + endX) / 2;
    const dip = i % 2 === 0 ? dripDepth + 2 : dripDepth - 1;
    ctx.quadraticCurveTo(midX, y + 12 + dip, endX, y + 12);
  }

  ctx.lineTo(x, y + capRadius);
  ctx.quadraticCurveTo(x, y, x + capRadius, y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Gloss highlight strip
  if (width > 24) {
    ctx.fillStyle = flavor.frostingHighlight;
    ctx.beginPath();
    ctx.roundRect(x + 7, y + 3, Math.max(6, width - 14), 3, 1.5);
    ctx.fill();
  }

  ctx.restore();
}

function drawToppings(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  flavor: CakeFlavor
) {
  ctx.save();
  if (flavor.topping === 'strawberry') {
    const count = width >= 110 ? 2 : 1;
    const positions = count === 2 ? [-width * 0.25, width * 0.25] : [0];
    for (const px of positions) {
      // Tiny leaf
      ctx.fillStyle = '#4ADE80';
      ctx.beginPath();
      ctx.ellipse(px - 2.5, y - 5, 3.5, 1.8, -0.4, 0, Math.PI * 2);
      ctx.ellipse(px + 2.5, y - 5, 3.5, 1.8, 0.4, 0, Math.PI * 2);
      ctx.fill();
      // Strawberry
      ctx.fillStyle = '#FB3B6E';
      ctx.strokeStyle = '#6B4C54';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(px, y - 1, 5.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // Highlight dot
      ctx.fillStyle = '#FFE4EE';
      ctx.beginPath();
      ctx.arc(px - 1.5, y - 2.4, 1.3, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (flavor.topping === 'blueberry') {
    const count = width >= 90 ? 3 : 1;
    for (let i = 0; i < count; i++) {
      const px = count === 1 ? 0 : (i - 1) * (width * 0.24);
      ctx.fillStyle = '#5B8DEF';
      ctx.strokeStyle = '#4A353B';
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.arc(px, y - 1, 4.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#DBEAFE';
      ctx.beginPath();
      ctx.arc(px - 1.2, y - 2.2, 1.1, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (flavor.topping === 'matcha_leaf') {
    ctx.fillStyle = '#4D9B56';
    ctx.strokeStyle = '#386641';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.ellipse(-4, y - 2, 5, 2.8, -0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(4, y - 2.5, 4.5, 2.5, 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else if (flavor.topping === 'caramel_pearl') {
    const spots = Math.max(2, Math.floor(width / 34));
    for (let i = 0; i < spots; i++) {
      const px = x + 14 + (i + 0.5) * ((width - 28) / spots);
      ctx.fillStyle = '#F59E0B';
      ctx.beginPath();
      ctx.arc(px, y + 6.5, 2.4, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (flavor.topping === 'stars') {
    ctx.fillStyle = '#FBBF24';
    ctx.strokeStyle = '#92400E';
    ctx.lineWidth = 0.8;
    drawStarShape(ctx, 0, y + 6, 5, 4.5, 2.1);
    ctx.fill();
    ctx.stroke();
  } else {
    // Colorful sugar sprinkles on frosting
    const sprinkleColors = ['#F43F7E', '#38BDF8', '#FBBF24', '#4ADE80', '#A78BFA'];
    const count = Math.max(2, Math.floor(width / 22));
    for (let i = 0; i < count; i++) {
      const px = x + 12 + (i + 0.5) * ((width - 24) / count);
      const py = y + (i % 2 === 0 ? 5.5 : 8);
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate((i * 0.9) % Math.PI);
      ctx.fillStyle = sprinkleColors[i % sprinkleColors.length];
      ctx.beginPath();
      ctx.roundRect(-2.6, -1.1, 5.2, 2.2, 1.1);
      ctx.fill();
      ctx.restore();
    }
  }
  ctx.restore();
}

function drawKawaiiFace(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  width: number,
  expression: FaceExpression,
  cheekColor: string
) {
  ctx.save();
  const eyeSpread = Math.min(18, Math.max(8, width * 0.14));

  // Rosy cheeks
  ctx.fillStyle = cheekColor;
  ctx.globalAlpha = 0.72;
  ctx.beginPath();
  ctx.ellipse(cx - eyeSpread - 4, cy + 3.2, 4.2, 2.4, 0, 0, Math.PI * 2);
  ctx.ellipse(cx + eyeSpread + 4, cy + 3.2, 4.2, 2.4, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalAlpha = 1;
  ctx.strokeStyle = '#4A353B';
  ctx.fillStyle = '#4A353B';
  ctx.lineWidth = 1.7;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (expression === 'happy') {
    // Shiny round eyes
    ctx.beginPath();
    ctx.arc(cx - eyeSpread, cy, 2.4, 0, Math.PI * 2);
    ctx.arc(cx + eyeSpread, cy, 2.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(cx - eyeSpread - 0.7, cy - 0.8, 0.85, 0, Math.PI * 2);
    ctx.arc(cx + eyeSpread - 0.7, cy - 0.8, 0.85, 0, Math.PI * 2);
    ctx.fill();

    // Small smile
    ctx.beginPath();
    ctx.arc(cx, cy + 1.5, 3.2, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
  } else if (expression === 'uwu') {
    // Arched ^ ^ eyes
    ctx.beginPath();
    ctx.arc(cx - eyeSpread, cy + 1, 3, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx + eyeSpread, cy + 1, 3, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();

    // Cat-like ω mouth
    ctx.beginPath();
    ctx.arc(cx - 2.3, cy + 2, 2.3, 0, Math.PI);
    ctx.arc(cx + 2.3, cy + 2, 2.3, 0, Math.PI);
    ctx.stroke();
  } else if (expression === 'wink') {
    // Left eye dot
    ctx.beginPath();
    ctx.arc(cx - eyeSpread, cy, 2.3, 0, Math.PI * 2);
    ctx.fill();

    // Right eye wink >
    ctx.beginPath();
    ctx.moveTo(cx + eyeSpread + 2.5, cy - 2);
    ctx.lineTo(cx + eyeSpread - 2, cy);
    ctx.lineTo(cx + eyeSpread + 2.5, cy + 2);
    ctx.stroke();

    // Smile
    ctx.beginPath();
    ctx.arc(cx, cy + 1.5, 3.2, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
  } else if (expression === 'bliss') {
    // Gentle closed ◡ ◡ eyes
    ctx.beginPath();
    ctx.arc(cx - eyeSpread, cy - 0.5, 2.8, 0.1 * Math.PI, 0.9 * Math.PI);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx + eyeSpread, cy - 0.5, 2.8, 0.1 * Math.PI, 0.9 * Math.PI);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy + 1.5, 2.8, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
  } else if (expression === 'surprised') {
    // Tiny cute 'o' eyes and 'o' mouth
    ctx.beginPath();
    ctx.arc(cx - eyeSpread, cy, 2.5, 0, Math.PI * 2);
    ctx.arc(cx + eyeSpread, cy, 2.5, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(cx, cy + 3, 2.4, 3, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
}

export function drawShieldAura(
  ctx: CanvasRenderingContext2D,
  targetX: number,
  targetY: number,
  targetWidth: number,
  targetHeight: number,
  cameraY: number,
  time: number
) {
  const screenY = targetY - cameraY;
  const cx = targetX + targetWidth / 2;
  const cy = screenY + targetHeight / 2;
  const pulse = 1 + Math.sin(time * 4.5) * 0.04;
  const rx = (targetWidth / 2 + 16) * pulse;
  const ry = (targetHeight / 2 + 14) * pulse;

  ctx.save();
  const grad = ctx.createRadialGradient(cx, cy, Math.min(rx, ry) * 0.3, cx, cy, Math.max(rx, ry));
  grad.addColorStop(0, 'rgba(56, 189, 248, 0.06)');
  grad.addColorStop(0.75, 'rgba(56, 189, 248, 0.18)');
  grad.addColorStop(1, 'rgba(125, 211, 252, 0.42)');

  ctx.fillStyle = grad;
  ctx.strokeStyle = 'rgba(14, 165, 233, 0.72)';
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 4]);
  ctx.lineDashOffset = -time * 18;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

export function drawEffects(
  ctx: CanvasRenderingContext2D,
  particles: Particle[],
  rings: ShockwaveRing[],
  texts: FloatingText[],
  cameraY: number
) {
  // Shockwave rings
  for (const ring of rings) {
    const progress = 1 - ring.life / ring.maxLife;
    const screenY = ring.y - cameraY;
    ctx.save();
    ctx.globalAlpha = Math.max(0, (1 - progress) * 0.75);
    ctx.strokeStyle = ring.color;
    ctx.lineWidth = 3 * (1 - progress) + 1;
    ctx.beginPath();
    ctx.ellipse(
      ring.x,
      screenY,
      ring.radius,
      ring.radius * 0.42,
      0,
      0,
      Math.PI * 2
    );
    ctx.stroke();
    ctx.restore();
  }

  // Particles
  for (const p of particles) {
    const alpha = Math.max(0, Math.min(1, p.life / (p.maxLife * 0.55)));
    const screenY = p.y - cameraY;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(p.x, screenY);
    ctx.rotate(p.rotation);
    ctx.fillStyle = p.color;

    if (p.shape === 'star') {
      drawStarShape(ctx, 0, 0, 4, p.size, p.size * 0.44);
      ctx.fill();
    } else if (p.shape === 'heart') {
      drawHeartShape(ctx, 0, 0, p.size * 0.9);
      ctx.fill();
    } else if (p.shape === 'sprinkle') {
      ctx.beginPath();
      ctx.roundRect(-p.size, -p.size * 0.36, p.size * 2, p.size * 0.72, p.size * 0.36);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, p.size * 0.65, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // Floating combo & score callouts
  for (const ft of texts) {
    const progress = 1 - ft.life / ft.maxLife;
    const alpha = progress < 0.2 ? progress / 0.2 : Math.max(0, 1 - (progress - 0.2) / 0.8);
    const screenY = ft.y - cameraY;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.textAlign = 'center';
    ctx.font = '700 18px "Fredoka", "Noto Sans TC", sans-serif';

    ctx.lineWidth = 4;
    ctx.strokeStyle = '#FFFFFF';
    ctx.strokeText(ft.text, ft.x, screenY);
    ctx.fillStyle = ft.color;
    ctx.fillText(ft.text, ft.x, screenY);

    if (ft.subtext) {
      ctx.font = '700 13px "Fredoka", "Noto Sans TC", sans-serif';
      ctx.lineWidth = 3;
      ctx.strokeText(ft.subtext, ft.x, screenY + 18);
      ctx.fillStyle = '#4A353B';
      ctx.fillText(ft.subtext, ft.x, screenY + 18);
    }
    ctx.restore();
  }
}

function drawStarShape(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  points: number,
  outerRadius: number,
  innerRadius: number
) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outerRadius : innerRadius;
    const angle = (i * Math.PI) / points - Math.PI / 2;
    const px = cx + Math.cos(angle) * r;
    const py = cy + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

function drawHeartShape(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number) {
  ctx.beginPath();
  const topCurveHeight = size * 0.3;
  ctx.moveTo(cx, cy + topCurveHeight);
  ctx.bezierCurveTo(cx, cy, cx - size, cy, cx - size, cy + topCurveHeight);
  ctx.bezierCurveTo(cx - size, cy + (size + topCurveHeight) / 1.5, cx, cy + size * 1.15, cx, cy + size * 1.35);
  ctx.bezierCurveTo(cx, cy + size * 1.15, cx + size, cy + (size + topCurveHeight) / 1.5, cx + size, cy + topCurveHeight);
  ctx.bezierCurveTo(cx + size, cy, cx, cy, cx, cy + topCurveHeight);
  ctx.closePath();
}
