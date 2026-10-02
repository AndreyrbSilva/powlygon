// client/js/characterModels.js
// Construtor procedural dos 10 mini-brawlers em Low-Poly (Three.js)
// Fiel a: specs/01-lobby-and-rooms/TECHSPEC-lobby.md

import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

export const CHARACTERS_CATALOG = [
  { id: "char_soldier", name: "Soldado Tático", theme: "Camuflagem Militar", color: 0x4a6b32 },
  { id: "char_ninja", name: "Shinobi Sombra", theme: "Ninja Treinado", color: 0x1f1f24 },
  { id: "char_robot", name: "Androide 01", theme: "Autômato Metálico", color: 0x7a8ca3 },
  { id: "char_astronaut", name: "Cosmonauta", theme: "Explorador Espacial", color: 0xeeeeee },
  { id: "char_punk", name: "Moicano Punk", theme: "Anarquista Cyber", color: 0x222222 },
  { id: "char_zombie", name: "Zumbi Faminto", theme: "Morto-Vivo", color: 0x5a7d4a },
  { id: "char_suit", name: "Agente de Terno", theme: "Espião Corporativo", color: 0x111116 },
  { id: "char_cyborg", name: "Ciborgue Neon", theme: "Meio-Humano Meio-Máquina", color: 0x556677 },
  { id: "char_brawler", name: "Pugilista", theme: "Campeão do Ringue", color: 0xc86a4b },
  { id: "char_scout", name: "Explorador", theme: "Aventureiro da Selva", color: 0xb58e57 }
];

export function createCharacterMesh(characterId) {
  const group = new THREE.Group();

  const charDef = CHARACTERS_CATALOG.find(c => c.id === characterId) || CHARACTERS_CATALOG[0];

  // Materiais base
  const bodyMat = new THREE.MeshLambertMaterial({ color: charDef.color });
  const skinMat = new THREE.MeshLambertMaterial({ color: characterId === "char_zombie" ? 0x6e9458 : 0xffcc99 });
  const darkMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x111111 });

  // 1. Tronco / Corpo (estilo caixote fofo)
  const bodyGeo = new THREE.BoxGeometry(0.7, 0.75, 0.45);
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = 0.7;
  body.castShadow = true;
  group.add(body);

  // 2. Cabeça
  const headGeo = new THREE.BoxGeometry(0.65, 0.6, 0.6);
  const head = new THREE.Mesh(headGeo, skinMat);
  head.position.y = 1.35;
  head.castShadow = true;
  group.add(head);

  // 3. Olhos
  const eyeGeo = new THREE.BoxGeometry(0.1, 0.1, 0.05);
  const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
  leftEye.position.set(0.16, 1.4, 0.31);
  const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
  rightEye.position.set(-0.16, 1.4, 0.31);
  group.add(leftEye, rightEye);

  // 4. Pernas
  const legGeo = new THREE.BoxGeometry(0.24, 0.45, 0.28);
  const leftLeg = new THREE.Mesh(legGeo, darkMat);
  leftLeg.position.set(0.2, 0.22, 0);
  leftLeg.castShadow = true;

  const rightLeg = new THREE.Mesh(legGeo, darkMat);
  rightLeg.position.set(-0.2, 0.22, 0);
  rightLeg.castShadow = true;
  group.add(leftLeg, rightLeg);

  // 5. Braços
  const armGeo = new THREE.BoxGeometry(0.2, 0.5, 0.2);
  const leftArm = new THREE.Mesh(armGeo, bodyMat);
  leftArm.position.set(0.48, 0.75, 0);
  leftArm.castShadow = true;

  const rightArm = new THREE.Mesh(armGeo, bodyMat);
  rightArm.position.set(-0.48, 0.75, 0.15);
  rightArm.rotation.x = Math.PI / 4; // Braço apontado à frente segurando arma
  rightArm.castShadow = true;
  group.add(leftArm, rightArm);

  // 6. Customizações exclusivas por personagem
  switch (characterId) {
    case "char_soldier": {
      // Capacete militar
      const helmetGeo = new THREE.BoxGeometry(0.72, 0.25, 0.68);
      const helmet = new THREE.Mesh(helmetGeo, new THREE.MeshLambertMaterial({ color: 0x3b5228 }));
      helmet.position.y = 1.62;
      group.add(helmet);
      break;
    }
    case "char_ninja": {
      // Faixa vermelha de ninja
      const bandGeo = new THREE.BoxGeometry(0.68, 0.12, 0.62);
      const band = new THREE.Mesh(bandGeo, new THREE.MeshLambertMaterial({ color: 0xcc1122 }));
      band.position.y = 1.48;
      group.add(band);
      break;
    }
    case "char_robot": {
      // Antena e visor azul ciano
      const antennaGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.3);
      const antenna = new THREE.Mesh(antennaGeo, darkMat);
      antenna.position.set(0, 1.8, 0);

      const visorGeo = new THREE.BoxGeometry(0.5, 0.12, 0.08);
      const visor = new THREE.Mesh(visorGeo, new THREE.MeshBasicMaterial({ color: 0x00ffff }));
      visor.position.set(0, 1.4, 0.31);
      group.add(antenna, visor);
      break;
    }
    case "char_astronaut": {
      // Visor dourado e mochila de oxigênio
      const visorGeo = new THREE.BoxGeometry(0.52, 0.28, 0.1);
      const visor = new THREE.Mesh(visorGeo, new THREE.MeshLambertMaterial({ color: 0xffaa00 }));
      visor.position.set(0, 1.38, 0.31);

      const tankGeo = new THREE.BoxGeometry(0.45, 0.5, 0.25);
      const tank = new THREE.Mesh(tankGeo, new THREE.MeshLambertMaterial({ color: 0xcccccc }));
      tank.position.set(0, 0.75, -0.3);
      group.add(visor, tank);
      break;
    }
    case "char_punk": {
      // Moicano Rosa Choque
      const mohawkGeo = new THREE.BoxGeometry(0.12, 0.35, 0.6);
      const mohawk = new THREE.Mesh(mohawkGeo, new THREE.MeshLambertMaterial({ color: 0xff007f }));
      mohawk.position.set(0, 1.78, 0);
      group.add(mohawk);
      break;
    }
    case "char_suit": {
      // Gravata vermelha
      const tieGeo = new THREE.BoxGeometry(0.12, 0.4, 0.04);
      const tie = new THREE.Mesh(tieGeo, new THREE.MeshLambertMaterial({ color: 0xee1122 }));
      tie.position.set(0, 0.75, 0.25);
      group.add(tie);
      break;
    }
    case "char_cyborg": {
      // Olho biônico vermelho neon
      const eyeCyborg = new THREE.Mesh(
        new THREE.SphereGeometry(0.08),
        new THREE.MeshBasicMaterial({ color: 0xff0033 })
      );
      eyeCyborg.position.set(0.16, 1.4, 0.32);
      group.add(eyeCyborg);
      break;
    }
    case "char_brawler": {
      // Luvas de boxe vermelhas
      const gloveGeo = new THREE.BoxGeometry(0.26, 0.26, 0.26);
      const gloveMat = new THREE.MeshLambertMaterial({ color: 0xee2222 });
      const leftGlove = new THREE.Mesh(gloveGeo, gloveMat);
      leftGlove.position.set(0.48, 0.5, 0);
      const rightGlove = new THREE.Mesh(gloveGeo, gloveMat);
      rightGlove.position.set(-0.48, 0.6, 0.35);
      group.add(leftGlove, rightGlove);
      break;
    }
    case "char_scout": {
      // Chapéu de explorador
      const hatBrim = new THREE.CylinderGeometry(0.55, 0.55, 0.06);
      const hatTop = new THREE.CylinderGeometry(0.35, 0.38, 0.25);
      const hatMat = new THREE.MeshLambertMaterial({ color: 0x8b6508 });
      const brim = new THREE.Mesh(hatBrim, hatMat);
      brim.position.y = 1.66;
      const top = new THREE.Mesh(hatTop, hatMat);
      top.position.y = 1.78;
      group.add(brim, top);
      break;
    }
  }

  // 7. Mini Arma na Mão Direita
  const weaponGeo = new THREE.BoxGeometry(0.14, 0.18, 0.55);
  const weaponMesh = new THREE.Mesh(weaponGeo, darkMat);
  weaponMesh.position.set(-0.48, 0.65, 0.45);
  group.add(weaponMesh);

  // Escudo de Invulnerabilidade (invisível por padrão)
  const shieldGeo = new THREE.SphereGeometry(1.2, 16, 16);
  const shieldMat = new THREE.MeshBasicMaterial({
    color: 0x00ccff,
    transparent: true,
    opacity: 0.35,
    wireframe: true
  });
  const shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
  shieldMesh.position.y = 0.9;
  shieldMesh.name = "shield";
  shieldMesh.visible = false;
  group.add(shieldMesh);

  return group;
}
