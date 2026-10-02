# PRD — Módulo 05: Bots de Inteligência Artificial da Arena
**Status:** Aprovado via Grill-Me  
**Versão:** 2.0.0  

---

## 1. Objetivo
Prover bots controlados por IA com comportamento tático dinâmico para preencher vagas em salas com menos de 4 pessoas, garantindo combates desafiadores e com níveis de inteligência ajustáveis.

---

## 2. Histórias de Usuário (User Stories)
* **US01:** Como jogador jogando sozinho ou com apenas 1 amigo, quero adicionar bots para termos sempre uma partida cheia e caótica com 4 participantes na arena.
* **US02:** Como jogador, quero que os bots não sejam "alvos estáticos fáceis": quero vê-los se protegendo atrás de paredes sólidas quando estão com pouca vida.
* **US03:** Como jogador, quero que os bots atirem nas caixas para roubar kits médicos antes de mim se eu vacilar.
* **US04:** Como Host, quero escolher a dificuldade dos bots (`Fácil`, `Médio`, `Difícil`) para calibrar o desafio para jogadores novatos ou veteranos.

---

## 3. Comportamento Tático e Níveis de Dificuldade

### 3.1. Máquina de Decisão Geral (Todos os Bots)
1. **Prioridade de Sobrevivência:** Se o HP estiver abaixo de $300$ (30%), o bot entra em modo **RETIRADA**, buscando uma parede sólida entre ele e o adversário mais próximo.
2. **Coleta de Recursos:** Se houver um Kit Médico solto no chão em um raio de 10 metros, o bot corre para pegá-lo antes de voltar a atirar.
3. **Destruição de Caixas:** Se não houver nenhum jogador em linha de visão, o bot atira em caixas próximas para farmar buffs.

### 3.2. Matriz de Parâmetros por Dificuldade

| Parâmetro | Fácil | Médio | Difícil |
| :--- | :--- | :--- | :--- |
| **Tempo de Reação** | $650 \text{ ms}$ | $300 \text{ ms}$ | $100 \text{ ms}$ |
| **Margem de Erro na Mira** | $\pm 18^\circ$ de desvio aleatório | $\pm 6^\circ$ | $\pm 1^\circ$ (quase perfeito) |
| **Mira Preditiva** | Desativada (mira onde o alvo está) | Parcial | Ativada (mira onde o alvo estará em $t + \Delta t$) |
| **Uso de Dash de Esquiva** | Nunca usa | Usa ocasionalmente | Usa imediatamente ao detectar projétil em rota de colisão |
| **Uso do Super** | Aleatório | Quando o alvo está a média distância | Combo devastador imediato |

---

## 4. Critérios de Aceitação
- [ ] Os bots navegam pelo mapa contornando paredes e caixas sem ficarem presos em quinas.
- [ ] Bots com HP < 300 interrompem o ataque e fogem para trás de paredes sólidas.
- [ ] No nível Difícil, os bots usam Dash para desviar de foguetes e disparam o Super com precisão.
