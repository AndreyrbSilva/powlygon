# 💥 Powlygon 3D

> **Arena Multiplayer 3D de Combate Isométrico no Navegador** desenvolvida com **Spec-Driven Development (SDD)**, Three.js, Node.js e WebSockets.

[![Spec-Driven Development](https://img.shields.io/badge/Architecture-Spec--Driven%20Development-blueviolet.svg)](specs/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Author](https://img.shields.io/badge/Author-Andrey%20Silva-blue.svg)](https://github.com/AndreyrbSilva)
[![Tests](https://img.shields.io/badge/Tests-Passing-brightgreen.svg)](tests/)

---

## 🎮 Sobre o Powlygon

**Powlygon** é um jogo multiplayer em tempo real para até 4 jogadores na mesma sala, com visão isométrica diagonal inspirada em clássicos como *Brawl Stars* e estética visual low-poly estilizada.

O projeto foi construído do zero utilizando a metodologia **Spec-Driven Development (SDD)**: nenhuma linha de código foi escrita antes da formalização dos PRDs, TechSpecs e contratos JSON de balanceamento.

---

## ✨ Funcionalidades Principais

* **Salas Privadas Instantâneas:** Sistema de lobby com código alfanumérico único de 4 letras para compartilhar com amigos.
* **Carrossel 3D Interativo no Lobby:** Preview em tempo real de 10 Brawlers Low-Poly únicos com animação rotacional antes de entrar na arena.
* **4 Classes de Armas Balanceadas:**
  * 🔫 *Pistola Tática* (cadência rápida e tiro estável).
  * 💥 *Shotgun de Assalto* (leque de 5 dispersões para curto alcance).
  * 💣 *Lança-Granadas* (disparo parabólico em arco 3D que pula por cima de paredes).
  * ⚡ *Rifle Laser Sniper* (tiro instantâneo de longo alcance e alto dano).
* **Habilidades Supremas (Supers):** Barra especial carregada por dano causado que dispara habilidades devastadoras específicas de cada arma.
* **Esquiva Tática (Dash):** Mecânica de esquiva rápida na barra de espaço com tempo de recarga visual na HUD.
* **IA Tática Balanceada (Bots):** Suporte a bots com máquina de estados finita (FSM), 3 níveis de dificuldade (Fácil, Médio, Difícil), busca de kits de cura e cobertura atrás de paredes.
* **Visual Overhaul 2.0 (Three.js):**
  * 🎯 **Miras Holográficas no Chão:** Cones, lasers e círculos de dispersão dinâmicos projetados no piso acompanhando o cursor do mouse.
  * 🏷️ **Barras de Vida e Nomes 3D sobre a Cabeça:** Sprites flutuantes em espaço 3D para todos os jogadores com indicação de host e bots.
  * 🏟️ **Refletores de Estádio:** 4 torres de iluminação nos cantos conferindo estética de arena esportiva.
  * 🎬 **Tone Mapping ACES Filmic:** Contraste e saturação com pós-processamento cinematográfico.
  * 💥 **Física de Partículas:** Caixas destruídas arremessam 14 pedaços de madeira 3D que quicam no chão com gravidade real.
  * 📳 **Screen Shake:** Tremor de tela procedural a cada explosão e impacto pesado.
* **Áudio Procedural:** Sintetizador sonoro nativo via **Web Audio API** (sem dependência de arquivos externos pesados de áudio).

---

## 🏛️ Metodologia: Spec-Driven Development (SDD)

Todas as especificações técnicas residem na pasta [`specs/`](specs/):

```text
specs/
├── INDEX.md                          # Matriz de rastreabilidade e visão geral
├── 00-master/                        # PRD Master e TechSpec de Arquitetura
├── 01-lobby-and-rooms/               # PRD e TechSpec do Lobby e Carrossel 3D
├── 02-arena-and-environment/         # PRD e TechSpec da Arena, Caixas e Refletores
├── 03-player-and-movement/           # PRD e TechSpec de WASD, Mira e Dash
├── 04-combat-and-weapons/            # PRD e TechSpec das 4 Armas e Balística
├── 05-ai-bots/                       # PRD e TechSpec da FSM e Mira Humana dos Bots
├── 06-match-lifecycle/               # PRD e TechSpec de 3min, Placar e Pódio 3D
├── weapons.json                      # Contrato de dados formal de balanceamento
├── arena-map.json                    # Matriz de coordenadas da arena e caixas
└── network-protocol.json             # Contrato de mensagens WebSocket
```

---

## 🚀 Como Executar Localmente

### Pré-requisitos
* [Node.js](https://nodejs.org/) (v18 ou superior)
* Git

### Passos

1. Clone o repositório:
```bash
git clone https://github.com/AndreyrbSilva/powlygon.git
cd powlygon
```

2. Instale as dependências:
```bash
npm install
```

3. Execute a bateria de testes de conformidade SDD:
```bash
npm test
```

4. Inicie o servidor:
```bash
npm start
```

5. Abra o navegador em:
👉 **`http://localhost:3000`**

---

## 🕹️ Controles

| Tecla / Botão | Ação |
| :--- | :--- |
| **W, A, S, D** | Movimentação pelo campo de batalha |
| **Mouse** | Mira livre em 360º com indicador holográfico no chão |
| **Botão Esquerdo** | Disparo da arma selecionada |
| **Barra de Espaço** | Dash de esquiva rápida (Cooldown de 3s) |
| **E / Botão Direito** | Disparar Habilidade Suprema (Super) quando a barra atingir 100% |

---

## 👨‍💻 Autor

Desenvolvido por **Andrey Silva**  
* GitHub: [@AndreyrbSilva](https://github.com/AndreyrbSilva)  
* Email: [andreyrdh@gmail.com](mailto:andreyrdh@gmail.com)

---

## 📄 Licença

Distribuído sob a licença MIT. Consulte `LICENSE` para mais detalhes.
