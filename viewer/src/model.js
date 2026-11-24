import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { ATLAS_PARTS } from "./atlas-parts.js";
import { prepareDissection } from "./dissection.js";
import { makeTissueMaterial } from "./tissue.js";

// Fit Mit With's named bilateral muscle meshes are in metres, with anterior along +Z.
export async function createAnatomyModel(scene) {
  const gltf = await new GLTFLoader().loadAsync(`${import.meta.env.BASE_URL}models/atlas.glb`);
  const root = gltf.scene;
  prepareDissection(root);
  const bounds = new THREE.Box3().setFromObject(root);
  const center = bounds.getCenter(new THREE.Vector3());
  const scale = 8.4 / (bounds.max.y - bounds.min.y);
  root.scale.setScalar(scale);
  root.position.copy(center).multiplyScalar(-scale);
  root.updateMatrixWorld(true);

  const muscleMeshes = [];
  const bodyMeshes = [];
  const muscleGroups = new Map();
  const replacedMaterials = new Set();
  root.traverse((mesh) => {
    if (!mesh.isMesh) return;
    const original = mesh.userData;
    const part = ATLAS_PARTS.get(original.key);
    if (original.key && !part) throw new Error(`Unknown anatomical structure: ${original.key}`);
    const kind = original.contextType ?? "muscle";
    replacedMaterials.add(mesh.material);
    mesh.material = kind === "eye" ? mesh.material.clone()
      : makeTissueMaterial(mesh, kind, part?.muscleId ?? original.supportId ?? original.boneId);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    if (!part) {
      bodyMeshes.push(mesh);
      return;
    }
    mesh.userData = {
      ...original,
      ...part,
      selectable: true,
      baseColor: mesh.material.color.clone(),
      baseEmissive: mesh.material.emissive.clone(),
      baseEmissiveIntensity: mesh.material.emissiveIntensity,
      baseScale: mesh.scale.clone()
    };
    muscleMeshes.push(mesh);
    if (!muscleGroups.has(part.muscleId)) muscleGroups.set(part.muscleId, []);
    muscleGroups.get(part.muscleId).push(mesh);
  });
  for (const material of replacedMaterials) material.dispose();
  scene.add(root);
  return { root, muscleMeshes, bodyMeshes, muscleGroups };
}
