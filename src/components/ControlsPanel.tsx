import React, { useState } from 'react';
import { ActiveTool, QueenEdict, ViewMode } from '../sim/types';
import { Simulation } from '../sim/Simulation';
import {
  Sparkles,
  Zap,
  Shield,
  Layers,
  Flame,
  Bug,
  Crosshair,
  Droplet,
  Biohazard,
  Egg as EggIcon,
  PlusCircle,
  Sliders,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Eye,
  Eraser
} from 'lucide-react';

interface ControlsPanelProps {
  sim: Simulation | null;
  activeTool: ActiveTool;
  setActiveTool: (tool: ActiveTool) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  speed: number;
  setSpeed: (speed: number) => void;
  eggInterval: number;
  setEggInterval: (interval: number) => void;
  currentEdict: QueenEdict;
  onSetEdict: (edict: QueenEdict) => void;
}

export const ControlsPanel: React.FC<ControlsPanelProps> = ({
  sim,
  activeTool,
  setActiveTool,
  viewMode,
  setViewMode,
  speed,
  setSpeed,
  eggInterval,
  setEggInterval,
  currentEdict,
  onSetEdict,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [trailDiffusion, setTrailDiffusion] = useState(0.18);
  const [trailDecay, setTrailDecay] = useState(0.015);
  const [pathogenDiffusion, setPathogenDiffusion] = useState(0.12);

  const handleDiffusionChange = (val: number) => {
    setTrailDiffusion(val);
    if (sim) sim.grid.diffusionRateTrail = val;
  };

  const handleDecayChange = (val: number) => {
    setTrailDecay(val);
    if (sim) sim.grid.decayRateTrail = val;
  };

  const handlePathogenDiffChange = (val: number) => {
    setPathogenDiffusion(val);
    if (sim) sim.grid.diffusionRatePathogen = val;
  };

  const handleClearChemicals = () => {
    if (sim) {
      sim.grid.clearAll(true);
    }
  };

  const handleResetWorld = () => {
    if (sim) {
      sim.initWorld();
    }
  };

  return (
    <aside className={`fixed top-20 left-3 z-20 w-80 max-h-[calc(100vh-6.5rem)] flex flex-col rounded-xl bg-stone-950/85 backdrop-blur-md border border-amber-500/25 shadow-2xl transition-all duration-300 font-sans ${
      isCollapsed ? 'max-h-12 overflow-hidden' : ''
    }`}>
      {/* Header */}
      <div 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="flex items-center justify-between px-3.5 py-2.5 cursor-pointer border-b border-amber-500/20 bg-stone-900/60 select-none hover:bg-stone-900/90 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-amber-200 font-['Cinzel',serif]">
            Sanctum Controls
          </span>
        </div>
        <button className="text-stone-400 hover:text-amber-300">
          {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto px-3.5 py-3 space-y-4 text-xs font-mono text-stone-300 custom-scrollbar">
        {/* 1. Mother Queen Directives */}
        <div>
          <div className="text-[10px] uppercase font-bold tracking-wider text-amber-400/80 mb-1.5 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-amber-400" />
            Matriarch Edicts
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => onSetEdict('GATHER')}
              className={`px-2 py-1.5 rounded-lg border text-left transition-all ${
                currentEdict === 'GATHER'
                  ? 'bg-amber-900/60 border-amber-400 text-amber-200 shadow-sm'
                  : 'bg-stone-900/50 border-stone-800 text-stone-300 hover:border-amber-600/40'
              }`}
            >
              <div className="font-bold text-[11px] text-amber-300">Gather Nectar</div>
              <div className="text-[9px] text-stone-400">Boost trail weaving</div>
            </button>

            <button
              onClick={() => onSetEdict('CRUSADE')}
              className={`px-2 py-1.5 rounded-lg border text-left transition-all ${
                currentEdict === 'CRUSADE'
                  ? 'bg-red-950/70 border-red-400 text-red-200 shadow-sm'
                  : 'bg-stone-900/50 border-stone-800 text-stone-300 hover:border-red-600/40'
              }`}
            >
              <div className="font-bold text-[11px] text-red-400">Crusade</div>
              <div className="text-[9px] text-stone-400">Hunt roaches & zombies</div>
            </button>

            <button
              onClick={() => onSetEdict('QUARANTINE')}
              className={`px-2 py-1.5 rounded-lg border text-left transition-all ${
                currentEdict === 'QUARANTINE'
                  ? 'bg-emerald-950/70 border-emerald-400 text-emerald-200 shadow-sm'
                  : 'bg-stone-900/50 border-stone-800 text-stone-300 hover:border-emerald-600/40'
              }`}
            >
              <div className="font-bold text-[11px] text-emerald-400">Quarantine</div>
              <div className="text-[9px] text-stone-400">Isolate spore carriers</div>
            </button>

            <button
              onClick={() => onSetEdict('PRAISE')}
              className={`px-2 py-1.5 rounded-lg border text-left transition-all ${
                currentEdict === 'PRAISE'
                  ? 'bg-purple-950/70 border-purple-400 text-purple-200 shadow-sm'
                  : 'bg-stone-900/50 border-stone-800 text-stone-300 hover:border-purple-600/40'
              }`}
            >
              <div className="font-bold text-[11px] text-purple-300">Devotional Orbit</div>
              <div className="text-[9px] text-stone-400">Sacred spiral praise</div>
            </button>
          </div>
        </div>

        {/* 2. Interactive Cursor Tools */}
        <div>
          <div className="text-[10px] uppercase font-bold tracking-wider text-amber-400/80 mb-1.5 flex items-center gap-1.5">
            <Crosshair className="w-3 h-3 text-amber-400" />
            Active Substrate Tool
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              onClick={() => setActiveTool('INSPECT')}
              className={`px-2 py-1.5 rounded-lg border flex flex-col items-center gap-1 transition-all ${
                activeTool === 'INSPECT'
                  ? 'bg-sky-950/70 border-sky-400 text-sky-200'
                  : 'bg-stone-900/60 border-stone-800 text-stone-300 hover:border-stone-700'
              }`}
            >
              <Eye className="w-3.5 h-3.5 text-sky-400" />
              <span className="text-[10px]">Inspect</span>
            </button>

            <button
              onClick={() => setActiveTool('FOOD')}
              className={`px-2 py-1.5 rounded-lg border flex flex-col items-center gap-1 transition-all ${
                activeTool === 'FOOD'
                  ? 'bg-amber-950/70 border-amber-400 text-amber-200'
                  : 'bg-stone-900/60 border-stone-800 text-stone-300 hover:border-stone-700'
              }`}
            >
              <Droplet className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[10px]">Drop Nectar</span>
            </button>

            <button
              onClick={() => setActiveTool('SPORE')}
              className={`px-2 py-1.5 rounded-lg border flex flex-col items-center gap-1 transition-all ${
                activeTool === 'SPORE'
                  ? 'bg-emerald-950/70 border-emerald-400 text-emerald-200'
                  : 'bg-stone-900/60 border-stone-800 text-stone-300 hover:border-stone-700'
              }`}
            >
              <Biohazard className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[10px]">Seed Spore</span>
            </button>

            <button
              onClick={() => setActiveTool('ANTISEPTIC')}
              className={`px-2 py-1.5 rounded-lg border flex flex-col items-center gap-1 transition-all ${
                activeTool === 'ANTISEPTIC'
                  ? 'bg-teal-950/70 border-teal-400 text-teal-200'
                  : 'bg-stone-900/60 border-stone-800 text-stone-300 hover:border-stone-700'
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-teal-400" />
              <span className="text-[10px]">Antiseptic</span>
            </button>

            <button
              onClick={() => setActiveTool('EGG')}
              className={`px-2 py-1.5 rounded-lg border flex flex-col items-center gap-1 transition-all ${
                activeTool === 'EGG'
                  ? 'bg-yellow-950/70 border-yellow-400 text-yellow-200'
                  : 'bg-stone-900/60 border-stone-800 text-stone-300 hover:border-stone-700'
              }`}
            >
              <EggIcon className="w-3.5 h-3.5 text-yellow-300" />
              <span className="text-[10px]">Virgin Egg</span>
            </button>

            <button
              onClick={() => setActiveTool('ROACH')}
              className={`px-2 py-1.5 rounded-lg border flex flex-col items-center gap-1 transition-all ${
                activeTool === 'ROACH'
                  ? 'bg-red-950/70 border-red-400 text-red-200'
                  : 'bg-stone-900/60 border-stone-800 text-stone-300 hover:border-stone-700'
              }`}
            >
              <Bug className="w-3.5 h-3.5 text-red-400" />
              <span className="text-[10px]">Add Roach</span>
            </button>

            <button
              onClick={() => setActiveTool('WALL')}
              className={`col-span-3 px-2 py-1.5 rounded-lg border flex items-center justify-center gap-1.5 transition-all ${
                activeTool === 'WALL'
                  ? 'bg-stone-800 border-amber-400 text-amber-200'
                  : 'bg-stone-900/60 border-stone-800 text-stone-300 hover:border-stone-700'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[10px]">Draw Chitin Barrier (Test Pathway Routing)</span>
            </button>
          </div>
        </div>

        {/* 3. Holy Miracles */}
        <div>
          <div className="text-[10px] uppercase font-bold tracking-wider text-amber-400/80 mb-1.5 flex items-center gap-1.5">
            <Flame className="w-3 h-3 text-amber-400" />
            Sacred Miracles
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => sim?.triggerHolyCleansingWave()}
              className="px-2.5 py-1.5 rounded-lg bg-teal-950/50 hover:bg-teal-900/70 border border-teal-500/40 text-teal-200 text-left transition-all active:scale-95"
            >
              <div className="font-bold text-[10px] text-teal-300 flex items-center gap-1">
                <Shield className="w-3 h-3 text-teal-400" /> Cleansing Wave
              </div>
              <div className="text-[9px] text-stone-400">Purges sanctum spores</div>
            </button>

            <button
              onClick={() => sim?.triggerBroodSurge()}
              className="px-2.5 py-1.5 rounded-lg bg-amber-950/50 hover:bg-amber-900/70 border border-amber-500/40 text-amber-200 text-left transition-all active:scale-95"
            >
              <div className="font-bold text-[10px] text-amber-300 flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-400" /> Brood Surge
              </div>
              <div className="text-[9px] text-stone-400">Rapid 4-egg virgin clutch</div>
            </button>
          </div>
        </div>

        {/* 4. Chemical Viewport Layers */}
        <div>
          <div className="text-[10px] uppercase font-bold tracking-wider text-amber-400/80 mb-1.5 flex items-center gap-1.5">
            <Layers className="w-3 h-3 text-amber-400" />
            Chemical Viewport Layer
          </div>
          <div className="grid grid-cols-1 gap-1 text-[11px]">
            {[
              { id: 'COMPOSITE', label: 'Composite Bio-Luminescence', desc: 'Blends all pheromones & entities' },
              { id: 'TRAILS', label: 'Emergent Trail Highways', desc: 'High-contrast stigmergic branches' },
              { id: 'PATHOGEN', label: 'Pathogen Contagion Heatmap', desc: 'Epidemiological spore plumes' },
              { id: 'MATERNAL_AURA', label: 'Holy Maternal Radiance', desc: 'Sanctum homing potential field' },
              { id: 'SENSORS', label: 'Chemotaxis Antenna Rays', desc: 'Live vector steering visualization' },
            ].map(m => (
              <button
                key={m.id}
                onClick={() => setViewMode(m.id as ViewMode)}
                className={`px-2.5 py-1.5 rounded-lg border text-left flex items-center justify-between transition-all ${
                  viewMode === m.id
                    ? 'bg-amber-950/80 border-amber-400 text-amber-200'
                    : 'bg-stone-900/50 border-stone-800 text-stone-400 hover:text-stone-200'
                }`}
              >
                <div>
                  <div className="font-semibold">{m.label}</div>
                  <div className="text-[9px] text-stone-500">{m.desc}</div>
                </div>
                {viewMode === m.id && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
              </button>
            ))}
          </div>
        </div>

        {/* 5. Colony Kinetics Sliders */}
        <div className="space-y-2 pt-1 border-t border-stone-800">
          <div className="text-[10px] uppercase font-bold tracking-wider text-amber-400/80 flex items-center justify-between">
            <span>Diffusion Kinetics</span>
            <button
              onClick={handleClearChemicals}
              className="text-[9px] text-stone-400 hover:text-amber-300 flex items-center gap-1 underline"
            >
              <Eraser className="w-2.5 h-2.5" /> Clear Trails
            </button>
          </div>

          {/* Speed Slider */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-stone-400">
              <span>Simulation Speed</span>
              <span className="text-amber-300 font-bold">{speed.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="0.2"
              max="3.0"
              step="0.1"
              value={speed}
              onChange={(e) => setSpeed(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
            />
          </div>

          {/* Egg Lay Interval */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-stone-400">
              <span>Virgin Egg Rate</span>
              <span className="text-amber-300 font-bold">{eggInterval}s</span>
            </div>
            <input
              type="range"
              min="2"
              max="20"
              step="1"
              value={eggInterval}
              onChange={(e) => setEggInterval(parseInt(e.target.value))}
              className="w-full h-1.5 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
            />
          </div>

          {/* Trail Diffusion Rate */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-stone-400">
              <span>Trail Diffusion (D)</span>
              <span className="text-amber-300 font-bold">{trailDiffusion.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.05"
              max="0.4"
              step="0.01"
              value={trailDiffusion}
              onChange={(e) => handleDiffusionChange(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
            />
          </div>

          {/* Trail Evaporation Decay */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-stone-400">
              <span>Trail Evaporation (Decay)</span>
              <span className="text-amber-300 font-bold">{(trailDecay * 100).toFixed(1)}%</span>
            </div>
            <input
              type="range"
              min="0.005"
              max="0.06"
              step="0.002"
              value={trailDecay}
              onChange={(e) => handleDecayChange(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
            />
          </div>
        </div>

        {/* Reset World Button */}
        <div className="pt-2">
          <button
            onClick={handleResetWorld}
            className="w-full py-2 rounded-lg bg-stone-900 hover:bg-stone-800 border border-stone-800 text-stone-400 hover:text-amber-300 text-xs flex items-center justify-center gap-1.5 transition-colors active:scale-98"
          >
            <RefreshCw className="w-3 h-3 text-stone-400" />
            <span>Reset Hive & Colony</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
