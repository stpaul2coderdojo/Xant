import React from 'react';
import { Xant } from '../sim/Xant';
import { MotherQueen } from '../sim/MotherQueen';
import { Egg } from '../sim/Egg';
import { Xroach } from '../sim/Xroach';
import { X, Sparkles, Activity, Shield, Droplet, Biohazard, Dna } from 'lucide-react';

interface InspectorModalProps {
  type: 'XANT' | 'QUEEN' | 'EGG' | 'ROACH' | null;
  entity: any | null;
  onClose: () => void;
  onCleanse?: (xant: Xant) => void;
  onForceEgg?: () => void;
}

export const InspectorModal: React.FC<InspectorModalProps> = ({
  type,
  entity,
  onClose,
  onCleanse,
  onForceEgg,
}) => {
  if (!type || !entity) return null;

  return (
    <div className="fixed top-20 right-3 z-30 w-80 rounded-xl bg-stone-950/90 backdrop-blur-md border border-amber-500/30 p-3.5 shadow-2xl font-mono text-xs text-stone-300">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-amber-500/20 pb-2 mb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-amber-400" />
          <span className="font-bold text-amber-200 tracking-wider font-['Cinzel',serif] uppercase">
            Bio-Inspector
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-md text-stone-400 hover:text-amber-300 hover:bg-stone-900 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* XANT INSPECTION */}
      {type === 'XANT' && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-amber-300 font-bold text-sm">{(entity as Xant).name}</span>
            <span className="px-2 py-0.5 rounded bg-amber-950/60 border border-amber-500/30 text-amber-300 text-[10px]">
              {(entity as Xant).caste} CASTE
            </span>
          </div>

          {/* Health & Spore load */}
          <div className="space-y-1.5 bg-stone-900/60 p-2 rounded-lg border border-stone-800">
            <div className="flex justify-between text-[11px]">
              <span>Chitin Integrity:</span>
              <span className="text-amber-400 font-bold">{Math.round((entity as Xant).health)} / {(entity as Xant).maxHealth}</span>
            </div>
            <div className="w-full h-1.5 bg-stone-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-400"
                style={{ width: `${Math.max(0, ((entity as Xant).health / (entity as Xant).maxHealth) * 100)}%` }}
              />
            </div>

            {/* Pathogenesis Infection Status */}
            <div className="flex justify-between text-[11px] pt-1">
              <span className="flex items-center gap-1">
                <Biohazard className="w-3 h-3 text-emerald-400" />
                Infection Stage:
              </span>
              <span className={`font-bold ${
                (entity as Xant).infection === 'CORDYCEPS_ZOMBIE'
                  ? 'text-red-400 animate-pulse'
                  : (entity as Xant).infection !== 'HEALTHY'
                  ? 'text-emerald-400'
                  : 'text-stone-400'
              }`}>
                {(entity as Xant).infection}
              </span>
            </div>
            <div className="flex justify-between text-[10px] text-stone-400">
              <span>Spore Load:</span>
              <span className="text-emerald-300">{Math.round((entity as Xant).sporeLoad)}%</span>
            </div>
            <div className="w-full h-1.5 bg-stone-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${(entity as Xant).sporeLoad}%` }}
              />
            </div>
          </div>

          {/* Dual-Antenna Chemotactic Gradient Readings */}
          <div className="bg-stone-900/60 p-2 rounded-lg border border-stone-800 space-y-1 text-[10px]">
            <div className="text-amber-400 font-bold text-[10px] uppercase">Antenna Chemotaxis Sensors</div>
            <div className="flex justify-between">
              <span>Left Antenna (+31°):</span>
              <span className="text-sky-300 font-mono">{(entity as Xant).leftReading.toFixed(3)}</span>
            </div>
            <div className="flex justify-between">
              <span>Right Antenna (-31°):</span>
              <span className="text-sky-300 font-mono">{(entity as Xant).rightReading.toFixed(3)}</span>
            </div>
            <div className="flex justify-between">
              <span>Carrying Nectar:</span>
              <span className={(entity as Xant).hasFood ? 'text-amber-300 font-bold' : 'text-stone-500'}>
                {(entity as Xant).hasFood ? 'YES (+1 Sacred Drop)' : 'NO (Searching)'}
              </span>
            </div>
          </div>

          {/* Cleanse Action */}
          {(entity as Xant).infection !== 'HEALTHY' && (
            <button
              onClick={() => onCleanse?.(entity as Xant)}
              className="w-full py-1.5 rounded-lg bg-teal-950/80 hover:bg-teal-900 border border-teal-500/50 text-teal-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-md"
            >
              <Shield className="w-3.5 h-3.5 text-teal-400" />
              <span>Apply Sacred Antiseptic Cleanse</span>
            </button>
          )}
        </div>
      )}

      {/* MOTHER QUEEN INSPECTION */}
      {type === 'QUEEN' && (
        <div className="space-y-2.5">
          <div className="text-amber-300 font-bold text-sm">Holy Mother of Hive Xant</div>
          <div className="text-[10px] text-amber-400/80">Parthenogenic Brood Matriarch</div>

          <div className="bg-stone-900/60 p-2 rounded-lg border border-stone-800 space-y-2">
            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span>Virgin Egg Maturation:</span>
                <span className="text-amber-300 font-bold">{Math.round((entity as MotherQueen).eggProgress * 100)}%</span>
              </div>
              <div className="w-full h-2 bg-stone-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-yellow-300 transition-all duration-200"
                  style={{ width: `${(entity as MotherQueen).eggProgress * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span>Royal Maternal Ichor:</span>
                <span className="text-yellow-400 font-bold">{Math.round((entity as MotherQueen).maternalIchor)}%</span>
              </div>
              <div className="w-full h-2 bg-stone-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-yellow-400 transition-all duration-200"
                  style={{ width: `${(entity as MotherQueen).maternalIchor}%` }}
                />
              </div>
            </div>

            <div className="flex justify-between text-[10px] pt-1 border-t border-stone-800">
              <span>Lifetime Virgin Offspring:</span>
              <span className="text-amber-300 font-bold">{(entity as MotherQueen).totalEggsLaid}</span>
            </div>
            <div className="flex justify-between text-[10px]">
              <span>Active Matriarch Edict:</span>
              <span className="text-amber-300 font-bold">{(entity as MotherQueen).edict}</span>
            </div>
          </div>

          <button
            onClick={onForceEgg}
            className="w-full py-1.5 rounded-lg bg-amber-950/80 hover:bg-amber-900 border border-amber-500/50 text-amber-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-md"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Force Immediate Virgin Birth</span>
          </button>
        </div>
      )}

      {/* ROACH INSPECTION */}
      {type === 'ROACH' && (
        <div className="space-y-2.5">
          <div className="text-red-400 font-bold text-sm">Carapace Invader (Xroach)</div>
          <div className="text-[10px] text-stone-400">Scavenger & Pathogen Dispersal Vector</div>

          <div className="bg-stone-900/60 p-2 rounded-lg border border-stone-800 space-y-1.5">
            <div className="flex justify-between text-[11px]">
              <span>Armor Integrity:</span>
              <span className="text-red-400 font-bold">{Math.round((entity as Xroach).health)} / {(entity as Xroach).maxHealth}</span>
            </div>
            <div className="w-full h-1.5 bg-stone-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-red-500"
                style={{ width: `${((entity as Xroach).health / (entity as Xroach).maxHealth) * 100}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px]">
              <span>Spore Dispersal:</span>
              <span className="text-emerald-400 font-bold">Active Aerosol Vector</span>
            </div>
          </div>
        </div>
      )}

      {/* EGG INSPECTION */}
      {type === 'EGG' && (
        <div className="space-y-2.5">
          <div className="text-yellow-300 font-bold text-sm">Parthenogenic Blastoderm Egg</div>
          <div className="text-[10px] text-stone-400">Asexual Virgin Clutch</div>

          <div className="bg-stone-900/60 p-2 rounded-lg border border-stone-800 space-y-1.5">
            <div className="flex justify-between text-[11px]">
              <span>Incubation Progress:</span>
              <span className="text-yellow-400 font-bold">{Math.round((entity as Egg).progress * 100)}%</span>
            </div>
            <div className="w-full h-1.5 bg-stone-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-yellow-400"
                style={{ width: `${(entity as Egg).progress * 100}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px]">
              <span>Embryo Caste:</span>
              <span className="text-amber-300 font-bold">{(entity as Egg).caste}</span>
            </div>
            <div className="flex justify-between text-[10px]">
              <span>Chorion Contamination:</span>
              <span className={(entity as Egg).isInfected ? 'text-emerald-400 font-bold' : 'text-stone-400'}>
                {(entity as Egg).isInfected ? 'Blighted Spores' : 'Sterile Sacred'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
