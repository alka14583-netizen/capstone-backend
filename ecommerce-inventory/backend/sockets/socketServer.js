const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Creates the Socket.IO server. Every connection must present a valid JWT.
module.exports = function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: process.env.CLIENT_URL || "http://localhost:5173", methods: ["GET", "POST"] },
  });

  // Authentication middleware: runs once when a client tries to connect
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth && socket.handshake.auth.token;
      if (!token) return next(new Error("Authentication required"));
      const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      const user = await User.findById(payload.id);
      if (!user || !user.isActive) return next(new Error("Invalid user"));
      socket.user = { id: user.id, role: user.role };
      next();
    } catch (err) {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    // Room-based authorization: the SERVER decides which rooms a user joins.
    // Clients cannot join rooms themselves, so nobody can listen to another user's room.
    socket.join(`user:${socket.user.id}`);
    if (socket.user.role !== "customer") socket.join(`role:${socket.user.role}`);
  });

  return io;
};
