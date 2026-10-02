# PRD — Módulo 01: Gestão de Salas, Lobby e Preview 3D
**Status:** Aprovado via Grill-Me  
**Versão:** 2.0.0  

---

## 1. Objetivo
Permitir a criação e entrada instantânea em salas privadas via código de 4 letras, seleção e customização de arsenal, escolha entre 10 personagens com preview 3D interativo e adição de bots com seleção de dificuldade pelo Host.

---

## 2. Histórias de Usuário (User Stories)
* **US01:** Como jogador, quero clicar em "Criar Sala" e obter um código alfanumérico único de 4 letras (ex: `B7K2`) com botão de cópia de link direto.
* **US02:** Como convidado, quero digitar o código de 4 caracteres para ingressar na sala do meu amigo em menos de 2 segundos.
* **US03:** Como jogador no Lobby, quero navegar por **10 mini-personagens 3D** através de um carrossel visual e ver o modelo 3D selecionado girando suavemente na tela.
* **US04:** Como jogador no Lobby, quero escolher minha arma inicial entre as 4 opções disponíveis (Pistola, Shotgun, Lança-Granadas e Sniper).
* **US05:** Como Host, quero ter um botão "Adicionar Bot" com um seletor de dificuldade (`Fácil`, `Médio`, `Difícil`) para preencher as vagas restantes até o limite de 4 jogadores.
* **US06:** Como Host, quero clicar em "Iniciar Partida" quando todos estiverem prontos.

---

## 3. Regras de Negócio
- **RN01 (Código da Sala):** 4 caracteres alfanuméricos em caixa alta sem ambiguidades (exclui `0`, `O`, `1`, `I`).
- **RN02 (Capacidade):** Mínimo de 1 jogador humano (com bots) e máximo de 4 participantes no total.
- **RN03 (Preview 3D do Personagem):** O preview no Lobby roda em uma mini-cena Three.js independente com iluminação de estúdio e rotação contínua de $30^\circ/\text{s}$.
- **RN04 (Dificuldade dos Bots):** O Host pode definir a dificuldade de cada bot individualmente ou de todos de uma vez:
  - *Fácil:* Mira lenta, sem uso de dash, recarga de tiro mais espaçada.
  - *Médio:* Mira tática, busca cobertura e caixas quando com pouco HP.
  - *Difícil:* Mira preditiva rápida, esquiva de tiros com Dash e uso imediato do Super.
- **RN05 (Bloqueio de Entrada):** Ninguém pode entrar na sala se a partida já estiver no estado `IN_GAME`.

---

## 4. Critérios de Aceitação
- [ ] O código de 4 letras é gerado e copiado para a área de transferência com 1 clique.
- [ ] O carrossel 3D permite alternar entre os 10 personagens com atualização instantânea do modelo 3D renderizado.
- [ ] O seletor de arma exibe o nome, ícone e a descrição da Habilidade Suprema de cada arma.
- [ ] O host pode adicionar bots até atingir 4 participantes e configurar a dificuldade de cada um.
- [ ] O botão de iniciar só fica ativo quando há pelo menos 2 participantes na sala (humanos ou bots).
