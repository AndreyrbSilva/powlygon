// server/server.js
import express from "express";
import http from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";
import { RoomManager } from "./roomManager.js";
import { GameEngine } from "./gameLoop.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

const PORT = process.env.PORT || 3000;

// Servir arquivos estáticos do cliente
app.use(express.static(path.join(__dirname, "../client")));
app.use("/specs", express.static(path.join(__dirname, "../specs")));

const roomManager = new RoomManager();
const activeEngines = new Map(); // roomCode -> GameEngine

io.on("connection", (socket) => {
  // 1. Criar Sala
  socket.on("LOBBY_CREATE", (data) => {
    const room = roomManager.createRoom(socket.id, data);
    socket.join(room.code);
    socket.emit("LOBBY_CREATED", { roomCode: room.code });
    io.to(room.code).emit("LOBBY_STATE", roomManager.formatLobbyState(room));
  });

  // 2. Entrar em Sala
  socket.on("LOBBY_JOIN", (data) => {
    const result = roomManager.joinRoom(data.roomCode, socket.id, data);
    if (!result.success) {
      socket.emit("LOBBY_ERROR", { message: result.error });
      return;
    }
    socket.join(result.room.code);
    socket.emit("LOBBY_JOINED", { roomCode: result.room.code });
    io.to(result.room.code).emit("LOBBY_STATE", roomManager.formatLobbyState(result.room));
  });

  // 3. Adicionar Bot
  socket.on("LOBBY_ADD_BOT", (data) => {
    const room = roomManager.getRoomBySocket(socket.id);
    if (!room) return;
    const result = roomManager.addBot(room.code, socket.id, data);
    if (result.success) {
      io.to(room.code).emit("LOBBY_STATE", roomManager.formatLobbyState(result.room));
    } else {
      socket.emit("LOBBY_ERROR", { message: result.error });
    }
  });

  // 4. Remover Bot
  socket.on("LOBBY_REMOVE_BOT", (data) => {
    const room = roomManager.getRoomBySocket(socket.id);
    if (!room) return;
    const result = roomManager.removeBot(room.code, socket.id, data.botId);
    if (result.success) {
      io.to(room.code).emit("LOBBY_STATE", roomManager.formatLobbyState(result.room));
    }
  });

  // 5. Atualizar Seleção no Lobby (Personagem ou Arma)
  socket.on("LOBBY_CHANGE_SELECTION", (data) => {
    const room = roomManager.getRoomBySocket(socket.id);
    if (!room) return;
    const updated = roomManager.updatePlayerSelection(room.code, socket.id, data);
    if (updated) {
      io.to(room.code).emit("LOBBY_STATE", roomManager.formatLobbyState(updated));
    }
  });

  // 6. Iniciar Partida
  socket.on("LOBBY_START", () => {
    const room = roomManager.getRoomBySocket(socket.id);
    if (!room || room.hostSocketId !== socket.id) return;
    if (room.players.size < 2) {
      socket.emit("LOBBY_ERROR", { message: "Necessário pelo menos 2 participantes (humanos ou bots)." });
      return;
    }

    const engine = new GameEngine(room, io);
    activeEngines.set(room.code, engine);
    engine.start();
  });

  // 7. Inputs de Gameplay
  socket.on("PLAYER_INPUT", (data) => {
    const room = roomManager.getRoomBySocket(socket.id);
    if (!room) return;
    const engine = activeEngines.get(room.code);
    if (engine) engine.handlePlayerInput(socket.id, data);
  });

  socket.on("PLAYER_FIRE", (data) => {
    const room = roomManager.getRoomBySocket(socket.id);
    if (!room) return;
    const engine = activeEngines.get(room.code);
    if (engine) engine.handleFire(socket.id, data.weaponId, data.angle, data.targetPoint, false);
  });

  socket.on("PLAYER_DASH", (data) => {
    const room = roomManager.getRoomBySocket(socket.id);
    if (!room) return;
    const engine = activeEngines.get(room.code);
    if (engine) engine.handleDash(socket.id, data.angle);
  });

  socket.on("PLAYER_USE_SUPER", (data) => {
    const room = roomManager.getRoomBySocket(socket.id);
    if (!room) return;
    const engine = activeEngines.get(room.code);
    if (engine) engine.handleFire(socket.id, data.weaponId, data.angle, data.targetPoint, true);
  });

  socket.on("PLAYER_RESPAWN_REQUEST", (data) => {
    const room = roomManager.getRoomBySocket(socket.id);
    if (!room) return;
    const engine = activeEngines.get(room.code);
    if (engine && data.newWeaponId) engine.changeWeaponOnRespawn(socket.id, data.newWeaponId);
  });

  socket.on("PLAY_AGAIN", () => {
    const room = roomManager.getRoomBySocket(socket.id);
    if (!room || room.hostSocketId !== socket.id) return;
    const engine = activeEngines.get(room.code);
    if (engine) engine.playAgain();
  });

  // Desconexão
  socket.on("disconnect", () => {
    const result = roomManager.removePlayer(socket.id);
    if (result) {
      if (result.deleted) {
        const engine = activeEngines.get(result.roomCode);
        if (engine) {
          engine.stop();
          activeEngines.delete(result.roomCode);
        }
      } else if (result.room) {
        io.to(result.roomCode).emit("LOBBY_STATE", roomManager.formatLobbyState(result.room));
      }
    }
  });
});

server.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`🚀 Mini Brawl 3D Server rodando na porta ${PORT}`);
  console.log(`🌐 Acesse: http://localhost:${PORT}`);
  console.log(`===============================================`);
});
