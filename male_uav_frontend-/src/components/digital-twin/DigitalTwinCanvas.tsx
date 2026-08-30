import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, ContactShadows } from '@react-three/drei';
import { Engine3DModel } from './Engine3DModel';
import { EngineComponentId, EngineTelemetry } from '../../types';

interface DigitalTwinCanvasProps {
  selectedComponent: EngineComponentId | null;
  onSelectComponent: (id: EngineComponentId) => void;
  activeLayer: 'THERMAL' | 'STRESS' | 'PHYSICS_DIFF' | 'MECHANICAL';
  isExplodeActive?: boolean;
  isTransparent?: boolean;
  explorationLevel?: number;
  isExplicitZoomRequested?: boolean;
  telemetry: EngineTelemetry;
}

export const DigitalTwinCanvas: React.FC<DigitalTwinCanvasProps> = ({
  selectedComponent,
  onSelectComponent,
  activeLayer,
  isExplodeActive = false,
  isTransparent = false,
  explorationLevel = 0,
  isExplicitZoomRequested = false,
  telemetry,
}) => {
  return (
    <div className="w-full h-full relative min-h-[560px] bg-gradient-to-b from-[#0A0C10] via-[#0E1117] to-[#0A0C10] rounded overflow-hidden shadow-2xl border border-[#2A2D33]">
      <Canvas
        camera={{ position: [500, 350, 750], fov: 45, near: 1.0, far: 10000.0 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      >
        <ambientLight intensity={0.9} />
        <directionalLight position={[1000, 1500, 800]} intensity={1.8} castShadow />
        <directionalLight position={[-1000, -1000, -500]} intensity={0.6} color="#3B82F6" />
        <pointLight position={[0, 400, 0]} intensity={1.2} color="#EF4444" />
        <pointLight position={[0, -400, 0]} intensity={0.8} color="#F59E0B" />

        <Suspense fallback={null}>
          <Engine3DModel
            selectedComponent={selectedComponent}
            onSelectComponent={onSelectComponent}
            activeLayer={activeLayer}
            isExplodeActive={isExplodeActive}
            isTransparent={isTransparent}
            explorationLevel={explorationLevel}
            isExplicitZoomRequested={isExplicitZoomRequested}
            telemetry={telemetry}
          />

          <ContactShadows
            position={[0, -200, 0]}
            opacity={0.6}
            scale={1000}
            blur={2.5}
            far={500}
          />
        </Suspense>

        <OrbitControls
          target={[0, 0, 0]}
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={10}
          maxDistance={20000}
          maxPolarAngle={Math.PI / 2 + 0.1}
        />
      </Canvas>
    </div>
  );
};
