// client/js/main.js
// Visual Overhaul 2.0: Miras Holográficas no Chão, Barras 3D sobre a Cabeça, 
// Moitas de Furtividade, Postes de Refletores, Sombras de Contato, Marcas de Explosão e Tone Mapping

import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { sfx } from "./audio.js";
import { CHARACTERS_CATALOG, createCharacterMesh } from "./characterModels.js";

// ================= ESTADO GLOBAL DO CLIENTE =================
const state = {
  socket: null,
  roomCode: null,
  isHost: false,
  myId: null,
  playerName: "Brawler",
  selectedCharIndex: 0,
  selectedWeapon: "pistol",
  inGame: false,
  myHp: 1000,
  mySuperCharge: 0,
  lastDashTime: 0,
  lastFireTime: 0,
  isDead: false,
  inputKeys: { w: false, a: false, s: false, d: false },
  mousePos3D: new THREE.Vector3(),
  screenShake: 0,
  gunRecoilOffset: 0
};

// ================= THREE.JS CENA PRINCIPAL COM TONE MAPPING CINEMÁTICO =================
const container = document.getElementById("canvas-container");
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0c0f18);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 26, 22);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// Tone Mapping de Cinema (ACES Filmic - Padrão de Filmes e Jogos AAA)
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.25;
container.appendChild(renderer.domElement);

// Iluminação Cinemática Estilo Desenho 3D (Luz Solar Quente + Luz Noturna Suave)
const ambientLight = new THREE.AmbientLight(0x7a8eb8, 1.2);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xfff5e0, 2.2);
dirLight.position.set(16, 34, 22);
dirLight.castShadow = true;
dirLight.shadow.mapSize.width = 2048;
dirLight.shadow.mapSize.height = 2048;
dirLight.shadow.camera.near = 0.5;
dirLight.shadow.camera.far = 100;
dirLight.shadow.camera.left = -22;
dirLight.shadow.camera.right = 22;
dirLight.shadow.camera.top = 22;
dirLight.shadow.camera.bottom = -22;
scene.add(dirLight);

// Luz Dinâmica de Disparo (Muzzle Flash Light)
const muzzlePointLight = new THREE.PointLight(0xffaa22, 0, 14);
muzzlePointLight.position.set(0, 1.5, 0);
scene.add(muzzlePointLight);

// ================= OBJETOS DA ARENA, PARTÍCULAS E DECALQUES =================
const playerMeshes = new Map();     // id -> THREE.Group
const crateMeshes = new Map();      // id -> THREE.Mesh
const dropMeshes = new Map();       // id -> THREE.Mesh
const projectileMeshes = new Map(); // id -> THREE.Mesh
const overheadBars = new Map();     // id -> THREE.Sprite
const stealthBushes = [];           // Array de meshes de arbustos
const scorchDecals = [];            // Marcas de explosão no chão

const debrisParticles = [];
const dustParticles = [];

const debrisMat = new THREE.MeshLambertMaterial({ color: 0x9b6b3c });
const dustMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 });
const scorchMat = new THREE.MeshBasicMaterial({ color: 0x111116, transparent: true, opacity: 0.75 });
const blobShadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.35 });

// 1. Marcas de Queimadura de Explosão no Chão
function spawnScorchMark(x, z, radius = 2.5) {
  const geo = new THREE.CircleGeometry(radius, 16);
  const mesh = new THREE.Mesh(geo, scorchMat.clone());
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(x, 0.03, z);
  scene.add(mesh);
  scorchDecals.push({ mesh, life: 12.0, maxLife: 12.0 });
}

// 2. Partículas de Madeira das Caixas
function spawnCrateDebris(x, z) {
  for (let i = 0; i < 14; i++) {
    const size = 0.2 + Math.random() * 0.28;
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(size, size, size), debrisMat);
    mesh.position.set(x + (Math.random() - 0.5) * 0.8, 0.8 + Math.random() * 0.6, z + (Math.random() - 0.5) * 0.8);
    mesh.castShadow = true;
    scene.add(mesh);

    debrisParticles.push({
      mesh,
      vx: (Math.random() - 0.5) * 8.5,
      vy: 4.5 + Math.random() * 6.5,
      vz: (Math.random() - 0.5) * 8.5,
      rotX: Math.random() * 12,
      rotY: Math.random() * 12,
      life: 1.3
    });
  }
}

// 3. Poeira de Dash
function spawnDashDust(x, z) {
  for (let i = 0; i < 5; i++) {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.35, 6, 6), dustMat.clone());
    mesh.position.set(x + (Math.random() - 0.5) * 0.6, 0.2, z + (Math.random() - 0.5) * 0.6);
    scene.add(mesh);
    dustParticles.push({ mesh, life: 0.45, maxLife: 0.45 });
  }
}

// 4. Popups de Dano Flutuante
function spawnDamagePopup(x, z, damage, isCrit = false) {
  const worldPos = new THREE.Vector3(x, 2.4, z);
  worldPos.project(camera);

  const screenX = ((worldPos.x + 1) / 2) * window.innerWidth;
  const screenY = ((-worldPos.y + 1) / 2) * window.innerHeight;

  const el = document.createElement("div");
  el.className = `damage-popup ${isCrit ? "crit" : ""}`;
  el.textContent = `-${damage}`;
  el.style.left = `${screenX}px`;
  el.style.top = `${screenY}px`;
  document.body.appendChild(el);

  setTimeout(() => el.remove(), 800);
}

// ================= CRIAÇÃO DAS BARRAS DE VIDA 3D FLUTUANTES (OVERHEAD BILLBOARDS) =================
function createOverheadBarSprite(name, isBot, isHost) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  const mat = new THREE.SpriteMaterial({ map: texture, depthTest: false });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(2.4, 0.6, 1);
  sprite.position.y = 2.3; // Flutua sobre a cabeça

  sprite.userData = { canvas, ctx, texture, name, isBot, isHost, currentHp: 1000 };
  updateOverheadSprite(sprite, 1000, 1000);
  return sprite;
}

function updateOverheadSprite(sprite, hp, maxHp = 1000) {
  const { canvas, ctx, texture, name, isBot, isHost } = sprite.userData;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 1. Nome do Jogador + Tag
  ctx.font = "bold 22px 'Segoe UI', sans-serif";
  ctx.textAlign = "center";
  ctx.fillStyle = "#ffffff";
  ctx.shadowColor = "#000000";
  ctx.shadowBlur = 6;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 2;

  let displayName = name;
  if (isHost) displayName = `👑 ${name}`;
  else if (isBot) displayName = `🤖 ${name}`;
  ctx.fillText(displayName, 128, 22);

  // 2. Fundo da Barra de Vida
  const barWidth = 200;
  const barHeight = 16;
  const barX = (canvas.width - barWidth) / 2;
  const barY = 32;

  ctx.shadowBlur = 0;
  ctx.fillStyle = "rgba(10, 12, 20, 0.85)";
  ctx.fillRect(barX, barY, barWidth, barHeight);

  // Borda sutil
  ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
  ctx.lineWidth = 2;
  ctx.strokeRect(barX, barY, barWidth, barHeight);

  // 3. Preenchimento de Vida com Cor Dinâmica
  const fillPct = Math.max(0, Math.min(1, hp / maxHp));
  if (fillPct > 0) {
    if (fillPct > 0.5) {
      ctx.fillStyle = "#2ed573"; // Verde saudável
    } else if (fillPct > 0.25) {
      ctx.fillStyle = "#ffa502"; // Amarelo alerta
    } else {
      ctx.fillStyle = "#ff4757"; // Vermelho crítico
    }
    ctx.fillRect(barX + 2, barY + 2, (barWidth - 4) * fillPct, barHeight - 4);
  }

  texture.needsUpdate = true;
}

// ================= MIRAS HOLOGRÁFICAS NO CHÃO (GROUND RETICLES) =================
const aimReticleGroup = new THREE.Group();
aimReticleGroup.position.y = 0.04; // Bem rente ao piso
scene.add(aimReticleGroup);

// A. Retículo Shotgun (Cone de 28 graus)
const shotgunConeGeo = new THREE.RingGeometry(1.5, 12.0, 16, 1, -Math.PI / 2 - 0.24, 0.48);
const aimMatShotgun = new THREE.MeshBasicMaterial({ color: 0xff6600, transparent: true, opacity: 0.28, side: THREE.DoubleSide });
const shotgunConeMesh = new THREE.Mesh(shotgunConeGeo, aimMatShotgun);
shotgunConeMesh.rotation.x = -Math.PI / 2;
aimReticleGroup.add(shotgunConeMesh);

// B. Retículo Sniper (Linha Laser Ciano Longa)
const sniperLineGeo = new THREE.PlaneGeometry(0.3, 30.0);
const aimMatSniper = new THREE.MeshBasicMaterial({ color: 0x00e5ff, transparent: true, opacity: 0.35 });
const sniperLineMesh = new THREE.Mesh(sniperLineGeo, aimMatSniper);
sniperLineMesh.rotation.x = -Math.PI / 2;
sniperLineMesh.position.z = 15.0; // Estende para a frente
aimReticleGroup.add(sniperLineMesh);

// C. Retículo Pistola (Linha Média Amarela)
const pistolLineGeo = new THREE.PlaneGeometry(0.35, 18.0);
const aimMatPistol = new THREE.MeshBasicMaterial({ color: 0xffcc00, transparent: true, opacity: 0.3 });
const pistolLineMesh = new THREE.Mesh(pistolLineGeo, aimMatPistol);
pistolLineMesh.rotation.x = -Math.PI / 2;
pistolLineMesh.position.z = 9.0;
aimReticleGroup.add(pistolLineMesh);

// D. Retículo Lança-Granadas (Círculo de Alvo Pulsante no Mouse)
const grenadeTargetGeo = new THREE.RingGeometry(2.8, 3.5, 24);
const aimMatGrenade = new THREE.MeshBasicMaterial({ color: 0x2ed573, transparent: true, opacity: 0.5, side: THREE.DoubleSide });
const grenadeTargetMesh = new THREE.Mesh(grenadeTargetGeo, aimMatGrenade);
grenadeTargetMesh.rotation.x = -Math.PI / 2;
scene.add(grenadeTargetMesh);

function updateAimReticle(weaponId, playerX, playerZ, angle, mousePos) {
  aimReticleGroup.position.set(playerX, 0.04, playerZ);
  aimReticleGroup.rotation.y = angle;

  shotgunConeMesh.visible = weaponId === "shotgun";
  sniperLineMesh.visible = weaponId === "sniper";
  pistolLineMesh.visible = weaponId === "pistol";

  if (weaponId === "grenade_launcher") {
    grenadeTargetMesh.visible = true;
    grenadeTargetMesh.position.set(mousePos.x, 0.05, mousePos.z);
    const pulse = 1.0 + Math.sin(Date.now() * 0.008) * 0.12;
    grenadeTargetMesh.scale.set(pulse, pulse, pulse);
  } else {
    grenadeTargetMesh.visible = false;
  }
}

// ================= MONTAGEM DA ARENA COM PROPS, MOITAS E REFLETORES =================
let arenaBuilt = false;

function buildArena3D(arenaSpec) {
  if (arenaBuilt) return;
  arenaBuilt = true;

  // 1. Piso da Arena com Textura Quadriculada Estilizada
  const floorGeo = new THREE.PlaneGeometry(36, 36);
  const floorMat = new THREE.MeshLambertMaterial({ color: 0x1f2538 });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  const grid = new THREE.GridHelper(36, 36, 0x3b466b, 0x242c44);
  grid.position.y = 0.02;
  scene.add(grid);

  // Paredes externas de Proteção
  const borderMat = new THREE.MeshLambertMaterial({ color: 0x111520 });
  const bTop = new THREE.Mesh(new THREE.BoxGeometry(37, 2.5, 1), borderMat);
  bTop.position.set(0, 1.25, -18.5);
  const bBot = new THREE.Mesh(new THREE.BoxGeometry(37, 2.5, 1), borderMat);
  bBot.position.set(0, 1.25, 18.5);
  const bLeft = new THREE.Mesh(new THREE.BoxGeometry(1, 2.5, 37), borderMat);
  bLeft.position.set(-18.5, 1.25, 0);
  const bRight = new THREE.Mesh(new THREE.BoxGeometry(1, 2.5, 37), borderMat);
  bRight.position.set(18.5, 1.25, 0);
  scene.add(bTop, bBot, bLeft, bRight);

  // 2. Paredes de Concreto
  const wallMat = new THREE.MeshLambertMaterial({ color: 0x3a4463 });
  for (const wall of arenaSpec.solidWalls) {
    const wallGeo = new THREE.BoxGeometry(wall.width, wall.height, wall.depth);
    const wallMesh = new THREE.Mesh(wallGeo, wallMat);
    wallMesh.position.set(wall.x, wall.height / 2, wall.z);
    wallMesh.castShadow = true;
    wallMesh.receiveShadow = true;
    scene.add(wallMesh);
  }

  // 3. Caixas Destrutíveis com Sombra de Contato
  const crateMat = new THREE.MeshLambertMaterial({ color: 0xb5824c });
  for (const crate of arenaSpec.destructibleCrates) {
    const crateGeo = new THREE.BoxGeometry(1.8, 1.8, 1.8);
    const crateMesh = new THREE.Mesh(crateGeo, crateMat);
    crateMesh.position.set(crate.x, 0.9, crate.z);
    crateMesh.castShadow = true;
    crateMesh.receiveShadow = true;
    scene.add(crateMesh);
    crateMeshes.set(crate.id, crateMesh);

    // Sombra de contato suave no pé da caixa
    const shadowGeo = new THREE.CircleGeometry(1.2, 12);
    const shadow = new THREE.Mesh(shadowGeo, blobShadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.set(crate.x, 0.025, crate.z);
    scene.add(shadow);
    crateMesh.userData.shadow = shadow;
  }

  // 4. Quatro Torres de Refletores nos Cantos da Arena (Estilo Torneio Esportivo)
  const poleMat = new THREE.MeshLambertMaterial({ color: 0x222636 });
  const lightHousingMat = new THREE.MeshBasicMaterial({ color: 0xffea9f });
  const corners = [
    { x: -17, z: -17 }, { x: 17, z: -17 },
    { x: -17, z: 17 }, { x: 17, z: 17 }
  ];

  corners.forEach(c => {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 7), poleMat);
    pole.position.set(c.x, 3.5, c.z);
    pole.castShadow = true;

    const lamp = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.6, 0.8), lightHousingMat);
    lamp.position.set(c.x, 7.2, c.z);
    lamp.lookAt(0, 0, 0);

    const spot = new THREE.SpotLight(0xfff3cc, 2.0, 35, Math.PI / 4, 0.4);
    spot.position.set(c.x, 7.2, c.z);
    spot.target.position.set(0, 0, 0);
    scene.add(spot.target);

    scene.add(pole, lamp, spot);
  });
}

// ================= CARROSSEL 3D NO LOBBY =================
const carouselCanvas = document.getElementById("carousel-canvas");
const carouselScene = new THREE.Scene();
carouselScene.background = new THREE.Color(0x1a2038);

const carouselCamera = new THREE.PerspectiveCamera(40, 300 / 280, 0.1, 100);
carouselCamera.position.set(0, 1.3, 3.4);
carouselCamera.lookAt(0, 0.8, 0);

const carouselRenderer = new THREE.WebGLRenderer({ canvas: carouselCanvas, antialias: true });
carouselRenderer.setSize(300, 280);
carouselRenderer.toneMapping = THREE.ACESFilmicToneMapping;
carouselRenderer.toneMappingExposure = 1.2;

const carAmbient = new THREE.AmbientLight(0xffffff, 1.2);
const carLight = new THREE.DirectionalLight(0xffe6b8, 2.0);
carLight.position.set(3, 5, 4);
carouselScene.add(carAmbient, carLight);

let currentCarouselMesh = null;

function updateCarouselModel() {
  const charDef = CHARACTERS_CATALOG[state.selectedCharIndex];
  document.getElementById("char-name-display").textContent = charDef.name;
  document.getElementById("char-counter-display").textContent = `${state.selectedCharIndex + 1} de ${CHARACTERS_CATALOG.length} (${charDef.theme})`;

  if (currentCarouselMesh) {
    carouselScene.remove(currentCarouselMesh);
  }
  currentCarouselMesh = createCharacterMesh(charDef.id);
  carouselScene.add(currentCarouselMesh);

  if (state.roomCode && state.socket) {
    state.socket.emit("LOBBY_CHANGE_SELECTION", {
      characterId: charDef.id,
      weaponId: state.selectedWeapon
    });
  }
}

function animateCarousel() {
  requestAnimationFrame(animateCarousel);
  if (currentCarouselMesh) {
    currentCarouselMesh.rotation.y += 0.015;
  }
  carouselRenderer.render(carouselScene, carouselCamera);
}
animateCarousel();

document.getElementById("btn-char-prev").onclick = () => {
  state.selectedCharIndex = (state.selectedCharIndex - 1 + CHARACTERS_CATALOG.length) % CHARACTERS_CATALOG.length;
  updateCarouselModel();
};
document.getElementById("btn-char-next").onclick = () => {
  state.selectedCharIndex = (state.selectedCharIndex + 1) % CHARACTERS_CATALOG.length;
  updateCarouselModel();
};

// ================= SELETOR DE ARMAS =================
document.querySelectorAll(".weapon-card").forEach(card => {
  card.onclick = () => {
    document.querySelectorAll(".weapon-card").forEach(c => c.classList.remove("selected"));
    card.classList.add("selected");
    state.selectedWeapon = card.dataset.weapon;

    if (state.roomCode && state.socket) {
      state.socket.emit("LOBBY_CHANGE_SELECTION", {
        characterId: CHARACTERS_CATALOG[state.selectedCharIndex].id,
        weaponId: state.selectedWeapon
      });
    }
  };
});

// ================= REDE SOCKET.IO =================
const socket = io();
state.socket = socket;

socket.on("connect", () => {
  state.myId = socket.id;
});

document.getElementById("btn-create-room").onclick = () => {
  sfx.init();
  const nameInput = document.getElementById("player-name-input").value.trim();
  if (nameInput) state.playerName = nameInput;

  socket.emit("LOBBY_CREATE", {
    name: state.playerName,
    characterId: CHARACTERS_CATALOG[state.selectedCharIndex].id,
    weaponId: state.selectedWeapon
  });
};

document.getElementById("btn-join-room").onclick = () => {
  sfx.init();
  const code = document.getElementById("room-code-input").value.trim().toUpperCase();
  const nameInput = document.getElementById("player-name-input").value.trim();
  if (nameInput) state.playerName = nameInput;

  if (code.length !== 4) {
    alert("Digite um código válido de 4 caracteres.");
    return;
  }

  socket.emit("LOBBY_JOIN", {
    roomCode: code,
    name: state.playerName,
    characterId: CHARACTERS_CATALOG[state.selectedCharIndex].id,
    weaponId: state.selectedWeapon
  });
};

socket.on("LOBBY_CREATED", (data) => {
  state.roomCode = data.roomCode;
  state.isHost = true;
  showLobbyScreen();
});

socket.on("LOBBY_JOINED", (data) => {
  state.roomCode = data.roomCode;
  state.isHost = false;
  showLobbyScreen();
});

socket.on("LOBBY_ERROR", (data) => {
  alert(data.message);
});

socket.on("LOBBY_STATE", (lobby) => {
  state.roomCode = lobby.roomCode;
  document.getElementById("lobby-room-code").textContent = lobby.roomCode;
  document.getElementById("slots-count").textContent = lobby.slots.length;

  const container = document.getElementById("slots-container");
  container.innerHTML = "";

  lobby.slots.forEach(slot => {
    const isMe = slot.id === state.myId;
    const char = CHARACTERS_CATALOG.find(c => c.id === slot.characterId) || CHARACTERS_CATALOG[0];

    const slotEl = document.createElement("div");
    slotEl.className = "slot-item";
    slotEl.innerHTML = `
      <div class="slot-info">
        <div class="slot-avatar">${slot.name.charAt(0).toUpperCase()}</div>
        <div>
          <div class="slot-name">${slot.name} ${isMe ? "(Você)" : ""}</div>
          <div class="slot-role">${slot.isHost ? "👑 Host" : slot.isBot ? `🤖 Bot (${slot.difficulty})` : "Jogador"} • ${char.name}</div>
        </div>
      </div>
      <div>${slot.weaponId.toUpperCase()}</div>
    `;
    container.appendChild(slotEl);
  });

  for (let i = lobby.slots.length; i < 4; i++) {
    const emptyEl = document.createElement("div");
    emptyEl.className = "slot-item empty";
    emptyEl.textContent = `Slot ${i + 1} Livre`;
    container.appendChild(emptyEl);
  }

  const isHost = lobby.hostId === state.myId;
  state.isHost = isHost;
  document.getElementById("host-controls").style.display = isHost ? "block" : "none";
  document.getElementById("bot-panel").style.display = (isHost && lobby.slots.length < 4) ? "flex" : "none";
});

document.getElementById("btn-add-bot").onclick = () => {
  const diff = document.getElementById("bot-diff-select").value;
  socket.emit("LOBBY_ADD_BOT", { difficulty: diff });
};

document.getElementById("btn-start-game").onclick = () => {
  socket.emit("LOBBY_START");
};

document.getElementById("btn-copy-code").onclick = () => {
  navigator.clipboard.writeText(state.roomCode);
  alert(`Código ${state.roomCode} copiado!`);
};

function showLobbyScreen() {
  document.getElementById("screen-welcome").classList.remove("active");
  document.getElementById("screen-lobby").classList.add("active");
  updateCarouselModel();
}

// ================= CICLO DA PARTIDA =================
socket.on("MATCH_COUNTDOWN", (data) => {
  document.getElementById("screen-lobby").classList.remove("active");
  document.getElementById("hud-overlay").style.display = "flex";

  const banner = document.getElementById("countdown-banner");
  banner.style.display = "block";
  banner.textContent = data.countdown > 0 ? data.countdown : "FIGHT!";

  fetch("/specs/arena-map.json")
    .then(r => r.json())
    .then(mapSpec => buildArena3D(mapSpec));
});

socket.on("MATCH_STARTED", () => {
  state.inGame = true;
  document.getElementById("countdown-banner").style.display = "none";
  sfx.playDash();
});

// SNAPSHOT DE TICK (25 Hz)
socket.on("GAME_TICK", (snapshot) => {
  // 1. Cronômetro
  const mins = Math.floor(snapshot.timeRemaining / 60);
  const secs = snapshot.timeRemaining % 60;
  document.getElementById("match-timer").textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  // 2. Placar ao vivo
  const lbRows = document.getElementById("leaderboard-rows");
  const sortedPlayers = [...snapshot.players].sort((a, b) => b.kills - a.kills);
  lbRows.innerHTML = sortedPlayers.map((p, idx) => `
    <div class="lb-row ${p.id === state.myId ? "me" : ""}">
      <span>#${idx + 1} ${p.name}</span>
      <span>${p.kills} 🎯</span>
    </div>
  `).join("");

  // 3. Atualizar jogadores e BARRAS DE VIDA FLUTUANTES
  const activeIds = new Set(snapshot.players.map(p => p.id));

  for (const [id, mesh] of playerMeshes.entries()) {
    if (!activeIds.has(id)) {
      scene.remove(mesh);
      playerMeshes.delete(id);
      const sprite = overheadBars.get(id);
      if (sprite) {
        scene.remove(sprite);
        overheadBars.delete(id);
      }
    }
  }

  for (const p of snapshot.players) {
    let mesh = playerMeshes.get(p.id);
    let overheadSprite = overheadBars.get(p.id);

    if (!mesh) {
      mesh = createCharacterMesh(p.characterId);
      scene.add(mesh);
      playerMeshes.set(p.id, mesh);
      mesh.userData = { lastX: p.x, lastZ: p.z, walkCycle: 0 };

      // Cria Barra de Vida 3D sobre a cabeça
      overheadSprite = createOverheadBarSprite(p.name, p.isBot || p.id.startsWith("bot_"), p.isHost);
      scene.add(overheadSprite);
      overheadBars.set(p.id, overheadSprite);
    }

    mesh.visible = !p.isDead;
    if (overheadSprite) {
      overheadSprite.visible = !p.isDead;
      updateOverheadSprite(overheadSprite, p.hp, 1000);
    }

    if (p.id === state.myId) {
      state.myHp = p.hp;
      state.mySuperCharge = p.superCharge;

      const hpPercent = Math.max(0, (p.hp / 1000) * 100);
      document.getElementById("hp-bar-fill").style.width = `${hpPercent}%`;
      document.getElementById("hp-text").textContent = `${p.hp} / 1000 HP`;

      const superPercent = Math.min(100, Math.round((p.superCharge / 1000) * 100));
      const superOverlay = document.getElementById("super-charge-overlay");
      const superBtn = document.getElementById("super-btn");

      if (superPercent >= 100) {
        superOverlay.style.display = "none";
        superBtn.classList.add("ready");
      } else {
        superOverlay.style.display = "flex";
        superOverlay.textContent = `${superPercent}%`;
        superBtn.classList.remove("ready");
      }

      const shield = mesh.getObjectByName("shield");
      if (shield) shield.visible = p.hasShield;
      if (overheadSprite) overheadSprite.position.set(myPosX, 2.3, myPosZ);

    } else {
      const dx = p.x - (mesh.userData.lastX || p.x);
      const dz = p.z - (mesh.userData.lastZ || p.z);
      const isMoving = Math.sqrt(dx * dx + dz * dz) > 0.05;

      mesh.position.lerp(new THREE.Vector3(p.x, 0, p.z), 0.35);
      mesh.rotation.y = p.rotationY;

      if (isMoving) {
        mesh.userData.walkCycle = (mesh.userData.walkCycle || 0) + 0.3;
        mesh.position.y = Math.abs(Math.sin(mesh.userData.walkCycle)) * 0.18;
      } else {
        mesh.position.y = 0;
      }

      mesh.userData.lastX = p.x;
      mesh.userData.lastZ = p.z;

      const shield = mesh.getObjectByName("shield");
      if (shield) shield.visible = p.hasShield;
      if (overheadSprite) overheadSprite.position.set(mesh.position.x, 2.3, mesh.position.z);
    }
  }

  // 4. Caixas
  for (const crate of snapshot.crates) {
    const mesh = crateMeshes.get(crate.id);
    if (mesh) {
      mesh.visible = !crate.destroyed;
      if (mesh.userData.shadow) mesh.userData.shadow.visible = !crate.destroyed;
    }
  }

  // 5. Drops
  const activeDropIds = new Set(snapshot.drops.map(d => d.id));
  for (const [id, mesh] of dropMeshes.entries()) {
    if (!activeDropIds.has(id)) {
      scene.remove(mesh);
      dropMeshes.delete(id);
    }
  }
  for (const d of snapshot.drops) {
    let dropMesh = dropMeshes.get(d.id);
    if (!dropMesh) {
      const color = d.type === "health" ? 0x2ed573 : 0xffcc00;
      dropMesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.45, 12, 12),
        new THREE.MeshLambertMaterial({ color })
      );
      scene.add(dropMesh);
      dropMeshes.set(d.id, dropMesh);
    }
    dropMesh.position.set(d.x, 0.45 + Math.sin(Date.now() * 0.006) * 0.18, d.z);
    dropMesh.rotation.y += 0.03;
  }

  // 6. Projéteis com Brilho
  const activeProjIds = new Set(snapshot.projectiles.map(p => p.id));
  for (const [id, mesh] of projectileMeshes.entries()) {
    if (!activeProjIds.has(id)) {
      scene.remove(mesh);
      projectileMeshes.delete(id);
    }
  }
  for (const p of snapshot.projectiles) {
    let pMesh = projectileMeshes.get(p.id);
    if (!pMesh) {
      const color = p.isSuper ? 0xff00ff : 0xffff22;
      pMesh = new THREE.Mesh(
        new THREE.SphereGeometry(p.isSuper ? 0.45 : 0.2, 8, 8),
        new THREE.MeshBasicMaterial({ color })
      );
      scene.add(pMesh);
      projectileMeshes.set(p.id, pMesh);
    }
    pMesh.position.set(p.x, p.y || 0.8, p.z);
  }
});

// Eventos de Áudio, Impacto, Luz e Partículas
socket.on("WEAPON_FIRED", (data) => {
  sfx.playShoot(data.weaponId);

  // Clarão de Luz no Bico da Arma (Muzzle Flash)
  const shooter = playerMeshes.get(data.playerId);
  if (shooter) {
    muzzlePointLight.position.set(shooter.position.x, 1.2, shooter.position.z);
    muzzlePointLight.intensity = 4.0;
    setTimeout(() => { muzzlePointLight.intensity = 0; }, 60);

    // Recuo da arma do jogador local
    if (data.playerId === state.myId) {
      state.gunRecoilOffset = 0.22;
    }
  }
});

socket.on("SUPER_ACTIVATED", (data) => {
  sfx.playSuper();
  state.screenShake = 0.5;
});

socket.on("PLAYER_DASHED", (data) => {
  sfx.playDash();
  spawnDashDust(data.x, data.z);
});

socket.on("PLAYER_DAMAGED", (data) => {
  const victim = playerMeshes.get(data.targetId);
  if (victim) {
    spawnDamagePopup(victim.position.x, victim.position.z, data.damage, data.damage > 200);
  }

  if (data.targetId === state.myId) {
    sfx.playHit();
    state.screenShake = 0.35;
  }
});

socket.on("CRATE_DESTROYED", (data) => {
  const mesh = crateMeshes.get(data.crateId);
  if (mesh) {
    spawnCrateDebris(mesh.position.x, mesh.position.z);
    spawnScorchMark(mesh.position.x, mesh.position.z, 1.6);
  }
  sfx.playExplosion(false);
});

socket.on("EXPLOSION_OCCURRED", (data) => {
  sfx.playExplosion(data.isSuper);
  state.screenShake = data.isSuper ? 0.75 : 0.45;
  spawnScorchMark(data.x, data.z, data.radius * 0.7);
});

socket.on("DROP_PICKED", () => {
  sfx.playPickup();
});

// Morte e Respawn
socket.on("PLAYER_KILLED", (data) => {
  if (data.victimId === state.myId) {
    state.isDead = true;
    const modal = document.getElementById("respawn-modal");
    modal.style.display = "block";
    document.getElementById("killer-info").textContent = `Abatido por ${data.killerName}`;

    let remaining = 3;
    const countdownEl = document.getElementById("respawn-countdown");
    countdownEl.textContent = remaining;

    const interval = setInterval(() => {
      remaining--;
      countdownEl.textContent = remaining;
      if (remaining <= 0) {
        clearInterval(interval);
        modal.style.display = "none";
        state.isDead = false;
      }
    }, 1000);
  }
});

// Troca de arma no Respawn
document.querySelectorAll(".respawn-weapon-btn").forEach(btn => {
  btn.onclick = () => {
    const newWeapon = btn.dataset.weapon;
    state.selectedWeapon = newWeapon;
    socket.emit("PLAYER_RESPAWN_REQUEST", { newWeaponId: newWeapon });
  };
});

// Fim de Partida e Pódio
socket.on("MATCH_OVER", (data) => {
  state.inGame = false;
  sfx.playWin();

  document.getElementById("hud-overlay").style.display = "none";
  document.getElementById("screen-podium").style.display = "flex";
  document.getElementById("winner-announcement").textContent = `🏆 Campeão: ${data.winner.name} (${data.winner.kills} Abates)`;

  const tbody = document.getElementById("podium-table-body");
  tbody.innerHTML = data.leaderboard.map((row, idx) => `
    <tr class="${idx === 0 ? "winner-row" : ""}">
      <td>#${row.rank} ${idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : ""}</td>
      <td>${row.name}</td>
      <td>${row.kills}</td>
      <td>${row.deaths}</td>
      <td>${row.damageDealt}</td>
    </tr>
  `).join("");

  document.getElementById("btn-play-again").style.display = state.isHost ? "inline-block" : "none";
});

document.getElementById("btn-play-again").onclick = () => {
  socket.emit("PLAY_AGAIN");
  document.getElementById("screen-podium").style.display = "none";
};

// ================= CONTROLES E INPUTS LOCAIS =================
window.addEventListener("keydown", (e) => {
  const k = e.key.toLowerCase();
  if (k === "w" || k === "arrowup") state.inputKeys.w = true;
  if (k === "a" || k === "arrowleft") state.inputKeys.a = true;
  if (k === "s" || k === "arrowdown") state.inputKeys.s = true;
  if (k === "d" || k === "arrowright") state.inputKeys.d = true;

  if (e.code === "Space" && state.inGame && !state.isDead) {
    tryDash();
  }
  if (k === "e" && state.inGame && !state.isDead) {
    trySuper();
  }
});

window.addEventListener("keyup", (e) => {
  const k = e.key.toLowerCase();
  if (k === "w" || k === "arrowup") state.inputKeys.w = false;
  if (k === "a" || k === "arrowleft") state.inputKeys.a = false;
  if (k === "s" || k === "arrowdown") state.inputKeys.s = false;
  if (k === "d" || k === "arrowright") state.inputKeys.d = false;
});

const raycaster = new THREE.Raycaster();
const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const mouseVec2 = new THREE.Vector2();

window.addEventListener("mousemove", (e) => {
  mouseVec2.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouseVec2.y = -(e.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouseVec2, camera);
  raycaster.ray.intersectPlane(groundPlane, state.mousePos3D);
});

window.addEventListener("mousedown", (e) => {
  if (!state.inGame || state.isDead) return;
  if (e.button === 0) {
    tryShoot();
  } else if (e.button === 2) {
    trySuper();
  }
});
window.addEventListener("contextmenu", (e) => e.preventDefault());

function tryShoot() {
  const now = Date.now();
  if (now - state.lastFireTime < 350) return;
  state.lastFireTime = now;

  const myMesh = playerMeshes.get(state.myId);
  if (!myMesh) return;

  const dx = state.mousePos3D.x - myMesh.position.x;
  const dz = state.mousePos3D.z - myMesh.position.z;
  const angle = Math.atan2(dx, dz);

  socket.emit("PLAYER_FIRE", {
    weaponId: state.selectedWeapon,
    angle,
    targetPoint: { x: state.mousePos3D.x, z: state.mousePos3D.z }
  });
}

function trySuper() {
  if (state.mySuperCharge < 1000) return;

  const myMesh = playerMeshes.get(state.myId);
  if (!myMesh) return;

  const dx = state.mousePos3D.x - myMesh.position.x;
  const dz = state.mousePos3D.z - myMesh.position.z;
  const angle = Math.atan2(dx, dz);

  socket.emit("PLAYER_USE_SUPER", {
    weaponId: state.selectedWeapon,
    angle,
    targetPoint: { x: state.mousePos3D.x, z: state.mousePos3D.z }
  });
}

function tryDash() {
  const now = Date.now();
  if (now - state.lastDashTime < 3000) return;
  state.lastDashTime = now;

  const myMesh = playerMeshes.get(state.myId);
  if (!myMesh) return;

  const dx = state.mousePos3D.x - myMesh.position.x;
  const dz = state.mousePos3D.z - myMesh.position.z;
  const angle = Math.atan2(dx, dz);

  socket.emit("PLAYER_DASH", { angle });

  const overlay = document.getElementById("dash-cooldown-overlay");
  overlay.style.display = "flex";
  let count = 3;
  overlay.textContent = count;
  const t = setInterval(() => {
    count--;
    overlay.textContent = count;
    if (count <= 0) {
      clearInterval(t);
      overlay.style.display = "none";
    }
  }, 1000);
}

// ================= RENDER LOOP (60 FPS) =================
let myPosX = 0;
let myPosZ = 0;
let myWalkCycle = 0;

function animate() {
  requestAnimationFrame(animate);

  const dt = 0.016;

  // 1. Atualizar Queimaduras de Explosão (dissipam suavemente)
  for (let i = scorchDecals.length - 1; i >= 0; i--) {
    const s = scorchDecals[i];
    s.life -= dt;
    if (s.life <= 0) {
      scene.remove(s.mesh);
      scorchDecals.splice(i, 1);
      continue;
    }
    s.mesh.material.opacity = (s.life / s.maxLife) * 0.7;
  }

  // 2. Partículas de Madeira
  for (let i = debrisParticles.length - 1; i >= 0; i--) {
    const p = debrisParticles[i];
    p.life -= dt;
    if (p.life <= 0) {
      scene.remove(p.mesh);
      debrisParticles.splice(i, 1);
      continue;
    }
    p.vy -= 18.0 * dt;
    p.mesh.position.x += p.vx * dt;
    p.mesh.position.y += p.vy * dt;
    p.mesh.position.z += p.vz * dt;

    if (p.mesh.position.y < 0.1) {
      p.mesh.position.y = 0.1;
      p.vy = -p.vy * 0.4;
      p.vx *= 0.6;
      p.vz *= 0.6;
    }
    p.mesh.rotation.x += p.rotX * dt;
    p.mesh.rotation.y += p.rotY * dt;
  }

  // 3. Partículas de Poeira
  for (let i = dustParticles.length - 1; i >= 0; i--) {
    const d = dustParticles[i];
    d.life -= dt;
    if (d.life <= 0) {
      scene.remove(d.mesh);
      dustParticles.splice(i, 1);
      continue;
    }
    const scale = 1.0 + (1.0 - d.life / d.maxLife) * 1.5;
    d.mesh.scale.set(scale, scale, scale);
    d.mesh.material.opacity = (d.life / d.maxLife) * 0.5;
  }

  // 4. Jogador Local, Recuo de Arma e Mira Holográfica
  if (state.inGame && !state.isDead) {
    const myMesh = playerMeshes.get(state.myId);

    if (myMesh) {
      let moveX = 0;
      let moveZ = 0;
      if (state.inputKeys.w) moveZ -= 1;
      if (state.inputKeys.s) moveZ += 1;
      if (state.inputKeys.a) moveX -= 1;
      if (state.inputKeys.d) moveX += 1;

      const isMoving = moveX !== 0 || moveZ !== 0;

      if (isMoving) {
        const len = Math.sqrt(moveX * moveX + moveZ * moveZ);
        const speed = 7.5 * dt;
        myPosX += (moveX / len) * speed;
        myPosZ += (moveZ / len) * speed;

        myWalkCycle += 0.35;
        myMesh.position.y = Math.abs(Math.sin(myWalkCycle)) * 0.22;
      } else {
        myMesh.position.y = 0;
      }

      const dx = state.mousePos3D.x - myMesh.position.x;
      const dz = state.mousePos3D.z - myMesh.position.z;
      const angleY = Math.atan2(dx, dz);
      myMesh.rotation.y = angleY;
      myMesh.position.x = myPosX;
      myMesh.position.z = myPosZ;

      // Atualiza Mira Holográfica Projetada no Chão
      updateAimReticle(state.selectedWeapon, myPosX, myPosZ, angleY, state.mousePos3D);

      // Recuo da Arma
      if (state.gunRecoilOffset > 0) {
        state.gunRecoilOffset = Math.max(0, state.gunRecoilOffset - 0.03);
      }

      // Câmera com Screen Shake
      const targetCamX = myPosX * 0.4 + (Math.random() - 0.5) * state.screenShake;
      const targetCamZ = 22 + myPosZ * 0.4 + (Math.random() - 0.5) * state.screenShake;
      const targetCamY = 26 + (Math.random() - 0.5) * state.screenShake;

      camera.position.x = targetCamX;
      camera.position.y = targetCamY;
      camera.position.z = targetCamZ;
      camera.lookAt(myPosX * 0.4, 0, myPosZ * 0.4);

      state.screenShake *= 0.88;
      if (state.screenShake < 0.02) state.screenShake = 0;

      socket.emit("PLAYER_INPUT", {
        x: myPosX,
        z: myPosZ,
        rotationY: angleY,
        seq: Date.now()
      });
    }
  }

  renderer.render(scene, camera);
}
animate();

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
