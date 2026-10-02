# PRD — Módulo 03: Movimentação, Mira e Dash
**Status:** Aprovado via Grill-Me  
**Versão:** 2.0.0  

---

## 1. Objetivo
Proporcionar controles ultra-responsivos e fluidos de movimentação com teclado, mira independente em 360º via cursor do mouse e uma mecânica de esquiva ativa (Dash) na barra de espaço para desviar de disparos fatais.

---

## 2. Histórias de Usuário (User Stories)
* **US01:** Como jogador, quero pressionar `W`, `A`, `S`, `D` para me mover com aceleração e desaceleração imediatas pelo mapa, desviando de paredes e caixas.
* **US02:** Como jogador, quero mover o mouse pela tela e ver meu personagem rotacionar suavemente acompanhando o cursor para apontar a arma onde pretendo atirar.
* **US03:** Como jogador, quero pressionar a `Barra de Espaço` para executar um **Dash de Esquiva** na direção em que estou andando, avançando rápido e escapando de tiros e granadas.
* **US04:** Como jogador recém-renascido, quero ter 1,5 segundos de invulnerabilidade (com um escudo translúcido visível) para não morrer imediatamente ao nascer (*spawn kill*).

---

## 3. Regras de Negócio e Constantes de Movimento

### 3.1. Movimento Base
- **Velocidade Padrão:** $7.5 \text{ metros/segundo}$.
- **Movimento Diagonal Normalizado:** Ao pressionar `W + D`, a velocidade não ultrapassa $7.5 \text{ m/s}$ (vetor normalizado por $\frac{1}{\sqrt{2}} \approx 0.7071$).

### 3.2. Mecânica de Dash (Esquiva no Espaço)
- **Ativação:** Tecla `Espaço` (`Spacebar`).
- **Cooldown (Tempo de Recarga):** $3.0 \text{ segundos}$ entre usos.
- **Duração do Deslize:** $0.2 \text{ segundos}$.
- **Distância Percorrida:** $4.5 \text{ metros}$ instantâneos na direção do movimento atual (ou na direção que o boneco está olhando se estiver parado).
- **Indicador Visual na HUD:** Um círculo ou barra de recarga com contagem regressiva de 3s e efeito sonoro de vento (*whoosh*).

### 3.3. Bolha de Invulnerabilidade ao Renascer
- **Duração:** $1.5 \text{ segundos}$ após cada respawn.
- **Feedback Visual:** Uma esfera holográfica translúcida azulada ao redor do boneco.
- **Regra:** O jogador não sofre dano enquanto o escudo estiver ativo. Se o jogador atirar, o escudo é cancelado imediatamente.

---

## 4. Critérios de Aceitação
- [ ] O movimento obedece estritamente ao teclado com vetor normalizado nas diagonais.
- [ ] O personagem rotaciona para o ponto exato de interseção do mouse com o chão 3D.
- [ ] O Dash move o boneco $4.5\text{m}$ em $0.2\text{s}$ e entra em cooldown de 3s, visível na HUD.
- [ ] Ao renascer, a bolha protege o jogador por 1.5s ou até o primeiro disparo.
