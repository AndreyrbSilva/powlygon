# PRD: Visual Overhaul, Miras Holográficas e Game Feel

| Metadado | Detalhe |
| :--- | :--- |
| **ID da Feature** | `SPEC-07-VISUAL-OVERHAUL` |
| **Versão** | `2.0.0` |
| **Autor** | Andrey Silva |
| **Status** | `APPROVED & IMPLEMENTED` |
| **Módulo** | `client/js/main.js`, `client/css/style.css` |

---

## 1. Visão Geral e Problema

Na Versão 1.0, o jogo possuía renderização funcional, porém apresentava lacunas típicas de protótipos:
* Dificuldade do jogador em prever a área de acerto de suas armas antes do disparo.
* Informação de vida e identificação dos adversários concentrada apenas no HUD inferior e no placar lateral.
* Falta de "game feel" e sensação de peso nas explosões e nos impactos de tiro.
* Iluminação plana sem contraste cinematográfico.

O objetivo deste PRD é transformar o Powlygon em um produto com **acabamento visual comercial (*Juice & Polish*)**, inspirado em referências como *Brawl Stars* e *Overwatch*.

---

## 2. Requisitos de Usuário (User Stories)

1. **Como jogador**, quero ver um indicador luminoso projetado no chão que mostre exatamente para onde e como minha arma dispara, para que eu possa mirar com precisão estratégica.
2. **Como jogador**, quero ver a barra de vida e o nome de cada oponente diretamente acima da cabeça do boneco no campo de batalha 3D, para saber instantaneamente quem focar sem desviar o olhar para a HUD.
3. **Como jogador**, quero que explosões e tiros pesados causem tremor na câmera e arremessem destroços das caixas, para sentir o impacto físico dos combates.
4. **Como jogador**, quero que a arena tenha iluminação dramática de arena esportiva e cores ricas, para que o jogo seja visualmente atraente para streaming e portfólio.

---

## 3. Requisitos Funcionais

* **RF-01 (Miras Holográficas Projetadas no Chão):**
  * *Shotgun:* Projeção de cone de $28^\circ$ até $12\text{m}$.
  * *Sniper:* Linha laser ciano fina de $30\text{m}$.
  * *Pistola:* Linha amarela de mira rápida de $18\text{m}$.
  * *Lança-Granadas:* Retículo circular verde pulsante centralizado exatamente nas coordenadas $(X, Z)$ do cursor do mouse no plano da arena.
* **RF-02 (Barras de Vida e Nomes 3D sobre a Cabeça):**
  * Cada entidade ativa possui um *billboard* que sempre encara a câmera.
  * Exibe o nome do jogador com prefixo visual (`👑` para Host, `🤖` para Bots).
  * Barra de HP com preenchimento em 3 cores dinâmicas: Verde ($>50\%$), Amarelo ($25\% - 50\%$) e Vermelho crítico ($<25\%$).
* **RF-03 (Iluminação de Estádio):**
  * 4 torres de holofotes nos cantos da arena com refletores direcionados para o centro.
  * Flash de luz dinâmico de disparo (*Muzzle Flash Point Light*) que pisca na boca da arma do atirador por $60\text{ms}$.
* **RF-04 (Pós-processamento e Posição Cinematográfica):**
  * Ativação de `ACESFilmicToneMapping` com exposição ajustada a $1.25$.
* **RF-05 (Física de Destroços e Partículas):**
  * Ao quebrar uma caixa, $14$ pedaços de madeira com física, gravidade e rebote no chão são gerados.
  * No Dash, partículas de poeira branca são emitidas sob os pés do personagem.
* **RF-06 (Tremor de Câmera - Screen Shake):**
  * Tremores direcionais aleatórios na câmera com decaimento exponencial ao sofrer dano ou em explosões de granada e do Super.
* **RF-07 (Marcas de Queimadura de Explosão):**
  * Decalques circulares de fuligem com dissipação suave ao longo de $12$ segundos.
