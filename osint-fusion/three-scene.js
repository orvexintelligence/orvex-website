import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js";

const canvas = document.getElementById("orvex3d");
window.orvex3dBoot = "v4";
if (canvas) canvas.dataset.boot = "v5";

if (canvas) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 1.4, 9.2);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: "high-performance"
  });
  const maxPixelRatio = window.matchMedia("(max-width: 720px)").matches ? 1.1 : 1.5;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, maxPixelRatio));
  renderer.setClearColor(0x080c14, 0);

  const root = new THREE.Group();
  root.position.set(2.45, 0.05, -0.8);
  root.scale.setScalar(0.92);
  scene.add(root);

  const palette = {
    blue: new THREE.Color("#2a7fff"),
    cyan: new THREE.Color("#00b8d9"),
    green: new THREE.Color("#2eb87a"),
    amber: new THREE.Color("#ef8c00"),
    red: new THREE.Color("#e53935"),
    muted: new THREE.Color("#5a7898")
  };

  scene.add(new THREE.AmbientLight(0x90a7bf, 0.65));
  const key = new THREE.PointLight(0x2a7fff, 48, 22);
  key.position.set(3, 4, 5);
  scene.add(key);
  const rim = new THREE.PointLight(0x00b8d9, 24, 18);
  rim.position.set(-5, -1, -2);
  scene.add(rim);

  const nodeMaterial = new THREE.MeshStandardMaterial({
    color: palette.blue,
    emissive: palette.blue,
    emissiveIntensity: 0.55,
    metalness: 0.35,
    roughness: 0.22
  });
  const warnMaterial = new THREE.MeshStandardMaterial({
    color: palette.amber,
    emissive: palette.amber,
    emissiveIntensity: 0.62,
    metalness: 0.3,
    roughness: 0.25
  });
  const coreMaterial = new THREE.MeshStandardMaterial({
    color: palette.cyan,
    emissive: palette.blue,
    emissiveIntensity: 0.85,
    metalness: 0.42,
    roughness: 0.18
  });

  const sphere = new THREE.SphereGeometry(0.075, 24, 16);
  const coreGeo = new THREE.IcosahedronGeometry(0.42, 2);
  const core = new THREE.Mesh(coreGeo, coreMaterial);
  root.add(core);
  core.visible = false;

  const nodePositions = [];
  const nodeMeshes = [];
  for (let i = 0; i < 22; i += 1) {
    const radius = 1.9 + (i % 5) * 0.38;
    const angle = i * 1.12;
    const height = Math.sin(i * 1.71) * 1.35;
    const position = new THREE.Vector3(
      Math.cos(angle) * radius,
      height,
      Math.sin(angle) * radius * 0.72
    );
    nodePositions.push(position);
    const mesh = new THREE.Mesh(sphere, i % 9 === 0 ? warnMaterial : nodeMaterial);
    mesh.position.copy(position);
    mesh.scale.setScalar(i % 8 === 0 ? 1.45 : 0.82 + (i % 3) * 0.14);
    mesh.visible = false;
    root.add(mesh);
    nodeMeshes.push(mesh);
  }

  const linePositions = [];
  const addLine = (from, to) => {
    linePositions.push(from.x, from.y, from.z, to.x, to.y, to.z);
  };
  nodePositions.forEach((position, index) => {
    if (index % 2 === 0) addLine(new THREE.Vector3(0, 0, 0), position);
    if (index > 0 && index % 4 === 0) addLine(position, nodePositions[index - 1]);
  });

  const lineGeometry = new THREE.BufferGeometry();
  lineGeometry.setAttribute("position", new THREE.Float32BufferAttribute(linePositions, 3));
  const lines = new THREE.LineSegments(
    lineGeometry,
    new THREE.LineBasicMaterial({
      color: palette.muted,
      transparent: true,
      opacity: 0.18,
      blending: THREE.AdditiveBlending
    })
  );
  root.add(lines);
  lines.visible = false;

  const rings = new THREE.Group();
  root.add(rings);
  rings.visible = false;
  [1.8, 2.9, 3.85].forEach((radius, index) => {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(radius, 0.006, 8, 180),
      new THREE.MeshBasicMaterial({
        color: index % 2 ? palette.blue : palette.cyan,
        transparent: true,
        opacity: 0.14,
        blending: THREE.AdditiveBlending
      })
    );
    ring.rotation.x = Math.PI / 2 + index * 0.22;
    ring.rotation.y = index * 0.33;
    rings.add(ring);
  });

  const pulseGeometry = new THREE.TorusGeometry(0.54, 0.01, 8, 120);
  const pulseMaterial = new THREE.MeshBasicMaterial({
    color: palette.green,
    transparent: true,
    opacity: 0.72,
    blending: THREE.AdditiveBlending
  });
  const pulses = Array.from({ length: 2 }, (_, index) => {
    const pulse = new THREE.Mesh(pulseGeometry, pulseMaterial.clone());
    pulse.rotation.x = Math.PI / 2;
    pulse.userData.offset = index * 0.25;
    root.add(pulse);
    pulse.visible = false;
    return pulse;
  });

  const globe = new THREE.Group();
  globe.position.set(0, 0.62, 0);
  globe.scale.setScalar(1.32);
  root.add(globe);

  const globeShell = new THREE.Mesh(
    new THREE.SphereGeometry(1.34, 48, 28),
    new THREE.MeshBasicMaterial({
      color: palette.blue,
      transparent: true,
      opacity: 0.18,
      wireframe: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
  );
  globe.add(globeShell);

  const globeSurfaceMaterial = new THREE.MeshPhongMaterial({
    color: 0x0a6fa1,
    emissive: 0x020b16,
    emissiveIntensity: 0.82,
    transparent: true,
    opacity: 0.9,
    shininess: 24,
    depthWrite: false
  });
  const globeSurface = new THREE.Mesh(
    new THREE.SphereGeometry(1.31, 64, 40),
    globeSurfaceMaterial
  );
  globe.add(globeSurface);

  const earthTextureUrl = "https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg";
  new THREE.TextureLoader().load(
    earthTextureUrl,
    (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
      globeSurfaceMaterial.map = texture;
      globeSurfaceMaterial.needsUpdate = true;
      canvas.dataset.earthTexture = "loaded";
    },
    undefined,
    () => {
      canvas.dataset.earthTexture = "fallback";
    }
  );

  const atmosphere = new THREE.Mesh(
    new THREE.SphereGeometry(1.39, 48, 32),
    new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vViewDirection;
        void main() {
          vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
          vNormal = normalize(normalMatrix * normal);
          vViewDirection = normalize(-viewPosition.xyz);
          gl_Position = projectionMatrix * viewPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        varying vec3 vViewDirection;
        void main() {
          float rim = pow(1.0 - max(dot(vNormal, vViewDirection), 0.0), 2.25);
          gl_FragColor = vec4(0.0, 0.72, 0.85, rim * 0.42);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
  );
  globe.add(atmosphere);

  const globeRingMaterial = new THREE.LineBasicMaterial({
    color: palette.cyan,
    transparent: true,
    opacity: 0.46,
    blending: THREE.AdditiveBlending
  });
  [-60, -30, 0, 30, 60].forEach((latitude) => {
    const radius = Math.cos(THREE.MathUtils.degToRad(latitude)) * 1.34;
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(radius, 0.004, 6, 128),
      new THREE.MeshBasicMaterial({
        color: latitude === 0 ? palette.cyan : palette.muted,
        transparent: true,
        opacity: latitude === 0 ? 0.62 : 0.34,
        blending: THREE.AdditiveBlending
      })
    );
    ring.position.y = Math.sin(THREE.MathUtils.degToRad(latitude)) * 1.34;
    ring.rotation.x = Math.PI / 2;
    globe.add(ring);
  });

  for (let lon = 0; lon < 180; lon += 30) {
    const meridian = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(
        Array.from({ length: 96 }, (_, index) => {
          const theta = (index / 95) * Math.PI * 2;
          return new THREE.Vector3(Math.cos(theta) * 1.34, Math.sin(theta) * 1.34, 0);
        })
      ),
      globeRingMaterial
    );
    meridian.rotation.y = THREE.MathUtils.degToRad(lon);
    globe.add(meridian);
  }

  const cityMaterial = new THREE.PointsMaterial({
    color: palette.amber,
    size: 0.075,
    transparent: true,
    opacity: 0.94,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const cityCoords = [
    [40.7, -74], [51.5, -0.1], [48.8, 2.3], [41.9, 12.5],
    [35.7, 139.7], [1.3, 103.8], [25.2, 55.3], [-23.5, -46.6],
    [37.8, -122.4], [52.5, 13.4], [19.4, -99.1], [-33.9, 151.2]
  ];
  const toSphere = ([lat, lon], radius = 1.39) => {
    const phi = THREE.MathUtils.degToRad(90 - lat);
    const theta = THREE.MathUtils.degToRad(lon + 180);
    return new THREE.Vector3(
      -radius * Math.sin(phi) * Math.cos(theta),
      radius * Math.cos(phi),
      radius * Math.sin(phi) * Math.sin(theta)
    );
  };
  const cityGeometry = new THREE.BufferGeometry().setFromPoints(cityCoords.map((coord) => toSphere(coord)));
  globe.add(new THREE.Points(cityGeometry, cityMaterial));
  globe.add(new THREE.Points(
    cityGeometry,
    new THREE.PointsMaterial({
      color: palette.amber,
      size: 0.17,
      transparent: true,
      opacity: 0.18,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
  ));

  const continentMaterial = new THREE.LineBasicMaterial({
    color: palette.cyan,
    transparent: true,
    opacity: 0.7,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const continentOutlines = [
    [[72,-165],[62,-140],[56,-125],[48,-124],[38,-122],[25,-112],[18,-96],[25,-81],[43,-66],[54,-58],[62,-73],[70,-92],[72,-125]],
    [[13,-81],[5,-77],[-8,-79],[-22,-70],[-38,-73],[-55,-68],[-48,-50],[-25,-43],[-5,-50],[8,-62]],
    [[35,-10],[44,-9],[52,2],[59,10],[66,25],[58,40],[45,32],[36,22]],
    [[35,-17],[36,10],[31,32],[12,44],[-12,40],[-35,20],[-34,5],[-15,-5],[5,-8],[20,-17]],
    [[36,25],[48,42],[60,60],[70,100],[60,140],[45,150],[30,122],[10,105],[8,80],[24,58],[30,40]],
    [[-12,113],[-22,114],[-35,134],[-38,149],[-25,153],[-12,142],[-10,126]],
    [[59,-52],[68,-50],[78,-36],[82,-20],[73,-18],[62,-42]]
  ];
  const continentGroup = new THREE.Group();
  continentOutlines.forEach((outline) => {
    continentGroup.add(new THREE.LineLoop(
      new THREE.BufferGeometry().setFromPoints(outline.map((coord) => toSphere(coord, 1.405))),
      continentMaterial
    ));
  });
  globe.add(continentGroup);

  const routeGroup = new THREE.Group();
  const routeMaterials = [];
  const routePackets = [];
  const routePairs = [[0, 1], [1, 4], [1, 6], [8, 4], [7, 1], [11, 5]];
  routePairs.forEach(([fromIndex, toIndex], index) => {
    const start = toSphere(cityCoords[fromIndex], 1.4);
    const end = toSphere(cityCoords[toIndex], 1.4);
    const midpoint = start.clone().add(end).multiplyScalar(0.5).normalize().multiplyScalar(1.78);
    const curve = new THREE.QuadraticBezierCurve3(start, midpoint, end);
    const material = new THREE.LineBasicMaterial({
      color: index % 3 === 0 ? palette.amber : palette.cyan,
      transparent: true,
      opacity: 0.42,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    routeMaterials.push(material);
    routeGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(36)), material));
    const packet = new THREE.Mesh(
      new THREE.SphereGeometry(0.025, 10, 8),
      new THREE.MeshBasicMaterial({
        color: index % 3 === 0 ? palette.amber : palette.cyan,
        transparent: true,
        opacity: 0.95,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })
    );
    packet.userData.curve = curve;
    packet.userData.offset = index / routePairs.length;
    routeGroup.add(packet);
    routePackets.push(packet);
  });
  globe.add(routeGroup);

  const beaconGroup = new THREE.Group();
  const beaconCoords = [[51.5, -0.1], [35.7, 139.7], [37.8, -122.4], [1.3, 103.8]];
  beaconCoords.forEach((coord, index) => {
    const anchor = toSphere(coord, 1.425);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: index === 1 ? palette.amber : palette.cyan,
      transparent: true,
      opacity: 0.62,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.035, 0.068, 24), ringMaterial);
    ring.position.copy(anchor);
    ring.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), anchor.clone().normalize());
    ring.userData.offset = index * 0.23;
    beaconGroup.add(ring);
  });
  globe.add(beaconGroup);

  const scanRing = new THREE.Mesh(
    new THREE.TorusGeometry(1.47, 0.009, 8, 180),
    new THREE.MeshBasicMaterial({
      color: palette.amber,
      transparent: true,
      opacity: 0.52,
      blending: THREE.AdditiveBlending
    })
  );
  scanRing.rotation.x = Math.PI / 2;
  globe.add(scanRing);

  const satelliteBodyMaterial = new THREE.MeshStandardMaterial({
    color: 0xb7cadb,
    emissive: 0x12365a,
    emissiveIntensity: 0.42,
    metalness: 0.78,
    roughness: 0.22
  });
  const panelMaterial = new THREE.MeshStandardMaterial({
    color: 0x124c91,
    emissive: 0x0b58a8,
    emissiveIntensity: 0.65,
    metalness: 0.46,
    roughness: 0.28,
    side: THREE.DoubleSide
  });
  const antennaMaterial = new THREE.MeshBasicMaterial({
    color: palette.amber,
    transparent: true,
    opacity: 0.86,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending
  });
  const bodyGeometry = new THREE.BoxGeometry(0.18, 0.13, 0.14);
  const armGeometry = new THREE.CylinderGeometry(0.009, 0.009, 0.13, 8);
  const panelGeometry = new THREE.BoxGeometry(0.24, 0.006, 0.13);
  const mastGeometry = new THREE.CylinderGeometry(0.008, 0.008, 0.11, 8);
  const antennaGeometry = new THREE.ConeGeometry(0.065, 0.05, 20, 1, true);

  function buildSatellite(index) {
    const unit = new THREE.Group();
    unit.scale.setScalar(0.78 + index * 0.025);
    unit.userData.index = index;
    unit.add(new THREE.Mesh(bodyGeometry, satelliteBodyMaterial));

    [-1, 1].forEach((side) => {
      const arm = new THREE.Mesh(armGeometry, satelliteBodyMaterial);
      arm.rotation.z = Math.PI / 2;
      arm.position.x = side * 0.14;
      unit.add(arm);

      const panel = new THREE.Mesh(panelGeometry, panelMaterial);
      panel.position.x = side * 0.29;
      unit.add(panel);
    });

    const mast = new THREE.Mesh(mastGeometry, satelliteBodyMaterial);
    mast.position.y = 0.1;
    unit.add(mast);
    const antenna = new THREE.Mesh(antennaGeometry, antennaMaterial);
    antenna.position.y = 0.175;
    antenna.rotation.x = Math.PI;
    unit.add(antenna);

    const beacon = new THREE.Mesh(
      new THREE.SphereGeometry(0.026, 10, 8),
      new THREE.MeshBasicMaterial({
        color: palette.amber,
        transparent: true,
        opacity: 0.92,
        blending: THREE.AdditiveBlending
      })
    );
    beacon.name = "satelliteBeacon";
    beacon.position.set(0, 0.08, 0.1);
    unit.add(beacon);
    return unit;
  }

  const satelliteSystem = new THREE.Group();
  satelliteSystem.position.copy(globe.position);
  satelliteSystem.scale.copy(globe.scale);
  root.add(satelliteSystem);
  const satelliteOrbits = [
    { radius: 1.68, tiltX: 1.02, tiltY: 0.25, speed: 0.17, phase: 0.0 },
    { radius: 1.82, tiltX: 0.62, tiltY: -0.58, speed: -0.14, phase: 1.55 },
    { radius: 1.96, tiltX: 1.32, tiltY: 0.78, speed: 0.11, phase: 3.1 },
    { radius: 2.1, tiltX: 0.84, tiltY: 1.12, speed: -0.09, phase: 4.65 }
  ].map((config, index) => {
    const plane = new THREE.Group();
    plane.rotation.x = config.tiltX;
    plane.rotation.y = config.tiltY;
    plane.add(new THREE.Mesh(
      new THREE.TorusGeometry(config.radius, 0.0045, 6, 180),
      new THREE.MeshBasicMaterial({
        color: index === 0 ? palette.cyan : palette.blue,
        transparent: true,
        opacity: 0.1 + index * 0.025,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })
    ));

    const motion = new THREE.Group();
    const unit = buildSatellite(index);
    unit.position.set(config.radius, 0, 0);
    motion.add(unit);
    plane.add(motion);
    satelliteSystem.add(plane);
    return { ...config, motion, unit, beacon: unit.getObjectByName("satelliteBeacon") };
  });
  globe.visible = true;

  const commandHolo = new THREE.Group();
  commandHolo.position.set(2.2, 0.2, -0.65);
  commandHolo.scale.setScalar(1.38);
  scene.add(commandHolo);
  commandHolo.visible = false;

  const shieldMaterial = new THREE.MeshStandardMaterial({
    color: palette.cyan,
    emissive: palette.blue,
    emissiveIntensity: 1.1,
    metalness: 0.55,
    roughness: 0.16,
    transparent: true,
    opacity: 0.88
  });
  const shield = new THREE.Mesh(new THREE.OctahedronGeometry(0.72, 2), shieldMaterial);
  shield.scale.set(1, 1.28, 0.28);
  commandHolo.add(shield);

  const shieldWire = new THREE.LineSegments(
    new THREE.WireframeGeometry(new THREE.OctahedronGeometry(0.78, 2)),
    new THREE.LineBasicMaterial({
      color: palette.cyan,
      transparent: true,
      opacity: 0.68,
      blending: THREE.AdditiveBlending
    })
  );
  shieldWire.scale.set(1, 1.28, 0.28);
  commandHolo.add(shieldWire);

  const radarRings = new THREE.Group();
  commandHolo.add(radarRings);
  [1.12, 1.82, 2.55].forEach((radius, index) => {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(radius, 0.008, 8, 180),
      new THREE.MeshBasicMaterial({
        color: index % 2 ? palette.blue : palette.cyan,
        transparent: true,
        opacity: index === 0 ? 0.48 : 0.22,
        blending: THREE.AdditiveBlending
      })
    );
    ring.rotation.x = Math.PI / 2;
    radarRings.add(ring);
  });

  const verticalRing = new THREE.Mesh(
    new THREE.TorusGeometry(1.92, 0.007, 8, 180),
    new THREE.MeshBasicMaterial({
      color: palette.amber,
      transparent: true,
      opacity: 0.38,
      blending: THREE.AdditiveBlending
    })
  );
  verticalRing.rotation.y = Math.PI / 2;
  commandHolo.add(verticalRing);

  const sweepShape = new THREE.Shape();
  sweepShape.moveTo(0, 0);
  sweepShape.absarc(0, 0, 2.25, 0, Math.PI / 5, false);
  sweepShape.lineTo(0, 0);
  const sweep = new THREE.Mesh(
    new THREE.ShapeGeometry(sweepShape),
    new THREE.MeshBasicMaterial({
      color: palette.cyan,
      transparent: true,
      opacity: 0.16,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
  );
  sweep.rotation.x = -Math.PI / 2;
  commandHolo.add(sweep);

  const orbitNodes = [];
  for (let i = 0; i < 10; i += 1) {
    const marker = new THREE.Mesh(
      new THREE.SphereGeometry(i % 5 === 0 ? 0.075 : 0.045, 16, 10),
      new THREE.MeshStandardMaterial({
        color: i % 5 === 0 ? palette.amber : palette.blue,
        emissive: i % 5 === 0 ? palette.amber : palette.blue,
        emissiveIntensity: 0.9,
        transparent: true,
        opacity: 0.95
      })
    );
    marker.userData.angle = i * 0.72;
    marker.userData.radius = 1.55 + (i % 2) * 0.62;
    marker.userData.height = Math.sin(i * 1.4) * 0.68;
    commandHolo.add(marker);
    orbitNodes.push(marker);
  }

  const particleCount = 150;
  const particles = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i += 1) {
    const spread = 9.5;
    particles[i * 3] = (Math.random() - 0.5) * spread;
    particles[i * 3 + 1] = (Math.random() - 0.5) * 5.4;
    particles[i * 3 + 2] = (Math.random() - 0.5) * spread;
  }
  const particleGeometry = new THREE.BufferGeometry();
  particleGeometry.setAttribute("position", new THREE.BufferAttribute(particles, 3));
  const particleField = new THREE.Points(
    particleGeometry,
    new THREE.PointsMaterial({
      color: palette.blue,
      size: 0.018,
      transparent: true,
      opacity: 0.42,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
  );
  scene.add(particleField);

  function resize() {
    const { clientWidth, clientHeight } = canvas;
    const isMobile = clientWidth <= 720;
    renderer.setSize(clientWidth, clientHeight, false);
    camera.fov = isMobile ? 50 : 45;
    camera.aspect = clientWidth / Math.max(clientHeight, 1);
    camera.position.set(0, isMobile ? 1.22 : 1.4, isMobile ? 11.4 : 9.2);
    root.position.set(isMobile ? 0.88 : 2.45, isMobile ? 0.18 : 0.05, isMobile ? -1.35 : -0.8);
    root.scale.setScalar(isMobile ? 0.52 : 0.92);
    camera.updateProjectionMatrix();
  }

  window.addEventListener("resize", resize);
  resize();

  const clock = new THREE.Clock();
  const activeColor = new THREE.Color();
  let analysisActive = false;
  window.addEventListener("orvex-analysis-state", (event) => {
    analysisActive = Boolean(event.detail?.active);
  });

  function animate() {
    const time = clock.getElapsedTime();
    const intensity = analysisActive ? 1 : 0;
    const speed = analysisActive ? 1.8 : 1;
    activeColor.copy(palette.blue).lerp(palette.amber, intensity * 0.5).lerp(palette.cyan, intensity * 0.35);
    nodeMaterial.emissive.copy(activeColor);
    nodeMaterial.emissiveIntensity = analysisActive ? 0.95 : 0.55;
    coreMaterial.emissive.copy(activeColor);
    coreMaterial.emissiveIntensity = analysisActive ? 1.25 : 0.85;
    particleField.material.color.copy(activeColor);
    particleField.material.opacity = analysisActive ? 0.82 : 0.42;
    key.intensity = analysisActive ? 82 : 48;
    rim.intensity = analysisActive ? 46 : 24;
    root.rotation.y = time * 0.07 * speed;
    root.rotation.x = Math.sin(time * 0.2 * speed) * 0.045;
    globe.rotation.y = -time * 0.22 * speed;
    globe.rotation.x = Math.sin(time * 0.18) * 0.08;
    globeShell.material.opacity = analysisActive ? 0.28 : 0.18;
    atmosphere.scale.setScalar(1 + Math.sin(time * 0.7) * 0.006);
    scanRing.rotation.z = time * (analysisActive ? 0.46 : 0.16);
    scanRing.material.opacity = analysisActive ? 0.78 : 0.48 + Math.sin(time * 1.4) * 0.08;
    routeMaterials.forEach((material, index) => {
      material.opacity = (analysisActive ? 0.64 : 0.34) + Math.sin(time * 1.3 + index) * 0.12;
    });
    routePackets.forEach((packet, index) => {
      const phase = (time * (analysisActive ? 0.28 : 0.14) + packet.userData.offset) % 1;
      packet.position.copy(packet.userData.curve.getPointAt(phase));
      packet.scale.setScalar(1 + Math.sin(time * 4 + index) * 0.28);
    });
    beaconGroup.children.forEach((beacon, index) => {
      const phase = (time * 0.55 + beacon.userData.offset) % 1;
      beacon.scale.setScalar(0.72 + phase * 2.4);
      beacon.material.opacity = Math.max(0.08, (analysisActive ? 0.9 : 0.62) * (1 - phase));
    });
    satelliteOrbits.forEach((orbit, index) => {
      const orbitSpeed = analysisActive ? orbit.speed * 1.8 : orbit.speed;
      orbit.motion.rotation.z = orbit.phase + time * orbitSpeed;
      orbit.unit.rotation.y = -orbit.motion.rotation.z + Math.sin(time * 0.5 + index) * 0.12;
      orbit.unit.rotation.z = Math.sin(time * 0.7 + index * 0.8) * 0.08;
      const pulse = 0.5 + Math.max(0, Math.sin(time * 3.2 + index * 1.4)) * 0.5;
      orbit.beacon.scale.setScalar(0.75 + pulse * 1.5);
      orbit.beacon.material.opacity = 0.45 + pulse * 0.5;
    });
    cityMaterial.color.copy(analysisActive ? palette.amber : palette.cyan);
    cityMaterial.opacity = analysisActive ? 1 : 0.82;
    commandHolo.rotation.y = time * 0.08 * speed;
    commandHolo.rotation.x = Math.sin(time * 0.18) * 0.035;
    shield.rotation.y = time * 0.22 * speed;
    shield.rotation.z = Math.sin(time * 0.42) * 0.035;
    shieldWire.rotation.copy(shield.rotation);
    shieldMaterial.emissive.copy(activeColor);
    shieldMaterial.emissiveIntensity = analysisActive ? 1.55 : 1.1;
    radarRings.rotation.z = time * 0.06 * speed;
    verticalRing.rotation.z = time * 0.08 * speed;
    sweep.rotation.z = time * (analysisActive ? 0.75 : 0.22);
    sweep.material.opacity = analysisActive ? 0.28 : 0.16;
    orbitNodes.forEach((marker, index) => {
      const angle = marker.userData.angle + time * (0.11 + (index % 3) * 0.025) * speed;
      const radius = marker.userData.radius;
      marker.position.set(
        Math.cos(angle) * radius,
        marker.userData.height + Math.sin(time * 1.1 + index) * 0.08,
        Math.sin(angle) * radius * 0.32
      );
      marker.scale.setScalar(1 + Math.sin(time * 2.4 + index) * (analysisActive ? 0.18 : 0.1));
    });
    rings.rotation.z = time * 0.08 * speed;
    core.rotation.x = time * 0.42 * speed;
    core.rotation.y = time * 0.57 * speed;
    nodeMeshes.forEach((mesh, index) => {
      const scale = mesh.userData.baseScale || mesh.scale.x;
      mesh.userData.baseScale = scale;
      mesh.scale.setScalar(scale * (1 + Math.sin(time * 2.2 * speed + index) * (analysisActive ? 0.14 : 0.08)));
    });
    pulses.forEach((pulse) => {
      const phase = (time * 0.38 * speed + pulse.userData.offset) % 1;
      const scale = 1 + phase * 6.2;
      pulse.scale.setScalar(scale);
      pulse.material.color.copy(analysisActive ? palette.amber : palette.green);
      pulse.material.opacity = Math.max(0, (analysisActive ? 0.9 : 0.68) * (1 - phase));
      pulse.rotation.z = time * 0.4 * speed + phase;
    });
    particleField.rotation.y = -time * 0.025 * speed;
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  animate();
}
