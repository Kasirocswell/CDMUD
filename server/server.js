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
  io.emit("terminal update", {
    type: "global",
    message: `Welcome to Celestial`,
  });

  socket.on("game command", (command) => {
    if (command.startsWith('"') && command.endsWith('"')) {
      // If the command is in quotes, we treat it as a chat message
      const chatMessage = command.slice(1, -1); // remove the quotes
      console.log("Chat message received from client:", chatMessage);
      // We then emit the chat message to all connected clients
      // Also update the terminal
      io.emit("terminal update", {
        type: "chat",
        message: `${chatMessage}`,
      });
    } else if (command.type == "global") {
      io.emit("terminal update", {
        type: "global",
        message: `${command}`,
      });
    } else {
      // If the command isn't in quotes, we treat it as a system command
      console.log("System command received from client:", command);
      // Process the command here, then emit the result

      // SYSTEM COMMAND LIST
      if (
        command.toLowerCase() == "inventory" ||
        command.toLowerCase() == "inv"
      ) {
        io.emit("inventory check");
      } else if (
        command.toLowerCase() == "status" ||
        command.toLowerCase() == "stats"
      ) {
        io.emit("status check");
      } else if (command.toLowerCase() == "help") {
        io.emit("help check");
      } else if (command.toLowerCase() == "look") {
        io.emit("look check");
      } else if (command.toLowerCase().startsWith("equip")) {
        io.emit("equip item");
      } else if (command.toLowerCase().startsWith("unequip")) {
        io.emit("unequip item");
      } else if (command.toLowerCase().startsWith("drop")) {
        io.emit("drop item");
      } else if (
        command.toLowerCase().startsWith("attack") ||
        command.toLowerCase().startsWith("kill")
      ) {
        io.emit("attack check");
      } else if (command.toLowerCase().startsWith("yield")) {
        io.emit("yield check");
      } else if (command.toLowerCase().startsWith("use")) {
        io.emit("use check");
      } else if (command.toLowerCase().startsWith("loot")) {
        io.emit("loot check");
      } else if (command.toLowerCase().startsWith("mount")) {
        io.emit("mount check");
      } else if (
        command.toLowerCase() == "north" ||
        command.toLowerCase() == "n"
      ) {
        io.emit("move north");
      } else if (
        command.toLowerCase() == "south" ||
        command.toLowerCase() == "s"
      ) {
        io.emit("move south");
      } else if (
        command.toLowerCase() == "east" ||
        command.toLowerCase() == "e"
      ) {
        io.emit("move east");
      } else if (
        command.toLowerCase() == "west" ||
        command.toLowerCase() == "w"
      ) {
        io.emit("move west");
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
