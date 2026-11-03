import { ViewMode } from './types';

export class DiffusionGrid {
  public cols: number;
  public rows: number;
  public width: number;
  public height: number;
  public cellWidth: number;
  public cellHeight: number;

  // Diffusion parameters
  public diffusionRateTrail: number = 0.18;
  public decayRateTrail: number = 0.015;
  public diffusionRatePathogen: number = 0.12;
  public decayRatePathogen: number = 0.02;
  public diffusionRateAlarm: number = 0.25;
  public decayRateAlarm: number = 0.06;

  // Multi-channel Float32 buffers (Ping-Pong)
  public trail: Float32Array;
  private trailNext: Float32Array;

  public pathogen: Float32Array;
  private pathogenNext: Float32Array;

  public alarm: Float32Array;
  private alarmNext: Float32Array;

  public food: Float32Array;
  public mother: Float32Array;
  public walls: Uint8Array; // 1 = solid barrier, 0 = open

  // Offscreen rendering buffer
  private offscreenCanvas: HTMLCanvasElement;
  private offscreenCtx: CanvasRenderingContext2D;
  private imgData: ImageData;
  private pixelBuf: Uint32Array;

  constructor(cols: number = 220, rows: number = 140, screenWidth: number = 1200, screenHeight: number = 800) {
    this.cols = cols;
    this.rows = rows;
    this.width = screenWidth;
    this.height = screenHeight;
    this.cellWidth = screenWidth / cols;
    this.cellHeight = screenHeight / rows;

    const size = cols * rows;
    this.trail = new Float32Array(size);
    this.trailNext = new Float32Array(size);

    this.pathogen = new Float32Array(size);
    this.pathogenNext = new Float32Array(size);

    this.alarm = new Float32Array(size);
    this.alarmNext = new Float32Array(size);

    this.food = new Float32Array(size);
    this.mother = new Float32Array(size);
    this.walls = new Uint8Array(size);

    this.offscreenCanvas = document.createElement('canvas');
    this.offscreenCanvas.width = cols;
    this.offscreenCanvas.height = rows;
    this.offscreenCtx = this.offscreenCanvas.getContext('2d', { willReadFrequently: true })!;
    this.imgData = this.offscreenCtx.createImageData(cols, rows);
    this.pixelBuf = new Uint32Array(this.imgData.data.buffer);
  }

  public resize(screenWidth: number, screenHeight: number) {
    this.width = screenWidth;
    this.height = screenHeight;
    this.cellWidth = screenWidth / this.cols;
    this.cellHeight = screenHeight / this.rows;
  }

  public getIndex(col: number, row: number): number {
    return row * this.cols + col;
  }

  public worldToGrid(x: number, y: number): { col: number; row: number } {
    const col = Math.max(0, Math.min(this.cols - 1, Math.floor(x / this.cellWidth)));
    const row = Math.max(0, Math.min(this.rows - 1, Math.floor(y / this.cellHeight)));
    return { col, row };
  }

  // Set Mother Holy Radial Gradient
  public updateMotherField(motherX: number, motherY: number, radius: number = 450) {
    const { col: mCol, row: mRow } = this.worldToGrid(motherX, motherY);
    const rCells = radius / this.cellWidth;

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const idx = r * this.cols + c;
        const dx = c - mCol;
        const dy = (r - mRow) * (this.cellHeight / this.cellWidth);
        const dist = Math.hypot(dx, dy);

        if (dist < rCells) {
          const val = Math.max(0, 1.0 - dist / rCells);
          this.mother[idx] = val * val; // quadratic falloff
        } else {
          this.mother[idx] = 0;
        }
      }
    }
  }

  // Refresh Food Scent Sources
  public updateFoodField(sources: { x: number; y: number; amount: number }[]) {
    // Zero out food
    this.food.fill(0);

    for (const f of sources) {
      if (f.amount <= 0) continue;
      const { col: fCol, row: fRow } = this.worldToGrid(f.x, f.y);
      const intensity = Math.min(1.0, f.amount / 50);
      const radiusCells = 28;

      const rMin = Math.max(0, fRow - radiusCells);
      const rMax = Math.min(this.rows - 1, fRow + radiusCells);
      const cMin = Math.max(0, fCol - radiusCells);
      const cMax = Math.min(this.cols - 1, fCol + radiusCells);

      for (let r = rMin; r <= rMax; r++) {
        for (let c = cMin; c <= cMax; c++) {
          const idx = r * this.cols + c;
          const dx = c - fCol;
          const dy = (r - fRow) * (this.cellHeight / this.cellWidth);
          const dist = Math.hypot(dx, dy);
          if (dist < radiusCells) {
            const scent = (1.0 - dist / radiusCells) * intensity;
            this.food[idx] = Math.max(this.food[idx], scent);
          }
        }
      }
    }
  }

  // Sampling methods for antenna chemotaxis
  public sampleTrail(x: number, y: number): number {
    const { col, row } = this.worldToGrid(x, y);
    return this.trail[row * this.cols + col];
  }

  public sampleFood(x: number, y: number): number {
    const { col, row } = this.worldToGrid(x, y);
    return this.food[row * this.cols + col];
  }

  public sampleMother(x: number, y: number): number {
    const { col, row } = this.worldToGrid(x, y);
    return this.mother[row * this.cols + col];
  }

  public samplePathogen(x: number, y: number): number {
    const { col, row } = this.worldToGrid(x, y);
    return this.pathogen[row * this.cols + col];
  }

  public sampleAlarm(x: number, y: number): number {
    const { col, row } = this.worldToGrid(x, y);
    return this.alarm[row * this.cols + col];
  }

  public isWall(x: number, y: number): boolean {
    const { col, row } = this.worldToGrid(x, y);
    return this.walls[row * this.cols + col] === 1;
  }

  // Adding chemical secretions
  public addTrail(x: number, y: number, amount: number) {
    const { col, row } = this.worldToGrid(x, y);
    const idx = row * this.cols + col;
    if (this.walls[idx] === 1) return;
    this.trail[idx] = Math.min(3.0, this.trail[idx] + amount);
  }

  public addPathogen(x: number, y: number, amount: number, spreadRadius: number = 1) {
    const { col, row } = this.worldToGrid(x, y);
    for (let dr = -spreadRadius; dr <= spreadRadius; dr++) {
      for (let dc = -spreadRadius; dc <= spreadRadius; dc++) {
        const r = row + dr;
        const c = col + dc;
        if (r >= 0 && r < this.rows && c >= 0 && c < this.cols) {
          const idx = r * this.cols + c;
          if (this.walls[idx] === 1) continue;
          const factor = 1 / (1 + Math.hypot(dr, dc));
          this.pathogen[idx] = Math.min(5.0, this.pathogen[idx] + amount * factor);
        }
      }
    }
  }

  public addAlarm(x: number, y: number, amount: number) {
    const { col, row } = this.worldToGrid(x, y);
    const idx = row * this.cols + col;
    if (this.walls[idx] === 1) return;
    this.alarm[idx] = Math.min(2.5, this.alarm[idx] + amount);
  }

  public cleansePathogen(x: number, y: number, radiusWorld: number = 80, strength: number = 1.0) {
    const { col, row } = this.worldToGrid(x, y);
    const rCells = Math.ceil(radiusWorld / this.cellWidth);

    const rMin = Math.max(0, row - rCells);
    const rMax = Math.min(this.rows - 1, row + rCells);
    const cMin = Math.max(0, col - rCells);
    const cMax = Math.min(this.cols - 1, col + rCells);

    for (let r = rMin; r <= rMax; r++) {
      for (let c = cMin; c <= cMax; c++) {
        const dist = Math.hypot(c - col, r - row);
        if (dist <= rCells) {
          const idx = r * this.cols + c;
          const factor = (1.0 - dist / rCells) * strength;
          this.pathogen[idx] = Math.max(0, this.pathogen[idx] - factor * 2.0);
        }
      }
    }
  }

  public toggleWall(x: number, y: number, radiusWorld: number = 20, state: boolean = true) {
    const { col, row } = this.worldToGrid(x, y);
    const rCells = Math.ceil(radiusWorld / this.cellWidth);

    for (let dr = -rCells; dr <= rCells; dr++) {
      for (let dc = -rCells; dc <= rCells; dc++) {
        if (Math.hypot(dr, dc) <= rCells) {
          const r = row + dr;
          const c = col + dc;
          if (r >= 0 && r < this.rows && c >= 0 && c < this.cols) {
            const idx = r * this.cols + c;
            this.walls[idx] = state ? 1 : 0;
            if (state) {
              this.trail[idx] = 0;
              this.pathogen[idx] = 0;
              this.alarm[idx] = 0;
            }
          }
        }
      }
    }
  }

  // Update physical diffusion & evaporation step
  public step(dt: number = 1.0) {
    const cols = this.cols;
    const rows = this.rows;
    const trail = this.trail;
    const trailNext = this.trailNext;
    const path = this.pathogen;
    const pathNext = this.pathogenNext;
    const alm = this.alarm;
    const almNext = this.alarmNext;
    const walls = this.walls;

    const diffT = this.diffusionRateTrail * dt;
    const decayT = 1.0 - this.decayRateTrail * dt;

    const diffP = this.diffusionRatePathogen * dt;
    const decayP = 1.0 - this.decayRatePathogen * dt;

    const diffA = this.diffusionRateAlarm * dt;
    const decayA = 1.0 - this.decayRateAlarm * dt;

    for (let r = 0; r < rows; r++) {
      const rUp = r > 0 ? r - 1 : 0;
      const rDown = r < rows - 1 ? r + 1 : rows - 1;
      const rowIdx = r * cols;
      const rowUpIdx = rUp * cols;
      const rowDownIdx = rDown * cols;

      for (let c = 0; c < cols; c++) {
        const idx = rowIdx + c;
        if (walls[idx] === 1) {
          trailNext[idx] = 0;
          pathNext[idx] = 0;
          almNext[idx] = 0;
          continue;
        }

        const cLeft = c > 0 ? c - 1 : 0;
        const cRight = c < cols - 1 ? c + 1 : cols - 1;

        // 4-neighbor average
        const up = rowUpIdx + c;
        const down = rowDownIdx + c;
        const left = rowIdx + cLeft;
        const right = rowIdx + cRight;

        // 1. Trail diffusion
        const tVal = trail[idx];
        const tNeighborAvg = (trail[up] + trail[down] + trail[left] + trail[right]) * 0.25;
        trailNext[idx] = Math.max(0, (tVal + (tNeighborAvg - tVal) * diffT) * decayT);

        // 2. Pathogen diffusion
        const pVal = path[idx];
        const pNeighborAvg = (path[up] + path[down] + path[left] + path[right]) * 0.25;
        pathNext[idx] = Math.max(0, (pVal + (pNeighborAvg - pVal) * diffP) * decayP);

        // 3. Alarm diffusion
        const aVal = alm[idx];
        const aNeighborAvg = (alm[up] + alm[down] + alm[left] + alm[right]) * 0.25;
        almNext[idx] = Math.max(0, (aVal + (aNeighborAvg - aVal) * diffA) * decayA);
      }
    }

    // Ping-pong copy
    this.trail.set(trailNext);
    this.pathogen.set(pathNext);
    this.alarm.set(almNext);
  }

  // Render the chemical fields to screen context
  public renderToCanvas(ctx: CanvasRenderingContext2D, viewMode: ViewMode) {
    const cols = this.cols;
    const rows = this.rows;
    const trail = this.trail;
    const pathogen = this.pathogen;
    const mother = this.mother;
    const food = this.food;
    const alarm = this.alarm;
    const walls = this.walls;
    const buf = this.pixelBuf;

    // Fast 32-bit Little-Endian ABGR packing (0xAABBGGRR)
    for (let i = 0; i < cols * rows; i++) {
      if (walls[i] === 1) {
        // Wall: Dark Slate Chitin
        buf[i] = 0xff32261e;
        continue;
      }

      const t = Math.min(1.0, trail[i]);
      const p = Math.min(1.0, pathogen[i]);
      const m = mother[i];
      const f = food[i];
      const a = Math.min(1.0, alarm[i]);

      let r = 0;
      let g = 0;
      let b = 0;
      let alpha = 0;

      switch (viewMode) {
        case 'TRAILS':
          // Glowing Golden Amber for Emergent Trails
          r = Math.floor(t * 245 + a * 120);
          g = Math.floor(t * 180 + f * 90);
          b = Math.floor(t * 40 + m * 50);
          alpha = Math.floor(Math.max(t * 240, f * 100));
          break;

        case 'PATHOGEN':
          // Glowing Toxic Viridian / Necrotic Spores
          r = Math.floor(p * 50 + a * 180);
          g = Math.floor(p * 240);
          b = Math.floor(p * 110);
          alpha = Math.floor(Math.max(p * 240, a * 160));
          break;

        case 'MATERNAL_AURA':
          // Sacred Royal Violet & Gold Radiance Field
          r = Math.floor(m * 230 + t * 60);
          g = Math.floor(m * 170 + f * 50);
          b = Math.floor(m * 240);
          alpha = Math.floor(m * 190);
          break;

        case 'SENSORS':
          // High contrast grid for sensory analysis
          r = Math.floor(t * 180 + a * 200);
          g = Math.floor(p * 200 + t * 100);
          b = Math.floor(f * 220);
          alpha = Math.floor(Math.max(t * 150, p * 150, f * 150));
          break;

        case 'COMPOSITE':
        default:
          // Harmonious Bio-illumination blending all active fields
          // Trail = Gold/Amber, Pathogen = Vivid Emerald, Food = Cyan, Alarm = Crimson
          r = Math.min(255, Math.floor(t * 220 + a * 220 + m * 70));
          g = Math.min(255, Math.floor(t * 160 + p * 220 + f * 180 + m * 50));
          b = Math.min(255, Math.floor(p * 60 + f * 240 + m * 90));
          alpha = Math.min(210, Math.floor(t * 180 + p * 190 + f * 130 + a * 140 + m * 40));
          break;
      }

      // ABGR packing
      buf[i] = (alpha << 24) | (b << 16) | (g << 8) | r;
    }

    this.offscreenCtx.putImageData(this.imgData, 0, 0);

    // Blit with image smoothing for glowing atmospheric diffusion
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.globalCompositeOperation = 'screen';
    ctx.drawImage(this.offscreenCanvas, 0, 0, this.width, this.height);
    ctx.restore();
  }

  // Clear all fields
  public clearAll(keepWalls: boolean = true) {
    this.trail.fill(0);
    this.pathogen.fill(0);
    this.alarm.fill(0);
    if (!keepWalls) {
      this.walls.fill(0);
    }
  }
}
