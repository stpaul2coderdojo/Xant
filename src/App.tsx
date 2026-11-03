import React, { useEffect, useRef, useState } from 'react';
import { Simulation } from './sim/Simulation';
import { ActiveTool, QueenEdict, SimulationStats, ViewMode } from './sim/types';
import { soundEngine } from './sim/AudioSynth';
import { TopBar } from './components/TopBar';
import { ControlsPanel } from './components/ControlsPanel';
import { CommunicatorPanel } from './components/CommunicatorPanel';
import { InspectorModal } from './components/InspectorModal';
import { InfoGuideModal } from './components/InfoGuideModal';
import { Xant } from './sim/Xant';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const simRef = useRef<Simulation | null>(null);
  const isPointerDownRef = useRef(false);

  // Simulation state
  const [stats, setStats] = useState<SimulationStats>({
    xantCount: 26,
    workerCount: 16,
    soldierCount: 4,
    acolyteCount: 3,
    scoutCount: 3,
    eggCount: 5,
    roachCount: 2,
    infectedCount: 0,
    zombieCount: 0,
    foodSourcesCount: 2,
    maternalIchor: 65,
    currentEdict: 'HARMONY',
    totalEggsLaid: 5,
    totalRoachesPurged: 0,
    totalFoodHarvested: 0,
    pathogenPrevalence: 0,
  });

  const [activeTool, setActiveTool] = useState<ActiveTool>('FOOD');
  const [viewMode, setViewMode] = useState<ViewMode>('COMPOSITE');
  const [speed, setSpeed] = useState<number>(1.0);
  const [eggInterval, setEggInterval] = useState<number>(7);
  const [currentEdict, setCurrentEdict] = useState<QueenEdict>('HARMONY');

  // Selected Entity for Inspector
  const [selectedType, setSelectedType] = useState<'XANT' | 'QUEEN' | 'EGG' | 'ROACH' | null>(null);
  const [selectedEntity, setSelectedEntity] = useState<any | null>(null);

  // Audio & Modals
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);

  // Initialize Simulation on Mount
  useEffect(() => {
    if (!canvasRef.current) return;

    const sim = new Simulation(canvasRef.current);
    simRef.current = sim;

    sim.onStatsUpdate = (newStats) => {
      setStats(newStats);
      setCurrentEdict(newStats.currentEdict);
    };

    sim.onEntitySelected = (type, entity) => {
      setSelectedType(type);
      setSelectedEntity(entity);
    };

    sim.start();

    const handleResize = () => {
      sim.resize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      sim.stop();
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Sync controls with simulation
  useEffect(() => {
    if (simRef.current) {
      simRef.current.activeTool = activeTool;
    }
  }, [activeTool]);

  useEffect(() => {
    if (simRef.current) {
      simRef.current.viewMode = viewMode;
    }
  }, [viewMode]);

  useEffect(() => {
    if (simRef.current) {
      simRef.current.speedMultiplier = speed;
    }
  }, [speed]);

  useEffect(() => {
    if (simRef.current) {
      simRef.current.mother.eggCycleDuration = eggInterval;
    }
  }, [eggInterval]);

  const handleToggleMute = () => {
    const isNowEnabled = soundEngine.toggleMute();
    setIsMuted(!isNowEnabled);
  };

  const handleSetEdict = (edict: QueenEdict) => {
    setCurrentEdict(edict);
    if (simRef.current) {
      simRef.current.setEdict(edict);
    }
  };

  const handleCleanseXant = (xant: Xant) => {
    xant.cleanse();
  };

  const handleForceEgg = () => {
    if (simRef.current) {
      simRef.current.triggerForceEgg();
    }
  };

  // Canvas Mouse & Touch Event Handlers
  const getCanvasCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isPointerDownRef.current = true;
    const { x, y } = getCanvasCoords(e);
    simRef.current?.handlePointerDown(x, y);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isPointerDownRef.current) return;
    const { x, y } = getCanvasCoords(e);
    simRef.current?.handlePointerDrag(x, y);
  };

  const handlePointerUp = () => {
    isPointerDownRef.current = false;
  };

  // Determine cursor based on activeTool
  const getCursorClass = () => {
    switch (activeTool) {
      case 'INSPECT':
        return 'cursor-help';
      case 'FOOD':
      case 'SPORE':
      case 'ANTISEPTIC':
      case 'EGG':
      case 'ROACH':
        return 'cursor-crosshair';
      case 'WALL':
        return 'cursor-cell';
      default:
        return 'cursor-default';
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-stone-950 select-none">
      {/* Simulation Canvas */}
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        className={`absolute inset-0 w-full h-full block ${getCursorClass()} touch-none`}
      />

      {/* Top HUD Bar */}
      <TopBar
        stats={stats}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        onOpenGuide={() => setIsGuideOpen(true)}
      />

      {/* Left Directives & Simulation Controls */}
      <ControlsPanel
        sim={simRef.current}
        activeTool={activeTool}
        setActiveTool={setActiveTool}
        viewMode={viewMode}
        setViewMode={setViewMode}
        speed={speed}
        setSpeed={setSpeed}
        eggInterval={eggInterval}
        setEggInterval={setEggInterval}
        currentEdict={currentEdict}
        onSetEdict={handleSetEdict}
      />

      {/* Right Bottom Chemical Oracle / Communicator */}
      <CommunicatorPanel
        sim={simRef.current}
        stats={stats}
      />

      {/* Entity Bio-Inspector Modal */}
      <InspectorModal
        type={selectedType}
        entity={selectedEntity}
        onClose={() => {
          setSelectedType(null);
          setSelectedEntity(null);
        }}
        onCleanse={handleCleanseXant}
        onForceEgg={handleForceEgg}
      />

      {/* Bio-Computational Codex Modal */}
      {isGuideOpen && (
        <InfoGuideModal onClose={() => setIsGuideOpen(false)} />
      )}
    </div>
  );
}
