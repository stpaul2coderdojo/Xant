import { CasteType } from './types';

export class Egg {
  public id: string;
  public x: number;
  public y: number;
  public caste: CasteType;
  public progress: number = 0; // 0 to 1
  public hatchTimeSeconds: number;
  public isInfected: boolean = false;
  public pulse: number = Math.random() * Math.PI;

  constructor(x: number, y: number, caste: CasteType = 'WORKER') {
    this.id = Math.random().toString(36).substring(2, 9);
    // Slight jitter around mother's oviduct
    const angle = Math.random() * Math.PI * 2;
    const dist = 30 + Math.random() * 45;
    this.x = x + Math.cos(angle) * dist;
    this.y = y + Math.sin(angle) * dist;
    this.caste = caste;
    this.hatchTimeSeconds = 8 + Math.random() * 5;
  }

  public update(dt: number, speedMultiplier: number, localPathogen: number): boolean {
    this.pulse += 0.05 * speedMultiplier;

    // High pathogen exposure can blight the egg
    if (localPathogen > 1.2 && !this.isInfected) {
      if (Math.random() < 0.04) {
        this.isInfected = true;
      }
    }

    this.progress += (dt * speedMultiplier) / this.hatchTimeSeconds;
    return this.progress >= 1.0;
  }

  public cleanse() {
    this.isInfected = false;
  }

  public nurse(amount: number = 0.05) {
    this.progress += amount;
  }

  public draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.x, this.y);

    const scale = 0.7 + this.progress * 0.4;
    const pulseOffset = Math.sin(this.pulse) * 0.5;

    // Egg glow
    ctx.shadowColor = this.isInfected ? '#22c55e' : '#ffd700';
    ctx.shadowBlur = this.isInfected ? 10 : 8;

    // Translucent chorion shell
    ctx.fillStyle = this.isInfected
      ? 'rgba(74, 222, 128, 0.85)'
      : 'rgba(255, 250, 220, 0.9)';
    ctx.strokeStyle = this.isInfected ? '#15803d' : '#d4af37';
    ctx.lineWidth = 1.2;

    ctx.beginPath();
    ctx.ellipse(0, 0, (5 + pulseOffset) * scale, (8 + pulseOffset) * scale, Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Embryo blastoderm inside
    if (this.progress > 0.3) {
      ctx.fillStyle = this.isInfected ? '#166534' : '#f59e0b';
      ctx.beginPath();
      ctx.ellipse(0, 0, 2.5 * scale, 4 * scale, Math.PI / 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Caste color indicator dot
    let casteColor = '#eab308'; // Worker = Yellow
    if (this.caste === 'SOLDIER') casteColor = '#ef4444'; // Red
    else if (this.caste === 'ACOLYTE') casteColor = '#38bdf8'; // Sky blue
    else if (this.caste === 'SCOUT') casteColor = '#a855f7'; // Purple

    ctx.fillStyle = casteColor;
    ctx.shadowBlur = 4;
    ctx.beginPath();
    ctx.arc(0, -2 * scale, 1.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
