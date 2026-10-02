# TechSpec: Implementação de Gráficos Avançados, Sprites 3D e Partículas

| Metadado | Detalhe |
| :--- | :--- |
| **ID da Feature** | `SPEC-07-VISUAL-OVERHAUL` |
| **Versão** | `2.0.0` |
| **Autor** | Andrey Silva |
| **Dependências** | `three.js`, WebGL 2.0, HTML5 2D Canvas API |

---

## 1. Arquitetura de Projeção de Miras no Chão (Ground Decals)

As miras são desenhadas a uma elevação de segurança $Y = 0.04$ acima do piso da arena para evitar *Z-Fighting*:

```text
[Aim Reticle Group] (Posição X, Z do Jogador; Rotação Y sincronizada com ângulo de mira)
  ├── Shotgun Cone: THREE.RingGeometry(1.5, 12.0, 16, 1, -PI/2 - 0.24, 0.48)
  ├── Sniper Beam: THREE.PlaneGeometry(0.3, 30.0) com centro deslocado Z=+15.0
  ├── Pistol Line: THREE.PlaneGeometry(0.35, 18.0) com centro deslocado Z=+9.0
  └── Grenade Target: THREE.RingGeometry(2.8, 3.5, 24) posicionado no Raycast do mouse
```

### Equação de Pulsação da Mira da Granada
A escala do retículo da granada oscila suavemente para conferir dinamismo:
$$S(t) = 1.0 + 0.12 \cdot \sin(0.008 \cdot t)$$

---

## 2. Overhead Billboards com Canvas 2D Dinâmico

Em vez de elementos DOM pesados que sobrecarregam o navegador com centenas de cálculos de *reflow*:
1. Cria-se um elemento `<canvas width="256" height="64">` fora da tela (*offscreen*) para cada jogador.
2. A renderização do texto, sombra, fundo escuro e barra de vida proporcional é desenhada via Canvas Context 2D.
3. Converte-se para `THREE.CanvasTexture` associada a um `THREE.Sprite(SpriteMaterial)`.
4. Define-se `sprite.position.y = 2.3` acima da origem do brawler.
5. Seta-se `depthTest: false` para que a barra de vida nunca seja ocultada por paredes ou caixas.

---

## 3. Iluminação Cinemática e Tone Mapping (ACES Filmic)

```javascript
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.25;
```

A curva de compressão de alcance dinâmico ACES Filmic evita que áreas de alta luminosidade (*highlights*) fiquem estouradas e esbranquiçadas, gerando tons ricos em gradientes de cor quentes.

### Torres de Holofotes nos Cantos
* 4 instâncias de `THREE.SpotLight` com coordenadas $(\pm 17, 7.2, \pm 17)$.
* Intensidade: $2.0 \text{ cd}$, ângulo de cone $\frac{\pi}{4}$ radianos e atenuação suave $0.4$.

---

## 4. Dinâmica do Screen Shake (Tremor de Tela)

A magnitude do tremor $\sigma$ decai exponencialmente a cada frame de renderização:
$$\sigma_{t+1} = \sigma_t \cdot 0.88$$
$$\text{Se } \sigma < 0.02 \implies \sigma = 0$$

O deslocamento da câmera em cada eixo é calculado por ruído uniforme:
$$\Delta X = (\text{random}() - 0.5) \cdot \sigma$$
$$\Delta Y = (\text{random}() - 0.5) \cdot \sigma$$

---

## 5. Física de Destroços e Partículas

Cada partícula de caixa destruída segue balística simplificada com coeficientes de atrito no solo:
$$V_{y, t+1} = V_{y, t} - 18.0 \cdot \Delta t$$
$$\text{Se } Y \le 0.1 \implies V_y = -V_y \cdot 0.4 \quad \text{e} \quad V_{x, z} = V_{x, z} \cdot 0.6$$
Ao expirar a vida útil ($\text{life} \le 0$), a malha é liberada da memória da cena Three.js.
