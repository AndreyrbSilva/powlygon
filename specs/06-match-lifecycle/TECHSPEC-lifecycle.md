# TechSpec — Módulo 06: Ciclo de Vida da Partida, Placar e Pódio 3D
**Status:** Aprovado via Grill-Me  
**Versão:** 2.0.0  

---

## 1. Estrutura de Estatísticas da Partida

```typescript
interface PlayerMatchStats {
  id: string;
  name: string;
  characterId: string;
  weaponId: string;
  kills: number;
  deaths: number;
  damageDealt: number;
  damageTaken: number;
  score: number; // kills * 100 + damageDealt * 0.1
}

interface MatchState {
  roomCode: string;
  status: "LOBBY" | "COUNTDOWN" | "IN_GAME" | "PODIUM";
  countdownSeconds: number; // 3 -> 0
  matchTimeRemainingSec: number; // 180 -> 0
  stats: Record<string, PlayerMatchStats>;
}
```

---

## 2. Renderização da Cena do Pódio 3D

Quando o timer atinge `00:00`, a câmera transiciona para a cena do pódio 3D:

* **Plataformas do Pódio:**
  - **1º Lugar (Centro):** Plataforma Dourada elevada em $Y = 1.5\text{m}$, com o personagem do campeão posicionado no topo executando animação de vitória ou rotação triunfal.
  - **2º Lugar (Esquerda):** Plataforma Prateada em $Y = 1.0\text{m}$.
  - **3º Lugar (Direita):** Plataforma de Bronze em $Y = 0.5\text{m}$.
* **Efeitos de Celebração:** Partículas de confete (*Three.js Points*) caindo continuamente e iluminação com holofote (*SpotLight*) focado no vencedor.

---

## 3. Contratos de Eventos de Ciclo de Vida

### 3.1. `MATCH_STARTING` (Servidor $\to$ Cliente)
```json
{
  "countdown": 3
}
```

### 3.2. `PLAYER_RESPAWN_REQUEST` (Cliente $\to$ Servidor)
Enviado quando o jogador escolhe uma nova arma na tela de respawn:
```json
{
  "newWeaponId": "sniper"
}
```

### 3.3. `MATCH_OVER` (Servidor $\to$ Cliente)
```json
{
  "winnerId": "socket_123",
  "winnerName": "Andrey",
  "leaderboard": [
    { "rank": 1, "name": "Andrey", "kills": 7, "deaths": 2, "damage": 4320, "characterId": "char_soldier" },
    { "rank": 2, "name": "Bot Alpha", "kills": 5, "deaths": 4, "damage": 3100, "characterId": "char_robot" },
    { "rank": 3, "name": "Lucas", "kills": 3, "deaths": 6, "damage": 2400, "characterId": "char_ninja" },
    { "rank": 4, "name": "Bot Beta", "kills": 1, "deaths": 7, "damage": 1100, "characterId": "char_zombie" }
  ]
}
```

### 3.4. `PLAY_AGAIN` (Cliente Host $\to$ Servidor)
```json
{}
```
* O servidor reinicia os cronômetros, restaura o mapa, reseta as pontuações e move todos os jogadores de volta aos respectivos *Spawn Points* da arena.
