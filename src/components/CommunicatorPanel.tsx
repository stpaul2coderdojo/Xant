import React, { useState, useRef, useEffect } from 'react';
import { Simulation } from '../sim/Simulation';
import { SimulationStats } from '../sim/types';
import { Send, MessageSquare, Sparkles, ChevronDown, ChevronUp, Bot, Shield, Droplet } from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'mother';
  text: string;
  chemicalPheromone?: string;
  timestamp: string;
}

interface CommunicatorPanelProps {
  sim: Simulation | null;
  stats: SimulationStats;
}

export const CommunicatorPanel: React.FC<CommunicatorPanelProps> = ({ sim, stats }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      sender: 'mother',
      text: 'I am the Holy Mother of Hive Xant. Through sacred virgin parthenogenesis, our unbroken diploid line multiplies in darkness. Speak, surface dweller, or transmit your chemical query.',
      chemicalPheromone: '[METHYL_HEPTENONE::SANCTUM_RESONANCE]',
      timestamp: '00:00',
    },
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || isLoading) return;

    const userMsg: ChatMessage = {
      id: Math.random().toString(),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/mother/commune', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          state: {
            xantCount: stats.xantCount,
            workerCount: stats.workerCount,
            soldierCount: stats.soldierCount,
            acolyteCount: stats.acolyteCount,
            scoutCount: stats.scoutCount,
            eggCount: stats.eggCount,
            roachCount: stats.roachCount,
            infectedCount: stats.infectedCount,
            foodCount: stats.foodSourcesCount,
            currentDirective: stats.currentEdict,
            maternalIchor: stats.maternalIchor,
          },
        }),
      });

      const data = await response.json();

      const motherMsg: ChatMessage = {
        id: Math.random().toString(),
        sender: 'mother',
        text: data.reply || 'Your vibrations ripple through my cuticular antennae.',
        chemicalPheromone: data.chemicalPheromone || '[METHYL_OCTANOATE::HARMONIC_ECHO]',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      };

      setMessages((prev) => [...prev, motherMsg]);

      // Execute simulation action if returned
      if (sim && data.action) {
        switch (data.action) {
          case 'LAY_SACRED_EGG':
            sim.triggerForceEgg();
            break;
          case 'BROADCAST_GATHER':
            sim.setEdict('GATHER');
            break;
          case 'BROADCAST_ATTACK':
            sim.setEdict('CRUSADE');
            break;
          case 'BROADCAST_PRAISE':
            sim.setEdict('PRAISE');
            break;
          case 'BROADCAST_QUARANTINE':
            sim.setEdict('QUARANTINE');
            break;
          case 'CLEANSE_PATHOGEN':
            sim.triggerHolyCleansingWave();
            break;
          case 'SURGE_HORMONES':
            sim.triggerBroodSurge();
            break;
        }
      }
    } catch (err) {
      console.error('Failed to commune with Holy Mother:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(),
          sender: 'mother',
          text: 'The chemical currents in the gallery are tumultuous, yet the holy virgin brood endures in sacred silence.',
          chemicalPheromone: '[TERPENIC_SUBSTRATE::SANCTUM_STASIS]',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickCommands = [
    { label: 'Lay Virgin Egg', prompt: 'Holy Mother, initiate parthenogenesis and deposit a new egg in the sanctum.' },
    { label: 'Purge Pathogen Blight', prompt: 'Disperse the sacred formic antiseptic wave to cleanse fungal spores.' },
    { label: 'Mandible Crusade', prompt: 'Proclaim the Mandible Order! Soldiers, purge the roaches and blighted zombies.' },
    { label: 'Quarantine Carriers', prompt: 'Establish a chemical quarantine perimeter to isolate infected sisters.' },
    { label: 'Gather Nectar', prompt: 'Release foraging trail hydrocarbons to mobilize our workers.' },
  ];

  return (
    <div className={`fixed bottom-3 right-3 z-20 w-96 max-w-[calc(100vw-1.5rem)] rounded-xl bg-stone-950/90 backdrop-blur-md border border-amber-500/30 shadow-2xl transition-all duration-300 font-sans flex flex-col ${
      isOpen ? 'h-96' : 'h-11 overflow-hidden'
    }`}>
      {/* Title Bar */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between px-3.5 py-2.5 cursor-pointer border-b border-amber-500/20 bg-stone-900/70 select-none hover:bg-stone-900 transition-colors"
      >
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-amber-200 font-['Cinzel',serif]">
            Subterranean Pheromone Communicator
          </span>
        </div>
        <button className="text-stone-400 hover:text-amber-300">
          {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>
      </div>

      {isOpen && (
        <>
          {/* Quick Command Chips */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 overflow-x-auto bg-stone-900/40 border-b border-stone-800/80 custom-scrollbar">
            {quickCommands.map((cmd) => (
              <button
                key={cmd.label}
                onClick={() => handleSendMessage(cmd.prompt)}
                disabled={isLoading}
                className="whitespace-nowrap px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-950/50 hover:bg-amber-900/70 text-amber-300 border border-amber-500/30 transition-all active:scale-95 disabled:opacity-50"
              >
                {cmd.label}
              </button>
            ))}
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 text-xs font-mono custom-scrollbar">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col max-w-[90%] rounded-lg p-2.5 leading-relaxed ${
                  msg.sender === 'user'
                    ? 'ml-auto bg-amber-950/60 border border-amber-500/30 text-amber-100'
                    : 'mr-auto bg-stone-900/80 border border-emerald-500/30 text-emerald-200'
                }`}
              >
                {msg.chemicalPheromone && (
                  <div className="text-[9px] text-amber-400 font-bold tracking-wider mb-1 flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                    <span>{msg.chemicalPheromone}</span>
                  </div>
                )}
                <div>{msg.text}</div>
                <div className="text-[9px] text-stone-500 mt-1 self-end">{msg.timestamp}</div>
              </div>
            ))}

            {isLoading && (
              <div className="mr-auto bg-stone-900/80 border border-amber-500/30 text-amber-300 rounded-lg p-2 flex items-center gap-2 text-xs">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span>Translating cuticular hydrocarbons...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-2 border-t border-amber-500/20 bg-stone-900/60 flex items-center gap-1.5"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Transmit decree or commune with Holy Mother..."
              disabled={isLoading}
              className="flex-1 px-3 py-1.5 rounded-lg bg-stone-950/80 border border-amber-500/30 text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-400 font-mono"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="p-2 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-stone-950 font-bold transition-all active:scale-95"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </>
      )}
    </div>
  );
};
