// server/gameLoop.js
// Implementação fiel a:
// - specs/00-master/TECHSPEC-architecture.md
// - specs/02-arena-and-environment/TECHSPEC-arena.md
// - specs/04-combat-and-weapons/TECHSPEC-combat.md
// - specs/06-match-lifecycle/TECHSPEC-lifecycle.md

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { AIBotController } from "./aiBot.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Carrega especificações oficiais de armas e arena
const weaponsSpec = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../specs/weapons.json"), "utf-8")
);
const arenaMapSpec = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../specs/arena-map.json"), "utf-8")
);

const WEAPONS_MAP = new Map(weaponsSpec.weapons.map(w => [w.id, w]));

export class GameEngine {
  constructor(room, io) {
    this.room = room;
    this.io = io;
    this.tickRate = 25; // 25 Hz
    this.tickInterval = 1000 / this.tickRate; // 40ms
    this.timer = null;
    this.tickCount = 0;

    // Estado da arena
    this.projectiles = [];
    this.drops = []; // { id, type: 'health' | 'super', x, z, createdAt }
    this.crates = arenaMapSpec.destructibleCrates.map(c => ({
      ...c,
      currentHp: c.hp,
      destroyed: false,
      destroyedAt: 0
    }));
    this.solidWalls = arenaMapSpec.solidWalls;
    this.spawns = arenaMapSpec.spawns;

    // Controladores de IA para bots
    this.botControllers = new Map();

    // Inicializa posições dos jogadores nos spawn points
    for (const player of this.room.players.values()) {
      const spawn = this.spawns[player.slotIndex % this.spawns.length];
      player.x = spawn.x;
      player.z = spawn.z;
      player.hp = 1000;
      player.superCharge = 0;
      player.isDead = false;
      player.shieldUntil = Date.now() + 1500;

      if (player.isBot) {
        this.botControllers.set(player.id, new AIBotController(player, this.room));
      }
    }
  }

  start() {
    this.room.status = "COUNTDOWN";
    this.room.countdownRemaining = 3;

    const countdownTimer = setInterval(() => {
      this.room.countdownRemaining--;
      this.io.to(this.room.code).emit("MATCH_COUNTDOWN", {
        countdown: this.room.countdownRemaining
      });

      if (this.room.countdownRemaining <= 0) {
        clearInterval(countdownTimer);
        this.room.status = "IN_GAME";
        this.room.matchTimeRemaining = 180; // 3 minutos
        this.io.to(this.room.code).emit("MATCH_STARTED", {
          duration: 180
        });

        // Inicia loop de ticks a 25 Hz
        this.timer = setInterval(() => this.tick(), this.tickInterval);
      }
    }, 1000);
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  tick() {
    this.tickCount++;
    const currentTime = Date.now();

    // 1. Atualiza cronômetro de 3 minutos da partida
    if (this.tickCount % this.tickRate === 0) {
      this.room.matchTimeRemaining--;
      if (this.room.matchTimeRemaining <= 0) {
        this.finishMatch();
        return;
      }
    }

    // 2. Atualiza Dash dos jogadores
    for (const player of this.room.players.values()) {
      if (player.isDashing) {
        if (currentTime - player.dashStartTime >= 200) {
          player.isDashing = false;
        } else {
          // Move no vetor de dash
          const dashSpeed = 22.5 * 0.04;
          player.x += (player.dashDirX || 0) * dashSpeed;
          player.z += (player.dashDirZ || 0) * dashSpeed;
          this.resolveWallCollision(player);
        }
      }

      // Verifica respawn de jogadores abatidos
      if (player.isDead && currentTime >= player.respawnAt) {
        this.respawnPlayer(player);
      }
    }

    // 3. Atualiza Bots de IA
    for (const controller of this.botControllers.values()) {
      controller.update(
        currentTime,
        this.solidWalls,
        this.projectiles,
        this.drops,
        this.crates,
        (bot, angle, target) => this.handleFire(bot.id, bot.weaponId, angle, target, false),
        (bot, angle) => this.handleDash(bot.id, angle),
        (bot, angle, target) => this.handleFire(bot.id, bot.weaponId, angle, target, true)
      );
    }

    // 4. Atualiza Projéteis
    this.updateProjectiles();

    // 5. Atualiza Renascimento de Caixas (Crate Respawn de 25s)
    for (const crate of this.crates) {
      if (crate.destroyed && currentTime - crate.destroyedAt >= crate.respawnCooldownSec * 1000) {
        // Renasce se não houver jogador ocupando o local exato
        const occupied = [...this.room.players.values()].some(
          p => Math.abs(p.x - crate.x) < 1.5 && Math.abs(p.z - crate.z) < 1.5
        );
        if (!occupied) {
          crate.destroyed = false;
          crate.currentHp = crate.hp;
          this.io.to(this.room.code).emit("CRATE_RESPAWNED", { crateId: crate.id });
        }
      }
    }

    // 6. Atualiza Coleta de Drops
    this.checkDropPickups();

    // 7. Envia Snapshot periódico para todos os clientes
    this.broadcastSnapshot();
  }

  handlePlayerInput(socketId, inputData) {
    const player = this.room.players.get(socketId);
    if (!player || player.isDead || this.room.status !== "IN_GAME") return;

    // Se estiver em dash, o dash tem prioridade no deslocamento
    if (!player.isDashing) {
      player.x = inputData.x;
      player.z = inputData.z;
      player.rotationY = inputData.rotationY;
      player.vx = inputData.vx || 0;
      player.vz = inputData.vz || 0;
      this.resolveWallCollision(player);
    }
  }

  handleDash(playerId, overrideAngle = null) {
    const player = this.room.players.get(playerId);
    if (!player || player.isDead) return;

    const currentTime = Date.now();
    if (currentTime - player.lastDashTime < 3000) return; // Cooldown 3s

    player.isDashing = true;
    player.dashStartTime = currentTime;
    player.lastDashTime = currentTime;

    const angle = overrideAngle !== null ? overrideAngle : player.rotationY;
    player.dashDirX = Math.sin(angle);
    player.dashDirZ = Math.cos(angle);

    this.io.to(this.room.code).emit("PLAYER_DASHED", {
      playerId: player.id,
      x: player.x,
      z: player.z,
      angle
    });
  }

  handleFire(playerId, weaponId, angle, targetPoint, isSuper = false) {
    const player = this.room.players.get(playerId);
    if (!player || player.isDead) return;

    // Cancela o escudo de invulnerabilidade ao atirar
    if (player.shieldUntil > Date.now()) {
      player.shieldUntil = 0;
    }

    const weapon = WEAPONS_MAP.get(weaponId) || WEAPONS_MAP.get("pistol");

    if (isSuper) {
      if (player.superCharge < 1000) return;
      player.superCharge = 0;
      this.triggerSuper(player, weapon, angle, targetPoint);
      return;
    }

    // Disparo Regular
    if (weapon.id === "shotgun") {
      // 5 projéteis em leque
      const pelletCount = weapon.projectilesPerShot;
      const spreadRad = (weapon.spreadAngleDeg * Math.PI) / 180;
      const startAngle = angle - spreadRad / 2;
      const step = spreadRad / (pelletCount - 1);

      for (let i = 0; i < pelletCount; i++) {
        const curAngle = startAngle + step * i;
        this.spawnProjectile(player, weapon, curAngle, targetPoint, false, 80);
      }
    } else {
      this.spawnProjectile(player, weapon, angle, targetPoint, false, weapon.damage);
    }

    this.io.to(this.room.code).emit("WEAPON_FIRED", {
      playerId,
      weaponId: weapon.id,
      isSuper: false,
      angle
    });
  }

  triggerSuper(player, weapon, angle, targetPoint) {
    this.io.to(this.room.code).emit("SUPER_ACTIVATED", {
      playerId: player.id,
      weaponId: weapon.id,
      angle
    });

    switch (weapon.id) {
      case "pistol":
        // Bullet Storm: 24 projéteis em 360 graus
        for (let i = 0; i < 24; i++) {
          const curAngle = (i * 2 * Math.PI) / 24;
          this.spawnProjectile(player, weapon, curAngle, null, true, 100, 26.0);
        }
        break;

      case "shotgun":
        // Bull Rush: avança 8 metros atropelando caixas e inimigos
        player.isDashing = true;
        player.dashStartTime = Date.now();
        player.dashDirX = Math.sin(angle);
        player.dashDirZ = Math.cos(angle);
        this.executeBullRushDamage(player, angle);
        break;

      case "grenade_launcher":
        // Mega Bomba Nuclear
        this.spawnParabolicProjectile(player, weapon, angle, targetPoint, true, 600, 7.0);
        break;

      case "sniper":
        // Raio Perfurante de Éter (atravessa paredes instantaneamente)
        this.executePiercingBeam(player, angle, 700);
        break;
    }
  }

  spawnProjectile(player, weapon, angle, targetPoint, isSuper, damage, speedOverride = null) {
    const speed = speedOverride || weapon.projectileSpeed;
    const isParabolic = weapon.canArcOverWalls && !isSuper;

    if (isParabolic) {
      this.spawnParabolicProjectile(player, weapon, angle, targetPoint, false, damage, weapon.splashRadius);
      return;
    }

    const proj = {
      id: `p_${Date.now()}_${Math.random()}`,
      ownerId: player.id,
      weaponId: weapon.id,
      isSuper,
      x: player.x,
      y: 0.8,
      z: player.z,
      vx: Math.sin(angle) * speed,
      vy: 0,
      vz: Math.cos(angle) * speed,
      damage,
      maxDistance: weapon.range,
      traveledDistance: 0,
      splashRadius: weapon.splashRadius || 0,
      canArcOverWalls: false,
      piercesWalls: false
    };

    this.projectiles.push(proj);
  }

  spawnParabolicProjectile(player, weapon, angle, targetPoint, isSuper, damage, splashRadius) {
    const destX = targetPoint ? targetPoint.x : player.x + Math.sin(angle) * 14;
    const destZ = targetPoint ? targetPoint.z : player.z + Math.cos(angle) * 14;

    const proj = {
      id: `p_arc_${Date.now()}_${Math.random()}`,
      ownerId: player.id,
      weaponId: weapon.id,
      isSuper,
      startX: player.x,
      startZ: player.z,
      destX,
      destZ,
      x: player.x,
      y: 0.8,
      z: player.z,
      progress: 0,
      progressSpeed: 0.045, // ~1s voando
      damage,
      splashRadius,
      canArcOverWalls: true
    };

    this.projectiles.push(proj);
  }

  updateProjectiles() {
    const dt = 0.04;
    const activeProjectiles = [];

    for (const p of this.projectiles) {
      if (p.canArcOverWalls) {
        // Projétil Parabólico (Lança-Granadas)
        p.progress += p.progressSpeed;
        p.x = p.startX + (p.destX - p.startX) * p.progress;
        p.z = p.startZ + (p.destZ - p.startZ) * p.progress;
        p.y = 0.8 + 4.0 * Math.sin(Math.PI * p.progress); // Parábola

        if (p.progress >= 1.0) {
          // Aterrissou no chão! Explode
          this.detonateExplosion(p.x, p.z, p.splashRadius, p.damage, p.ownerId, p.isSuper);
          continue; // Finaliza projétil
        }
        activeProjectiles.push(p);
      } else {
        // Projétil Reto
        const distStep = Math.sqrt(p.vx * p.vx + p.vz * p.vz) * dt;
        p.x += p.vx * dt;
        p.z += p.vz * dt;
        p.traveledDistance += distStep;

        if (p.traveledDistance >= p.maxDistance) {
          continue; // Expirou alcance
        }

        // Colisão com Paredes Sólidas
        let hitWall = false;
        if (!p.piercesWalls) {
          for (const wall of this.solidWalls) {
            if (Math.abs(p.x - wall.x) < wall.width / 2 && Math.abs(p.z - wall.z) < wall.depth / 2) {
              hitWall = true;
              break;
            }
          }
        }
        if (hitWall) continue;

        // Colisão com Caixas Destrutíveis
        let hitCrate = false;
        for (const crate of this.crates) {
          if (!crate.destroyed && Math.abs(p.x - crate.x) < 1.2 && Math.abs(p.z - crate.z) < 1.2) {
            this.damageCrate(crate, p.damage, p.ownerId);
            hitCrate = true;
            break;
          }
        }
        if (hitCrate) continue;

        // Colisão com Jogadores
        let hitPlayer = false;
        for (const target of this.room.players.values()) {
          if (target.id === p.ownerId || target.isDead || target.shieldUntil > Date.now()) continue;

          const dx = p.x - target.x;
          const dz = p.z - target.z;
          if (Math.sqrt(dx * dx + dz * dz) < 1.1) {
            this.damagePlayer(target, p.damage, p.ownerId);
            hitPlayer = true;
            break;
          }
        }
        if (hitPlayer) continue;

        activeProjectiles.push(p);
      }
    }

    this.projectiles = activeProjectiles;
  }

  damagePlayer(target, damage, dealerId) {
    target.hp = Math.max(0, target.hp - damage);

    const dealer = this.room.players.get(dealerId);
    if (dealer) {
      dealer.damageDealt += damage;
      dealer.superCharge = Math.min(1000, dealer.superCharge + damage);
    }

    this.io.to(this.room.code).emit("PLAYER_DAMAGED", {
      targetId: target.id,
      dealerId,
      damage,
      remainingHp: target.hp
    });

    if (target.hp <= 0) {
      target.isDead = true;
      target.deaths++;
      target.respawnAt = Date.now() + 3000; // 3s respawn

      if (dealer && dealer.id !== target.id) {
        dealer.kills++;
      }

      this.io.to(this.room.code).emit("PLAYER_KILLED", {
        victimId: target.id,
        victimName: target.name,
        killerId: dealer ? dealer.id : null,
        killerName: dealer ? dealer.name : "Arena",
        respawnTimeMs: 3000
      });
    }
  }

  damageCrate(crate, damage, dealerId) {
    crate.currentHp -= damage;
    const dealer = this.room.players.get(dealerId);
    if (dealer) {
      dealer.superCharge = Math.min(1000, dealer.superCharge + damage * 0.5);
    }

    if (crate.currentHp <= 0 && !crate.destroyed) {
      crate.destroyed = true;
      crate.destroyedAt = Date.now();

      // Sorteia o Drop (60% Cura, 40% Super)
      const dropType = Math.random() < 0.6 ? "health" : "super";
      const drop = {
        id: `drop_${Date.now()}_${crate.id}`,
        type: dropType,
        x: crate.x,
        z: crate.z,
        createdAt: Date.now()
      };
      this.drops.push(drop);

      this.io.to(this.room.code).emit("CRATE_DESTROYED", {
        crateId: crate.id,
        drop
      });
    }
  }

  detonateExplosion(x, z, radius, maxDamage, dealerId, isSuper) {
    this.io.to(this.room.code).emit("EXPLOSION_OCCURRED", { x, z, radius, isSuper });

    // Dano em área para jogadores
    for (const player of this.room.players.values()) {
      if (player.id === dealerId || player.isDead || player.shieldUntil > Date.now()) continue;
      const dist = Math.sqrt((player.x - x) ** 2 + (player.z - z) ** 2);
      if (dist <= radius) {
        const falloffDamage = Math.round(maxDamage * (1 - dist / radius));
        this.damagePlayer(player, Math.max(50, falloffDamage), dealerId);
      }
    }

    // Dano em caixas
    for (const crate of this.crates) {
      if (crate.destroyed) continue;
      const dist = Math.sqrt((crate.x - x) ** 2 + (crate.z - z) ** 2);
      if (dist <= radius) {
        this.damageCrate(crate, maxDamage, dealerId);
      }
    }
  }

  executePiercingBeam(player, angle, damage) {
    const beamLength = 36.0;
    const beamDirX = Math.sin(angle);
    const beamDirZ = Math.cos(angle);

    // Acerta todos os jogadores na linha de mira
    for (const target of this.room.players.values()) {
      if (target.id === player.id || target.isDead || target.shieldUntil > Date.now()) continue;

      const toTargetX = target.x - player.x;
      const toTargetZ = target.z - player.z;
      const projection = toTargetX * beamDirX + toTargetZ * beamDirZ;

      if (projection > 0 && projection < beamLength) {
        const perpDist = Math.sqrt(
          (toTargetX - beamDirX * projection) ** 2 + (toTargetZ - beamDirZ * projection) ** 2
        );
        if (perpDist < 1.3) {
          this.damagePlayer(target, damage, player.id);
        }
      }
    }
  }

  executeBullRushDamage(player, angle) {
    // Destrói caixas e atinge primeiro jogador no caminho
    const dirX = Math.sin(angle);
    const dirZ = Math.cos(angle);

    for (let step = 1; step <= 8; step++) {
      const checkX = player.x + dirX * step;
      const checkZ = player.z + dirZ * step;

      for (const crate of this.crates) {
        if (!crate.destroyed && Math.abs(crate.x - checkX) < 1.2 && Math.abs(crate.z - checkZ) < 1.2) {
          this.damageCrate(crate, 500, player.id);
        }
      }

      for (const target of this.room.players.values()) {
        if (target.id === player.id || target.isDead || target.shieldUntil > Date.now()) continue;
        if (Math.abs(target.x - checkX) < 1.2 && Math.abs(target.z - checkZ) < 1.2) {
          this.damagePlayer(target, 450, player.id);
          target.x += dirX * 3.0; // Knockback
          target.z += dirZ * 3.0;
          return;
        }
      }
    }
  }

  checkDropPickups() {
    const activeDrops = [];
    for (const drop of this.drops) {
      let picked = false;
      for (const player of this.room.players.values()) {
        if (player.isDead) continue;
        const dist = Math.sqrt((player.x - drop.x) ** 2 + (player.z - drop.z) ** 2);
        if (dist < 1.2) {
          if (drop.type === "health") {
            player.hp = Math.min(1000, player.hp + 300);
          } else if (drop.type === "super") {
            player.superCharge = Math.min(1000, player.superCharge + 400);
          }
          this.io.to(this.room.code).emit("DROP_PICKED", {
            dropId: drop.id,
            playerId: player.id,
            type: drop.type
          });
          picked = true;
          break;
        }
      }
      if (!picked && Date.now() - drop.createdAt < 20000) {
        activeDrops.push(drop);
      }
    }
    this.drops = activeDrops;
  }

  respawnPlayer(player) {
    // Escolhe o spawn mais seguro
    const safeSpawn = this.spawns[Math.floor(Math.random() * this.spawns.length)];
    player.x = safeSpawn.x;
    player.z = safeSpawn.z;
    player.hp = 1000;
    player.isDead = false;
    player.shieldUntil = Date.now() + 1500; // 1.5s escudo de proteção

    this.io.to(this.room.code).emit("PLAYER_RESPAWNED", {
      playerId: player.id,
      x: player.x,
      z: player.z,
      weaponId: player.weaponId
    });
  }

  changeWeaponOnRespawn(playerId, newWeaponId) {
    const player = this.room.players.get(playerId);
    if (player && WEAPONS_MAP.has(newWeaponId)) {
      player.weaponId = newWeaponId;
    }
  }

  resolveWallCollision(player) {
    const limit = 16.5;
    player.x = Math.max(-limit, Math.min(limit, player.x));
    player.z = Math.max(-limit, Math.min(limit, player.z));

    // Colisão com paredes sólidas
    for (const wall of this.solidWalls) {
      const halfW = wall.width / 2 + 0.6;
      const halfD = wall.depth / 2 + 0.6;
      if (Math.abs(player.x - wall.x) < halfW && Math.abs(player.z - wall.z) < halfD) {
        // Empurra para fora
        const overlapX = halfW - Math.abs(player.x - wall.x);
        const overlapZ = halfD - Math.abs(player.z - wall.z);
        if (overlapX < overlapZ) {
          player.x += player.x > wall.x ? overlapX : -overlapX;
        } else {
          player.z += player.z > wall.z ? overlapZ : -overlapZ;
        }
      }
    }
  }

  broadcastSnapshot() {
    const snapshot = {
      timeRemaining: this.room.matchTimeRemaining,
      players: [...this.room.players.values()].map(p => ({
        id: p.id,
        name: p.name,
        characterId: p.characterId,
        weaponId: p.weaponId,
        x: p.x,
        z: p.z,
        rotationY: p.rotationY,
        hp: p.hp,
        superCharge: p.superCharge,
        kills: p.kills,
        deaths: p.deaths,
        damageDealt: p.damageDealt,
        isDead: p.isDead,
        hasShield: p.shieldUntil > Date.now(),
        isDashing: p.isDashing
      })),
      projectiles: this.projectiles.map(p => ({
        id: p.id,
        weaponId: p.weaponId,
        x: p.x,
        y: p.y,
        z: p.z,
        isSuper: p.isSuper
      })),
      crates: this.crates.map(c => ({
        id: c.id,
        x: c.x,
        z: c.z,
        destroyed: c.destroyed,
        hp: c.currentHp
      })),
      drops: this.drops.map(d => ({
        id: d.id,
        type: d.type,
        x: d.x,
        z: d.z
      }))
    };

    this.io.to(this.room.code).emit("GAME_TICK", snapshot);
  }

  finishMatch() {
    this.stop();
    this.room.status = "PODIUM";

    // Ordena ranking por Kills -> Menor Mortes -> Maior Dano
    const leaderboard = [...this.room.players.values()]
      .sort((a, b) => b.kills - a.kills || a.deaths - b.deaths || b.damageDealt - a.damageDealt)
      .map((p, idx) => ({
        rank: idx + 1,
        id: p.id,
        name: p.name,
        characterId: p.characterId,
        weaponId: p.weaponId,
        kills: p.kills,
        deaths: p.deaths,
        damageDealt: p.damageDealt
      }));

    this.io.to(this.room.code).emit("MATCH_OVER", {
      winner: leaderboard[0],
      leaderboard
    });
  }

  playAgain() {
    this.stop();
    // Reseta pontuações e reinicia partida
    for (const player of this.room.players.values()) {
      player.kills = 0;
      player.deaths = 0;
      player.damageDealt = 0;
      player.hp = 1000;
      player.superCharge = 0;
      player.isDead = false;
    }
    this.crates.forEach(c => {
      c.destroyed = false;
      c.currentHp = c.hp;
    });
    this.drops = [];
    this.projectiles = [];
    this.start();
  }
}
