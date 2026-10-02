# PRD — Módulo 02: Arena 3D, Câmera e Elementos do Cenário
**Status:** Aprovado via Grill-Me  
**Versão:** 2.0.0  

---

## 1. Objetivo
Construir um ambiente 3D estilizado e balanceado para 4 jogadores, com visão isométrica diagonal, obstáculos sólidos para cobertura permanente e caixas de madeira destrutíveis que dropam consumíveis e renascem ciclicamente.

---

## 2. Histórias de Usuário (User Stories)
* **US01:** Como jogador, quero visualizar o campo de batalha em uma perspectiva isométrica diagonal limpa, com sombras suaves e sem obstruções visuais que impeçam a mira.
* **US02:** Como jogador, quero usar paredes de concreto sólidas como proteção impenetrável contra tiros diretos de snipers e shotguns.
* **US03:** Como jogador, quero poder atirar em caixas de madeira para destruí-las e coletar Kits de Cura (+300 HP) ou Cargas de Super deixadas no chão.
* **US04:** Como jogador, quero que novas caixas renasçam periodicamente nos locais vazios para que o centro do mapa nunca fique desértico e sempre haja disputa por recursos.

---

## 3. Regras de Negócio e Balanceamento da Arena

### 3.1. Paredes Indestrutíveis (Paredes de Concreto / Pilares)
- **Comportamento:** 100% sólidas. Bloqueiam movimentação de jogadores e projéteis retos.
- **Dano:** Imunes a qualquer dano.
- **Altura:** 2.0 unidades no eixo Y.

### 3.2. Caixas de Madeira Destrutíveis (Crates)
- **Vida (HP):** 240 HP (ex: 2 tiros de pistola ou 1 tiro de shotgun à queima-roupa destroem a caixa).
- **Colisão:** Bloqueiam movimentação e tiros retos. Tiros em arco (Lança-Granadas) passam por cima.
- **Drops ao Quebrar:**
  - 60% de chance de dropar um **Kit Médico (+300 HP)**.
  - 40% de chance de dropar uma **Esfera de Energia de Super (+40% de barra de Super)**.
- **Renascimento de Caixas (Crate Respawn):**
  - Cada ponto de caixa destruído inicia um cronômetro de **25 segundos**.
  - Após 25 segundos, se nenhum jogador estiver ocupando o espaço exato, uma nova caixa reaparece com um efeito sutil de *spawn* (fumaça/partícula).

### 3.3. Drops / Consumíveis no Chão
- **Kit Médico:** Restaura 300 de HP instantaneamente ao passar por cima. Não ultrapassa o máximo de 1000 HP.
- **Esfera de Super:** Concede 40% de carga imediata na barra de Habilidade Suprema.
- **Tempo de vida:** Desaparecem se não forem coletados após 20 segundos.

---

## 4. Critérios de Aceitação
- [ ] A arena possui limites externos intransponíveis de $36 \times 36$ unidades.
- [ ] As paredes de concreto bloqueiam projéteis e movimentação.
- [ ] As caixas sofrem dano, exibem fissuras ou efeito visual de impacto e se quebram com 240 HP.
- [ ] Ao quebrar uma caixa, o drop aparece no chão e pode ser coletado por qualquer jogador ou bot.
- [ ] Caixas destruídas renascem após 25 segundos no mesmo ponto de origem.
