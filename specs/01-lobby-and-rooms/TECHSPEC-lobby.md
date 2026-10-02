# TechSpec — Módulo 01: Gestão de Salas, Lobby e Preview 3D
**Status:** Aprovado via Grill-Me  
**Versão:** 2.0.0  

---

## 1. Catálogo dos 10 Personagens

Os 10 mini-personagens utilizam os modelos low-poly do acervo Kenney Mini Characters:

| ID | Nome de Exibição | Arquivo Modelo 3D | Cor / Tema Base |
| :--- | :--- | :--- | :--- |
| `char_soldier` | Soldado Tático | `characters/soldier.glb` | Camuflagem / Verde Oliva |
| `char_ninja` | Shinobi Sombra | `characters/ninja.glb` | Preto / Vermelho Escuro |
| `char_robot` | Androide 01 | `characters/robot.glb` | Cinza Metálico / LED Azul |
| `char_astronaut` | Cosmonauta | `characters/astronaut.glb` | Branco Espacial / Visor Dourado |
| `char_punk` | Moicano Punk | `characters/punk.glb` | Moicano Rosa / Jaqueta de Couro |
| `char_zombie` | Zumbi Faminto | `characters/zombie.glb` | Verde Pálido / Roupas Rasgadas |
| `char_suit` | Agente de Terno | `characters/suit.glb` | Terno Preto / Gravata Vermelha |
| `char_cyborg` | Ciborgue Cyber | `characters/cyborg.glb` | Prata com Olho Biônico Neon |
| `char_brawler` | Pugilista | `characters/brawler.glb` | Luvas Vermelhas e Regata |
| `char_scout` | Explorador | `characters/scout.glb` | Bege com Chapéu de Aventureiro |

---

## 2. Preview 3D no Lobby (Arquitetura Three.js)

```javascript
// Mini Scene no Canvas do Lobby (largura 300px, altura 350px)
class CharacterPreviewCarousel {
  constructor(canvasElement) {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, 300 / 350, 0.1, 100);
    this.camera.position.set(0, 1.2, 3.2);
    this.camera.lookAt(0, 0.8, 0);

    // Iluminação de estúdio suave
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    const keyLight = new THREE.DirectionalLight(0xfff5e6, 2.0);
    keyLight.position.set(2, 4, 3);
    this.scene.add(ambientLight, keyLight);

    this.currentMesh = null;
    this.rotationSpeed = 0.015; // Rotação suave contínua
  }

  loadCharacter(characterId) {
    // Carrega do cache ou faz download do GLB
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    if (this.currentMesh) {
      this.currentMesh.rotation.y += this.rotationSpeed;
    }
    this.renderer.render(this.scene, this.camera);
  }
}
```

---

## 3. Contratos de Eventos WebSocket do Lobby

### 3.1. `LOBBY_CREATE`
```json
{
  "name": "Andrey",
  "characterId": "char_soldier",
  "weaponId": "shotgun"
}
```

### 3.2. `LOBBY_JOIN`
```json
{
  "roomCode": "B7K2",
  "name": "Lucas",
  "characterId": "char_ninja",
  "weaponId": "sniper"
}
```

### 3.3. `LOBBY_ADD_BOT`
```json
{
  "difficulty": "medium", // "easy" | "medium" | "hard"
  "characterId": "char_robot",
  "weaponId": "grenade_launcher"
}
```

### 3.4. `LOBBY_CHANGE_SELECTION`
```json
{
  "characterId": "char_cyborg",
  "weaponId": "pistol"
}
```

### 3.5. `LOBBY_STATE` (Broadcast pelo Servidor)
```json
{
  "roomCode": "B7K2",
  "hostId": "socket_123",
  "slots": [
    { "id": "socket_123", "name": "Andrey", "isHost": true, "isBot": false, "characterId": "char_soldier", "weaponId": "shotgun" },
    { "id": "socket_456", "name": "Lucas", "isHost": false, "isBot": false, "characterId": "char_ninja", "weaponId": "sniper" },
    { "id": "bot_1", "name": "Bot Androide", "isHost": false, "isBot": true, "difficulty": "hard", "characterId": "char_robot", "weaponId": "grenade_launcher" }
  ],
  "canStart": true
}
```
