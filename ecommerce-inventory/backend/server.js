require("dotenv").config(); // load .env first
const http = require("http");
const app = require("./app");
const connectDB = require("./config/db");
const initSocket = require("./sockets/socketServer");
const registerListeners = require("./events/listeners");

const PORT = process.env.PORT || 5000;

(async () => {
  try {
    await connectDB();
    const server = http.createServer(app);
    const io = initSocket(server);   // Socket.IO: server -> browser
    registerListeners(io);           // EventEmitter listeners: internal events -> notifications
    server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
  } catch (err) {
    console.error("Failed to start server:", err.message);
    process.exit(1);
  }
})();
