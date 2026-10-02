# PRD Master — Mini Brawl 3D
**Status:** Aprovado via Grill-Me  
**Metodologia:** Spec-Driven Development (SDD)  
**Versão:** 2.0.0  

---

## 1. Visão Geral do Produto
O **Mini Brawl 3D** é um jogo de ação multiplayer de arena em tempo real executado diretamente no navegador web. Utiliza gráficos 3D low-poly estilizados (acervo Kenney), câmera isométrica diagonal (~55º), suporte a até 4 participantes por sala privada e bots táticos com IA para preenchimento de vagas.

---

## 2. Pilares de Gameplay
1. **Modo Mata-Mata Contínuo (Deathmatch 3 Minutos):** Partida ininterrupta de 180 segundos. Ao morrer, o jogador renasce em 3 segundos com 1,5s de invulnerabilidade e pode trocar de arma para contra-atacar. Vence quem acumular mais abates (*kills*).
2. **Combate Dinâmico:** Movimentação WASD, mira livre em 360º no mouse, disparo principal e **Dash de Esquiva no Espaço** (cooldown de 3s).
3. **Habilidades Supremas (Super):** Causar dano carrega a barra de Super. Cada arma possui uma Habilidade Suprema única e devastadora.
4. **Arena Interativa:** Paredes indestrutíveis para cobertura tática permanente e caixas de madeira destrutíveis que dropam Kits de Cura (+300 HP) e carga de Super, renascendo periodicamente para manter o centro da arena disputado.
5. **Bots com Dificuldade Escalar:** Bots com IA que tomam decisões táticas (flanquear, buscar abrigo quando com pouca vida e farmar caixas).
6. **Lobby & Pódio 3D:** Carrossel com preview 3D giratório dos 10 personagens disponíveis e tela final com pódio 3D e placar completo (Abates, Mortes e Dano).

---

## 3. Matriz de Módulos (Specs)
* **Módulo 01:** Gestão de Salas, Lobby e Preview 3D de Personagens.
* **Módulo 02:** Arena 3D, Câmera Isométrica, Coberturas e Ciclo de Caixas/Drops.
* **Módulo 03:** Movimentação do Jogador, Raycast do Mouse e Mecânica de Dash.
* **Módulo 04:** Balística das 4 Armas e Sistema de Habilidade Suprema (Super).
* **Módulo 05:** Inteligência Artificial dos Bots e Níveis de Dificuldade.
* **Módulo 06:** Ciclo de Vida da Partida (Timer de 3 min, Placar, Respawn e Pódio 3D).
