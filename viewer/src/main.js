import "./styles.css";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { MUSCLES, MUSCLE_BY_ID } from "./muscle-data.js";
import { createAnatomyModel } from "./model.js";
import { ATLAS_PARTS } from "./atlas-parts.js";

const $ = id => document.getElementById(id);
const canvas = $("anatomy-canvas");
const wrap = $("canvas-wrap");
const labels = $("callouts");
const catalog = document.querySelector(".catalog-panel");
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
const requestedQuery = new URLSearchParams(window.location.search).get("q")?.trim() || "";
const labelSets = {
  front: [["deltoid",-1],["pectoralis-major",1],["biceps-brachii",-1],["rectus-abdominis",1],["sartorius",-1],["quadriceps",1],["tibialis-anterior",-1]],
  back: [["trapezius",1],["triceps-brachii",-1],["latissimus-dorsi",1],["gluteus-maximus",-1],["hamstrings",1],["gastrocnemius",-1],["achilles",1]],
  side: [["deltoid",1],["triceps-brachii",-1],["external-oblique",1],["gluteus-maximus",-1],["quadriceps",1],["gastrocnemius",-1]]
};
const ray = new THREE.Raycaster();
let renderer, camera, controls, model;
let selected = null;
let selectedMesh = null;
let hovered = null;
let isolating = false;
let filter = "all";
let view = "front";
let showLabels = true;
let tween = null;
let dirty = true;
let labelTimer = 0;
let lastTime = 0;
let lastFocus = null;
let pickable = [];

function renderCatalog() {
  const q = $("muscle-search").value.trim().toLowerCase();
  const matches = new Map();
  if (q) {
    for (const [key, part] of ATLAS_PARTS) {
      if (part.partZh.includes(q) || key.replaceAll("_"," ").includes(q)) {
        if (!matches.has(part.muscleId)) matches.set(part.muscleId,[]);
        matches.get(part.muscleId).push({key, ...part});
      }
    }
  }
  const entries = MUSCLES.filter(m => (filter === "all" || m.category === filter) &&
    (matches.has(m.id) || [m.name,m.english,m.group,m.area].join(" ").toLowerCase().includes(q)));
  const list = $("muscle-list");
  list.replaceChildren();
  for (const entry of entries) {
    const button = document.createElement("button");
    button.className = "muscle-list-button";
    button.dataset.muscleId = entry.id;
    const copy = document.createElement("span");
    copy.className = "muscle-list-copy";
    const name = document.createElement("strong");
    name.textContent = entry.name;
    const english = document.createElement("small");
    const parts = matches.get(entry.id) || [];
    english.textContent = parts.length && !entry.name.includes(q) ? parts.map(p=>p.partZh).join("、") : entry.english;
    copy.append(name,english);
    button.append(copy);
    button.onclick = () => {
      const specific = parts.length === 1 && !entry.name.includes(q);
      const mesh = specific && model?.muscleGroups.get(entry.id)?.find(m=>m.userData.key===parts[0].key);
      choose(entry.id, mesh || null, true);
    };
    list.append(button);
  }
  if (!entries.length) {
    const none = document.createElement("p");
    none.className = "empty-list-state";
    none.textContent = "没有匹配的结构。可换个名称，或重置筛选。";
    list.append(none);
  }
  $("visible-count").textContent = entries.length;
  $("muscle-count").textContent = MUSCLES.length + " 项";
}

function setFilter(value) {
  filter = value;
  for (const b of document.querySelectorAll(".filter-chip")) {
    const active = b.dataset.filter === value;
    b.classList.toggle("is-active", active); b.setAttribute("aria-pressed",String(active));
  }
  renderCatalog();
  updateAppearance(); scheduleLabels();
}

function groupBounds(id) {
  const box = new THREE.Box3();
  for (const mesh of model.muscleGroups.get(id) || []) box.expandByObject(mesh);
  return box;
}
function selectedPartName(entry, mesh) {
  if (!mesh) return entry.name;
  const side = { left:"左侧",right:"右侧",L:"左侧",R:"右侧" }[mesh.userData.side] || "";
  return side + (mesh.userData.partZh || entry.name);
}
function updateAppearance() {
  if (!model) return;
  let visibilityChanged = false;
  for (const mesh of model.muscleMeshes) {
    const id = mesh.userData.muscleId;
    const active = selectedMesh ? mesh === selectedMesh : Boolean(selected && selected === id);
    const visible = (!isolating || active) && (filter==="all" || MUSCLE_BY_ID.get(id).category===filter);
    visibilityChanged ||= mesh.visible !== visible;
    mesh.visible = visible;
    mesh.material.color.copy(mesh.userData.atlasColor);
    mesh.material.emissive.set(0);
    if (active) {
      mesh.material.color.set("#16839b");
      mesh.material.emissive.set("#083c45");
    } else if (mesh === hovered) {
      mesh.material.color.lerp(new THREE.Color("#ea9b54"),.56);
    } else if (selected) {
      mesh.material.color.lerp(new THREE.Color("#d8b4a4"),.40);
    }
  }
  for (const mesh of model.bodyMeshes) {
    visibilityChanged ||= mesh.visible === isolating;
    mesh.visible = !isolating;
  }
  if (visibilityChanged) renderer.shadowMap.needsUpdate=true;
  dirty = true;
}

function choose(id, mesh = null, focus = false) {
  const entry = MUSCLE_BY_ID.get(id);
  if (!entry) return;
  if (!selected) lastFocus = document.activeElement;
  selected = id; selectedMesh = mesh; hovered = null; isolating = false;
  const name = selectedPartName(entry,mesh);
  $("detail-name").textContent = name;
  $("detail-latin").textContent = mesh?.userData.label || entry.english;
  $("detail-region").textContent = entry.area + " · " + entry.view;
  const fields = ["group","position","area","view","layer","form","action","landmark"];
  for (const field of fields) $("detail-"+field).textContent = entry[field];
  if (mesh?.userData.partZh && mesh.userData.partZh !== entry.name) {
    $("detail-group").textContent = entry.name + " · " + entry.group;
  }
  if (mesh?.userData.layer==="deep") $("detail-layer").textContent="深层";
  $("action-heading").textContent = mesh?.userData.partZh && mesh.userData.partZh!==entry.name ? "所属肌群的主要作用" : "主要作用";
  $("group-heading").textContent = id.includes("achilles") ? "所属结构" : "所属肌群";
  $("selection-announcer").textContent = name + "，" + entry.group;
  catalog.hidden = true;
  $("detail-panel").hidden = false; $("detail-panel").scrollTop = 0;
  $("isolate").setAttribute("aria-pressed","false"); $("isolate").textContent = "单独显示";
  $("hover-tooltip").classList.remove("is-visible");
  if (focus) {
    $("close-detail").focus({preventScroll:true});
    if (model && (/深层/.test(entry.layer) || mesh?.userData.layer==="deep")) toggleIsolate();
    focusSelected();
    if (matchMedia("(max-width:760px)").matches) $("viewer").scrollIntoView({block:"start"});
  }
  updateAppearance(); scheduleLabels();
}
function clearSelection(returnFocus = false) {
  selected = null; selectedMesh = null; isolating = false; hovered = null;
  $("detail-panel").hidden = true; catalog.hidden = false;
  if (returnFocus && lastFocus instanceof HTMLElement && lastFocus.isConnected) lastFocus.focus({preventScroll:true});
  $("selection-announcer").textContent = "已返回结构目录";
  updateAppearance(); scheduleLabels();
}
function toggleIsolate() {
  if (!model || !selected) return;
  isolating = !isolating;
  $("isolate").setAttribute("aria-pressed", String(isolating));
  $("isolate").textContent = isolating ? "显示全身" : "单独显示";
  updateAppearance(); scheduleLabels();
}

function updateView() {
  const offset = camera.position.clone().sub(controls.target);
  view = Math.abs(offset.z) >= Math.abs(offset.x) ? (offset.z > 0 ? "front" : "back") : "side";
  $("view-name").textContent = {front:"前侧观 · ANTERIOR",back:"后侧观 · POSTERIOR",side:(offset.x > 0 ? "左" : "右")+"侧观 · LATERAL"}[view];
  for (const k of ["front","back","side"]) {
    $(k+"-view").classList.toggle("is-active", view === k);
    $(k+"-view").setAttribute("aria-pressed",String(view === k));
  }
}
function setRotation(active) {
  if (!controls) return;
  controls.autoRotate = active;
  $("auto-rotate").setAttribute("aria-pressed",String(active));
  $("auto-rotate").setAttribute("aria-label", active ? "关闭自动旋转" : "开启自动旋转");
  dirty = true; scheduleLabels();
}
function moveCamera(toView,target,distance) {
  if (!controls) return;
  setRotation(false);
  const spherical = new THREE.Spherical().setFromVector3(camera.position.clone().sub(controls.target));
  const targetTheta = {front:0,back:Math.PI,side:Math.PI / 2}[toView];
  const turn = Math.atan2(Math.sin(targetTheta-spherical.theta),Math.cos(targetTheta-spherical.theta));
  tween = { from:spherical, target:controls.target.clone(), to:target, distance, turn, start:performance.now() };
  dirty = true;
}
function focusSelected() {
  if (!model || !selected) return;
  const box = selectedMesh ? new THREE.Box3().setFromObject(selectedMesh) : groupBounds(selected);
  if (box.isEmpty()) return;
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const distance = Math.max(5.6,Math.max(size.y,size.x/camera.aspect)*1.6/(2*Math.tan(THREE.MathUtils.degToRad(camera.fov/2))));
  const preferred = MUSCLE_BY_ID.get(selected).preferredView;
  moveCamera(selectedMesh && !isolating ? view : preferred,center,Math.min(20,distance));
}
function fullDistance() { return Math.max(22.3,9.1/camera.aspect); }
function goToView(key) { if (controls) moveCamera(key,new THREE.Vector3(),fullDistance()); }
function updateTween(time) {
  if (!tween) return;
  const t = reducedMotion.matches ? 1 : Math.min(1,(time-tween.start)/525);
  const f = t*t*(3-2*t);
  const from = tween.from;
  controls.target.lerpVectors(tween.target,tween.to,f);
  camera.position.setFromSpherical(new THREE.Spherical(
    THREE.MathUtils.lerp(from.radius,tween.distance,f),
    THREE.MathUtils.lerp(from.phi,Math.PI/2,f), from.theta+tween.turn*f
  )).add(controls.target);
  dirty = true;
  if (t === 1) tween = null;
}

function hitAt(ndc) {
  ray.setFromCamera(ndc,camera);
  // Include bones and connective tissue so opaque foreground anatomy blocks hits.
  const hit = ray.intersectObjects(pickable.filter(m=>m.visible),false)[0];
  return hit?.object.userData.muscleId ? hit : null;
}
function pointerHit(e) {
  const r = canvas.getBoundingClientRect();
  return hitAt(new THREE.Vector2((e.clientX-r.left)*2/r.width-1,1-(e.clientY-r.top)*2/r.height));
}
function bindPointer() {
  const down = new Map();
  let multi = false;
  canvas.addEventListener("pointerdown",e=>{
    down.set(e.pointerId,{x:e.clientX,y:e.clientY,moved:false});
    if (down.size > 1) multi = true;
    tween = null; setRotation(false);
  });
  canvas.addEventListener("pointermove",e=>{
    if (down.size) {
      const p = down.get(e.pointerId);
      if (p && Math.hypot(e.clientX-p.x,e.clientY-p.y)>6) p.moved=true;
      $("hover-tooltip").classList.remove("is-visible"); return;
    }
    if (e.pointerType !== "mouse" || !model) return;
    const hit = pointerHit(e);
    const mesh = hit?.object || null;
    if (hovered !== mesh) { hovered=mesh; updateAppearance(); }
    canvas.classList.toggle("is-hovering",!!mesh);
    const tip = $("hover-tooltip"); tip.classList.toggle("is-visible",!!mesh);
    if (mesh) {
      const box = wrap.getBoundingClientRect();
      tip.textContent = selectedPartName(MUSCLE_BY_ID.get(mesh.userData.muscleId),mesh);
      tip.style.left = Math.max(0,Math.min(box.width-tip.offsetWidth-12,e.clientX-box.left))+"px";
      tip.style.top = Math.min(box.height-42,e.clientY-box.top)+"px";
    }
  });
  canvas.addEventListener("pointerup",e=>{
    const p = down.get(e.pointerId); down.delete(e.pointerId);
    const tap = p && !multi && !p.moved && e.button===0 && Math.hypot(e.clientX-p.x,e.clientY-p.y)<7;
    if (!down.size) multi = false;
    if (!tap || !model) return;
    const hit = pointerHit(e);
    if (hit) choose(hit.object.userData.muscleId,hit.object);
    else clearSelection();
  });
  canvas.addEventListener("pointercancel",e=>{down.delete(e.pointerId); if (!down.size) multi=false;});
  canvas.addEventListener("pointerleave",()=>{hovered=null; updateAppearance(); $("hover-tooltip").classList.remove("is-visible");});
}

// Attach labels only to points whose nearest visible surface belongs to that
// structure. This also avoids marking deep muscles through opaque anatomy.
function visibleAnchor(id, side) {
  const group = selectedMesh && selected===id ? [selectedMesh] : model.muscleGroups.get(id) || [];
  const bounds = groupBounds(id);
  const groupCenter = bounds.getCenter(new THREE.Vector3()).project(camera);
  const candidates = [];
  for (const mesh of group) {
    if (!mesh.visible) continue;
    const pos = mesh.geometry.getAttribute("position");
    const step = Math.max(1,Math.floor(pos.count/18));
    for (let i=0;i<pos.count;i+=step) {
      const v = new THREE.Vector3().fromBufferAttribute(pos,i).applyMatrix4(mesh.matrixWorld).project(camera);
      if (Math.abs(v.x)>.92 || Math.abs(v.y)>.94 || Math.abs(v.z)>1) continue;
      const score = Math.abs(v.y-groupCenter.y)*1.4 + Math.abs(v.x-groupCenter.x)*.22 + (v.x*side < 0 ? 2 : 0);
      candidates.push({v,score});
    }
  }
  candidates.sort((a,b)=>a.score-b.score);
  for (const {v} of candidates.slice(0,16)) {
    const hit = hitAt(v);
    if (hit?.object.userData.muscleId===id && (!selectedMesh || selectedMesh===hit.object)) return v;
  }
  return null;
}
function scheduleLabels() {
  clearTimeout(labelTimer);
  labels.style.visibility = "hidden";
  if (showLabels && model && !controls.autoRotate) labelTimer = setTimeout(renderLabels,100);
}
function renderLabels() {
  labels.replaceChildren();
  if (!model || !showLabels || controls.autoRotate) return;
  const w=wrap.clientWidth, h=wrap.clientHeight, occupied=[];
  const requested = selected ? [[selected, 1]] : labelSets[view];
  for (const [id,direction] of requested) {
    if (!model.muscleGroups.has(id)) continue;
    const v = visibleAnchor(id,direction);
    if (!v) continue;
    const x=(v.x+.99999)*w/2, y=(1-v.y)*h/2;
    const button=document.createElement("button");
    button.type="button"; button.className="pin";
    button.textContent=selected===id ? selectedPartName(MUSCLE_BY_ID.get(id),selectedMesh) : MUSCLE_BY_ID.get(id).name;
    button.classList.toggle("is-selected",selected===id);
    labels.append(button);
    const width=button.offsetWidth;
    const side = selected ? (w-x > width+65 ? 1 : -1) : direction;
    const lead=Math.min(w*.18, Math.max(26,Math.abs(w*.20 - Math.abs(x-w/2))));
    const left = side>0 ? Math.min(w-width-4,x+lead) : Math.max(4,x-lead-width);
    const line = side>0 ? left-x : x-left-width;
    if (line<4 || occupied.some(p=>Math.abs(y-p.y)<30 && left < p.right+6 && left+width > p.left-6)) {button.remove();continue;}
    occupied.push({left,right:left+width,y});
    button.classList.add(side>0?"right":"left");
    button.style.cssText="left:"+left+"px;top:"+y+"px;--leader:"+line+"px";
    button.onclick=()=>choose(id,selected===id ? selectedMesh : null);
  }
  labels.style.visibility = "visible";
}

function resize() {
  if (!renderer) return;
  const {width,height}=wrap.getBoundingClientRect();
  renderer.setSize(width,height,false);
  camera.aspect=width/Math.max(1,height); camera.updateProjectionMatrix();
  dirty=true; scheduleLabels();
}
function frame(time) {
  updateTween(time);
  controls.update(Math.min(.1,(time-lastTime)/1000));
  lastTime=time;
  if (dirty) { renderer.render(scene,camera); dirty=false; }
  requestAnimationFrame(frame);
}
const scene=new THREE.Scene();
async function initScene() {
  renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:"high-performance"});
  renderer.setPixelRatio(Math.min(2,window.devicePixelRatio || 1));
  renderer.setClearColor(0xfffbf3,0);
  renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate=false; renderer.shadowMap.needsUpdate=true;
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=1.03;
  camera=new THREE.PerspectiveCamera(24,1,.1,100);
  controls=new OrbitControls(camera,canvas); controls.enableDamping=true; controls.dampingFactor=.14;
  controls.minDistance=2.6; controls.maxDistance=36; controls.minPolarAngle=.1; controls.maxPolarAngle=Math.PI-.1;
  controls.autoRotateSpeed=.8; controls.rotateSpeed=.75;
  controls.addEventListener("change",()=>{dirty=true;updateView();scheduleLabels();});
  resize(); camera.position.set(0,0,fullDistance()); controls.update();
  new ResizeObserver(resize).observe(wrap);
  scene.add(new THREE.HemisphereLight(0xfff5e4,0xac9184,1.35));
  for (const [position,color,power] of [[[-4,7,6],0xfff1e4,2.5],[[5,2,3],0xe4edfa,.7],[[2,5,-6],0xffe4c8,1.45]]) {
    const light=new THREE.DirectionalLight(color,power); light.position.set(...position); scene.add(light);
    if (power>2) {
      light.castShadow=true;
      light.shadow.mapSize.set(2048,2048);
      Object.assign(light.shadow.camera,{left:-3.6,right:3.6,top:5.1,bottom:-5.1,near:.5,far:19});
      light.shadow.camera.updateProjectionMatrix();
      light.shadow.normalBias=.003; light.shadow.bias=-.00012;
    }
  }
  model=await createAnatomyModel(scene);
  model.root.updateMatrixWorld(true);
  for (const mesh of model.muscleMeshes) mesh.userData.atlasColor=mesh.material.color.clone();
  pickable=[...model.muscleMeshes,...model.bodyMeshes];
  bindPointer(); updateAppearance(); resize(); updateView();
  if (selected) {
    focusSelected();
  } else if (requestedQuery && $("muscle-search").value === requestedQuery && filter === "all") {
    const buttons = $("muscle-list").querySelectorAll(".muscle-list-button");
    if (buttons.length === 1) buttons[0].click();
  }
  $("canvas-loader").classList.add("is-hidden"); scheduleLabels();
  requestAnimationFrame(frame);
}

$("muscle-search").oninput=renderCatalog;
for (const b of document.querySelectorAll(".filter-chip")) b.onclick=()=>setFilter(b.dataset.filter);
$("clear-filter").onclick=()=>{$("muscle-search").value="";setFilter("all");};
for (const k of ["front","back","side"]) $(k+"-view").onclick=()=>goToView(k);
$("auto-rotate").onclick=()=>setRotation(!controls?.autoRotate);
$("reset-view").onclick=()=>{clearSelection();goToView("front");};
$("close-detail").onclick=()=>clearSelection(true);
$("locate-muscle").onclick=focusSelected;
$("isolate").onclick=toggleIsolate;
$("labels-toggle").onclick=()=>{showLabels=!showLabels;$("labels-toggle").setAttribute("aria-pressed",String(showLabels));scheduleLabels();};
$("source-toggle").onclick=()=>$("source-links").showModal();
$("geometry-credit").textContent="本图谱基于 Z-Anatomy 和 BodyParts3D 的人体结构，使用 Fit Mit With 整理的移动端网格。网页为各结构添加了中文索引、表面材质与点选标注。";
document.addEventListener("keydown",e=>{
  if (e.ctrlKey || e.metaKey || e.altKey || $("source-links").open || e.target instanceof HTMLInputElement) return;
  if (e.key==="/") { e.preventDefault();clearSelection();$("muscle-search").focus();return; }
  if (e.key==="Escape") { clearSelection(true);return; }
  if (!controls || !model) return;
  const k=e.key.toLowerCase();
  if (["f","b","s"].includes(k)) goToView({f:"front",b:"back",s:"side"}[k]);
  else if (k==="r") $("reset-view").click();
  else if (k==="a") $("auto-rotate").click();
  else if (document.activeElement===canvas) {
    const sph=new THREE.Spherical().setFromVector3(camera.position.clone().sub(controls.target));
    if (k==="arrowleft") sph.theta-=.15;
    else if (k==="arrowright") sph.theta+=.15;
    else if (k==="arrowup") sph.phi=Math.max(.15,sph.phi-.15);
    else if (k==="arrowdown") sph.phi=Math.min(Math.PI-.15,sph.phi+.15);
    else if (k==="+"||k==="=") sph.radius=Math.max(controls.minDistance,sph.radius*.88);
    else if (k==="-") sph.radius=Math.min(controls.maxDistance,sph.radius*1.14);
    else return;
    e.preventDefault(); tween=null;setRotation(false);camera.position.setFromSpherical(sph).add(controls.target);controls.update();
  }
});
$("muscle-search").value = requestedQuery;
renderCatalog();
initScene().catch(error=>{
  console.error("Anatomy model could not load",error);
  $("canvas-loader").classList.add("is-hidden"); $("webgl-error").hidden=false;
});
