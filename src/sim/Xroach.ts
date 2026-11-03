import { DiffusionGrid } from './DiffusionGrid';
import { soundEngine } from './AudioSynth';

export class Xroach {
  public id: string;
  public x: number;
  public y: number;
  public angle: number;
  public speed: number = 1.6;
  public baseSpeed: number = 1.6;
  public health: number = 75;
  public maxHealth: number = 75;
  public legPhase: number = Math.random() * Math.PI * 2;
  public isScared: boolean = false;
  public carriesSpore: boolean = true;

  constructor(x: number, y: number) {
    this.id = Math.random().toString(36).substring(2, 9);
    this.x = x;
    this.y = y;
    this.angle = Math.random() * Math.PI * 2;
  }

  public update(
    dt: number,
    speedMultiplier: number,
    grid: DiffusionGrid,
    motherX: number,
    motherY: number
  ): boolean {
    const effSpeed = this.speed * speedMultiplier;
    this.legPhase += 0.35 * effSpeed;

    // Flee away from Holy Mother Sanctum
    const dx = this.x - motherX;
    const dy = this.y - motherY;
    const distToMother = Math.hypot(dx, dy);

    if (distToMother < 220) {
      this.isScared = true;
      this.speed = this.baseSpeed * 2.2;
      this.angle = Math.atan2(dy, dx) + (Math.random() - 0.5) * 0.3;
    } else {
      this.isScared = false;
      this.speed = this.baseSpeed;
      // Scavenge: gently attracted to food scent
      const { col, row } = grid.worldToGrid(this.x, this.y);
      if (grid.food[row * grid.cols + col] > 0.1) {
        this.speed = this.baseSpeed * 0.8;
      } else {
        this.angle += (Math.random() - 0.5) * 0.25;
      }
    }

    // Leaks pathogen spores into the diffusion grid
    if (this.carriesSpore && Math.random() < 0.3) {
      grid.addPathogen(this.x, this.y, 0.02 * speedMultiplier, 0);
    }

    // Move
    const nextX = this.x + Math.cos(this.angle) * effSpeed;
    const nextY = this.y + Math.sin(this.angle) * effSpeed;

    if (grid.isWall(nextX, nextY)) {
      this.angle += Math.PI * 0.7 + (Math.random() - 0.5) * 0.5;
    } else {
      this.x = nextX;
      this.y = nextY;
    }

    // Screen bounds bounce
    if (this.x < 12) { this.x = 12; this.angle = Math.PI - this.angle; }
    if (this.x > grid.width - 12) { this.x = grid.width - 12; this.angle = Math.PI - this.angle; }
    if (this.y < 12) { this.y = 12; this.angle = -this.angle; }
    if (this.y > grid.height - 12) { this.y = grid.height - 12; this.angle = -this.angle; }

    return this.health > 0;
  }

  public takeDamage(dmg: number, grid: DiffusionGrid) {
    this.health -= dmg;
    this.speed = this.baseSpeed * 1.8;
    // Release alarm and burst of spores
    grid.addAlarm(this.x, this.y, 0.4);
    grid.addPathogen(this.x, this.y, 0.08, 1);
    soundEngine.playMandibleClick();
  }

  public draw(ctx: CanvasRenderingContext2D, isSelected: boolean = false) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    if (isSelected) {
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, 22, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Long whipping antennae
    ctx.strokeStyle = '#a16207';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(12, -3); ctx.bezierCurveTo(24, -14, 30, -18, 36, -22);
    ctx.moveTo(12, 3); ctx.bezierCurveTo(24, 14, 30, 18, 36, 22);
    ctx.stroke();

    // Spiny Roach Legs (6 fast legs)
    const legPhase = Math.sin(this.legPhase);
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    // Left legs
    ctx.moveTo(4, -5); ctx.lineTo(8, -14 + legPhase * 4); ctx.lineTo(14, -20 + legPhase * 4);
    ctx.moveTo(-2, -5); ctx.lineTo(-4, -16 - legPhase * 4); ctx.lineTo(-8, -22 - legPhase * 4);
    ctx.moveTo(-8, -5); ctx.lineTo(-14, -15 + legPhase * 4); ctx.lineTo(-20, -19 + legPhase * 4);
    // Right legs
    ctx.moveTo(4, 5); ctx.lineTo(8, 14 - legPhase * 4); ctx.lineTo(14, 20 - legPhase * 4);
    ctx.moveTo(-2, 5); ctx.lineTo(-4, 16 + legPhase * 4); ctx.lineTo(-8, 22 + legPhase * 4);
    ctx.moveTo(-8, 5); ctx.lineTo(-14, 15 - legPhase * 4); ctx.lineTo(-20, 19 - legPhase * 4);
    ctx.stroke();

    // Roach Flat Dorsal Pronotum & Elytra (Wings)
    ctx.fillStyle = '#2a1104';
    ctx.strokeStyle = '#713f12';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(0, 0, 17, 8.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Shimmering brown wing cover
    ctx.fillStyle = 'rgba(180, 83, 9, 0.45)';
    ctx.beginPath();
    ctx.ellipse(-2, 0, 14, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Head shield
    ctx.fillStyle = '#1c0a02';
    ctx.beginPath();
    ctx.ellipse(11, 0, 6, 6.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Health bar above roach if damaged
    if (this.health < this.maxHealth) {
      const pct = Math.max(0, this.health / this.maxHealth);
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(-12, -15, 24, 3);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-12, -15, 24 * pct, 3);
    }

    ctx.restore();
  }
}
