# PRD — Módulo 04: Combate, Armas e Habilidades Supremas (Super)
**Status:** Aprovado via Grill-Me  
**Versão:** 2.0.0  

---

## 1. Objetivo
Oferecer um sistema de combate balanceado, tático e emocionante com 4 armas distintas e um sistema de Habilidade Suprema (Super) exclusivo para cada arma, carregado ao causar dano e destruir caixas.

---

## 2. As 4 Armas e Suas Mecânicas

### 2.1. Pistola Tática (Equilibrada / Média Distância)
* **Tiro Primário:** Disparo reto e rápido com baixo recuo.
* **Dano:** 120 por tiro.
* **Cadência:** 1 tiro a cada 0.35s (2.8 tiros/s).
* **Super — "Tempestade Radial (Bullet Storm)":**
  * Dispara uma rajada circular instantânea de **24 projéteis em 360º** cobrindo toda a área ao redor.
  * Ideal para quando o jogador é cercado ou entra no meio do combate.

### 2.2. Trabuco / Shotgun (Curto Alcance / Emboscada)
* **Tiro Primário:** Dispara 5 projéteis em leque (abertura de $28^\circ$).
* **Dano:** 80 por projétil (máximo de 400 se todos os 5 acertarem à queima-roupa).
* **Cadência:** 1 tiro a cada 0.75s.
* **Super — "Investida Brutal (Bull Rush)":**
  * O jogador avança 8 metros em linha reta atropelando obstáculos: destrói caixas instantaneamente e causa 450 de dano com forte empurrão (*knockback*) no primeiro inimigo atingido.

### 2.3. Lança-Granadas (Tiro Parabólico / Antiacampamento)
* **Tiro Primário:** Arremessa uma granada que faz arco balístico no ar, **passando por cima de caixas e paredes**, explodindo no impacto com raio de 3.5 metros.
* **Dano:** 260 de dano em área (*splash damage*).
* **Cadência:** 1 tiro a cada 1.1s.
* **Super — "Mega Bomba Nuclear":**
  * Lança um míssil gigante que atinge uma área de 7 metros de raio, causando 600 de dano e deixando o chão em chamas por 3 segundos (causando dano contínuo de 50/s a quem pisar).

### 2.4. Rifle Laser Sniper (Longo Alcance / Alta Precisão)
* **Tiro Primário:** Feixe laser veloz de longo alcance (32 metros) com linha guia visível.
* **Dano:** 420 por tiro.
* **Cadência:** 1 tiro a cada 1.3s.
* **Super — "Raio Perfurante de Éter":**
  * Dispara um raio cósmico ultra-potente que **atravessa paredes e caixas**, causando 700 de dano a qualquer inimigo na trajetória em linha reta.

---

## 3. Sistema de Carga do Super
- **Ativação:** Tecla `E` ou `Botão Direito do Mouse`.
- **Carga Total:** 1000 pontos de energia (100%).
- **Formas de Carregar:**
  1. Causar dano a inimigos (1 ponto de dano = 1 ponto de carga).
  2. Causar dano a caixas (1 ponto de dano = 0.5 ponto de carga).
  3. Coletar Esfera de Super no chão (+400 pontos / +40%).
- **Efeito Visual:** Quando a barra atinge 100%, o personagem emite um brilho dourado pulsante e o botão de Super na HUD fica com efeito de chama.

---

## 4. Critérios de Aceitação
- [ ] Todas as 4 armas disparam seus respectivos projéteis com cadências e efeitos sonoros próprios.
- [ ] O tiro do Lança-Granadas ignora a colisão de caixas enquanto está no ar na parábola.
- [ ] O dano sofrido por jogadores é deduzido de seu HP (1000 máximo) com texto flutuante de dano (*damage numbers*).
- [ ] A barra de Super enche conforme o dano causado e libera a habilidade suprema correspondente à arma ativa.
