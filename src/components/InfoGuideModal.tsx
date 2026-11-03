import React from 'react';
import { X, Dna, Share2, Biohazard, Sparkles, BookOpen } from 'lucide-react';

interface InfoGuideModalProps {
  onClose: () => void;
}

export const InfoGuideModal: React.FC<InfoGuideModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md font-sans">
      <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl bg-stone-950 border border-amber-500/30 shadow-2xl overflow-hidden font-mono text-xs text-stone-300">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-amber-500/20 bg-stone-900/60">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-amber-200 tracking-wider font-['Cinzel',serif] uppercase">
              Bio-Computational Codex
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-amber-300 hover:bg-stone-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 custom-scrollbar text-stone-300 leading-relaxed">
          {/* Section 1: Diffusion Pathways */}
          <div className="space-y-2.5 bg-stone-900/50 p-4 rounded-xl border border-stone-800">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
              <Share2 className="w-4 h-4 text-amber-400" />
              <span>1. Emergent Diffusion Pathways (Stigmergy)</span>
            </div>
            <p className="text-stone-300">
              No individual Xant possesses a global map of the terrain. Instead, emergent arterial highways materialize through <strong className="text-amber-300">continuous 2D chemical diffusion</strong> and <strong className="text-amber-300">stigmergy</strong>:
            </p>
            <div className="p-2.5 rounded-lg bg-stone-950/80 border border-stone-800 text-[11px] text-amber-200/90 font-mono">
              ∂C/∂t = D · ∇²C - γ·C + R(x, y)
            </div>
            <ul className="list-disc pl-4 space-y-1 text-stone-400 text-[11px]">
              <li><strong className="text-stone-200">Dual-Antenna Chemotaxis:</strong> Each Xant samples the concentration gradient with forward-angled left and right antennae (±31°), steering towards denser trails.</li>
              <li><strong className="text-stone-200">Reinforcement Loops:</strong> Returning workers carrying sweet nectar deposit high concentrations of trail hydrocarbons, forming glowing braided highways that optimize around obstacles.</li>
              <li><strong className="text-stone-200">Continuous Evaporation:</strong> Substrate evaporation (γ) clears disused paths, allowing dynamic adaptive rerouting when food supplies deplete.</li>
            </ul>
          </div>

          {/* Section 2: Holy Mother Parthenogenesis */}
          <div className="space-y-2.5 bg-stone-900/50 p-4 rounded-xl border border-stone-800">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
              <Dna className="w-4 h-4 text-amber-400" />
              <span>2. Sacred Parthenogenesis (Asexual Virgin Birth)</span>
            </div>
            <p className="text-stone-300">
              The Holy Mother Ant resides at the sanctum center, reproducing exclusively via <strong className="text-amber-300">thelytokous parthenogenesis</strong>:
            </p>
            <ul className="list-disc pl-4 space-y-1 text-stone-400 text-[11px]">
              <li><strong className="text-stone-200">Diploid Virgin Clones:</strong> Eggs develop spontaneously without fertilization, preserving maternal genetic sanctity.</li>
              <li><strong className="text-stone-200">Physogastric Oviduct:</strong> Her massive undulating abdomen swells as blastoderm embryos mature inside the peristaltic egg chamber.</li>
              <li><strong className="text-stone-200">Epigenetic Caste Differentiation:</strong> Offspring differentiate into specialized functional castes:
                <ul className="pl-4 mt-1 space-y-0.5 text-stone-400">
                  <li>• <span className="text-amber-300 font-semibold">Workers:</span> Efficient foragers and highway weavers.</li>
                  <li>• <span className="text-red-400 font-semibold">Soldiers:</span> Armored mandibles for hunting roaches & zombies.</li>
                  <li>• <span className="text-sky-300 font-semibold">Acolytes:</span> Grooms eggs and sprays antiseptic secretions.</li>
                  <li>• <span className="text-purple-300 font-semibold">Scouts:</span> Long antennae with wide exploration sweeps.</li>
                </ul>
              </li>
            </ul>
          </div>

          {/* Section 3: Pathogenesis & Contagion Dynamics */}
          <div className="space-y-2.5 bg-stone-900/50 p-4 rounded-xl border border-stone-800">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <Biohazard className="w-4 h-4 text-emerald-400" />
              <span>3. Pathogenesis & Fungal Contagion Dynamics</span>
            </div>
            <p className="text-stone-300">
              Hive Xant is susceptible to virulent <strong className="text-emerald-400">Cordyceps-like spore blights</strong> transmitted by scavengers and airborne plumes:
            </p>
            <ul className="list-disc pl-4 space-y-1 text-stone-400 text-[11px]">
              <li><strong className="text-stone-200">Epidemiological Stages:</strong>
                <span className="text-stone-300"> Healthy → Exposed (20%) → Active Pathogenic (50%) → Mind-Controlled Zombie (85%+).</span>
              </li>
              <li><strong className="text-stone-200">Behavioral Parasitism:</strong> Once the fungus reaches the thoracic ganglia, it hijacks the host's chemotaxis, forcing it to walk towards high ant density to shed toxic spore clouds into the diffusion grid.</li>
              <li><strong className="text-stone-200">Social Immunity:</strong> The colony reacts through alarm pheromones, quarantine herding, soldier neutralization, and maternal antiseptic waves that cleanse spores and restore healthy cuticle.</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-amber-500/20 bg-stone-900/60 flex items-center justify-between">
          <span className="text-[11px] text-stone-500">Hive Xant v2.0 • Stigmergy & Pathogenesis Engine</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs transition-all active:scale-95 shadow-md"
          >
            Enter Subterranean Sanctum
          </button>
        </div>
      </div>
    </div>
  );
};
