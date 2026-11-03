import { CasteType, QueenEdict } from './types';
import { soundEngine } from './AudioSynth';

export class MotherQueen {
  public x: number;
  public y: number;
  public radius: number = 38;
  public pulse: number = 0;
  public haloAngle: number = 0;
  public edict: QueenEdict = 'HARMONY';

  // Parthenogenesis biological state
  public eggProgress: number = 0;
  public eggCycleDuration: number = 7.0; // Seconds per egg
  public maternalIchor: number = 65; // 0 to 100 royal energy
  public maxIchor: number = 100;
  public totalEggsLaid: number = 0;
  public peristalticPhase: number = 0;

  // Selected lineage distribution for parthenogenesis
  public targetCasteWeights: Record<CasteType, number> = {
    WORKER: 0.55,
    SOLDIER: 0.20,
    ACOLYTE: 0.15,
    SCOUT: 0.10,
  };

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  public update(dt: number, speedMultiplier: number): { laidEgg: boolean; caste?: CasteType } {
    this.pulse += 0.04 * speedMultiplier;
    this.haloAngle += 0.015 * speedMultiplier;
    this.peristalticPhase += 0.06 * speedMultiplier;

    // Passive ichor generation & consumption
    this.maternalIchor = Math.min(this.maxIchor, this.maternalIchor + 0.02 * dt * speedMultiplier);

    // Progress asexual parthenogenesis
    const cycleRate = (dt * speedMultiplier) / Math.max(1.0, this.eggCycleDuration);
    this.eggProgress += cycleRate;

    if (this.eggProgress >= 1.0) {
      this.eggProgress = 0;
      this.totalEggsLaid++;
      soundEngine.playEggLay();

      // Pick caste based on weights
      const caste = this.pickNextCaste();
      return { laidEgg: true, caste };
    }

    return { laidEgg: false };
  }

  public pickNextCaste(): CasteType {
    const r = Math.random();
    let acc = 0;
    for (const [caste, weight] of Object.entries(this.targetCasteWeights) as [CasteType, number][]) {
      acc += weight;
      if (r <= acc) return caste;
    }
    return 'WORKER';
  }

  public feedIchor(amount: number) {
    this.maternalIchor = Math.min(this.maxIchor, this.maternalIchor + amount);
    // Faster egg maturation when fed
    this.eggProgress += amount * 0.005;
  }

  public forceLayEgg(): CasteType {
    this.eggProgress = 0;
    this.totalEggsLaid++;
    this.maternalIchor = Math.max(0, this.maternalIchor - 8);
    soundEngine.playEggLay();
    return this.pickNextCaste();
  }

  public setEdict(newEdict: QueenEdict) {
    this.edict = newEdict;
    soundEngine.playHolyPulse();
  }

  public draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.x, this.y);

    // 1. Divine Matriarch Pheromone Aura (Radial Glow)
    const auraRad = this.radius + 35 + Math.sin(this.pulse) * 6;
    const auraGrad = ctx.createRadialGradient(0, 0, 10, 0, 0, auraRad);
    auraGrad.addColorStop(0, 'rgba(255, 215, 0, 0.45)');
    auraGrad.addColorStop(0.4, 'rgba(218, 165, 32, 0.2)');
    auraGrad.addColorStop(0.8, 'rgba(147, 51, 234, 0.08)');
    auraGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.arc(0, 0, auraRad, 0, Math.PI * 2);
    ctx.fill();

    // 2. Halo of Sacred Pheromone Droplets
    ctx.save();
    ctx.rotate(this.haloAngle);
    const dropletCount = 8;
    for (let i = 0; i < dropletCount; i++) {
      const angle = (i / dropletCount) * Math.PI * 2;
      const dX = Math.cos(angle) * (this.radius + 22);
      const dY = Math.sin(angle) * (this.radius + 22);
      ctx.fillStyle = '#ffd700';
      ctx.shadowColor = '#ffd700';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(dX, dY, 2.5 + Math.sin(this.pulse + i) * 1, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // 3. Massive Physogastric Abdomen (Asexual Virgin Brood Organ)
    // Peristaltic undulating segmented body
    const abdLength = 48 + Math.sin(this.pulse) * 3;
    const abdWidth = 32 + (this.eggProgress * 8); // Swells as egg develops!

    // Abdomen underglow
    const abdGrad = ctx.createRadialGradient(-20, 0, 5, -20, 0, abdWidth);
    abdGrad.addColorStop(0, '#ffd966');
    abdGrad.addColorStop(0.5, '#5c3a00');
    abdGrad.addColorStop(0.9, '#1f1300');
    ctx.fillStyle = abdGrad;
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 2;
    ctx.shadowColor = 'rgba(255, 215, 0, 0.5)';
    ctx.shadowBlur = 12;

    ctx.beginPath();
    ctx.ellipse(-22, 0, abdLength * 0.6, abdWidth * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Sclerite Rings on Abdomen (Showing expansion during parthenogenesis)
    ctx.strokeStyle = 'rgba(255, 223, 100, 0.4)';
    ctx.lineWidth = 1.5;
    for (let seg = -38; seg <= -8; seg += 9) {
      const segW = Math.cos(((seg + 22) / 30) * Math.PI * 0.5) * (abdWidth * 0.5);
      if (segW > 0) {
        ctx.beginPath();
        ctx.ellipse(seg, 0, 3, Math.max(2, segW), 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // Glowing Embryonic Blastoderm inside the oviduct
    if (this.eggProgress > 0.2) {
      const eggAlpha = Math.min(1.0, (this.eggProgress - 0.2) / 0.8);
      ctx.fillStyle = `rgba(255, 250, 210, ${eggAlpha})`;
      ctx.shadowColor = '#ffd700';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.ellipse(-38 + this.eggProgress * 12, 0, 7 * this.eggProgress, 5 * this.eggProgress, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // 4. Thorax (Strong Chitinous Middle Section)
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#3a2002';
    ctx.strokeStyle = '#b8860b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(2, 0, 11, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 5. Majestic Royal Head & Mandibles
    ctx.fillStyle = '#542d05';
    ctx.beginPath();
    ctx.ellipse(18, 0, 12, 11, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Royal Compound Eyes (Bioluminescent Gold)
    ctx.fillStyle = '#ffd700';
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(22, -6, 3, 0, Math.PI * 2);
    ctx.arc(22, 6, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Mandibles (Sacred Golden Curved Jaws)
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(27, -4);
    ctx.quadraticCurveTo(36, -3, 34, 1);
    ctx.moveTo(27, 4);
    ctx.quadraticCurveTo(36, 3, 34, -1);
    ctx.stroke();

    // Royal Antennae (Sweeping Graceful Crown)
    const antWave = Math.sin(this.pulse * 1.5) * 0.15;
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#ffd700';
    ctx.beginPath();
    // Left upper antenna
    ctx.moveTo(24, -3);
    ctx.bezierCurveTo(34, -14 + antWave * 5, 42, -22, 50, -26);
    // Right lower antenna
    ctx.moveTo(24, 3);
    ctx.bezierCurveTo(34, 14 - antWave * 5, 42, 22, 50, 26);
    ctx.stroke();

    // Antenna Tips Glowing Nodes
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(50, -26, 2.5, 0, Math.PI * 2);
    ctx.arc(50, 26, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Legs (6 Chitinous Golden Appendages)
    ctx.strokeStyle = '#8c5d1e';
    ctx.lineWidth = 2;
    const legPhase = Math.sin(this.pulse) * 2;
    // Front Legs
    ctx.beginPath();
    ctx.moveTo(10, -9);
    ctx.lineTo(16, -24 + legPhase);
    ctx.lineTo(26, -30 + legPhase);
    ctx.moveTo(10, 9);
    ctx.lineTo(16, 24 - legPhase);
    ctx.lineTo(26, 30 - legPhase);
    // Mid Legs
    ctx.moveTo(0, -10);
    ctx.lineTo(-2, -28 - legPhase);
    ctx.lineTo(6, -36 - legPhase);
    ctx.moveTo(0, 10);
    ctx.lineTo(-2, 28 + legPhase);
    ctx.lineTo(6, 36 + legPhase);
    // Back Legs
    ctx.moveTo(-10, -10);
    ctx.lineTo(-20, -26 + legPhase);
    ctx.lineTo(-26, -34 + legPhase);
    ctx.moveTo(-10, 10);
    ctx.lineTo(-20, 26 - legPhase);
    ctx.lineTo(-26, 34 - legPhase);
    ctx.stroke();

    ctx.restore();
  }
}
