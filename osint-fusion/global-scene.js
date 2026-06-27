import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js";

const canvas = document.getElementById("orvexGlobal3d");

if (canvas) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(58, 1, 0.1, 180);
  camera.position.set(0, 7.5, 12);
  camera.lookAt(0, 0, -8);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: "high-performance"
  });
  const maxPixelRatio = window.matchMedia("(max-width: 720px)").matches ? 1 : 1.35;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, maxPixelRatio));
  renderer.setClearColor(0x080c14, 0);

  const palette = {
    blue: new THREE.Color("#2a7fff"),
    cyan: new THREE.Color("#00b8d9"),
    amber: new THREE.Color("#ef8c00")
  };

  const grid = new THREE.GridHelper(70, 70, 0x2a7fff, 0x1e2d42);
  grid.position.y = -2.8;
  grid.position.z = -12;
  grid.material.transparent = true;
  grid.material.opacity = 0.18;
  scene.add(grid);

  const horizon = new THREE.LineSegments(
    new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-34, -1.6, -42),
      new THREE.Vector3(34, -1.6, -42),
      new THREE.Vector3(-34, -0.2, -54),
      new THREE.Vector3(34, -0.2, -54)
    ]),
    new THREE.LineBasicMaterial({
      color: 0x2a7fff,
      transparent: true,
      opacity: 0.22,
      blending: THREE.AdditiveBlending
    })
  );
  scene.add(horizon);

  const particleCount = 520;
  const positions = new Float32Array(particleCount * 3);
  const velocities = [];
  for (let i = 0; i < particleCount; i += 1) {
    positions[i * 3] = (Math.random() - 0.5) * 34;
    positions[i * 3 + 1] = Math.random() * 13 - 3.8;
    positions[i * 3 + 2] = Math.random() * -45;
    velocities.push(0.004 + Math.random() * 0.012);
  }

  const particleGeometry = new THREE.BufferGeometry();
  particleGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const particleMaterial = new THREE.PointsMaterial({
    color: palette.blue,
    size: 0.026,
    transparent: true,
    opacity: 0.42,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const field = new THREE.Points(particleGeometry, particleMaterial);
  scene.add(field);

  const sweepMaterial = new THREE.MeshBasicMaterial({
    color: palette.cyan,
    transparent: true,
    opacity: 0.12,
    wireframe: true,
    blending: THREE.AdditiveBlending
  });
  const sweep = new THREE.Mesh(new THREE.TorusGeometry(5.8, 0.012, 8, 160), sweepMaterial);
  sweep.rotation.x = Math.PI / 2;
  sweep.position.set(6.4, 0.4, -10);
  scene.add(sweep);

  let analysisActive = false;
  window.addEventListener("orvex-analysis-state", (event) => {
    analysisActive = Boolean(event.detail?.active);
  });

  function resize() {
    const width = canvas.clientWidth || window.innerWidth;
    const height = canvas.clientHeight || window.innerHeight;
    renderer.setSize(width, height, false);
    camera.aspect = width / Math.max(height, 1);
    camera.updateProjectionMatrix();
  }

  window.addEventListener("resize", resize);
  resize();

  const clock = new THREE.Clock();
  const activeColor = new THREE.Color();
  let lastRenderTime = 0;
  function animate(timestamp = 0) {
    requestAnimationFrame(animate);
    if (document.hidden || timestamp - lastRenderTime < 32) return;
    lastRenderTime = timestamp;
    const time = clock.getElapsedTime();
    const intensity = analysisActive ? 1 : 0;
    const speed = analysisActive ? 4.2 : 1;
    activeColor.copy(palette.blue).lerp(palette.amber, intensity * 0.55).lerp(palette.cyan, intensity * 0.25);

    grid.material.opacity = analysisActive ? 0.32 : 0.18;
    particleMaterial.color.copy(activeColor);
    particleMaterial.opacity = analysisActive ? 0.72 : 0.42;
    sweepMaterial.opacity = analysisActive ? 0.34 : 0.12;
    sweep.rotation.z = time * (analysisActive ? 0.65 : 0.16);
    sweep.scale.setScalar(1 + Math.sin(time * 2.2) * (analysisActive ? 0.06 : 0.02));

    const arr = particleGeometry.attributes.position.array;
    for (let i = 0; i < particleCount; i += 1) {
      arr[i * 3 + 2] += velocities[i] * speed;
      arr[i * 3 + 1] += Math.sin(time * 0.35 + i) * 0.0008 * speed;
      if (arr[i * 3 + 2] > 2) {
        arr[i * 3 + 2] = -45;
        arr[i * 3] = (Math.random() - 0.5) * 34;
      }
    }
    particleGeometry.attributes.position.needsUpdate = true;
    field.rotation.y = Math.sin(time * 0.08) * 0.04;

    renderer.render(scene, camera);
  }

  animate();
}
