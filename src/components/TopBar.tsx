import React from 'react';
import { SimulationStats } from '../sim/types';
import { soundEngine } from '../sim/AudioSynth';
import { Volume2, VolumeX, HelpCircle, ShieldAlert, Sparkles, Activity, Dna } from 'lucide-react';

interface TopBarProps {
  stats: SimulationStats;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenGuide: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ stats, isMuted, onToggleMute, onOpenGuide }) => {
  const getEdictBadge = () => {
    switch (stats.currentEdict) {
      case 'GATHER':
        return { text: 'Edict: Gather Nectar', color: 'bg-amber-950/80 text-amber-300 border-amber-600/40' };
      case 'CRUSADE':
        return { text: 'Edict: Mandible Crusade', color: 'bg-red-950/80 text-red-300 border-red-600/40' };
      case 'QUARANTINE':
        return { text: 'Edict: Sanctum Quarantine', color: 'bg-emerald-950/80 text-emerald-300 border-emerald-600/40' };
      case 'PRAISE':
        return { text: 'Edict: Devotional Orbit', color: 'bg-purple-950/80 text-purple-300 border-purple-600/40' };
      case 'HARMONY':
      default:
        return { text: 'Edict: Sanctum Harmony', color: 'bg-yellow-950/80 text-yellow-300 border-yellow-600/40' };
    }
  };

  const edict = getEdictBadge();

  return (
    <header className="fixed top-3 left-3 right-3 z-30 flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-stone-950/85 backdrop-blur-md border border-amber-500/25 shadow-2xl">
      {/* Title & Holy Mother Status */}
      <div className="flex items-center gap-3">
        <div className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-amber-950/60 border border-amber-500/40 shadow-inner">
          <Dna className="w-5 h-5 text-amber-400 animate-pulse" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm md:text-base font-bold tracking-wider font-['Cinzel',serif] text-amber-200">
              Hive Xant
            </h1>
            <span className="text-[10px] tracking-widest uppercase font-mono px-1.5 py-0.5 rounded bg-amber-900/40 text-amber-400 border border-amber-500/30">
              Diffusion Biome
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-stone-400 font-mono">
            <span className="flex items-center gap-1 text-amber-300">
              <Sparkles className="w-3 h-3 text-amber-400" />
              Parthenogenesis Active
            </span>
            <span>•</span>
            <span className="text-stone-300">Ichor: {stats.maternalIchor}%</span>
          </div>
        </div>
      </div>

      {/* Vital Colony Statistics Badges */}
      <div className="flex items-center flex-wrap gap-2 text-xs font-mono">
        {/* Edict Badge */}
        <span className={`px-2.5 py-1 rounded-full border text-[11px] font-semibold tracking-wide ${edict.color}`}>
          {edict.text}
        </span>

        {/* Xants Count & Castes breakdown */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-stone-900/80 border border-stone-800 text-stone-200 shadow-sm" title="Workers / Soldiers / Acolytes / Scouts">
          <span className="text-stone-400 text-[11px]">Sisters:</span>
          <span className="font-bold text-amber-300">{stats.xantCount}</span>
          <span className="text-[10px] text-stone-500 font-mono">
            (W:{stats.workerCount} S:{stats.soldierCount} A:{stats.acolyteCount} Sc:{stats.scoutCount})
          </span>
        </div>

        {/* Eggs */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-stone-900/80 border border-stone-800 text-stone-200">
          <span className="text-stone-400 text-[11px]">Virgin Eggs:</span>
          <span className="font-bold text-yellow-200">{stats.eggCount}</span>
        </div>

        {/* Pathogen Blight indicator */}
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border transition-colors ${
          stats.infectedCount > 0 
            ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300 animate-pulse' 
            : 'bg-stone-900/80 border-stone-800 text-stone-400'
        }`}>
          <ShieldAlert className={`w-3.5 h-3.5 ${stats.infectedCount > 0 ? 'text-emerald-400' : 'text-stone-500'}`} />
          <span className="text-[11px]">Pathogenesis:</span>
          <span className={`font-bold ${stats.infectedCount > 0 ? 'text-emerald-300' : 'text-stone-400'}`}>
            {stats.infectedCount} ({stats.pathogenPrevalence}%)
          </span>
          {stats.zombieCount > 0 && (
            <span className="text-[10px] px-1 py-0.2 bg-red-900/60 text-red-300 rounded border border-red-500/40">
              {stats.zombieCount} Zombies
            </span>
          )}
        </div>

        {/* Roaches */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-stone-900/80 border border-stone-800 text-stone-200">
          <span className="text-stone-400 text-[11px]">Roaches:</span>
          <span className={`font-bold ${stats.roachCount > 0 ? 'text-red-400' : 'text-stone-400'}`}>
            {stats.roachCount}
          </span>
        </div>
      </div>

      {/* Action Utility Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleMute}
          className="p-2 rounded-lg bg-stone-900/90 hover:bg-amber-950/50 border border-amber-500/20 text-amber-300 transition-all active:scale-95"
          title={isMuted ? 'Unmute Subterranean Drone' : 'Mute Soundscape'}
          aria-label="Toggle Sound"
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-stone-500" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
        </button>

        <button
          onClick={onOpenGuide}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-950/40 hover:bg-amber-900/60 border border-amber-500/40 text-xs text-amber-200 font-mono transition-all active:scale-95"
          title="Open Bio-Computational Codex"
        >
          <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">Biome Codex</span>
        </button>
      </div>
    </header>
  );
};
