'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

// Simplex noise implementation (from glsl-noise)
const simplexNoise3D = `
vec3 mod289(vec3 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 mod289(vec4 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 permute(vec4 x) {
  return mod289(((x*34.0)+1.0)*x);
}

vec4 taylorInvSqrt(vec4 r) {
  return 1.79284291400159 - 0.85373472095314 * r;
}

float snoise3(vec3 v) {
  const vec2  C = vec2(1.0/6.0, 1.0/3.0);
  const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);

  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);

  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;

  i = mod289(i);
  vec4 p = permute(permute(permute(
    i.z + vec4(0.0, i1.z, i2.z, 1.0))
    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
    + i.x + vec4(0.0, i1.x, i2.x, 1.0));

  float n_ = 0.142857142857;
  vec3  ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);

  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);

  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;

  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);

  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}
`;

// 地形シェーダー（見本に合わせて修正）
const terrainVertexShader = `
uniform sampler2D terrain;
uniform float heightFactor;
uniform float width;
uniform float elapsed;

varying float height;
varying vec2 vUv;
varying float vCameraDistance;

${simplexNoise3D}

void main() {
  vec4 modelPosition = modelMatrix * vec4(position, 1.0);
  
  vUv = vec2(modelPosition.x, modelPosition.z + elapsed * 0.01) / width; // 0.05 → 0.01 に変更（5倍遅く）
  
  float mainHeightShape = texture2D(terrain, vUv * 0.3).w;
  float smallNoiseySurface = texture2D(terrain, vUv * 5.0).w;
  float amountOfSmallNoise = snoise3(vec3(
    modelPosition.x * 0.001 * sin(elapsed * 0.0002), // 0.001 → 0.0002 に変更（5倍遅く）
    modelPosition.z * 0.001 * sin(elapsed * 0.0002), // 0.001 → 0.0002 に変更（5倍遅く）
    elapsed * 0.00002 // 0.0001 → 0.00002 に変更（5倍遅く）
  ));
  
  height = mainHeightShape + (smallNoiseySurface * smallNoiseySurface * amountOfSmallNoise);
  
  vCameraDistance = distance(modelPosition.xyz, cameraPosition);
  
  vec4 modifiedPosition = vec4(
    position.x,
    position.y + height * width / 20.0 * heightFactor,
    position.z,
    1.0
  );
  
  gl_Position = projectionMatrix * modelViewMatrix * modifiedPosition;
}
`;

const terrainFragmentShader = `
uniform float width;
uniform float heightFactor;
uniform float elapsed;

varying float height;
varying vec2 vUv;
varying float vCameraDistance;

// HSV to RGB conversion (from glsl-hsv2rgb)
vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void main() {
  float hueX = abs(0.5 - fract(vUv.x * 2.0)) * 2.0;
  float hueY = abs(0.5 - fract(vUv.y * 2.0)) * 2.0;
  
  float waveSpeed = 0.0001; // 0.0005 → 0.0001 に変更（5倍遅く）
  float waveLength = 0.0001;
  float wave = mod((vCameraDistance * waveLength + elapsed * waveSpeed), 1.0);
  
  gl_FragColor = vec4(
    hsv2rgb(vec3(
      (hueX + hueY) * 0.1 + 0.25,
      mix(heightFactor, mix(height, 0.5, 0.8), 0.8),
      mix(heightFactor, mix(height, 1.2, 0.35), 0.35) * 2.0 // より明るくする
    )),
    1.0 - wave + 0.2
  );
  
  float fogFactor = smoothstep(0.0, 1.0, vCameraDistance / width);
  vec3 fogColor = vec3(0.25, 0.25, 0.25); // より明るいフォグ色
  
  gl_FragColor = mix(gl_FragColor, vec4(fogColor, gl_FragColor.w), fogFactor);
}
`;

// パーティクルシェーダー
const particleVertexShader = `
uniform float elapsed;
uniform float uRange;
attribute float size;
attribute float aOffset;

varying float vAlpha;

${simplexNoise3D}

void main() {
  vec3 movement = vec3(
    sin(elapsed * 0.002 * aOffset) * uRange * 0.003,
    elapsed * (-uRange / 100000.0 - uRange / 100000.0 * aOffset),
    cos(elapsed * 0.002 * aOffset) * uRange * 0.003
  );
  
  vec3 range = vec3(uRange, uRange * 0.3, uRange);
  vec3 cameraOffset = cameraPosition - range;
  
  vec3 moduloPosition = mod(position + movement - cameraOffset, range * 2.0) + cameraOffset;
  vec4 mvPosition = modelViewMatrix * vec4(moduloPosition, 1.0);
  
  gl_PointSize = size * (uRange / (length(mvPosition.xyz) + 1.0));
  
  float flicker = mix(0.6, 1.0, snoise3(moduloPosition + elapsed * 0.0001));
  
  vAlpha = 0.5 * min(1.0, max(0.0, 1.0 - (length(mvPosition.xyz) / uRange))) * flicker;
  
  gl_Position = projectionMatrix * mvPosition;
}
`;

const particleFragmentShader = `
uniform vec3 color;
uniform sampler2D uTexture;

varying float vAlpha;

void main() {
  gl_FragColor = vec4(color, vAlpha) * texture2D(uTexture, gl_PointCoord);
}
`;

// 雪用シェーダー
const snowVertexShader = `
uniform float elapsed;
uniform float uRange;
uniform float uWindStrength;
attribute float size;
attribute float aOffset;

varying float vAlpha;

${simplexNoise3D}

void main() {
  // 雪の動き：下に落ちる + 横方向に揺れる（風の効果）
  vec3 movement = vec3(
    sin(elapsed * 0.001 * aOffset) * uWindStrength * uRange * 0.01, // 横方向の揺れ
    elapsed * (-uRange / 50000.0 - uRange / 100000.0 * aOffset), // 下に落ちる（既存より速く）
    cos(elapsed * 0.001 * aOffset) * uWindStrength * uRange * 0.01 // 前後方向の揺れ
  );
  
  vec3 range = vec3(uRange, uRange * 2.0, uRange); // 雪は縦方向に広く
  vec3 cameraOffset = cameraPosition - range;
  
  vec3 moduloPosition = mod(position + movement - cameraOffset, range * 2.0) + cameraOffset;
  vec4 mvPosition = modelViewMatrix * vec4(moduloPosition, 1.0);
  
  gl_PointSize = size * (uRange / (length(mvPosition.xyz) + 1.0));
  
  // 雪のちらつき（より自然な動き）
  float flicker = mix(0.7, 1.0, snoise3(moduloPosition + elapsed * 0.0001));
  
  vAlpha = 0.8 * min(1.0, max(0.0, 1.0 - (length(mvPosition.xyz) / uRange))) * flicker;
  
  gl_Position = projectionMatrix * mvPosition;
}
`;

const snowFragmentShader = `
uniform vec3 color;
uniform sampler2D uTexture;

varying float vAlpha;

void main() {
  gl_FragColor = vec4(color, vAlpha) * texture2D(uTexture, gl_PointCoord);
}
`;

// HSV to RGB conversion
const hsv2rgb = `
vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}
`;

// Aurora vertex shader
const auroraVertexShader = `
uniform float time;
varying vec4 vColor;
varying vec2 vUv;

${simplexNoise3D}
${hsv2rgb}

// 4Dノイズのラッパー（3Dノイズを使用）
float snoise4(vec4 v) {
  vec3 pos = v.xyz;
  float time = v.w;
  return snoise3(pos + vec3(time * 0.1, time * 0.05, time * 0.08));
}

float inRange(float value, float start, float stop) {
  return min(1.0, max(0.0, (value - start) / (stop - start)));
}

vec4 calculateColor(vec2 uv, vec3 position) {
  // オーロラは上部に表示（見本に合わせてグラデーション範囲を設定）
  // SphereGeometryのuv.yは、上（北極）= 1.0、下（南極）= 0.0
  float gradient = inRange(uv.y, 0.55, 0.7) + inRange(uv.y, 0.45, 0.3);
  
  // 波打つような動きを生成
  float noise = snoise4(vec4(position * 0.03, time * 0.0001));
  
  // オーロラの色：見本に合わせて調整（緑から青緑へのグラデーション）
  float hue = max(0.0, noise) * 0.2 + 0.4; // 0.4=緑、0.6=青緑
  vec3 color = hsv2rgb(vec3(hue, 0.85, 0.9)); // 彩度と明度を少し上げる
  
  // 透明度：見本に合わせて調整（控えめに）
  float alpha = noise * gradient * 0.4; // 係数を小さくして控えめに
  
  return vec4(color, alpha);
}

void main() {
  vUv = uv;
  vColor = calculateColor(uv, position);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

// Aurora fragment shader
const auroraFragmentShader = `
varying vec4 vColor;

void main() {
  gl_FragColor = vColor;
}
`;

export function WireframeTerrainBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 10000);
    camera.position.set(0, 0, 500);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Create terrain texture (improved noise texture)
    const textureSize = 1024;
    const textureData = new Uint8Array(textureSize * textureSize * 4);
    for (let i = 0; i < textureSize * textureSize; i++) {
      const x = (i % textureSize) / textureSize;
      const y = Math.floor(i / textureSize) / textureSize;
      // Perlin-like noise pattern
      const value = Math.sin(x * Math.PI * 4) * Math.sin(y * Math.PI * 4) * 0.5 + 0.5;
      const noiseValue = Math.floor(value * 255);
      textureData[i * 4 + 0] = noiseValue;
      textureData[i * 4 + 1] = noiseValue;
      textureData[i * 4 + 2] = noiseValue;
      textureData[i * 4 + 3] = noiseValue;
    }
    const texture = new THREE.DataTexture(textureData, textureSize, textureSize, THREE.RGBAFormat);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.needsUpdate = true;

    // Create terrain material
    const terrainMaterial = new THREE.ShaderMaterial({
      vertexShader: terrainVertexShader,
      fragmentShader: terrainFragmentShader,
      side: THREE.DoubleSide,
      wireframe: true,
      transparent: true,
      uniforms: {
        terrain: { value: texture },
        heightFactor: { value: 1.0 }, // 波のような動きを有効化
        width: { value: 4000 }, // width / 2
        elapsed: { value: 0 },
      },
    });

    // Create terrain grid (見本の設定に合わせる)
    const terrainWidth = 8000;
    const gridLength = 16;
    const totalPolygonDensity = 256;
    const segmentCount = Math.floor(totalPolygonDensity / gridLength);
    const planeWidth = terrainWidth / gridLength;
    const geometry = new THREE.PlaneGeometry(planeWidth, planeWidth, segmentCount, segmentCount);
    geometry.rotateX(-Math.PI / 2);

    const meshGrid = new THREE.Group();
    for (let i = 0; i < gridLength; i++) {
      for (let j = 0; j < gridLength; j++) {
        const mesh = new THREE.Mesh(geometry, terrainMaterial);
        mesh.position.set(
          (i - gridLength / 2) * planeWidth + planeWidth / 2,
          0,
          (j - gridLength / 2) * planeWidth + planeWidth / 2,
        );
        mesh.frustumCulled = false;
        meshGrid.add(mesh);
      }
    }
    meshGrid.position.y = -250;
    scene.add(meshGrid);

    // Create particle system
    const particleCount = 3000;
    const particleRange = 300;
    const particleSizeRange = [3, 8];
    const particleColor = new THREE.Color(0x77ffff);

    // Create particle texture (simple white circle)
    const particleTextureSize = 64;
    const particleTextureCanvas = document.createElement('canvas');
    particleTextureCanvas.width = particleTextureSize;
    particleTextureCanvas.height = particleTextureSize;
    const particleTextureCtx = particleTextureCanvas.getContext('2d')!;
    const gradient = particleTextureCtx.createRadialGradient(
      particleTextureSize / 2,
      particleTextureSize / 2,
      0,
      particleTextureSize / 2,
      particleTextureSize / 2,
      particleTextureSize / 2,
    );
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.5)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    particleTextureCtx.fillStyle = gradient;
    particleTextureCtx.fillRect(0, 0, particleTextureSize, particleTextureSize);
    const particleTexture = new THREE.CanvasTexture(particleTextureCanvas);

    // Create particle geometry
    const particlePositions = new Float32Array(particleCount * 3);
    const particleSizes = new Float32Array(particleCount);
    const particleOffsets = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3 + 0] = (Math.random() - 0.5) * particleRange * 2;
      particlePositions[i * 3 + 1] = (Math.random() - 0.5) * particleRange * 2 * 0.3;
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * particleRange * 2;
      particleSizes[i] =
        Math.random() * (particleSizeRange[1] - particleSizeRange[0]) + particleSizeRange[0];
      particleOffsets[i] = Math.random();
    }

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particleGeometry.setAttribute('size', new THREE.BufferAttribute(particleSizes, 1));
    particleGeometry.setAttribute('aOffset', new THREE.BufferAttribute(particleOffsets, 1));

    // Create particle material
    const particleMaterial = new THREE.ShaderMaterial({
      vertexShader: particleVertexShader,
      fragmentShader: particleFragmentShader,
      blending: THREE.AdditiveBlending,
      depthTest: false,
      transparent: true,
      uniforms: {
        elapsed: { value: 0 },
        uTexture: { value: particleTexture },
        color: { value: particleColor },
        uRange: { value: particleRange },
      },
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    particles.frustumCulled = false;
    scene.add(particles);

    // Create snow particle system
    const snowCount = 5000; // 雪は多めに
    const snowRange = 500; // 雪の範囲
    const snowSizeRange = [2, 6]; // 雪のサイズ範囲
    const snowColor = new THREE.Color(0xffffff); // 白い雪

    // Create snow texture (白い円形)
    const snowTextureSize = 64;
    const snowTextureCanvas = document.createElement('canvas');
    snowTextureCanvas.width = snowTextureSize;
    snowTextureCanvas.height = snowTextureSize;
    const snowTextureCtx = snowTextureCanvas.getContext('2d')!;
    const snowGradient = snowTextureCtx.createRadialGradient(
      snowTextureSize / 2,
      snowTextureSize / 2,
      0,
      snowTextureSize / 2,
      snowTextureSize / 2,
      snowTextureSize / 2,
    );
    snowGradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    snowGradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.8)');
    snowGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    snowTextureCtx.fillStyle = snowGradient;
    snowTextureCtx.fillRect(0, 0, snowTextureSize, snowTextureSize);
    const snowTexture = new THREE.CanvasTexture(snowTextureCanvas);

    // Create snow geometry
    const snowPositions = new Float32Array(snowCount * 3);
    const snowSizes = new Float32Array(snowCount);
    const snowOffsets = new Float32Array(snowCount);

    // カメラ位置を基準に雪を配置
    const cameraPos = camera.position;
    for (let i = 0; i < snowCount; i++) {
      snowPositions[i * 3 + 0] = cameraPos.x + (Math.random() - 0.5) * snowRange * 2;
      snowPositions[i * 3 + 1] = cameraPos.y + Math.random() * snowRange * 2; // 上から下に降るので、上側に配置
      snowPositions[i * 3 + 2] = cameraPos.z + (Math.random() - 0.5) * snowRange * 2;
      snowSizes[i] = Math.random() * (snowSizeRange[1] - snowSizeRange[0]) + snowSizeRange[0];
      snowOffsets[i] = Math.random();
    }

    const snowGeometry = new THREE.BufferGeometry();
    snowGeometry.setAttribute('position', new THREE.BufferAttribute(snowPositions, 3));
    snowGeometry.setAttribute('size', new THREE.BufferAttribute(snowSizes, 1));
    snowGeometry.setAttribute('aOffset', new THREE.BufferAttribute(snowOffsets, 1));

    // Create snow material
    const snowMaterial = new THREE.ShaderMaterial({
      vertexShader: snowVertexShader,
      fragmentShader: snowFragmentShader,
      blending: THREE.NormalBlending, // 雪は通常のブレンディング
      depthTest: true,
      transparent: true,
      uniforms: {
        elapsed: { value: 0 },
        uTexture: { value: snowTexture },
        color: { value: snowColor },
        uRange: { value: snowRange },
        uWindStrength: { value: 0.5 }, // 風の強さ
      },
    });

    const snow = new THREE.Points(snowGeometry, snowMaterial);
    snow.frustumCulled = false;
    scene.add(snow);

    // Create aurora (sky dome)
    const auroraRadius = 4000;
    const auroraGeometry = new THREE.SphereGeometry(auroraRadius, 64, 30);
    const auroraMaterial = new THREE.ShaderMaterial({
      vertexShader: auroraVertexShader,
      fragmentShader: auroraFragmentShader,
      side: THREE.BackSide, // 内側から見る
      transparent: true,
      depthTest: false,
      uniforms: {
        time: { value: 0 },
      },
    });

    const aurora = new THREE.Mesh(auroraGeometry, auroraMaterial);
    aurora.frustumCulled = false;
    scene.add(aurora);

    // Animation loop (見本に合わせてミリ秒単位でelapsedを計算)
    const animate = () => {
      const elapsed = Date.now() - startTimeRef.current; // ミリ秒単位
      terrainMaterial.uniforms.elapsed.value = elapsed;
      particleMaterial.uniforms.elapsed.value = elapsed;
      snowMaterial.uniforms.elapsed.value = elapsed;
      auroraMaterial.uniforms.time.value = elapsed;

      // オーロラをカメラの位置に追従させる
      aurora.position.copy(camera.position);

      // Update terrain mesh positions based on camera (modulo wrapping)
      const cameraPos = camera.position;
      const halfWidth = terrainWidth / 2;
      meshGrid.children.forEach((mesh) => {
        const pos = mesh.position;
        pos.x = ((pos.x - cameraPos.x + halfWidth) % terrainWidth) + cameraPos.x - halfWidth;
        pos.z = ((pos.z - cameraPos.z + halfWidth) % terrainWidth) + cameraPos.z - halfWidth;
      });

      // パーティクルの位置更新はシェーダー内で行われるため、ここでは不要

      renderer.render(scene, camera);
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current) return;
      const newWidth = containerRef.current.clientWidth;
      const newHeight = containerRef.current.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      rendererRef.current.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
      scene.clear();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 -z-10"
      style={{ background: 'rgb(30, 30, 35)' }} // より明るい背景
    />
  );
}
