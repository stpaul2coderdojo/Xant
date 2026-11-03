export type CasteType = 'WORKER' | 'SOLDIER' | 'ACOLYTE' | 'SCOUT';

export type InfectionStage = 'HEALTHY' | 'EXPOSED' | 'PATHOGENIC' | 'CORDYCEPS_ZOMBIE';

export type QueenEdict = 'HARMONY' | 'GATHER' | 'CRUSADE' | 'QUARANTINE' | 'PRAISE';

export type ViewMode = 'COMPOSITE' | 'TRAILS' | 'PATHOGEN' | 'MATERNAL_AURA' | 'SENSORS';

export type ActiveTool = 
  | 'INSPECT'
  | 'FOOD'
  | 'SPORE'
  | 'ANTISEPTIC'
  | 'EGG'
  | 'ROACH'
  | 'WALL';

export interface FoodSource {
  id: string;
  x: number;
  y: number;
  amount: number;
  maxAmount: number;
  radius: number;
  type: 'NECTAR' | 'ORGANIC_CARCASS';
}

export interface WallObstacle {
  x: number;
  y: number;
  radius: number;
}

export interface PheromonePulse {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  color: string;
  alpha: number;
  lineWidth: number;
  type: 'HOLY' | 'ALARM' | 'ANTISEPTIC' | 'EGG';
}

export interface SimulationStats {
  xantCount: number;
  workerCount: number;
  soldierCount: number;
  acolyteCount: number;
  scoutCount: number;
  eggCount: number;
  roachCount: number;
  infectedCount: number;
  zombieCount: number;
  foodSourcesCount: number;
  maternalIchor: number;
  currentEdict: QueenEdict;
  totalEggsLaid: number;
  totalRoachesPurged: number;
  totalFoodHarvested: number;
  pathogenPrevalence: number; // 0 to 100%
}
