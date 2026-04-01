const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const registerSessionHandlers = require('./sessionHandlers');

let io;

function initSocket(server) {
  const PROD = process.env.NODE_ENV === 'production';

  io = new Server(server, {
    cors: PROD ? undefined : { origin: process.env.CORS_ORIGIN, credentials: true },
  });

  // JWT authentication on handshake
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('No token provided'));
    try {
      socket.user = jwt.verify(token, process.env.JWT_SECRET);
      next();
    } catch {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    registerSessionHandlers(io, socket);
  });

  console.log('[Socket.io] Initialized');
}

function getIO() {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
}

module.exports = { initSocket, getIO };
