// server/roomManager.js
// Implementação fiel à especificação: specs/01-lobby-and-rooms/TECHSPEC-lobby.md

const CODE_CHARACTERS = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"; // Sem 0, O, 1, I

export class RoomManager {
  constructor() {
    this.rooms = new Map(); // roomCode -> GameRoom
  }

  generateRoomCode(length = 4) {
    let code = "";
    do {
      code = "";
      for (let i = 0; i < length; i++) {
        code += CODE_CHARACTERS.charAt(Math.floor(Math.random() * CODE_CHARACTERS.length));
      }
    } while (this.rooms.has(code));
    return code;
  }

  createRoom(hostSocketId, hostData) {
    const code = this.generateRoomCode();
    const room = {
      code,
      hostSocketId,
      status: "LOBBY", // LOBBY | COUNTDOWN | IN_GAME | PODIUM
      countdownRemaining: 3,
      matchTimeRemaining: 180, // 3 minutos
      players: new Map(),
      aiBotsCount: 0,
      createdAt: Date.now()
    };

    const hostSlot = {
      id: hostSocketId,
      name: (hostData.name || "Jogador 1").slice(0, 16),
      characterId: hostData.characterId || "char_soldier",
      weaponId: hostData.weaponId || "pistol",
      isHost: true,
      isBot: false,
      difficulty: null,
      slotIndex: 0,
      kills: 0,
      deaths: 0,
      damageDealt: 0,
      hp: 1000,
      maxHp: 1000,
      superCharge: 0,
      lastDashTime: 0,
      isDashing: false,
      dashStartTime: 0,
      shieldUntil: 0,
      x: 0,
      z: 0,
      rotationY: 0,
      isDead: false,
      respawnAt: 0
    };

    room.players.set(hostSocketId, hostSlot);
    this.rooms.set(code, room);
    return room;
  }

  joinRoom(roomCode, socketId, playerData) {
    const code = roomCode.toUpperCase().trim();
    const room = this.rooms.get(code);

    if (!room) {
      return { success: false, error: "Sala não encontrada com esse código." };
    }

    if (room.status !== "LOBBY") {
      return { success: false, error: "Partida já em andamento nesta sala." };
    }

    if (room.players.size >= 4) {
      return { success: false, error: "A sala já está cheia (máximo de 4 jogadores)." };
    }

    // Acha o primeiro slotIndex livre (0 a 3)
    const occupiedSlots = new Set([...room.players.values()].map(p => p.slotIndex));
    let nextSlotIndex = 0;
    for (let i = 0; i < 4; i++) {
      if (!occupiedSlots.has(i)) {
        nextSlotIndex = i;
        break;
      }
    }

    const playerSlot = {
      id: socketId,
      name: (playerData.name || `Jogador ${room.players.size + 1}`).slice(0, 16),
      characterId: playerData.characterId || "char_ninja",
      weaponId: playerData.weaponId || "shotgun",
      isHost: false,
      isBot: false,
      difficulty: null,
      slotIndex: nextSlotIndex,
      kills: 0,
      deaths: 0,
      damageDealt: 0,
      hp: 1000,
      maxHp: 1000,
      superCharge: 0,
      lastDashTime: 0,
      isDashing: false,
      dashStartTime: 0,
      shieldUntil: 0,
      x: 0,
      z: 0,
      rotationY: 0,
      isDead: false,
      respawnAt: 0
    };

    room.players.set(socketId, playerSlot);
    return { success: true, room };
  }

  addBot(roomCode, socketId, botOptions = {}) {
    const room = this.rooms.get(roomCode);
    if (!room) return { success: false, error: "Sala não encontrada." };
    if (room.hostSocketId !== socketId) return { success: false, error: "Apenas o Host pode adicionar bots." };
    if (room.players.size >= 4) return { success: false, error: "Sala cheia (máximo 4 jogadores)." };

    room.aiBotsCount++;
    const botId = `bot_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const botNames = ["Bot Alpha", "Bot Tático", "Bot Cyber", "Bot Titan", "Bot Zero"];
    const characters = ["char_robot", "char_cyborg", "char_zombie", "char_punk", "char_astronaut"];
    const weapons = ["pistol", "shotgun", "grenade_launcher", "sniper"];

    const occupiedSlots = new Set([...room.players.values()].map(p => p.slotIndex));
    let nextSlotIndex = 0;
    for (let i = 0; i < 4; i++) {
      if (!occupiedSlots.has(i)) {
        nextSlotIndex = i;
        break;
      }
    }

    const botSlot = {
      id: botId,
      name: botNames[(room.players.size - 1) % botNames.length],
      characterId: botOptions.characterId || characters[Math.floor(Math.random() * characters.length)],
      weaponId: botOptions.weaponId || weapons[Math.floor(Math.random() * weapons.length)],
      isHost: false,
      isBot: true,
      difficulty: botOptions.difficulty || "medium", // easy | medium | hard
      slotIndex: nextSlotIndex,
      kills: 0,
      deaths: 0,
      damageDealt: 0,
      hp: 1000,
      maxHp: 1000,
      superCharge: 0,
      lastDashTime: 0,
      isDashing: false,
      dashStartTime: 0,
      shieldUntil: 0,
      x: 0,
      z: 0,
      rotationY: 0,
      isDead: false,
      respawnAt: 0
    };

    room.players.set(botId, botSlot);
    return { success: true, room };
  }

  removeBot(roomCode, socketId, botId) {
    const room = this.rooms.get(roomCode);
    if (!room) return { success: false, error: "Sala não encontrada." };
    if (room.hostSocketId !== socketId) return { success: false, error: "Apenas o Host pode remover bots." };

    const bot = room.players.get(botId);
    if (bot && bot.isBot) {
      room.players.delete(botId);
      return { success: true, room };
    }
    return { success: false, error: "Bot não encontrado." };
  }

  updatePlayerSelection(roomCode, socketId, data) {
    const room = this.rooms.get(roomCode);
    if (!room) return null;
    const player = room.players.get(socketId);
    if (!player) return null;

    if (data.characterId) player.characterId = data.characterId;
    if (data.weaponId) player.weaponId = data.weaponId;
    if (data.name) player.name = data.name.slice(0, 16);
    return room;
  }

  removePlayer(socketId) {
    for (const [code, room] of this.rooms.entries()) {
      if (room.players.has(socketId)) {
        room.players.delete(socketId);

        // Se a sala ficou vazia de humanos, encerra a sala
        const humanPlayers = [...room.players.values()].filter(p => !p.isBot);
        if (humanPlayers.length === 0) {
          this.rooms.delete(code);
          return { roomCode: code, room: null, deleted: true };
        }

        // Se o host saiu, transfere para o próximo jogador humano
        if (room.hostSocketId === socketId) {
          room.hostSocketId = humanPlayers[0].id;
          humanPlayers[0].isHost = true;
        }

        return { roomCode: code, room, deleted: false };
      }
    }
    return null;
  }

  getRoomBySocket(socketId) {
    for (const room of this.rooms.values()) {
      if (room.players.has(socketId)) return room;
    }
    return null;
  }

  formatLobbyState(room) {
    return {
      roomCode: room.code,
      hostId: room.hostSocketId,
      status: room.status,
      countdownRemaining: room.countdownRemaining,
      matchTimeRemaining: room.matchTimeRemaining,
      slots: [...room.players.values()].map(p => ({
        id: p.id,
        name: p.name,
        characterId: p.characterId,
        weaponId: p.weaponId,
        isHost: p.isHost,
        isBot: p.isBot,
        difficulty: p.difficulty,
        slotIndex: p.slotIndex
      })),
      canStart: room.players.size >= 2
    };
  }
}
