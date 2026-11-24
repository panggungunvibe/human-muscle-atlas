import * as THREE from "three";

// Striation fields use the glTF's anatomical coordinates, in metres. The
// density stays fixed on the tissue as the camera orbits or zooms.
export function makeTissueMaterial(mesh, kind, id = "") {
  mesh.geometry.computeBoundingBox();
  const bounds = mesh.geometry.boundingBox;
  const center = bounds.getCenter(new THREE.Vector3());
  const size = bounds.getSize(new THREE.Vector3());
  const side = center.x < 0 ? -1 : 1;
  const name = String(id || mesh.name);
  const bone = kind === "bone" || kind === "cartilage";
  const fascia = kind === "connective" || kind === "tendon";
  const pigment = bone ? "#ddcdae" : fascia ? "#e5d8c4" : "#b95b49";
  const material = new THREE.MeshStandardMaterial({
    color: pigment, roughness: bone ? 0.86 : 0.68, metalness: 0, side: THREE.DoubleSide
  });
  if (bone || fascia) return material;
  const fan = /pectoralis-major|latissimus|gluteus-medius/.test(name);
  const slope = /oblique/.test(name) ? .75 : /trapezius/.test(name) ? -.8 : /gluteus-maximus/.test(name) ? .75 : /serratus/.test(name) ? -.8 : 0;
  let hueHash = 0;
  for (const c of name) hueHash = (hueHash + c.charCodeAt(0)) % 11;
  material.color.offsetHSL((hueHash - 5) * .0009, 0, (hueHash - 5) * .004);
  const breadth = Math.max(size.x, .012);
  const length = Math.max(size.y, .014);
  const uniforms = {
    fiberOrigin: { value: center }, fiberSpan: { value: new THREE.Vector2(breadth, length) },
    fiberDirection: { value: new THREE.Vector3(side, fan ? 1 : 0, slope) },
    fiberSeed: { value: hueHash * .53 },
    rectus: { value: name === "rectus-abdominis" ? 1 : 0 },
    distal: { value: /forearm-|tibialis-anterior|fibularis|extensor-digitorum|flexor-digitorum/.test(name) ? 1 : 0 }
  };
  material.onBeforeCompile = shader => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader.replace("#include <common>", "#include <common>\nvarying vec3 vTissuePoint;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvTissuePoint = position;");
    shader.fragmentShader = shader.fragmentShader.replace("#include <common>", `#include <common>
      varying vec3 vTissuePoint;
      uniform vec3 fiberOrigin;
      uniform vec2 fiberSpan;
      uniform vec3 fiberDirection;
      uniform float fiberSeed;
      uniform float rectus;
      uniform float distal;
      float fiberBand(float t) {
        float visibility = 1.0 - smoothstep(0.75,3.15,fwidth(t));
        return cos(t)*visibility;
      }`).replace("#include <color_fragment>", `#include <color_fragment>
      vec3 p = vTissuePoint - fiberOrigin;
      float across = p.x * fiberDirection.x + p.z * .56;
      float curve = across + p.y * fiberDirection.z;
      if (fiberDirection.y > .5) {
        float dx = max(.008, fiberSpan.x*.68 - across);
        curve = atan(p.y - fiberSpan.y*.13, dx) * fiberSpan.x*.74;
      } else {
        curve *= 1. + .18*pow(clamp(2.*p.y/fiberSpan.y,-1.,1.),2.);
      }
      float waviness = .62*sin(p.y*37. + across*27. + fiberSeed) + .36*sin(p.y*86.-p.z*65.);
      float t = curve*1950. + waviness;
      float ridges = .074*fiberBand(t) + .037*fiberBand(t*1.94+.7) + .054*fiberBand(t*.27+.5*sin(t*.09));
      diffuseColor.rgb *= 1. + ridges;
      diffuseColor.rgb += vec3(.025,.018,.013) * smoothstep(.3,.96,fiberBand(t*.49 + waviness));
      float level = vTissuePoint.y + .002*cos(vTissuePoint.x*93.) - .0015*sin(vTissuePoint.x*150.);
      float gap = min(abs(level-1.03), min(abs(level-1.09),abs(level-1.15)));
      float rectusEdge = smoothstep(.002,.018,abs(vTissuePoint.x)) * (1.-.68*smoothstep(.044,.069,abs(vTissuePoint.x)));
      float intersection = rectus * rectusEdge * (1.-smoothstep(.0005,.005,gap));
      float tip = distal * (1. - smoothstep(.11,.32,p.y/fiberSpan.y+.5));
      float naturalPigment = smoothstep(.04,.20,diffuseColor.r-diffuseColor.b);
      diffuseColor.rgb = mix(diffuseColor.rgb,vec3(.73,.60,.49),naturalPigment*(intersection*.35+tip*.85));
    `).replace("#include <normal_fragment_maps>", `#include <normal_fragment_maps>
      // Slight depressions along the visible tendinous intersections.
      float relief = -.012 * rectus * rectusEdge * exp(-gap*gap/.000033) + .00036*fiberBand(t);
      vec3 sx = dFdx(-vViewPosition);
      vec3 sy = dFdy(-vViewPosition);
      vec3 r1 = cross(sy,normal);
      vec3 r2 = cross(normal,sx);
      float det = dot(sx,r1);
      normal = normalize(max(abs(det),1e-10)*normal - sign(det)*(dFdx(relief)*r1 + dFdy(relief)*r2));
    `);
  };
  return material;
}
