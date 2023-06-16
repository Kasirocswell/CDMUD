const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

// Configure CORS
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3001",
    methods: ["GET", "POST"],
  },
});

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

io.on("connection", (socket) => {
  console.log("A client connected");

  io.emit("character check");

  socket.on("game command", (command) => {
    if (command.startsWith('"') && command.endsWith('"')) {
      // If the command is in quotes, we treat it as a chat message
      const chatMessage = command.slice(1, -1); // remove the quotes
      console.log("Chat message received from client:", chatMessage);
      // We then emit the chat message to all connected clients
      // Also update the terminal
      io.emit("terminal update", {
        type: "chat",
        message: `Chat: ${chatMessage}`,
      });
    } else {
      // If the command isn't in quotes, we treat it as a system command
      console.log("System command received from client:", command);
      // Process the command here, then emit the result

      // SYSTEM COMMAND LIST
      if (command.toLowerCase() == "inventory") {
        io.emit("Inventory Check");
      } else {
        io.emit("terminal update", {
          type: "system",
          message: `System command does not exist: ${command}`,
        });
      }
    }
  });

  socket.on("disconnect", () => {
    console.log("A client disconnected");
  });
});

server.listen(3000, () => {
  console.log("Server listening on port 3000");
});
