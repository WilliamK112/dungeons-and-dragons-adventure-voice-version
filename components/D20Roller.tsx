import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { motion } from 'motion/react';
import D20Mesh from './D20Scene';

interface D20RollerProps {
  value: number | null;
  isRolling: boolean;
  currentPlayerName?: string;
  previousForCurrent?: number | null;
}

/** 骰子停止且出结果时，数字变金黄色 */
const RollNumber: React.FC<{ value: number | null; isRolling: boolean }> = ({ value, isRolling }) => {
  const settled = !isRolling && value != null;
  return (
    <motion.span
      className="absolute inset-0 z-10 flex items-center justify-center font-bold text-xl pointer-events-none select-none"
      style={{ textShadow: '0 0 12px currentColor' }}
      animate={{
        color: settled ? '#fbbf24' : 'rgb(165 243 252)',
        scale: settled ? 1.1 : 1,
        y: -2,
      }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      {isRolling ? '…' : (value ?? '-')}
    </motion.span>
  );
};

const D20Roller: React.FC<D20RollerProps> = ({ value, isRolling, currentPlayerName, previousForCurrent }) => {
  return (
    <div className="mb-4 p-3 rounded-lg border border-cyan-700/40 bg-slate-900/40">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-cyan-300">System D20</p>
          <p className="text-[11px] text-cyan-200/80">Random d20 roll is used for action judgement.</p>
          {currentPlayerName && previousForCurrent != null && (
            <p className="text-[11px] text-violet-300 mt-1">
              {currentPlayerName}'s previous roll: <span className="font-bold">{previousForCurrent}</span>
            </p>
          )}
        </div>
        <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-slate-950/90 border border-cyan-500/40 shadow-[0_0_20px_rgba(34,211,238,0.2)]">
          <Suspense fallback={<div className="w-full h-full flex items-center justify-center text-cyan-300">…</div>}>
            <Canvas
              camera={{ position: [0, 0, 4], fov: 45 }}
              gl={{ alpha: true, antialias: true }}
              dpr={[1, 2]}
            >
              <ambientLight intensity={0.6} />
              <directionalLight position={[3, 4, 5]} intensity={1.2} />
              <pointLight position={[-2, -1, 2]} color="#22d3ee" intensity={0.8} />
              <D20Mesh isRolling={isRolling} value={value} />
            </Canvas>
          </Suspense>
          <RollNumber value={value} isRolling={isRolling} />
        </div>
      </div>
    </div>
  );
};

export default D20Roller;
