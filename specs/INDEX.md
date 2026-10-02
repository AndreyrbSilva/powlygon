# Powlygon 3D — Índice de Especificações (SDD Suite)
**Status:** Todas as especificações aprovadas e congeladas.  
**Metodologia:** Spec-Driven Development (SDD)  

---

## 📑 Navegação pelas Especificações

| Módulo | Documento de Requisitos (PRD) | Especificação Técnica (TechSpec) | Contrato de Dados |
| :--- | :--- | :--- | :--- |
| **00 - Master** | [PRD Master](00-master/PRD-master.md) | [TechSpec Arquitetura](00-master/TECHSPEC-architecture.md) | — |
| **01 - Lobby & Salas** | [PRD Lobby](01-lobby-and-rooms/PRD-lobby.md) | [TechSpec Lobby](01-lobby-and-rooms/TECHSPEC-lobby.md) | [Network Protocol](network-protocol.json) |
| **02 - Arena & Cenário** | [PRD Arena](02-arena-and-environment/PRD-arena.md) | [TechSpec Arena](02-arena-and-environment/TECHSPEC-arena.md) | [Arena Map Spec](arena-map.json) |
| **03 - Movimentação & Dash** | [PRD Movimentação](03-player-and-movement/PRD-movement.md) | [TechSpec Movimentação](03-player-and-movement/TECHSPEC-movement.md) | — |
| **04 - Combate & Armas** | [PRD Combate](04-combat-and-weapons/PRD-combat.md) | [TechSpec Combate](04-combat-and-weapons/TECHSPEC-combat.md) | [Weapons Spec](weapons.json) |
| **05 - Bots de IA** | [PRD Bots IA](05-ai-bots/PRD-ai-bots.md) | [TechSpec Bots IA (v2.0)](05-ai-bots/TECHSPEC-ai-bots.md) | — |
| **06 - Ciclo & Pódio 3D** | [PRD Ciclo de Vida](06-match-lifecycle/PRD-lifecycle.md) | [TechSpec Ciclo de Vida](06-match-lifecycle/TECHSPEC-lifecycle.md) | — |
| **07 - Visual Overhaul** | [PRD Visual Overhaul](07-visual-overhaul/PRD-visual-overhaul.md) | [TechSpec Visual Overhaul](07-visual-overhaul/TECHSPEC-visual-overhaul.md) | — |

---

## 🚀 Ciclo de Execução Metodológico

1. **Fase 1 (Fundação Backend & Salas):** Servidor Node.js + Socket.io implementando criação de salas de 4 letras, conexões, lobby e ticks autoritativos a 25 Hz.
2. **Fase 2 (Frontend 3D & Lobby):** Interface HTML/CSS moderna com preview 3D giratório no Three.js para os 10 personagens e seleção de armas.
3. **Fase 3 (Arena 3D, Câmera e Obstáculos):** Construção da arena com paredes de concreto e caixas de madeira destrutíveis baseadas no `arena-map.json`.
4. **Fase 4 (Movimento, Mira e Dash):** Controle WASD, raycaster no mouse e mecânica de Dash no espaço com recarga visual na HUD.
5. **Fase 5 (Combate, Projéteis e Supers):** Sistema balístico (incluindo o arco parabólico do Lança-Granadas), cálculo de dano e acionamento das Habilidades Supremas.
6. **Fase 6 (Ciclo de Caixas e Drops):** Vida das caixas, drops de Kits Médicos e Cargas de Super, e cronômetro de respawn de caixas.
7. **Fase 7 (Bots de IA):** Implementação da máquina de estados tática dos bots com dificuldades Fácil, Média e Difícil.
8. **Fase 8 (Ciclo de Partida, Placar e Pódio 3D):** Timer de 180s, contagem regressiva, respawn com troca de arma, placar ao vivo e tela final com Pódio 3D e botão Jogar Novamente.
9. **Fase 9 (Visual Overhaul & Calibração Humana de Bots):** Miras holográficas projetadas no chão, barras 3D dinâmicas sobre a cabeça, refletores esportivos nos cantos, partículas de destroços com gravidade, marcas de fuligem, tone mapping ACES Filmic e humanização da mira dos bots com perturbação gaussiana.
