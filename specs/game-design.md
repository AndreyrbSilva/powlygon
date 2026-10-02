# Mini Brawl 3D — Game Design Document (GDD)
**Metodologia:** Spec-Driven Development (SDD)  
**Versão:** 1.0.0  

---

## 1. Visão Geral do Jogo
- **Gênero:** Arena Shooter 3D Multiplayer com visão isométrica.
- **Público / Sessão:** Partidas rápidas de 2 a 5 minutos entre até 4 jogadores no navegador.
- **Estilo Visual:** Low-poly 3D estilizado (utilizando Kenney 3D Assets: Mini Characters & Blaster/City Kit).
- **Câmera:** Câmera diagonal isométrica fixa (Perspectiva inclinada a ~55º com rotação suave ou fixa centrada na arena).

---

## 2. Controles do Jogador
- **Movimentação:** Teclas `W`, `A`, `S`, `D` (ou setas).
- **Mira:** O personagem rotaciona suavemente em direção ao cursor do mouse no plano 3D ($X, Z$).
- **Disparo:** Botão Esquerdo do Mouse (`Mouse Click`).
- **Recarga:** Automática por cadência (*cooldown*) ou barra de munição com recarga passiva estilo Brawl Stars.

---

## 3. Sistema de Salas (Multiplayer & Lobby)
1. **Criar Sala:** O jogador clica em "Criar Sala" e recebe um código de 4 letras/dígitos (ex: `B7K2`).
2. **Entrar na Sala:** Outros jogadores acessam a URL ou digitam o código de 4 letras.
3. **Capacidade:** Até 4 jogadores por sala.
4. **Preenchimento com IA:** Se houver menos de 4 jogadores, o host pode clicar em "Adicionar Bot de IA" para preencher os slots restantes.
5. **Início da Partida:** Quando o host clica em "Iniciar", uma contagem de 3 segundos inicia e todos surgem em seus respectivos *Spawn Points*.

---

## 4. O Mapa e Elementos da Arena
- **Dimensões:** Arena retangular fechada delimitada por paredes intransponíveis.
- **Spawn Points:** 4 pontos definidos nos quatro cantos da arena.
- **Obstáculos (Caixas e Paredes):**
  - **Paredes de Concreto:** Bloqueiam movimentação e tiros retos; são indestrutíveis.
  - **Caixas de Madeira/Contêineres:** Oferecem cobertura. Bloqueiam tiros diretos, mas podem ser destruídas após receber 100 de dano ou saltadas por tiros de granada.

---

## 5. Condições de Vitória e Pontuação
- **Modo Battle Royale / Último Sobrevivente:** Cada jogador tem 1000 de vida (HP). O último jogador de pé vence a rodada.
- **Respawn / Próxima Rodada:** Após a vitória de um jogador, uma tela de comemoração exibe o vencedor e o botão de "Jogar Novamente".
