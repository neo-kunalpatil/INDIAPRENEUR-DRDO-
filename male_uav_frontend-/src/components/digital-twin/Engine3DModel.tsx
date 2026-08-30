import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { EngineComponentId, EngineTelemetry } from '../../../types';

interface Engine3DModelProps {
  selectedComponent: EngineComponentId | null;
  onSelectComponent: (id: EngineComponentId) => void;
  activeLayer: 'THERMAL' | 'STRESS' | 'PHYSICS_DIFF' | 'MECHANICAL';
  isExplodeActive?: boolean;
  isTransparent?: boolean;
  explorationLevel?: number;
  isExplicitZoomRequested?: boolean;
  telemetry: EngineTelemetry;
}

export const Engine3DModel: React.FC<Engine3DModelProps> = ({
  selectedComponent,
  onSelectComponent,
  activeLayer,
  isExplodeActive = false,
  isTransparent = false,
  explorationLevel = 0,
  isExplicitZoomRequested = false,
  telemetry,
}) => {
  const modelRef = useRef<THREE.Group>(null);
  const { camera } = useThree();
  
  // Load real Khronos 2-Cylinder Aero CAD Engine GLB Model from public assets
  const { scene } = useGLTF('/assets/models/engine.glb');

  // Clone scene & compute exact geometric center and radius
  const { clonedScene, boundingRadius, center } = useMemo(() => {
    const cloned = scene.clone(true);
    
    // Compute exact bounding box of raw GLTF geometry in world coordinates
    const box = new THREE.Box3().setFromObject(cloned);
    const boxCenter = box.getCenter(new THREE.Vector3());
    const sphere = box.getBoundingSphere(new THREE.Sphere());

    // Recenter geometry pivot directly to origin (0, 0, 0)
    cloned.position.x = -boxCenter.x;
    cloned.position.y = -boxCenter.y;
    cloned.position.z = -boxCenter.z;

    return { clonedScene: cloned, boundingRadius: sphere.radius || 150, center: boxCenter };
  }, [scene]);

  // Telemetry driven animation multipliers
  const rpmRatio = useMemo(() => Math.max(0.1, (telemetry.rpm || 5120) / 5800), [telemetry.rpm]);

  // Calculate true camera distance based on actual bounding sphere radius & FOV trigonometry
  const fitDistance = useMemo(() => {
    const fovRad = (45 * Math.PI) / 360;
    // Places camera far enough outside so 100% of bounding sphere fits cleanly within viewport
    return (boundingRadius / Math.sin(fovRad)) * 2.2;
  }, [boundingRadius]);

  // Default camera distance: ALWAYS stays constant outside the engine UNLESS explicit zoom is requested
  const targetCamPos = useMemo(() => {
    const defaultOverview = new THREE.Vector3(fitDistance * 0.7, fitDistance * 0.5, fitDistance);

    if (!isExplicitZoomRequested) {
      return defaultOverview;
    }

    switch (explorationLevel) {
      case 1: return new THREE.Vector3(fitDistance * 0.6, fitDistance * 0.4, fitDistance * 0.8);
      case 2: return new THREE.Vector3(fitDistance * 0.45, fitDistance * 0.3, fitDistance * 0.6);
      case 3: return new THREE.Vector3(fitDistance * 0.3, fitDistance * 0.2, fitDistance * 0.4);
      case 4: return new THREE.Vector3(fitDistance * 0.2, fitDistance * 0.15, fitDistance * 0.25);
      default: return defaultOverview;
    }
  }, [explorationLevel, fitDistance, isExplicitZoomRequested]);

  // Execute ONE-TIME camera positioning on mount / model load to position camera OUTSIDE the engine
  useEffect(() => {
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.near = 1.0;
      camera.far = 10000.0;
      camera.position.set(fitDistance * 0.7, fitDistance * 0.5, fitDistance);
      camera.lookAt(0, 0, 0);
      camera.updateProjectionMatrix();
    }
  }, [camera, fitDistance]);

  // Material Shader Updates per frame
  useEffect(() => {
    clonedScene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        const meshName = mesh.name.toLowerCase();
        const isSelected = selectedComponent !== null && (
          (selectedComponent === 'cylinder_3' && meshName.includes('cyl')) ||
          (selectedComponent === 'cylinder_1' && meshName.includes('piston')) ||
          (selectedComponent === 'gearbox_prop_governor' && meshName.includes('gear'))
        );

        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((mat) => applyMaterialSettings(mat, meshName, isSelected));
        } else if (mesh.material) {
          applyMaterialSettings(mesh.material, meshName, isSelected);
        }
      }
    });
  }, [clonedScene, isTransparent, selectedComponent, activeLayer, explorationLevel, telemetry]);

  const applyMaterialSettings = (mat: THREE.Material, meshName: string, isSelected: boolean) => {
    if (mat instanceof THREE.MeshStandardMaterial || mat instanceof THREE.MeshPhysicalMaterial) {
      if (isTransparent) {
        const isOuterHousing = meshName.includes('casing') || 
                               meshName.includes('block') || 
                               meshName.includes('cover') ||
                               meshName.includes('housing');

        if (isOuterHousing) {
          mat.transparent = true;
          mat.opacity = Math.max(0.08, 0.22 - (selectedComponent ? 0.05 : 0.0));
          if (mat instanceof THREE.MeshPhysicalMaterial) {
            mat.transmission = 0.85;
            mat.ior = 1.45;
          }
        } else {
          mat.transparent = false;
          mat.opacity = 1.0;
          mat.metalness = isSelected ? 0.95 : 0.85;
          mat.roughness = isSelected ? 0.1 : 0.25;

          if (isSelected) {
            mat.emissive = new THREE.Color('#3B82F6');
            mat.emissiveIntensity = 0.45;
          } else {
            mat.emissive = new THREE.Color('#000000');
            mat.emissiveIntensity = 0.0;
          }
        }
      } else {
        mat.transparent = false;
        mat.opacity = 1.0;
      }

      if (activeLayer === 'THERMAL' && (meshName.includes('cyl') || meshName.includes('piston'))) {
        mat.color = new THREE.Color('#EF4444');
      }
    }
  };

  useFrame((state, delta) => {
    // Interpolate camera only if explicit zoom is requested by user
    if (isExplicitZoomRequested) {
      camera.position.lerp(targetCamPos, delta * 2.5);
    }

    // Rotate CAD engine internal drive shaft continuously according to engine RPM
    if (modelRef.current) {
      modelRef.current.rotation.y += delta * 1.5 * rpmRatio;
    }

    // Internal sub-component exploded hierarchy reveal when selected (without camera move)
    const targetExplode = (isExplodeActive ? 1 : 0) + (selectedComponent ? 0.35 : 0);
    const lerpFactor = 0.08;

    clonedScene.traverse((child) => {
      if (child.name && (child.name.includes('Piston') || child.name.includes('Cylinder') || child.name.includes('Gear'))) {
        const defaultX = child.userData.defaultPositionX || child.position.x;
        if (child.userData.defaultPositionX === undefined) child.userData.defaultPositionX = child.position.x;
        
        child.position.x = THREE.MathUtils.lerp(child.position.x, defaultX + targetExplode * 15.0, lerpFactor);
      }
    });
  });

  return (
    <group
      ref={modelRef}
      position={[0, 0, 0]}
      scale={1.0}
      onClick={(e) => {
        e.stopPropagation();
        const clickedMesh = e.object as THREE.Mesh;
        if (clickedMesh && clickedMesh.name) {
          const name = clickedMesh.name.toLowerCase();
          if (name.includes('piston')) onSelectComponent('cylinder_1');
          else if (name.includes('cyl')) onSelectComponent('cylinder_3');
          else if (name.includes('gear')) onSelectComponent('gearbox_prop_governor');
          else onSelectComponent('crankcase');
        }
      }}
    >
      <primitive object={clonedScene} />
    </group>
  );
};

useGLTF.preload('/assets/models/engine.glb');
