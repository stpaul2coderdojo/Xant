import { CasteType, InfectionStage, QueenEdict } from './types';
import { DiffusionGrid } from './DiffusionGrid';
import { soundEngine } from './AudioSynth';

export class Xant {
  public id: string;
  public name: string;
  public x: number;
  public y: number;
  public angle: number;
  public speed: number;
  public baseSpeed: number;
  public caste: CasteType;
  public infection: InfectionStage = 'HEALTHY';
  public sporeLoad: number = 0; // 0 to 100
  public immunityTimer: number = 0; // Temporary resistance after cleansing
  public hasFood: boolean = false;
  public foodValue: number = 0;
  public health: number = 100;
  public maxHealth: number = 100;
  public legCycle: number = Math.random() * Math.PI * 2;
  public wanderJitter: number = 0.3;

  // Sensor parameters
  public sensorDistance: number = 18;
  public sensorAngle: number = 0.55; // ~31 degrees
  public turnSpeed: number = 0.22;

  // Sensory readings for inspector
  public leftReading: number = 0;
  public rightReading: number = 0;
  public centerReading: number = 0;

  constructor(x: number, y: number, caste: CasteType = 'WORKER') {
    this.id = Math.random().toString(36).substring(2, 9);
    this.name = `Sister X-${Math.floor(100 + Math.random() * 900)}`;
    this.x = x;
    this.y = y;
    this.angle = Math.random() * Math.PI * 2;
    this.caste = caste;

    // Caste-specific tuning
    switch (caste) {
      case 'SOLDIER':
        this.baseSpeed = 2.0;
        this.sensorDistance = 20;
        this.sensorAngle = 0.45;
        this.maxHealth = 160;
        this.turnSpeed = 0.24;
        break;
      case 'SCOUT':
        this.baseSpeed = 2.8;
        this.sensorDistance = 26;
        this.sensorAngle = 0.8;
        this.maxHealth = 85;
        this.turnSpeed = 0.3;
        break;
      case 'ACOLYTE':
        this.baseSpeed = 1.9;
        this.sensorDistance = 16;
        this.sensorAngle = 0.5;
        this.maxHealth = 90;
        this.turnSpeed = 0.2;
        break;
      case 'WORKER':
      default:
        this.baseSpeed = 2.3;
        this.sensorDistance = 18;
        this.sensorAngle = 0.55;
        this.maxHealth = 100;
        this.turnSpeed = 0.22;
        break;
    }
    this.speed = this.baseSpeed;
    this.health = this.maxHealth;
  }

  // Main update loop
  public update(
    dt: number,
    speedMultiplier: number,
    grid: DiffusionGrid,
    motherX: number,
    motherY: number,
    edict: QueenEdict
  ): boolean {
    const effSpeed = this.speed * speedMultiplier;
    this.legCycle += 0.3 * effSpeed;

    // Immunity timer countdown
    if (this.immunityTimer > 0) {
      this.immunityTimer -= dt * speedMultiplier;
    }

    // 1. Pathogenesis progression & Spore dynamics
    const localPathogen = grid.samplePathogen(this.x, this.y);
    if (this.immunityTimer <= 0 && localPathogen > 0.15) {
      this.sporeLoad = Math.min(100, this.sporeLoad + localPathogen * 0.4 * dt * speedMultiplier);
    } else if (localPathogen < 0.05 && this.sporeLoad > 0) {
      // Natural slow recovery if healthy and unexposed
      if (this.infection !== 'CORDYCEPS_ZOMBIE') {
        this.sporeLoad = Math.max(0, this.sporeLoad - 0.05 * dt * speedMultiplier);
      }
    }

    // Update infection stage
    if (this.sporeLoad >= 85) {
      this.infection = 'CORDYCEPS_ZOMBIE';
    } else if (this.sporeLoad >= 50) {
      this.infection = 'PATHOGENIC';
    } else if (this.sporeLoad >= 20) {
      this.infection = 'EXPOSED';
    } else {
      this.infection = 'HEALTHY';
    }

    // Infected xants leak pathogen into diffusion grid!
    if (this.infection === 'CORDYCEPS_ZOMBIE') {
      grid.addPathogen(this.x, this.y, 0.045 * speedMultiplier, 1);
      // Erratic speed bursts & spasms
      this.speed = this.baseSpeed * (0.8 + Math.sin(this.legCycle * 2) * 0.4);
    } else if (this.infection === 'PATHOGENIC') {
      grid.addPathogen(this.x, this.y, 0.015 * speedMultiplier, 0);
    }

    // 2. Behavior based on Edicts & Caste & Infection
    if (this.infection === 'CORDYCEPS_ZOMBIE') {
      // Zombie behavior: guided towards highest ant density / mother to spread spores
      this.navigateZombie(grid, motherX, motherY);
    } else if (edict === 'PRAISE') {
      // Orbit the Holy Mother in devotional spirals
      this.navigatePraise(motherX, motherY);
    } else if (this.caste === 'ACOLYTE') {
      this.navigateAcolyte(grid, motherX, motherY);
    } else if (this.caste === 'SOLDIER' || edict === 'CRUSADE') {
      this.navigateSoldier(grid, motherX, motherY);
    } else {
      // Normal forager / scout chemotactic navigation
      this.navigateChemotaxis(grid, motherX, motherY, edict);
    }

    // 3. Physical movement & Collision with walls
    const nextX = this.x + Math.cos(this.angle) * effSpeed;
    const nextY = this.y + Math.sin(this.angle) * effSpeed;

    if (grid.isWall(nextX, nextY)) {
      // Bounce / deflect off wall
      this.angle += Math.PI * 0.75 + (Math.random() - 0.5) * 0.5;
    } else {
      this.x = nextX;
      this.y = nextY;
    }

    // Wrap around screen boundaries with slight buffer
    if (this.x < 8) this.x = grid.width - 10;
    if (this.x > grid.width - 8) this.x = 10;
    if (this.y < 8) this.y = grid.height - 10;
    if (this.y > grid.height - 8) this.y = 10;

    // 4. Chemical secretions into Diffusion Grid
    if (this.infection !== 'CORDYCEPS_ZOMBIE') {
      if (this.hasFood) {
        // High trail pheromone deposition while homing!
        grid.addTrail(this.x, this.y, 0.12 * speedMultiplier);
      } else {
        // Low exploratory trail
        grid.addTrail(this.x, this.y, 0.012 * speedMultiplier);
      }
    }

    return this.health > 0;
  }

  // Chemotaxis: Antenna sensory sampling and gradient steering
  private navigateChemotaxis(grid: DiffusionGrid, motherX: number, motherY: number, edict: QueenEdict) {
    const d = this.sensorDistance;
    const phi = this.sensorAngle;

    const lx = this.x + Math.cos(this.angle - phi) * d;
    const ly = this.y + Math.sin(this.angle - phi) * d;
    const rx = this.x + Math.cos(this.angle + phi) * d;
    const ry = this.y + Math.sin(this.angle + phi) * d;
    const cx = this.x + Math.cos(this.angle) * d;
    const cy = this.y + Math.sin(this.angle) * d;

    let leftScore = 0;
    let rightScore = 0;
    let centerScore = 0;

    if (this.hasFood) {
      // Carrying nectar -> Attracted to Mother's Holy Aura & Existing Trails
      leftScore = grid.sampleMother(lx, ly) * 3.0 + grid.sampleTrail(lx, ly) * 0.6;
      rightScore = grid.sampleMother(rx, ry) * 3.0 + grid.sampleTrail(rx, ry) * 0.6;
      centerScore = grid.sampleMother(cx, cy) * 3.0 + grid.sampleTrail(cx, cy) * 0.6;

      // Avoid heavy pathogen if healthy
      if (this.infection === 'HEALTHY') {
        leftScore -= grid.samplePathogen(lx, ly) * 1.5;
        rightScore -= grid.samplePathogen(rx, ry) * 1.5;
      }
    } else {
      // Searching for food -> Attracted to Food Scents & Foraging Trails
      const trailWeight = edict === 'GATHER' ? 1.6 : 1.0;
      leftScore = grid.sampleFood(lx, ly) * 4.0 + grid.sampleTrail(lx, ly) * trailWeight;
      rightScore = grid.sampleFood(rx, ry) * 4.0 + grid.sampleTrail(rx, ry) * trailWeight;
      centerScore = grid.sampleFood(cx, cy) * 4.0 + grid.sampleTrail(cx, cy) * trailWeight;

      // Repelled by pathogen clouds
      if (this.infection === 'HEALTHY') {
        leftScore -= grid.samplePathogen(lx, ly) * 2.0;
        rightScore -= grid.samplePathogen(rx, ry) * 2.0;
      }
    }

    this.leftReading = leftScore;
    this.rightReading = rightScore;
    this.centerReading = centerScore;

    // Gradient steering
    if (centerScore > leftScore && centerScore > rightScore) {
      // Continue straight ahead with gentle Brownian jitter
      this.angle += (Math.random() - 0.5) * this.wanderJitter * 0.5;
    } else if (leftScore > rightScore) {
      this.angle -= this.turnSpeed;
    } else if (rightScore > leftScore) {
      this.angle += this.turnSpeed;
    } else {
      // Wandering exploratory jitter
      this.angle += (Math.random() - 0.5) * this.wanderJitter;
    }
  }

  // Soldier: Attracted to alarm and pathogen to hunt intruders
  private navigateSoldier(grid: DiffusionGrid, motherX: number, motherY: number) {
    const d = this.sensorDistance;
    const phi = this.sensorAngle;

    const lx = this.x + Math.cos(this.angle - phi) * d;
    const ly = this.y + Math.sin(this.angle - phi) * d;
    const rx = this.x + Math.cos(this.angle + phi) * d;
    const ry = this.y + Math.sin(this.angle + phi) * d;

    // Soldiers follow alarm & pathogen trails
    const leftScore = grid.sampleAlarm(lx, ly) * 3.0 + grid.samplePathogen(lx, ly) * 1.5;
    const rightScore = grid.sampleAlarm(rx, ry) * 3.0 + grid.samplePathogen(rx, ry) * 1.5;

    this.leftReading = leftScore;
    this.rightReading = rightScore;

    if (leftScore > 0.1 || rightScore > 0.1) {
      if (leftScore > rightScore) this.angle -= this.turnSpeed * 1.3;
      else if (rightScore > leftScore) this.angle += this.turnSpeed * 1.3;
    } else {
      // Patrol around periphery of Mother
      const distMother = Math.hypot(this.x - motherX, this.y - motherY);
      if (distMother > 320) {
        const toMother = Math.atan2(motherY - this.y, motherX - this.x);
        this.angle = toMother + (Math.random() - 0.5) * 0.4;
      } else {
        this.angle += (Math.random() - 0.5) * this.wanderJitter;
      }
    }
  }

  // Acolyte: Guards Holy Mother, cleanses nearby spores
  private navigateAcolyte(grid: DiffusionGrid, motherX: number, motherY: number) {
    const dist = Math.hypot(this.x - motherX, this.y - motherY);
    if (dist > 180) {
      // Head back towards sanctum
      const angleToMother = Math.atan2(motherY - this.y, motherX - this.x);
      this.angle = angleToMother + (Math.random() - 0.5) * 0.4;
    } else {
      // Patrol and cleanse pathogen
      const localP = grid.samplePathogen(this.x, this.y);
      if (localP > 0.2) {
        grid.cleansePathogen(this.x, this.y, 25, 0.4);
      }
      this.angle += (Math.random() - 0.5) * 0.4;
    }
  }

  // Praise Edict: Sacred spiral orbit
  private navigatePraise(motherX: number, motherY: number) {
    const dx = motherX - this.x;
    const dy = motherY - this.y;
    const dist = Math.hypot(dx, dy);
    const angleToMother = Math.atan2(dy, dx);

    // Orbit tangentially with slight inward pull
    const targetOrbit = 120;
    const radialForce = (dist - targetOrbit) * 0.005;
    this.angle = angleToMother + Math.PI * 0.5 + radialForce;
  }

  // Zombie Nav: Attracted towards the Holy Mother or highest trail to contaminate hive
  private navigateZombie(grid: DiffusionGrid, motherX: number, motherY: number) {
    const dx = motherX - this.x;
    const dy = motherY - this.y;
    const toMother = Math.atan2(dy, dx);
    this.angle = toMother + (Math.random() - 0.5) * 0.8;
  }

  // Cleanse treatment
  public cleanse() {
    this.infection = 'HEALTHY';
    this.sporeLoad = 0;
    this.immunityTimer = 12.0; // 12 seconds immunity
    soundEngine.playCleanse();
  }

  // Draw Xant organism
  public draw(ctx: CanvasRenderingContext2D, isSelected: boolean = false) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    const isZombie = this.infection === 'CORDYCEPS_ZOMBIE';
    const isPathogenic = this.infection === 'PATHOGENIC';
    const isExposed = this.infection === 'EXPOSED';

    // Selection ring
    if (isSelected) {
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, 16, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Infection Bio-Aura
    if (isZombie) {
      ctx.shadowColor = '#22c55e';
      ctx.shadowBlur = 12;
    } else if (isPathogenic) {
      ctx.shadowColor = '#4ade80';
      ctx.shadowBlur = 7;
    }

    // 1. Walking Legs (6 articulate segments)
    const legPhase = Math.sin(this.legCycle);
    ctx.strokeStyle = isZombie ? '#166534' : this.caste === 'SOLDIER' ? '#7f1d1d' : '#78350f';
    ctx.lineWidth = 1.2;

    // Left 3 legs
    ctx.beginPath();
    ctx.moveTo(3, -3); ctx.lineTo(6, -9 + legPhase * 3); ctx.lineTo(10, -13 + legPhase * 3);
    ctx.moveTo(-1, -3); ctx.lineTo(-2, -10 - legPhase * 3); ctx.lineTo(-4, -14 - legPhase * 3);
    ctx.moveTo(-5, -3); ctx.lineTo(-9, -9 + legPhase * 3); ctx.lineTo(-13, -12 + legPhase * 3);
    // Right 3 legs
    ctx.moveTo(3, 3); ctx.lineTo(6, 9 - legPhase * 3); ctx.lineTo(10, 13 - legPhase * 3);
    ctx.moveTo(-1, 3); ctx.lineTo(-2, 10 + legPhase * 3); ctx.lineTo(-4, 14 + legPhase * 3);
    ctx.moveTo(-5, 3); ctx.lineTo(-9, 9 - legPhase * 3); ctx.lineTo(-13, 12 - legPhase * 3);
    ctx.stroke();

    // 2. Abdomen (Gaster)
    let abdColor = '#2d1806';
    let abdStroke = '#d4af37';
    if (isZombie) {
      abdColor = '#14532d';
      abdStroke = '#4ade80';
    } else if (isPathogenic) {
      abdColor = '#1e3a1f';
      abdStroke = '#86efac';
    } else if (this.caste === 'SOLDIER') {
      abdColor = '#450a0a';
      abdStroke = '#f87171';
    } else if (this.caste === 'ACOLYTE') {
      abdColor = '#0c4a6e';
      abdStroke = '#38bdf8';
    }

    ctx.fillStyle = abdColor;
    ctx.strokeStyle = abdStroke;
    ctx.lineWidth = 1;

    // Abdomen size
    const abdSize = this.caste === 'SOLDIER' ? 8 : 7;
    ctx.beginPath();
    ctx.ellipse(-7, 0, abdSize, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Nectar drop being carried on abdomen or jaws
    if (this.hasFood) {
      ctx.fillStyle = '#fde047';
      ctx.shadowColor = '#facc15';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(-7, 0, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // 3. Petiole / Thorax
    ctx.fillStyle = isZombie ? '#15803d' : '#451a03';
    ctx.beginPath();
    ctx.ellipse(0, 0, 3.5, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // 4. Head
    const headSize = this.caste === 'SOLDIER' ? 5.5 : 3.8;
    ctx.fillStyle = isZombie ? '#166534' : this.caste === 'SOLDIER' ? '#991b1b' : '#5c2b09';
    ctx.beginPath();
    ctx.ellipse(5, 0, headSize, headSize * 0.85, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Mandibles
    ctx.strokeStyle = this.caste === 'SOLDIER' ? '#fca5a5' : '#ffd700';
    ctx.lineWidth = this.caste === 'SOLDIER' ? 2 : 1;
    ctx.beginPath();
    ctx.moveTo(5 + headSize, -2); ctx.lineTo(5 + headSize + 4, -0.5);
    ctx.moveTo(5 + headSize, 2); ctx.lineTo(5 + headSize + 4, 0.5);
    ctx.stroke();

    // Antennae
    ctx.strokeStyle = isZombie ? '#86efac' : '#ffd700';
    ctx.lineWidth = 1;
    const antReach = this.caste === 'SCOUT' ? 14 : 10;
    ctx.beginPath();
    ctx.moveTo(6, -2); ctx.lineTo(6 + antReach * 0.6, -5); ctx.lineTo(6 + antReach, -8);
    ctx.moveTo(6, 2); ctx.lineTo(6 + antReach * 0.6, 5); ctx.lineTo(6 + antReach, 8);
    ctx.stroke();

    // Fungal Cordyceps Stroma (Sprouting out of head if Zombie!)
    if (isZombie) {
      ctx.strokeStyle = '#4ade80';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(4, 0);
      ctx.quadraticCurveTo(8, -8, 12, -12);
      ctx.stroke();

      // Glowing Spore Club Tip
      ctx.fillStyle = '#bbf7d0';
      ctx.shadowColor = '#22c55e';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(12, -12, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}
