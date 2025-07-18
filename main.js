// --- Basic setup ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);

// --- Lighting ---
const pointLight = new THREE.PointLight(0xffffff, 5, 1000);
pointLight.position.set(0, 0, 0);
scene.add(pointLight);

const ambientLight = new THREE.AmbientLight(0x404040, 2);
scene.add(ambientLight);

// --- Sun ---
const sunMaterial = new THREE.MeshBasicMaterial({
  color: 0xffcc00,
  emissive: 0xffaa00,
  emissiveIntensity: 1
});
const sun = new THREE.Mesh(new THREE.SphereGeometry(2, 32, 32), sunMaterial);
scene.add(sun);

// --- Planet data ---
const planetsData = [
  ["Mercury", 0.3, 5, 0xaaaaaa],
  ["Venus", 0.5, 7, 0xffcc66],
  ["Earth", 0.5, 9, 0x3399ff],
  ["Mars", 0.4, 11, 0xff3300],
  ["Jupiter", 1.2, 14, 0xff9966],
  ["Saturn", 1.0, 17, 0xffcc99],
  ["Uranus", 0.8, 20, 0x66ffff],
  ["Neptune", 0.8, 23, 0x3366ff],
];

const orbitGroups = [];
const speeds = {};
const planets = [];

const slidersContainer = document.getElementById("speedSliders");

planetsData.forEach(([name, size, distance, color], i) => {
  // Create orbit group
  const group = new THREE.Object3D();
  scene.add(group);

  // Create planet material
  const material = new THREE.MeshStandardMaterial({
    color: color,
    emissive: color,
    emissiveIntensity: 0.1,
    roughness: 0.4,
    metalness: 0.3
  });

  // Create planet mesh
  const geometry = new THREE.SphereGeometry(size, 32, 32);
  const planet = new THREE.Mesh(geometry, material);
  planet.name = name;
  planet.position.x = distance;
  group.add(planet);

  // Special ring for Saturn
  if (name === "Saturn") {
    const ringGeo = new THREE.RingGeometry(size * 1.2, size * 2.2, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xcc9966,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.6
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.x = distance;
    group.add(ring);
  }

  // Add to scene and data
  orbitGroups.push(group);
  planets.push(planet);
  speeds[name] = 0.01 + i * 0.002;

  // Create slider
  const div = document.createElement("div");
  div.className = "slider-container";
  div.innerHTML = `
    <label for="${name}">${name}</label>
    <input type="range" id="${name}" min="0" max="0.1" step="0.001" value="${speeds[name]}">
  `;
  slidersContainer.appendChild(div);
  div.querySelector("input").addEventListener("input", (e) => {
    speeds[name] = parseFloat(e.target.value);
  });

  // Orbit ring
  const ringGeo = new THREE.RingGeometry(distance - 0.01, distance + 0.01, 64);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0x444444, side: THREE.DoubleSide });
  const orbitRing = new THREE.Mesh(ringGeo, ringMat);
  orbitRing.rotation.x = Math.PI / 2;
  scene.add(orbitRing);
});

camera.position.set(0, 20, 50);
camera.lookAt(0, 0, 0);

// --- Starfield background ---
function createStars(count) {
  const geometry = new THREE.BufferGeometry();
  const vertices = [];
  for (let i = 0; i < count; i++) {
    vertices.push(
      THREE.MathUtils.randFloatSpread(300),
      THREE.MathUtils.randFloatSpread(300),
      THREE.MathUtils.randFloatSpread(300)
    );
  }
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  const material = new THREE.PointsMaterial({ color: 0xffffff, size: 0.5 });
  const stars = new THREE.Points(geometry, material);
  scene.add(stars);
}
createStars(1000);

// --- Interactivity ---
let isPaused = false;
let isDark = true;
const tooltip = document.getElementById("tooltip");
const infoPanel = document.getElementById("planet-info");
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Pause/Resume
document.getElementById("toggleAnim").onclick = () => {
  isPaused = !isPaused;
  toggleAnim.innerText = isPaused ? "Resume" : "Pause";
};

// Theme toggle
document.getElementById("themeToggle").onclick = () => {
  isDark = !isDark;
  document.body.style.backgroundColor = isDark ? "#000" : "#fff";
  document.getElementById("controls").style.color = isDark ? "#fff" : "#000";
  tooltip.style.backgroundColor = isDark ? "#222" : "#ddd";
  tooltip.style.color = isDark ? "#fff" : "#000";
};

// Tooltip hover
window.addEventListener("mousemove", (e) => {
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(planets);
  if (intersects.length > 0) {
    const planet = intersects[0].object;
    tooltip.style.display = "block";
    tooltip.style.left = e.clientX + 10 + "px";
    tooltip.style.top = e.clientY + 10 + "px";
    tooltip.innerText = planet.name;
  } else {
    tooltip.style.display = "none";
  }
});

// Fun facts panel
const facts = {
  Mercury: "Closest planet to the Sun.",
  Venus: "Hottest planet in our solar system.",
  Earth: "Only known planet to support life.",
  Mars: "Known as the Red Planet.",
  Jupiter: "Largest planet in the system.",
  Saturn: "Famous for its ring system.",
  Uranus: "Rotates on its side!",
  Neptune: "Farthest from the Sun."
};

window.addEventListener("click", () => {
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(planets);
  if (intersects.length > 0) {
    const obj = intersects[0].object;
    const pos = new THREE.Vector3();
    obj.getWorldPosition(pos);
    camera.position.set(pos.x + 5, pos.y + 5, pos.z + 5);
    camera.lookAt(pos);
    infoPanel.style.display = "block";
    infoPanel.innerHTML = `<strong>${obj.name}</strong><br>${facts[obj.name] || ""}`;
  }
});

// --- Animate loop ---
function animate() {
  requestAnimationFrame(animate);

  if (!isPaused) {
    orbitGroups.forEach((group, i) => {
      const name = planetsData[i][0];
      group.rotation.y += speeds[name]; // orbit
      planets[i].rotation.y += 0.02;    // self-spin
    });
  }

  renderer.render(scene, camera);
}
animate();

// --- Responsive resize ---
window.addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
