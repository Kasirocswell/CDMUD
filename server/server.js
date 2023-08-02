const express = require("express");
const https = require("https");
const fs = require("fs");
const { Server } = require("socket.io");

const app = express();

// Provide the key and certificate
const options = {
  key: fs.readFileSync("./key.pem"),
  cert: fs.readFileSync("./cert.pem"),
};

const server = https.createServer(options, app);

// Configure CORS
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

// Listen on HTTPS
server.listen(3000, () => {
  console.log("Server running at https://146.190.155.158:3000/");
});

io.on("connection", (socket) => {
  console.log("A client connected");
  io.emit("title");
  io.emit("character check");

  socket.on("character check", () => {
    io.emit("character check");
  });

  socket.on("first look", () => {
    io.emit("look check");
  });

  socket.on("run north", () => {
    io.emit("move north");
    io.emit("enemy check");
  });

  socket.on("run south", () => {
    io.emit("move south");
    io.emit("enemy check");
  });

  socket.on("run east", () => {
    io.emit("move east");
    io.emit("enemy check");
  });

  socket.on("run west", () => {
    io.emit("move west");
    io.emit("enemy check");
  });

  // On Game Command from Console.js
  socket.on("game command", (command) => {
    if (command.startsWith('"') && command.endsWith('"')) {
      // If the command is in quotes, we treat it as a chat message
      const chatMessage = command.slice(1, -1); // remove the quotes
      console.log("Chat message received from client:", chatMessage);
      // We then emit the chat message to all connected clients
      // Also update the terminal
      io.emit("chat message", {
        type: "chat",
        message: `${chatMessage}`,
      });
    } else if (command.type == "global") {
      io.emit("terminal update", {
        type: "global",
        message: `${command}`,
      });
    } else if (command.type == "character_update") {
      io.emit("terminal update", {
        type: "name_update",
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
      } else if (
        command.toLowerCase().startsWith("inspect") ||
        command.toLowerCase().startsWith("examine")
      ) {
        let target = command.slice(8);
        io.emit("inspect", {
          type: "system",
          message: `${target}`,
        });
      } else if (command.toLowerCase().startsWith("equip")) {
        // Extract the item name from the command
        const itemName = command.slice(6); // remove 'equip ' from the command
        console.log("Equip command received from client for item:", itemName);
        // Then emit the itemName to the client
        io.emit("equip item", {
          type: "system",
          message: `${itemName}`,
        });
      } else if (command.toLowerCase().startsWith("unequip")) {
        // Extract the item name from the command
        const itemName = command.slice(8); // remove 'unequip ' from the command
        console.log("Equip command received from client for item:", itemName);
        // Then emit the itemName to the client
        io.emit("unequip item", {
          type: "system",
          message: `${itemName}`,
        });
      } else if (command.toLowerCase().startsWith("drop")) {
        // Extract the item name from the command
        const itemName = command.slice(5); // remove 'unequip ' from the command
        console.log("Drop command received from client for item:", itemName);
        // Then emit the itemName to the client
        io.emit("drop item", {
          type: "system",
          message: `${itemName}`,
        });
      } else if (
        command.toLowerCase().startsWith("pickup") ||
        command.toLowerCase().startsWith("get")
      ) {
        const itemName = command.slice(7); // remove 'unequip ' from the command
        console.log("Pickup command received from client for item:", itemName);
        // Then emit the itemName to the client
        io.emit("pickup item", {
          type: "system",
          message: `${itemName}`,
        });
      } else if (
        command.toLowerCase().startsWith("attack") ||
        command.toLowerCase().startsWith("kill")
      ) {
        let target;
        if (command.toLowerCase().startsWith("attack")) {
          target = command.slice(7);
        } else if (command.toLowerCase().startsWith("kill")) {
          target = command.slice(5);
        } // remove 'unequip ' from the command
        console.log("attack command received from client for target:", target);
        // Then emit the itemName to the client
        io.emit("attack check", {
          type: "system",
          message: `${target}`,
        });
      } else if (command.toLowerCase().startsWith("yield")) {
        io.emit("yield check");
      } else if (command.toLowerCase().startsWith("use")) {
        const itemName = command.slice(4); // remove 'use ' from the command
        console.log("Equip command received from client for item:", itemName);
        // Then emit the itemName to the client
        io.emit("use check", {
          type: "system",
          message: `${itemName}`,
        });
      } else if (command.toLowerCase().startsWith("loot")) {
        let target = command.slice(5);
        io.emit("loot check", {
          type: "system",
          message: `${target}`,
        });
      } else if (command.toLowerCase().startsWith("mount")) {
        // io.emit("mount check");
      } else if (command.toLowerCase().startsWith("talk to")) {
        let npcName = command.toLowerCase().slice(8);
        io.emit("talk check", {
          type: "system",
          message: npcName,
        });
      } else if (
        command.toLowerCase() == "north" ||
        command.toLowerCase() == "n"
      ) {
        io.emit("move north");
        io.emit("enemy check");
      } else if (
        command.toLowerCase() == "south" ||
        command.toLowerCase() == "s"
      ) {
        io.emit("move south");
        io.emit("enemy check");
      } else if (
        command.toLowerCase() == "east" ||
        command.toLowerCase() == "e"
      ) {
        io.emit("move east");
        io.emit("enemy check");
      } else if (
        command.toLowerCase() == "west" ||
        command.toLowerCase() == "w"
      ) {
        io.emit("move west");
        io.emit("enemy check");
      } else if (
        command.toLowerCase() == "enter" ||
        command.toLowerCase() == "en"
      ) {
        io.emit("enter check");
        io.emit("enemy check");
      } else if (
        command.toLowerCase() == "exit" ||
        command.toLowerCase() == "ex"
      ) {
        io.emit("exit check");
        io.emit("enemy check");
      } else if (command.toLowerCase() == "activate teleporter") {
        io.emit("activate teleporter");
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
