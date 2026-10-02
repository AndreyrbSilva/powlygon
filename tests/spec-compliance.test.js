// tests/spec-compliance.test.js
// Teste de Conformidade de Especificações (Spec-Driven Development)
// Garante que o balanceamento de armas, arenas e lógica de rede aderem às specs

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import assert from "assert";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log("🧪 Iniciando Bateria de Testes de Conformidade SDD...\n");

// 1. Validação da Spec de Armas
const weaponsSpec = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../specs/weapons.json"), "utf-8")
);

assert(Array.isArray(weaponsSpec.weapons), "O catálogo de armas deve ser um array.");
assert.strictEqual(weaponsSpec.weapons.length, 4, "Devem existir exatamente 4 armas no jogo.");

const weaponIds = weaponsSpec.weapons.map(w => w.id);
assert(weaponIds.includes("pistol"), "A Pistola Tática deve estar presente.");
assert(weaponIds.includes("shotgun"), "A Shotgun deve estar presente.");
assert(weaponIds.includes("grenade_launcher"), "O Lança-Granadas deve estar presente.");
assert(weaponIds.includes("sniper"), "O Rifle Laser Sniper deve estar presente.");

weaponsSpec.weapons.forEach(w => {
  assert(w.damage > 0, `O dano da arma ${w.id} deve ser positivo.`);
  assert(w.super && w.super.id, `A arma ${w.id} deve conter uma Habilidade Suprema (Super).`);
});
console.log("✅ 1. Especificação de Armas (weapons.json): APROVADA!");

// 2. Validação da Spec do Mapa e Arena
const arenaSpec = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../specs/arena-map.json"), "utf-8")
);

assert.strictEqual(arenaSpec.spawns.length, 4, "A arena deve possuir exatamente 4 Spawn Points para 4 jogadores.");
assert(arenaSpec.solidWalls.length >= 4, "A arena deve conter paredes sólidas para cobertura tática.");
assert(arenaSpec.destructibleCrates.length >= 5, "A arena deve conter pelo menos 5 caixas destrutíveis.");

arenaSpec.destructibleCrates.forEach(c => {
  assert(c.hp >= 200, `A caixa ${c.id} deve ter pelo menos 200 de HP.`);
  assert(c.respawnCooldownSec >= 20, `O cooldown de renascimento da caixa ${c.id} deve ser de pelo menos 20 segundos.`);
});
console.log("✅ 2. Especificação do Mapa da Arena (arena-map.json): APROVADA!");

// 3. Validação do Protocolo de Rede
const networkSpec = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../specs/network-protocol.json"), "utf-8")
);

assert(networkSpec.clientToServerEvents.LOBBY_CREATE || networkSpec.clientToServerEvents.CREATE_ROOM, "Evento de criação de sala deve existir.");
assert(networkSpec.serverToClientEvents.GAME_TICK, "Evento de broadcast de Game Tick a 25Hz deve existir.");
console.log("✅ 3. Especificação do Protocolo de Rede (network-protocol.json): APROVADA!");

console.log("\n🎉 TODOS OS TESTES DE CONFORMIDADE SDD PASSARAM COM SUCESSO!");
