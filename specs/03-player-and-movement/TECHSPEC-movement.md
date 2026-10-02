# TechSpec — Módulo 03: Movimentação, Mira e Dash
**Status:** Aprovado via Grill-Me  
**Versão:** 2.0.0  

---

## 1. Cálculo de Mira com Raycaster 3D (Plano $Y = 0$)

Para converter a posição $(X, Y)$ do cursor do mouse na tela em uma coordenada de mira no mundo 3D, utilizamos um plano matemático virtual em $Y = 0$:

```javascript
const raycaster = new THREE.Raycaster();
const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const targetPoint = new THREE.Vector3();

function updateAimRotation(mouseScreenX, mouseScreenY, camera, playerMesh) {
  // Converte coordenadas de tela (-1 a +1)
  const pointer = new THREE.Vector2(
    (mouseScreenX / window.innerWidth) * 2 - 1,
    -(mouseScreenY / window.innerHeight) * 2 + 1
  );

  raycaster.setFromCamera(pointer, camera);
  raycaster.ray.intersectPlane(groundPlane, targetPoint);

  if (targetPoint) {
    // Calcula o ângulo no plano horizontal XZ
    const dx = targetPoint.x - playerMesh.position.x;
    const dz = targetPoint.z - playerMesh.position.z;
    const angleY = Math.atan2(dx, dz);
    playerMesh.rotation.y = angleY;
    return angleY;
  }
  return playerMesh.rotation.y;
}
```

---

## 2. Implementação do Dash (Esquiva no Espaço)

```typescript
interface DashState {
  isDashing: boolean;
  dashStartTime: number;
  durationMs: 200; // 0.2s
  cooldownMs: 3000; // 3.0s
  lastDashTime: number;
  directionVector: { x: number; z: number };
}

function triggerDash(player: PlayerState, currentTime: number): boolean {
  if (currentTime - player.dash.lastDashTime < player.dash.cooldownMs) {
    return false; // Ainda em recarga
  }

  player.dash.isDashing = true;
  player.dash.dashStartTime = currentTime;
  player.dash.lastDashTime = currentTime;

  // Direção do movimento atual ou para onde está olhando
  const moveDir = getNormalizedInputVector(player.inputs);
  player.dash.directionVector = moveDir.length() > 0 ? moveDir : getForwardVector(player.rotationY);

  return true;
}
```

* Durante o Dash, a cada sub-passo de física (a 60 FPS), testa-se a colisão contra os AABBs de paredes para impedir que o Dash atravesse objetos sólidos (*tunneling prevention*).

---

## 3. Protocolo de Sincronização de Input

### `PLAYER_INPUT` (Stream contínuo a 25 Hz)
```json
{
  "seq": 1420,
  "x": 3.42,
  "z": -8.15,
  "rotationY": 1.57,
  "isDashing": false
}
```
* O servidor valida se a distância percorrida entre os pacotes é compatível com a velocidade máxima permitida ($7.5 \text{ m/s}$ ou $22.5 \text{ m/s}$ em dash) antes de aceitar a posição final no tick autoritativo.
