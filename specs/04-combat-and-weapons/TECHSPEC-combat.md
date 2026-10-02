# TechSpec — Módulo 04: Combate, Armas e Habilidades Supremas (Super)
**Status:** Aprovado via Grill-Me  
**Versão:** 2.0.0  

---

## 1. Estrutura de Dados do Projétil

```typescript
interface Projectile {
  id: string;
  ownerId: string;
  weaponId: "pistol" | "shotgun" | "grenade_launcher" | "sniper";
  isSuper: boolean;
  
  // Posição e velocidade no espaço 3D
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  
  // Propriedades físicas
  damage: number;
  remainingDistance: number;
  splashRadius: number;
  canArcOverWalls: boolean;
  piercesWalls: boolean;
  createdAt: number;
}
```

---

## 2. Física do Projétil Parabólico (Lança-Granadas)

Para a granada passar por cima das caixas, sua altura $Y$ é calculada de acordo com o progresso do percurso $(t \in [0, 1])$:

$$Y(t) = 4.0 \cdot \sin(\pi \cdot t)$$

* O projétil atinge uma altura máxima de **4.0 metros** no meio da trajetória ($t = 0.5$).
* Como as caixas e paredes possuem altura máxima de $2.2 \text{ metros}$, enquanto $Y(t) > 2.2$, o projétil **não colide** com obstáculos e viaja livremente até o ponto de impacto no chão.
* Ao aterrissar ($t = 1.0$), uma esfera de dano de raio $R = 3.5\text{m}$ (ou $7.0\text{m}$ na Mega Bomba Super) é detonada, aplicando dano com queda linear de intensidade:
  $$\text{Dano}(d) = \text{DanoBase} \cdot \left(1 - \frac{d}{R}\right)$$

---

## 3. Disparo de Habilidade Suprema (Super)

### Contrato de Disparo do Super: `PLAYER_USE_SUPER`
```json
{
  "weaponId": "shotgun",
  "origin": { "x": 5.2, "y": 0.8, "z": -3.1 },
  "angle": 1.25,
  "targetPoint": { "x": 12.0, "z": -1.0 }
}
```

### Processamento no Servidor:
1. Verifica se o `player.superCharge >= 1000`. Se não for, ignora a mensagem.
2. Zera a barra `player.superCharge = 0`.
3. Executa a lógica correspondente à arma:
   - **Pistola:** Spawna 24 projéteis com ângulos $\theta_i = i \cdot \frac{2\pi}{24}$.
   - **Shotgun:** Inicia deslocamento rápido com destruição instantânea de caixas na trajetória.
   - **Lança-Granadas:** Spawna projétil nuclear com raio de splash expandido e poça de fogo residual.
   - **Sniper:** Executa raycast contínuo penetrante sem interrupção em paredes sólidas.
4. Faz o broadcast do evento `SUPER_TRIGGERED` para todos os clientes da sala tocarem a animação e o som especial.
