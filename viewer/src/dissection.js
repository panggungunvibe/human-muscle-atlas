import * as THREE from "three";

// The atlas stores the intact superficial sheets. Open a dissection window
// along the rectus' own lateral border, in source coordinates (metres).
function rectusProfile(geometry) {
  const position = geometry.attributes.position;
  const index = geometry.index;
  geometry.computeBoundingBox();
  const low = geometry.boundingBox.min.y;
  const high = geometry.boundingBox.max.y;
  const segments = 36;
  const widths = [];
  for (let row = 0; row <= segments; row++) {
    const height = THREE.MathUtils.lerp(low + 0.00001, high - 0.00001, row / segments);
    let width = 0;
    for (let face = 0; face < index.count; face += 3) {
      for (let k = 0; k < 3; k++) {
        const a = index.getX(face + k);
        const b = index.getX(face + (k + 1) % 3);
        const ay = position.getY(a);
        const by = position.getY(b);
        if ((ay > height) === (by > height)) continue;
        const t = (height - ay) / (by - ay);
        const x = THREE.MathUtils.lerp(position.getX(a), position.getX(b), t);
        width = Math.max(width, Math.abs(x));
      }
    }
    // Leave a narrow rim of overlapping aponeurosis along the lateral edge.
    widths.push(Math.max(0, width - 0.002));
  }
  return y => {
    if (y < low || y > high) return 0;
    const t = (y - low) / (high - low) * segments;
    const i = Math.min(segments - 1, Math.floor(t));
    return THREE.MathUtils.lerp(widths[i], widths[i + 1], t - i);
  };
}

function openSheath(mesh, width) {
  const geometry = mesh.geometry;
  const sourcePosition = geometry.attributes.position;
  const sourceNormal = geometry.attributes.normal;
  const output = [];
  const normals = [];
  const position = new THREE.Vector3();
  const normal = new THREE.Vector3();
  const vertex = i => ({
    p: position.fromBufferAttribute(sourcePosition, i).clone(),
    n: normal.fromBufferAttribute(sourceNormal, i).clone()
  });
  const distance = p => Math.max(Math.abs(p.x) - width(p.y), 0.042 - p.z);

  for (let face = 0; face < geometry.index.count; face += 3) {
    const tri = [0, 1, 2].map(k => vertex(geometry.index.getX(face + k)));
    const clipped = [];
    for (let k = 0; k < 3; k++) {
      const a = tri[k];
      const b = tri[(k + 1) % 3];
      const da = distance(a.p);
      const db = distance(b.p);
      if (da >= 0) clipped.push(a);
      if ((da >= 0) === (db >= 0)) continue;
      const t = da / (da - db);
      clipped.push({ p: a.p.clone().lerp(b.p, t), n: a.n.clone().lerp(b.n, t).normalize() });
    }
    for (let k = 1; k + 1 < clipped.length; k++) {
      for (const v of [clipped[0], clipped[k], clipped[k + 1]]) {
        output.push(v.p.x, v.p.y, v.p.z);
        normals.push(v.n.x, v.n.y, v.n.z);
      }
    }
  }
  const cut = new THREE.BufferGeometry();
  cut.setAttribute("position", new THREE.Float32BufferAttribute(output, 3));
  cut.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  mesh.geometry = cut;
  geometry.dispose();
}

function reflectPlatysma(mesh) {
  // The low-poly atlas packs head, hands and feet into a single support mesh.
  // Isolate its two broad superficial neck sheets by connected component.
  const geometry = mesh.geometry;
  const position = geometry.attributes.position;
  const index = geometry.index.array;
  const parent = Uint32Array.from({ length: position.count }, (_, i) => i);
  const root = i => {
    while (i !== parent[i]) {
      parent[i] = parent[parent[i]];
      i = parent[i];
    }
    return i;
  };
  for (let i = 0; i < index.length; i += 3) {
    const a = root(index[i]);
    parent[root(index[i + 1])] = a;
    parent[root(index[i + 2])] = a;
  }
  const boxes = new Map();
  const point = new THREE.Vector3();
  for (let i = 0; i < position.count; i++) {
    const id = root(i);
    if (!boxes.has(id)) boxes.set(id, new THREE.Box3());
    boxes.get(id).expandByPoint(point.fromBufferAttribute(position, i));
  }
  const sheets = new Set();
  for (const [id, { min, max }] of boxes) {
    if (min.y > 1.39 && min.y < 1.41 && max.y > 1.53 && max.y < 1.55 &&
        max.x - min.x > .13 && max.z > .08) sheets.add(id);
  }
  if (sheets.size === 2) geometry.setIndex([...index].filter(i => !sheets.has(root(i))));
}

function addEyeGlobes(root) {
  // Each eyelid aperture in this dataset spans roughly 28 × 12 mm.
  // Keep the anterior poles behind the lids so those meshes shape the opening.
  const geometry = new THREE.SphereGeometry(1, 64, 48);
  const position = geometry.attributes.position;
  const sclera = new THREE.Color("#cfc6b1");
  const iris = new THREE.Color("#645143");
  const limbus = new THREE.Color("#443d35");
  const pupil = new THREE.Color("#252321");
  const color = new THREE.Color();
  const colors = [];
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i) * .014;
    const y = position.getY(i) * .0124;
    const distance = Math.hypot(x, y);
    color.copy(sclera);
    if (position.getZ(i) > 0 && distance < .0061) {
      color.copy(iris).lerp(limbus, THREE.MathUtils.smoothstep(distance, .0045, .0058));
      color.lerp(pupil, 1 - THREE.MathUtils.smoothstep(distance, .0018, .0023));
      color.lerp(sclera, THREE.MathUtils.smoothstep(distance, .0055, .0061));
    }
    colors.push(color.r, color.g, color.b);
  }
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  const material = new THREE.MeshStandardMaterial({vertexColors: true, roughness: .48});
  for (const sign of [-1, 1]) {
    const eye = new THREE.Mesh(geometry, material);
    eye.name = sign > 0 ? "Left eye" : "Right eye";
    eye.scale.set(.014, .0124, .0124);
    eye.position.set(sign * .0302, 1.5901, .064);
    eye.userData.contextType = "eye";
    root.add(eye);
  }
}

export function prepareDissection(root) {
  const rectus = new Map();
  const sheaths = [];
  root.traverse(mesh => {
    if (!mesh.isMesh) return;
    const { key, side, supportId } = mesh.userData;
    if (key === "rectus_abdominis") rectus.set(side, rectusProfile(mesh.geometry));
    // Below the arcuate line the transversus aponeurosis also passes in
    // front of the rectus. Clip that layer at the same dissection margin.
    if (["internal_oblique", "external_oblique", "transversus_abdominis"].includes(key)) sheaths.push(mesh);
    if (supportId === "head_hands_feet") reflectPlatysma(mesh);
  });
  for (const mesh of sheaths) {
    const width = rectus.get(mesh.userData.side);
    if (width) openSheath(mesh, width);
  }
  addEyeGlobes(root);
}
