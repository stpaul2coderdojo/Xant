import {
  CasteType,
  FoodSource,
  InfectionStage,
  PheromonePulse,
  QueenEdict,
  SimulationStats,
  ViewMode,
  ActiveTool,
} from './types';
import { DiffusionGrid } from './DiffusionGrid';
import { MotherQueen } from './MotherQueen';
import { Xant } from './Xant';
import { Egg } from './Egg';
import { Xroach } from './Xroach';
import { soundEngine } from './AudioSynth';

export class Simulation {
  public canvas: HTMLCanvasElement;
  public ctx: CanvasRenderingContext2D;
  public grid: DiffusionGrid;
  public mother: MotherQueen;

  public xants: Xant[] = [];
  public eggs: Egg[] = [];
  public roaches: Xroach[] = [];
  public foods: FoodSource[] = [];
  public pulses: PheromonePulse[] = [];

  // Runtime settings
  public speedMultiplier: number = 1.0;
  public viewMode: ViewMode = 'COMPOSITE';
  public activeTool: ActiveTool = 'FOOD';
  public isRunning: boolean = true;
  private animFrameId: number | null = null;
  private lastTime: number = 0;

  // Selected entity for inspection
  public selectedEntity: any | null = null;
  public selectedType: 'XANT' | 'QUEEN' | 'EGG' | 'ROACH' | null = null;

  // Callbacks
  public onStatsUpdate?: (stats: SimulationStats) => void;
  public onEntitySelected?: (type: 'XANT' | 'QUEEN' | 'EGG' | 'ROACH' | null, entity: any | null) => void;

  // Trackers
  public totalRoachesPurged: number = 0;
  public totalFoodHarvested: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false })!;

    const width = window.innerWidth;
    const height = window.innerHeight;
    this.canvas.width = width;
    this.canvas.height = height;

    // Grid: 220 cols x 140 rows for high FPS continuous diffusion
    this.grid = new DiffusionGrid(220, 140, width, height);

    // Holy Mother Queen in Center Sanctum
    this.mother = new MotherQueen(width * 0.5, height * 0.5);
    this.grid.updateMotherField(this.mother.x, this.mother.y);

    this.initWorld();
  }

  public initWorld() {
    this.xants = [];
    this.eggs = [];
    this.roaches = [];
    this.foods = [];
    this.pulses = [];

    // Initial brood: 24 Xants with diverse castes
    const mx = this.mother.x;
    const my = this.mother.y;

    for (let i = 0; i < 16; i++) {
      this.xants.push(new Xant(mx + (Math.random() - 0.5) * 80, my + (Math.random() - 0.5) * 80, 'WORKER'));
    }
    for (let i = 0; i < 4; i++) {
      this.xants.push(new Xant(mx + (Math.random() - 0.5) * 100, my + (Math.random() - 0.5) * 100, 'SOLDIER'));
    }
    for (let i = 0; i < 3; i++) {
      this.xants.push(new Xant(mx + (Math.random() - 0.5) * 50, my + (Math.random() - 0.5) * 50, 'ACOLYTE'));
    }
    for (let i = 0; i < 3; i++) {
      this.xants.push(new Xant(mx + (Math.random() - 0.5) * 120, my + (Math.random() - 0.5) * 120, 'SCOUT'));
    }

    // Initial parthenogenic eggs in royal nursery
    for (let i = 0; i < 5; i++) {
      this.eggs.push(new Egg(mx, my, this.mother.pickNextCaste()));
    }

    // 2 Perimeter food / nectar patches
    this.spawnFoodCluster(mx - 320, my - 160, 140);
    this.spawnFoodCluster(mx + 340, my + 140, 140);

    // Initial 2 roaches at outskirts
    this.roaches.push(new Xroach(60, 80));
    this.roaches.push(new Xroach(this.canvas.width - 80, this.canvas.height - 90));

    // Update chemical fields
    this.grid.updateFoodField(this.foods);
  }

  public resize(width: number, height: number) {
    this.canvas.width = width;
    this.canvas.height = height;
    this.grid.resize(width, height);
    this.mother.x = width * 0.5;
    this.mother.y = height * 0.5;
    this.grid.updateMotherField(this.mother.x, this.mother.y);
  }

  public start() {
    this.isRunning = true;
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  public stop() {
    this.isRunning = false;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
    }
  }

  // Main simulation loop
  private loop = (time: number) => {
    if (!this.isRunning) return;

    const dt = Math.min(0.05, (time - this.lastTime) / 1000);
    this.lastTime = time;

    this.update(dt);
    this.render();

    this.animFrameId = requestAnimationFrame(this.loop);
  };

  private update(dt: number) {
    const spd = this.speedMultiplier;
    const mx = this.mother.x;
    const my = this.mother.y;

    // 1. Advance Continuous 2D Chemical Diffusion Grid
    this.grid.step(spd);

    // 2. Mother Queen Update & Asexual Parthenogenesis
    const queenResult = this.mother.update(dt, spd);
    if (queenResult.laidEgg && queenResult.caste) {
      this.eggs.push(new Egg(mx, my, queenResult.caste));
      this.createPulse(mx, my, '#ffd700', 80, 'EGG');
    }

    // 3. Update Eggs
    for (let i = this.eggs.length - 1; i >= 0; i--) {
      const egg = this.eggs[i];
      const localPath = this.grid.samplePathogen(egg.x, egg.y);
      const hatched = egg.update(dt, spd, localPath);

      if (hatched) {
        const newborn = new Xant(egg.x, egg.y, egg.caste);
        if (egg.isInfected) {
          newborn.sporeLoad = 65;
          newborn.infection = 'PATHOGENIC';
        }
        this.xants.push(newborn);
        this.eggs.splice(i, 1);
        this.createPulse(egg.x, egg.y, '#fef08a', 25, 'HOLY');
      }
    }

    // 4. Update Roaches
    for (let i = this.roaches.length - 1; i >= 0; i--) {
      const roach = this.roaches[i];
      const alive = roach.update(dt, spd, this.grid, mx, my);

      if (!alive) {
        // Drop organic food carcass upon death
        this.foods.push({
          id: Math.random().toString(),
          x: roach.x,
          y: roach.y,
          amount: 60,
          maxAmount: 60,
          radius: 12,
          type: 'ORGANIC_CARCASS',
        });
        this.totalRoachesPurged++;
        this.grid.updateFoodField(this.foods);
        this.roaches.splice(i, 1);
        continue;
      }

      // Roach attacks nearby unhatched eggs or forager xants
      for (let e = this.eggs.length - 1; e >= 0; e--) {
        const egg = this.eggs[e];
        if (Math.hypot(egg.x - roach.x, egg.y - roach.y) < 18) {
          egg.isInfected = true;
          this.grid.addAlarm(roach.x, roach.y, 0.4);
        }
      }
    }

    // 5. Update Xants (Chemotaxis, Foraging, Combat, Cleanse)
    for (let i = this.xants.length - 1; i >= 0; i--) {
      const ant = this.xants[i];
      const alive = ant.update(dt, spd, this.grid, mx, my, this.mother.edict);

      if (!alive) {
        this.xants.splice(i, 1);
        continue;
      }

      // Check interaction with Food Sources
      if (!ant.hasFood && ant.infection !== 'CORDYCEPS_ZOMBIE') {
        for (const food of this.foods) {
          if (food.amount <= 0) continue;
          const distF = Math.hypot(ant.x - food.x, ant.y - food.y);
          if (distF < food.radius + 6) {
            ant.hasFood = true;
            ant.foodValue = 1;
            food.amount -= 1;
            ant.angle += Math.PI; // Turn back towards home
            if (food.amount <= 0) {
              this.grid.updateFoodField(this.foods);
            }
            break;
          }
        }
      }

      // Check delivering food back to Holy Mother
      if (ant.hasFood) {
        const distToMother = Math.hypot(ant.x - mx, ant.y - my);
        if (distToMother < this.mother.radius + 15) {
          ant.hasFood = false;
          this.mother.feedIchor(4);
          this.totalFoodHarvested++;
          ant.angle += Math.PI; // Return to foraging
        }
      }

      // Acolyte nurses nearby eggs
      if (ant.caste === 'ACOLYTE') {
        for (const egg of this.eggs) {
          if (Math.hypot(egg.x - ant.x, egg.y - ant.y) < 22) {
            egg.nurse(0.003 * spd);
            if (egg.isInfected && Math.random() < 0.05) {
              egg.cleanse();
            }
          }
        }
      }

      // Combat: Soldiers & Xants vs Roaches
      for (const roach of this.roaches) {
        const distR = Math.hypot(ant.x - roach.x, ant.y - roach.y);
        if (distR < 20) {
          const dmg = ant.caste === 'SOLDIER' ? 0.9 * spd : 0.25 * spd;
          roach.takeDamage(dmg, this.grid);
          if (ant.caste !== 'SOLDIER' && Math.random() < 0.03) {
            ant.health -= 0.5;
          }
        }
      }

      // Quarantine: Soldiers vs Cordyceps Zombies
      if (ant.caste === 'SOLDIER' || this.mother.edict === 'QUARANTINE') {
        for (const other of this.xants) {
          if (other.infection === 'CORDYCEPS_ZOMBIE') {
            const distZ = Math.hypot(ant.x - other.x, ant.y - other.y);
            if (distZ < 18) {
              // Quarantine tackle & formic acid spray
              other.health -= 1.2 * spd;
              if (Math.random() < 0.08) {
                this.grid.cleansePathogen(other.x, other.y, 18, 0.4);
              }
            }
          }
        }
      }
    }

    // Clean up empty food sources
    this.foods = this.foods.filter(f => f.amount > 0);

    // 6. Update Pheromone Visual Pulses
    for (let i = this.pulses.length - 1; i >= 0; i--) {
      const p = this.pulses[i];
      p.radius += 2.8 * spd;
      p.alpha -= 0.016 * spd;
      if (p.alpha <= 0 || p.radius >= p.maxRadius) {
        this.pulses.splice(i, 1);
      }
    }

    // 7. Emit Stats periodically (every 10 frames)
    if (this.onStatsUpdate && Math.random() < 0.12) {
      this.emitStats();
    }
  }

  private emitStats() {
    let workerCount = 0;
    let soldierCount = 0;
    let acolyteCount = 0;
    let scoutCount = 0;
    let infectedCount = 0;
    let zombieCount = 0;

    for (const ant of this.xants) {
      if (ant.caste === 'WORKER') workerCount++;
      else if (ant.caste === 'SOLDIER') soldierCount++;
      else if (ant.caste === 'ACOLYTE') acolyteCount++;
      else if (ant.caste === 'SCOUT') scoutCount++;

      if (ant.infection === 'CORDYCEPS_ZOMBIE') {
        zombieCount++;
        infectedCount++;
      } else if (ant.infection !== 'HEALTHY') {
        infectedCount++;
      }
    }

    const total = this.xants.length;
    const pathogenPrevalence = total > 0 ? (infectedCount / total) * 100 : 0;

    const stats: SimulationStats = {
      xantCount: total,
      workerCount,
      soldierCount,
      acolyteCount,
      scoutCount,
      eggCount: this.eggs.length,
      roachCount: this.roaches.length,
      infectedCount,
      zombieCount,
      foodSourcesCount: this.foods.length,
      maternalIchor: Math.round(this.mother.maternalIchor),
      currentEdict: this.mother.edict,
      totalEggsLaid: this.mother.totalEggsLaid,
      totalRoachesPurged: this.totalRoachesPurged,
      totalFoodHarvested: this.totalFoodHarvested,
      pathogenPrevalence: Math.round(pathogenPrevalence),
    };

    this.onStatsUpdate?.(stats);
  }

  private render() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Dark subterranean bedrock background
    ctx.fillStyle = '#090705';
    ctx.fillRect(0, 0, w, h);

    // Subtle bedrock texture / sanctum ring
    ctx.save();
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.04)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(this.mother.x, this.mother.y, 160, 0, Math.PI * 2);
    ctx.arc(this.mother.x, this.mother.y, 320, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // 1. Render Chemical Diffusion Fields (Trails, Pathogens, Mother aura)
    this.grid.renderToCanvas(ctx, this.viewMode);

    // 2. Render Pheromone Pulses
    for (const p of this.pulses) {
      ctx.save();
      ctx.strokeStyle = p.color;
      ctx.lineWidth = p.lineWidth;
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // 3. Render Food Sources
    for (const f of this.foods) {
      this.drawFoodSource(ctx, f);
    }

    // 4. Render Eggs
    for (const egg of this.eggs) {
      egg.draw(ctx);
    }

    // 5. Render Holy Mother Queen
    this.mother.draw(ctx);

    // 6. Render Roaches
    for (const roach of this.roaches) {
      const isSel = this.selectedType === 'ROACH' && this.selectedEntity === roach;
      roach.draw(ctx, isSel);
    }

    // 7. Render Xants
    for (const ant of this.xants) {
      const isSel = this.selectedType === 'XANT' && this.selectedEntity === ant;
      ant.draw(ctx, isSel);

      // In SENSORS view mode, draw antenna sensory lines
      if (this.viewMode === 'SENSORS') {
        this.drawAntSensors(ctx, ant);
      }
    }
  }

  private drawFoodSource(ctx: CanvasRenderingContext2D, f: FoodSource) {
    ctx.save();
    ctx.translate(f.x, f.y);

    const isNectar = f.type === 'NECTAR';
    const rad = Math.max(6, f.radius * (f.amount / f.maxAmount));

    // Glow
    ctx.shadowColor = isNectar ? '#38bdf8' : '#eab308';
    ctx.shadowBlur = 12;

    // Body
    ctx.fillStyle = isNectar ? 'rgba(56, 189, 248, 0.85)' : 'rgba(234, 179, 8, 0.85)';
    ctx.strokeStyle = isNectar ? '#bae6fd' : '#fef08a';
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.arc(0, 0, rad, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Core
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, rad * 0.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private drawAntSensors(ctx: CanvasRenderingContext2D, ant: Xant) {
    ctx.save();
    ctx.translate(ant.x, ant.y);
    const d = ant.sensorDistance;
    const phi = ant.sensorAngle;

    const lx = Math.cos(ant.angle - phi) * d;
    const ly = Math.sin(ant.angle - phi) * d;
    const rx = Math.cos(ant.angle + phi) * d;
    const ry = Math.sin(ant.angle + phi) * d;

    ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(lx, ly);
    ctx.moveTo(0, 0); ctx.lineTo(rx, ry);
    ctx.stroke();

    // Left sensor dot
    ctx.fillStyle = ant.leftReading > ant.rightReading ? '#22c55e' : '#f59e0b';
    ctx.beginPath();
    ctx.arc(lx, ly, 1.5, 0, Math.PI * 2);
    ctx.arc(rx, ry, 1.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  public createPulse(x: number, y: number, color: string, maxRadius: number, type: 'HOLY' | 'ALARM' | 'ANTISEPTIC' | 'EGG') {
    this.pulses.push({
      x,
      y,
      radius: 8,
      maxRadius,
      color,
      alpha: 0.9,
      lineWidth: 2,
      type,
    });
  }

  // User Actions
  public spawnFoodCluster(x: number, y: number, amount: number = 100) {
    this.foods.push({
      id: Math.random().toString(),
      x,
      y,
      amount,
      maxAmount: amount,
      radius: 16,
      type: 'NECTAR',
    });
    this.grid.updateFoodField(this.foods);
    this.createPulse(x, y, '#38bdf8', 60, 'HOLY');
  }

  public spawnRoach(x: number, y: number) {
    this.roaches.push(new Xroach(x, y));
    this.createPulse(x, y, '#ef4444', 50, 'ALARM');
    soundEngine.playMandibleClick();
  }

  public seedPathogenSpore(x: number, y: number) {
    this.grid.addPathogen(x, y, 2.5, 3);
    this.createPulse(x, y, '#22c55e', 90, 'ALARM');
    soundEngine.playSporeBurst();

    // Infect any nearby healthy xants directly
    for (const ant of this.xants) {
      if (Math.hypot(ant.x - x, ant.y - y) < 40) {
        ant.sporeLoad = Math.min(100, ant.sporeLoad + 45);
      }
    }
  }

  public sprayAntiseptic(x: number, y: number, radius: number = 90) {
    this.grid.cleansePathogen(x, y, radius, 1.0);
    this.createPulse(x, y, '#a7f3d0', radius, 'ANTISEPTIC');
    soundEngine.playCleanse();

    // Cleanse exposed xants in radius
    for (const ant of this.xants) {
      if (Math.hypot(ant.x - x, ant.y - y) <= radius) {
        ant.cleanse();
      }
    }
    // Cleanse eggs
    for (const egg of this.eggs) {
      if (Math.hypot(egg.x - x, egg.y - y) <= radius) {
        egg.cleanse();
      }
    }
  }

  public triggerHolyCleansingWave() {
    const mx = this.mother.x;
    const my = this.mother.y;
    this.sprayAntiseptic(mx, my, 380);
    this.createPulse(mx, my, '#ffd700', 420, 'HOLY');
    soundEngine.playHolyPulse();
  }

  public triggerForceEgg(): CasteType {
    const caste = this.mother.forceLayEgg();
    this.eggs.push(new Egg(this.mother.x, this.mother.y, caste));
    this.createPulse(this.mother.x, this.mother.y, '#ffd700', 90, 'EGG');
    return caste;
  }

  public triggerBroodSurge() {
    for (let i = 0; i < 4; i++) {
      const caste = this.mother.forceLayEgg();
      this.eggs.push(new Egg(this.mother.x, this.mother.y, caste));
    }
    this.createPulse(this.mother.x, this.mother.y, '#ffd700', 140, 'EGG');
    soundEngine.playHolyPulse();
  }

  public setEdict(edict: QueenEdict) {
    this.mother.setEdict(edict);
    this.createPulse(this.mother.x, this.mother.y, '#eab308', 300, 'HOLY');
  }

  // Pointer Interaction
  public handlePointerDown(worldX: number, worldY: number) {
    switch (this.activeTool) {
      case 'INSPECT': {
        // Find clicked entity
        // Check Queen
        if (Math.hypot(worldX - this.mother.x, worldY - this.mother.y) < this.mother.radius + 15) {
          this.selectedEntity = this.mother;
          this.selectedType = 'QUEEN';
          this.onEntitySelected?.('QUEEN', this.mother);
          return;
        }

        // Check Xants
        let nearestAnt: Xant | null = null;
        let minDist = 25;
        for (const ant of this.xants) {
          const d = Math.hypot(ant.x - worldX, ant.y - worldY);
          if (d < minDist) {
            minDist = d;
            nearestAnt = ant;
          }
        }
        if (nearestAnt) {
          this.selectedEntity = nearestAnt;
          this.selectedType = 'XANT';
          this.onEntitySelected?.('XANT', nearestAnt);
          return;
        }

        // Check Roaches
        for (const roach of this.roaches) {
          if (Math.hypot(roach.x - worldX, roach.y - worldY) < 22) {
            this.selectedEntity = roach;
            this.selectedType = 'ROACH';
            this.onEntitySelected?.('ROACH', roach);
            return;
          }
        }

        // Check Eggs
        for (const egg of this.eggs) {
          if (Math.hypot(egg.x - worldX, egg.y - worldY) < 16) {
            this.selectedEntity = egg;
            this.selectedType = 'EGG';
            this.onEntitySelected?.('EGG', egg);
            return;
          }
        }

        // Deselect
        this.selectedEntity = null;
        this.selectedType = null;
        this.onEntitySelected?.(null, null);
        break;
      }

      case 'FOOD':
        this.spawnFoodCluster(worldX, worldY, 120);
        break;

      case 'SPORE':
        this.seedPathogenSpore(worldX, worldY);
        break;

      case 'ANTISEPTIC':
        this.sprayAntiseptic(worldX, worldY, 80);
        break;

      case 'EGG': {
        const caste = this.triggerForceEgg();
        break;
      }

      case 'ROACH':
        this.spawnRoach(worldX, worldY);
        break;

      case 'WALL':
        this.grid.toggleWall(worldX, worldY, 22, true);
        break;
    }
  }

  public handlePointerDrag(worldX: number, worldY: number) {
    if (this.activeTool === 'WALL') {
      this.grid.toggleWall(worldX, worldY, 18, true);
    } else if (this.activeTool === 'ANTISEPTIC') {
      this.sprayAntiseptic(worldX, worldY, 40);
    } else if (this.activeTool === 'SPORE') {
      this.grid.addPathogen(worldX, worldY, 0.4, 2);
    }
  }
}
