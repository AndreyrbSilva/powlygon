# PRD — Módulo 06: Ciclo de Vida da Partida, Placar e Pódio 3D
**Status:** Aprovado via Grill-Me  
**Versão:** 2.0.0  

---

## 1. Objetivo
Gerenciar todo o fluxo de uma partida de Mata-Mata de 3 minutos, desde a contagem inicial, contagem contínua de abates e respawn com troca de arma, até a consagração no Pódio 3D com placar completo e reinício de sala.

---

## 2. Histórias de Usuário (User Stories)
* **US01:** Como jogador, quero ver uma contagem regressiva de 3 segundos na tela antes do combate começar para todos se posicionarem.
* **US02:** Como jogador, quero acompanhar o tempo restante da partida (de 03:00 até 00:00) e o placar de abates atualizado ao vivo no canto da tela.
* **US03:** Como jogador abatido, quero ver um contador de renascimento de 3 segundos com a opção de **trocar minha arma** antes de voltar ao campo de batalha.
* **US04:** Como jogador ao final dos 3 minutos, quero ver uma tela épica de encerramento com um **Pódio 3D** exibindo os 3 primeiros colocados comemorando, além de uma tabela detalhada com Abates, Mortes e Dano Causado.
* **US05:** Como Host ou participante no fim da partida, quero clicar em "Jogar Novamente" para reiniciar outra rodada de 3 minutos na mesma sala, sem precisar gerar outro código.

---

## 3. Estados da Partida e Regras de Negócio

```text
[LOBBY] 
   │ Host clica em "Iniciar"
   ▼
[COUNTDOWN 3s] 
   │ Timer zera
   ▼
[IN_GAME 180s] 
   │ Ao morrer: Respawn em 3s (com seletor de arma) + 1.5s de escudo
   │ Timer atinge 00:00
   ▼
[PODIUM_3D & STATS] 
   │ Host clica em "Jogar Novamente"
   ▼
[RESET PARA NOVO JOGO / LOBBY]
```

### 3.1. Placar e Critério de Desempate
* **Critério Principal:** Maior número de Abates (*Kills*).
* **Desempate 1:** Menor número de Mortes (*Deaths*).
* **Desempate 2:** Maior volume de Dano Total Causado.

### 3.2. Modal de Renascimento (Respawn HUD)
* Durante os 3 segundos de espera:
  - Exibe: "Você foi abatido por [Nome do Inimigo]".
  - Botões rápidos com ícones das 4 armas para trocar caso queira se adaptar ao oponente.
  - Renasce no spawn mais distante de inimigos com 1000 HP e bolha de 1.5s de escudo.

---

## 4. Critérios de Aceitação
- [ ] A contagem regressiva de 3s bloqueia disparos até o "FIGHT!".
- [ ] O HUD exibe timer de 3 minutos e o ranking em tempo real dos 4 participantes.
- [ ] O jogador abatido consegue trocar de arma durante os 3 segundos de respawn.
- [ ] Ao zerar o tempo, a partida encerra imediatamente e o Pódio 3D é renderizado com o vencedor em destaque e tabela com Kills, Mortes e Dano.
- [ ] O botão "Jogar Novamente" reinicia a partida para todos os participantes na mesma sala.
