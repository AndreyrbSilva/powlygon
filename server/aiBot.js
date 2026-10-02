// server/aiBot.js
// Calibração de Dificuldade Balanceada e Mais Humana

export class AIBotController {
  constructor(botSlot, room) {
    this.bot = botSlot;
    this.room = room;
    this.state = "PATROL"; // PATROL | ATTACK | RETREAT_TO_COVER | LOOT_DROP
    this.targetPlayerId = null;
    this.targetDropId = null;
    this.lastDecisionTime = 0;
    this.lastFireTime = 0;
    this.patrolAngle = Math.random() * Math.PI * 2;
    this.burstShotsRemaining = 0;
    this.reactionDelayTimer = 0;
  }

  update(currentTime, obstacles, projectiles, drops, crates, fireCallback, dashCallback, superCallback) {
    if (this.bot.isDead) return;

    const diff = this.bot.difficulty || "medium";
    const decisionInterval = diff === "hard" ? 250 : diff === "medium" ? 600 : 1000;

    // 1. Tomada de Decisão Periódica (FSM)
    if (currentTime - this.lastDecisionTime >= decisionInterval) {
      this.lastDecisionTime = currentTime;
      this.evaluateState(drops, crates, obstacles);
    }

    // 2. Esquiva Ativa com Dash (Mais rara e menos robótica)
    if (diff === "hard" && currentTime - this.bot.lastDashTime >= 4500) {
      this.evaluateDodge(projectiles, dashCallback);
    }

    // 3. Execução do Estado Atual
    switch (this.state) {
      case "RETREAT_TO_COVER":
        this.executeRetreat(obstacles);
        break;
      case "LOOT_DROP":
        this.executeLoot(drops);
        break;
      case "ATTACK":
        this.executeAttack(currentTime, obstacles, fireCallback, superCallback);
        break;
      case "PATROL":
      default:
        this.executePatrol(crates, currentTime, fireCallback);
        break;
    }
  }

  evaluateState(drops, crates, obstacles) {
    // Prioridade 1: Fugir se estiver com HP muito baixo (< 250)
    if (this.bot.hp < 250) {
      const nearestHealth = this.findNearestHealthDrop(drops);
      if (nearestHealth && nearestHealth.dist < 12) {
        this.state = "LOOT_DROP";
        this.targetDropId = nearestHealth.id;
        return;
      }
      this.state = "RETREAT_TO_COVER";
      return;
    }

    // Prioridade 2: Pegar Kit Médico próximo se HP < 700
    if (this.bot.hp < 700) {
      const nearestHealth = this.findNearestHealthDrop(drops);
      if (nearestHealth && nearestHealth.dist < 10) {
        this.state = "LOOT_DROP";
        this.targetDropId = nearestHealth.id;
        return;
      }
    }

    // Prioridade 3: Combate se houver inimigo em alcance
    const nearestEnemy = this.findNearestEnemy();
    if (nearestEnemy && nearestEnemy.dist < 18) {
      // Verifica se há parede sólida bloqueando completamente
      if (!this.isLineOfSightBlocked(this.bot, nearestEnemy.player, obstacles)) {
        this.state = "ATTACK";
        this.targetPlayerId = nearestEnemy.player.id;
        return;
      }
    }

    // Prioridade 4: Patrulhar / Farmar caixas
    this.state = "PATROL";
  }

  isLineOfSightBlocked(from, to, obstacles) {
    const minX = Math.min(from.x, to.x);
    const maxX = Math.max(from.x, to.x);
    const minZ = Math.min(from.z, to.z);
    const maxZ = Math.max(from.z, to.z);

    for (const wall of obstacles) {
      if (wall.x >= minX && wall.x <= maxX && wall.z >= minZ && wall.z <= maxZ) {
        // Checagem simplificada de intersecção
        const d = Math.abs((to.z - from.z) * wall.x - (to.x - from.x) * wall.z + to.x * from.z - to.z * from.x) /
                  Math.sqrt((to.z - from.z) ** 2 + (to.x - from.x) ** 2);
        if (d < 1.5) return true;
      }
    }
    return false;
  }

  findNearestEnemy() {
    let nearest = null;
    let minDist = Infinity;

    for (const player of this.room.players.values()) {
      if (player.id === this.bot.id || player.isDead) continue;
      const dx = player.x - this.bot.x;
      const dz = player.z - this.bot.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < minDist) {
        minDist = dist;
        nearest = { player, dist };
      }
    }
    return nearest;
  }

  findNearestHealthDrop(drops) {
    let nearest = null;
    let minDist = Infinity;
    for (const drop of drops) {
      if (drop.type === "health") {
        const dx = drop.x - this.bot.x;
        const dz = drop.z - this.bot.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < minDist) {
          minDist = dist;
          nearest = { ...drop, dist };
        }
      }
    }
    return nearest;
  }

  executeAttack(currentTime, obstacles, fireCallback, superCallback) {
    const enemy = this.room.players.get(this.targetPlayerId);
    if (!enemy || enemy.isDead) {
      this.state = "PATROL";
      return;
    }

    const dx = enemy.x - this.bot.x;
    const dz = enemy.z - this.bot.z;
    const dist = Math.sqrt(dx * dx + dz * dz);

    const diff = this.bot.difficulty || "medium";

    // MIRA HUMANA COM ERRO CALIBRADO:
    // No fácil: erra bastante (±2.8m). No médio: erra um pouco (±1.5m). No difícil: erra pouco (±0.6m).
    const errorScale = diff === "easy" ? 2.8 : diff === "medium" ? 1.4 : 0.6;
    const jitterX = (Math.sin(currentTime * 0.003) * 0.8 + (Math.random() - 0.5)) * errorScale;
    const jitterZ = (Math.cos(currentTime * 0.003) * 0.8 + (Math.random() - 0.5)) * errorScale;

    const aimX = enemy.x + jitterX;
    const aimZ = enemy.z + jitterZ;

    // Rotação suave (não instantânea)
    const targetAngle = Math.atan2(aimX - this.bot.x, aimZ - this.bot.z);
    this.bot.rotationY = targetAngle;

    // Movimentação tática (anda mais devagar enquanto atira)
    let moveDirX = 0;
    let moveDirZ = 0;
    if (dist > 11) {
      moveDirX = dx / dist;
      moveDirZ = dz / dist;
    } else if (dist < 5) {
      moveDirX = -dx / dist;
      moveDirZ = -dz / dist;
    } else {
      // Dança lateral
      moveDirX = -dz / dist * 0.5;
      moveDirZ = dx / dist * 0.5;
    }

    const speed = 5.0 * 0.04;
    this.bot.x += moveDirX * speed;
    this.bot.z += moveDirZ * speed;
    this.clampToArena();

    // Disparo com intervalo humano realista:
    // Fácil: 1200ms | Médio: 900ms | Difícil: 650ms
    const fireInterval = diff === "easy" ? 1200 : diff === "medium" ? 850 : 600;

    if (currentTime - this.lastFireTime >= fireInterval) {
      this.lastFireTime = currentTime;

      // Super se carregado e médio/difícil
      if (this.bot.superCharge >= 1000 && diff !== "easy" && Math.random() < 0.6) {
        superCallback(this.bot, this.bot.rotationY, { x: aimX, z: aimZ });
      } else {
        fireCallback(this.bot, this.bot.rotationY, { x: aimX, z: aimZ });
      }
    }
  }

  executeRetreat(obstacles) {
    const enemy = this.findNearestEnemy();
    if (!enemy) {
      this.state = "PATROL";
      return;
    }

    const dx = this.bot.x - enemy.player.x;
    const dz = this.bot.z - enemy.player.z;
    const dist = Math.sqrt(dx * dx + dz * dz) || 1;

    const speed = 6.0 * 0.04;
    this.bot.x += (dx / dist) * speed;
    this.bot.z += (dz / dist) * speed;
    this.bot.rotationY = Math.atan2(-dx, -dz);
    this.clampToArena();
  }

  executeLoot(drops) {
    const drop = drops.find(d => d.id === this.targetDropId);
    if (!drop) {
      this.state = "PATROL";
      return;
    }

    const dx = drop.x - this.bot.x;
    const dz = drop.z - this.bot.z;
    const dist = Math.sqrt(dx * dx + dz * dz);

    if (dist < 0.6) {
      this.state = "PATROL";
      return;
    }

    const speed = 6.5 * 0.04;
    this.bot.x += (dx / dist) * speed;
    this.bot.z += (dz / dist) * speed;
    this.bot.rotationY = Math.atan2(dx, dz);
    this.clampToArena();
  }

  executePatrol(crates, currentTime, fireCallback) {
    this.patrolAngle += 0.02;
    const moveX = Math.cos(this.patrolAngle);
    const moveZ = Math.sin(this.patrolAngle);

    const speed = 3.8 * 0.04;
    this.bot.x += moveX * speed;
    this.bot.z += moveZ * speed;
    this.bot.rotationY = Math.atan2(moveX, moveZ);
    this.clampToArena();

    // Se tiver caixa perto, atira de vez em quando
    const activeCrates = crates.filter(c => !c.destroyed);
    for (const crate of activeCrates) {
      const dx = crate.x - this.bot.x;
      const dz = crate.z - this.bot.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < 7 && currentTime - this.lastFireTime >= 1100) {
        this.lastFireTime = currentTime;
        this.bot.rotationY = Math.atan2(dx, dz);
        fireCallback(this.bot, this.bot.rotationY, { x: crate.x, z: crate.z });
        break;
      }
    }
  }

  evaluateDodge(projectiles, dashCallback) {
    for (const proj of projectiles) {
      if (proj.ownerId === this.bot.id) continue;
      const dx = this.bot.x - proj.x;
      const dz = this.bot.z - proj.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      // Só esquiva se o tiro estiver bem perto e com 60% de chance (não infalível)
      if (dist < 3.2 && Math.random() < 0.6) {
        const dodgeAngle = Math.atan2(proj.vx, proj.vz) + (Math.random() > 0.5 ? Math.PI / 2 : -Math.PI / 2);
        dashCallback(this.bot, dodgeAngle);
        break;
      }
    }
  }

  clampToArena() {
    const limit = 16.0;
    this.bot.x = Math.max(-limit, Math.min(limit, this.bot.x));
    this.bot.z = Math.max(-limit, Math.min(limit, this.bot.z));
  }
}
