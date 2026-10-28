'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const modelFiles = [
  '/media/3D_models/dna.glb',
  '/media/3D_models/lac_repressor_with_anti-inducer_onpf_and_dna.glb',
  '/media/3D_models/zinc_finger_-_dna_nonspecific_binding.glb',
] as const;

type Cue = {
  x: number;
  y: number;
  z: number;
  rx: number;
  ry: number;
  rz: number;
  scale: number;
  opacity: number;
  cameraZ: number;
};

const cues: Cue[][] = [
  // Track 0: DNA
  [
    { x: 2.55, y: -0.05, z: 0, rx: 0.04, ry: -0.15, rz: -0.75, scale: 3.2, opacity: 1, cameraZ: 10.4 },
    { x: 2.2, y: 0.05, z: 0, rx: 0.12, ry: 0.1, rz: -0.5, scale: 3.5, opacity: 1, cameraZ: 9.8 },
    { x: 2.45, y: 0.1, z: 0, rx: 0.25, ry: 0.25, rz: -0.28, scale: 3.15, opacity: 0.9, cameraZ: 10.5 },
    { x: 2.1, y: 0.2, z: -0.4, rx: 0.2, ry: 0.45, rz: 0.1, scale: 2.7, opacity: 0.68, cameraZ: 11.2 },
    { x: 2.7, y: 0.35, z: -0.8, rx: 0.1, ry: 0.7, rz: 0.3, scale: 2.5, opacity: 0.44, cameraZ: 12 },
  ],
  // Track 1: Lac Repressor
  [
    { x: 2.3, y: -0.15, z: -0.2, rx: 0.1, ry: 0, rz: -0.2, scale: 2.35, opacity: 0, cameraZ: 10.4 },
    { x: 2.15, y: 0.05, z: 0, rx: 0.2, ry: 0.45, rz: 0.25, scale: 2.55, opacity: 0.08, cameraZ: 9.8 },
    { x: 1.9, y: 0.1, z: 0, rx: 0.05, ry: 0.9, rz: 0.55, scale: 2.85, opacity: 0.94, cameraZ: 10.5 },
    { x: 1.8, y: 0.2, z: -0.1, rx: 0.2, ry: 1.3, rz: 0.72, scale: 2.9, opacity: 0.72, cameraZ: 11.2 },
    { x: 1.6, y: 0.15, z: -0.3, rx: 0.25, ry: 1.7, rz: 0.9, scale: 2.65, opacity: 0.56, cameraZ: 12 },
  ],
  // Track 2: Zinc Finger
  [
    { x: 2.2, y: -0.1, z: -0.4, rx: 0.4, ry: -0.3, rz: 0.3, scale: 2.4, opacity: 0, cameraZ: 10.4 },
    { x: 2.35, y: 0.05, z: 0, rx: 0.35, ry: 0.2, rz: 0.52, scale: 2.45, opacity: 0.06, cameraZ: 9.8 },
    { x: 2.4, y: -0.05, z: 0, rx: 0.25, ry: 0.5, rz: 0.72, scale: 2.75, opacity: 0.1, cameraZ: 10.5 },
    { x: 2.0, y: 0.1, z: 0, rx: 0.15, ry: 1.0, rz: 0.9, scale: 3.05, opacity: 0.96, cameraZ: 11.2 },
    { x: 2.5, y: 0.25, z: -0.3, rx: 0.1, ry: 1.45, rz: 1.1, scale: 2.5, opacity: 0.8, cameraZ: 12 },
  ],
];

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const disposeObject = (object: THREE.Object3D) => {
  object.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (mesh.geometry) {
      mesh.geometry.dispose();
    }
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    materials.forEach((material) => {
      if (material) {
        const mat = material as THREE.MeshStandardMaterial & { map?: THREE.Texture };
        mat.map?.dispose();
        mat.dispose();
      }
    });
  });
};

export function BioSceneExperience() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const narrowScreen = window.matchMedia('(max-width: 720px)');
    if (reducedMotion.matches || narrowScreen.matches) {
      mount.dataset.mode = 'static';
      return;
    }

    let disposed = false;
    let active = false;
    let raf = 0;
    let renderer: THREE.WebGLRenderer | undefined;
    let scene: THREE.Scene | undefined;
    let camera: THREE.PerspectiveCamera | undefined;
    let rootGroup: THREE.Group | undefined;
    let modelGroups: Array<THREE.Group | undefined> = [];
    const loaded = new Set<number>();
    const loading = new Set<number>();
    let targetCues = cues.map((track) => track[0]);
    let targetCameraZ = cues[0][0].cameraZ;
    let previousTime = 0;
    const markerSelector = '[data-scene-step]';
    let markers: HTMLElement[] = [];
    let intersectionObserver: IntersectionObserver | undefined;

    const schedule = () => {
      active = true;
      if (!raf) raf = window.requestAnimationFrame(tick);
    };

    const readProgress = () => {
      if (!scene || !camera) return;
      markers = Array.from(document.querySelectorAll<HTMLElement>(markerSelector));
      if (!markers.length) return;
      const focus = window.innerHeight * 0.52;
      const centers = markers.map((marker) => {
        const rect = marker.getBoundingClientRect();
        return rect.top + Math.min(rect.height * 0.52, window.innerHeight * 0.55);
      });
      let left = 0;
      while (left < centers.length - 1 && centers[left + 1] < focus) left += 1;
      const right = Math.min(left + 1, centers.length - 1);
      const distance = centers[right] - centers[left];
      const t = right === left || distance <= 0 ? 0 : clamp((focus - centers[left]) / distance, 0, 1);
      const sectionIndex = clamp(Number(markers[left].dataset.sceneStepIndex ?? left), 0, cues[0].length - 1);
      const nextIndex = clamp(Number(markers[right].dataset.sceneStepIndex ?? right), 0, cues[0].length - 1);
      targetCues = cues.map((track) => {
        const a = track[sectionIndex];
        const b = track[nextIndex];
        const mix = (key: keyof Cue) => a[key] + (b[key] - a[key]) * t;
        return {
          x: mix('x'),
          y: mix('y'),
          z: mix('z'),
          rx: mix('rx'),
          ry: mix('ry'),
          rz: mix('rz'),
          scale: mix('scale'),
          opacity: mix('opacity'),
          cameraZ: mix('cameraZ'),
        };
      });
      targetCameraZ = targetCues[0].cameraZ;
      targetCues.forEach((cue, index) => {
        if (cue.opacity > 0.025) void loadModel(index);
      });
      schedule();
    };

    const tick = (time: number) => {
      raf = 0;
      if (disposed || !renderer || !scene || !camera || !rootGroup) return;
      const dt = previousTime ? Math.min((time - previousTime) / 1000, 0.05) : 0.016;
      previousTime = time;
      const damping = 1 - Math.exp(-7 * dt);
      let moving = false;

      modelGroups.forEach((group, index) => {
        if (!group) return;
        const cue = targetCues[index];
        const opacity = (group.userData.opacity as number | undefined) ?? 0;
        const nextOpacity = opacity + (cue.opacity - opacity) * damping;
        group.userData.opacity = nextOpacity;
        group.position.x += (cue.x - group.position.x) * damping;
        group.position.y += (cue.y - group.position.y) * damping;
        group.position.z += (cue.z - group.position.z) * damping;
        group.rotation.x += (cue.rx - group.rotation.x) * damping;
        group.rotation.y += (cue.ry - group.rotation.y) * damping;
        group.rotation.z += (cue.rz - group.rotation.z) * damping;
        group.scale.setScalar(group.userData.baseScale * cue.scale);

        group.traverse((object) => {
          const mesh = object as THREE.Mesh;
          if (!mesh.isMesh) return;
          const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          materials.forEach((material) => {
            const alphaMaterial = material as THREE.MeshStandardMaterial & { opacity: number; transparent: boolean; depthWrite: boolean };
            mesh.visible = nextOpacity > 0.008;
            alphaMaterial.opacity = Math.min(1, nextOpacity);
            alphaMaterial.transparent = nextOpacity < 0.99;
            alphaMaterial.depthWrite = nextOpacity > 0.98;
          });
        });

        if (
          Math.abs(cue.opacity - nextOpacity) > 0.004 ||
          Math.abs(group.position.x - cue.x) > 0.004 ||
          Math.abs(group.rotation.y - cue.ry) > 0.004
        ) {
          moving = true;
        }
      });

      camera.position.z += (targetCameraZ - camera.position.z) * damping;
      if (Math.abs(camera.position.z - targetCameraZ) > 0.004) moving = true;

      renderer.render(scene, camera);
      if (moving) raf = window.requestAnimationFrame(tick);
      else active = false;
    };

    const loadModel = async (index: number) => {
      if (disposed || loaded.has(index) || loading.has(index) || !scene) return;
      loading.add(index);
      try {
        const loader = new GLTFLoader();
        const gltf = await loader.loadAsync(modelFiles[index]);
        if (disposed || !scene || !camera) {
          disposeObject(gltf.scene);
          return;
        }
        const group = new THREE.Group();
        const box = new THREE.Box3().setFromObject(gltf.scene);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        gltf.scene.position.sub(center);
        const maxDimension = Math.max(size.x, size.y, size.z) || 1;
        const baseScale = 3.2 / maxDimension;
        group.userData.baseScale = baseScale;
        group.userData.opacity = 0;

        gltf.scene.traverse((object) => {
          const mesh = object as THREE.Mesh;
          if (!mesh.isMesh) return;
          mesh.castShadow = false;
          mesh.receiveShadow = false;
          mesh.material = Array.isArray(mesh.material)
            ? mesh.material.map((mat) => mat.clone())
            : mesh.material.clone();
          const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          materials.forEach((material) => {
            const mat = material as THREE.MeshStandardMaterial;
            if (mat.color) {
              mat.color.lerp(new THREE.Color(0x568d73), 0.2);
              mat.roughness = Math.max(mat.roughness, 0.3);
            }
            mat.transparent = true;
            mat.opacity = 0;
            mat.depthWrite = false;
          });
        });

        group.add(gltf.scene);
        scene.add(group);
        modelGroups[index] = group;
        loaded.add(index);
        readProgress();
        schedule();
      } catch {
        if (!disposed) mount.dataset.mode = 'fallback';
      } finally {
        loading.delete(index);
      }
    };

    const setup = async () => {
      try {
        if (disposed) return;
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(34, window.innerWidth / window.innerHeight, 0.1, 100);
        camera.position.set(0, 0, cues[0][0].cameraZ);
        rootGroup = new THREE.Group();
        scene.add(rootGroup);

        const ambient = new THREE.AmbientLight(0xf4f5ed, 1.5);
        const directional = new THREE.DirectionalLight(0x8fd0ae, 3.1);
        directional.position.set(-4, 5, 6);
        rootGroup.add(ambient, directional);

        const rim = new THREE.DirectionalLight(0x9fbed8, 1.25);
        rim.position.set(5, -2, -4);
        rootGroup.add(rim);

        renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: 'low-power' });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.4));
        renderer.setSize(window.innerWidth, window.innerHeight, false);
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.05;
        renderer.domElement.className = 'bio-scene-canvas';
        renderer.domElement.setAttribute('aria-hidden', 'true');
        mount.appendChild(renderer.domElement);
        mount.dataset.mode = 'webgl';

        const positions = new Float32Array(96 * 3);
        for (let i = 0; i < 96; i += 1) {
          const seed = i * 2.399963;
          positions[i * 3] = Math.sin(seed) * (2.7 + (i % 7) * 0.28);
          positions[i * 3 + 1] = Math.cos(seed * 1.31) * (1.4 + (i % 5) * 0.25);
          positions[i * 3 + 2] = -1 - (i % 11) * 0.42;
        }
        const dustGeometry = new THREE.BufferGeometry();
        dustGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        scene.add(
          new THREE.Points(
            dustGeometry,
            new THREE.PointsMaterial({
              color: 0x6f9c80,
              size: 0.012,
              transparent: true,
              opacity: 0.34,
              depthWrite: false,
            })
          )
        );

        const resize = () => {
          if (!renderer || !camera) return;
          camera.aspect = window.innerWidth / window.innerHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(window.innerWidth, window.innerHeight, false);
          schedule();
        };

        window.addEventListener('resize', resize, { passive: true });
        (mount as HTMLDivElement & { cleanupResize?: () => void }).cleanupResize = () =>
          window.removeEventListener('resize', resize);

        readProgress();
        void loadModel(0);
      } catch {
        if (!disposed) mount.dataset.mode = 'fallback';
      }
    };

    const onScroll = () => {
      readProgress();
    };

    const onMotionChange = () => {
      if (reducedMotion.matches || narrowScreen.matches) {
        mount.dataset.mode = 'static';
        if (raf) window.cancelAnimationFrame(raf);
        raf = 0;
      }
    };

    markers = Array.from(document.querySelectorAll<HTMLElement>(markerSelector));
    markers.forEach((marker, index) => {
      marker.dataset.sceneStepIndex = String(index);
    });

    if ('IntersectionObserver' in window) {
      intersectionObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const index = markers.indexOf(entry.target as HTMLElement);
            if (index > 1 && index < 4) void loadModel(index - 1);
          });
        },
        { rootMargin: '500px 0px' }
      );
      markers.forEach((marker) => intersectionObserver?.observe(marker));
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    reducedMotion.addEventListener('change', onMotionChange);
    narrowScreen.addEventListener('change', onMotionChange);
    void setup();

    return () => {
      disposed = true;
      window.removeEventListener('scroll', onScroll);
      reducedMotion.removeEventListener('change', onMotionChange);
      narrowScreen.removeEventListener('change', onMotionChange);
      intersectionObserver?.disconnect();
      (mount as HTMLDivElement & { cleanupResize?: () => void }).cleanupResize?.();
      if (raf) window.cancelAnimationFrame(raf);
      if (scene) disposeObject(scene);
      renderer?.dispose();
      renderer?.forceContextLoss();
      renderer?.domElement.remove();
      modelGroups = [];
    };
  }, []);

  return (
    <div ref={mountRef} className="bio-scene-layer" aria-hidden="true">
      <div className="bio-scene-wash" />
    </div>
  );
}
