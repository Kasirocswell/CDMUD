import { useEffect, useState, useRef } from "react";
import io from "socket.io-client";
import supabase from "../utils/supabase";
import { getUser, setCharacter, charCheck } from "./utils/CharacterUtils";
import { title } from "./AsciiArt";
import backgroundImage from "../public/space.jpg";
import Image from "next/Image";

let socket;
let currUser;

export default function Home() {
  const [message, setMessage] = useState("");
  const [terminal, setTerminal] = useState([]);
  const chatEndRef = useRef(null);

  // Listening Events UseEffect
  useEffect(() => {
    socket = io("http://localhost:3000");

    socket.on("chat message", (msg) => {
      setTerminal((prevTerminal) => [
        ...prevTerminal,
        {
          type: "chat",
          message: `${sessionStorage.getItem("handle")}: ` + msg.message,
        }, // updated line
      ]);
    });

    socket.on("global message", (msg) => {
      setTerminal((prevTerminal) => [
        ...prevTerminal,
        { type: "global", message: msg.message }, // updated line
      ]);
    });

    socket.on("system message", (msg) => {
      setTerminal((prevTerminal) => [
        ...prevTerminal,
        { type: "system", message: msg.message }, // updated line
      ]);
    });

    socket.on("terminal update", (update) => {
      setTerminal((prevTerminal) => [
        ...prevTerminal,
        { type: update.type, message: update.message }, // updated line
      ]);
    });

    // Character Check
    socket.on("character check", async () => {
      console.log("character check");
      await getUser();
      await charCheck();
      await setCharacter();
      setTerminal((prevTerminal) => [
        ...prevTerminal,
        { type: "global", message: title }, // updated line
      ]);
    });

    // System Command Event Listener functions
    socket.on("inventory check", () => {
      getUser().then(async (result) => {
        currUser = result;
        const { data: inventory, inventoryError } = await supabase
          .from("Equipment")
          .select()
          .eq("uid", currUser.id);
        let equipm = inventory[0];
        let invList = `
          You are currently wearing:
          Head: ${equipm.head}
          Neck: ${equipm.neck}
          Chest: ${equipm.chest}
          Back: ${equipm.back}
          Arms: ${equipm.arms}
          Hands: ${equipm.hands}
          Waist: ${equipm.waist}
          `;
        setTerminal((prevTerminal) => [
          ...prevTerminal,
          { type: "system", message: invList }, // updated line
        ]);
      });
    });

    socket.on("status check", () => {
      getUser().then(async (result) => {
        currUser = result;
        const { data: char, charError } = await supabase
          .from("Char")
          .select()
          .eq("uid", currUser.id);
        console.log(char);
        let character = char[0];
        let statsList = `
        Name: ${character.char_name}
        Race: ${character.char_race}
        Level: ${character.char_level}
        XP: ${character.char_xp}
        Location: ${character.current_location}
        `;

        setTerminal((prevTerminal) => [
          ...prevTerminal,
          { type: "system", message: statsList }, // updated line
        ]);
      });
    });
    socket.on("help check", () => {
      let helpList = `
      Use game commands to interact with the world around you.
      To talk to other players put your message in quotes " ".
      Game Commands:
      Inventory - Check your current inventory
      Status - Check your current health, level, xp, and more.
      Look - Check out your surroundings

      `;
      setTerminal((prevTerminal) => [
        ...prevTerminal,
        { type: "system", message: helpList }, // updated line
      ]);
    });
    socket.on("look check", () => {
      getUser().then(async (result) => {
        currUser = result;
        const { data: _currentLocation, locationError } = await supabase
          .from("Char")
          .select()
          .eq("uid", currUser.id);
        let currentLocation = _currentLocation[0].current_location;
        console.log(currentLocation);
        const { data: currentRoom, roomError } = await supabase
          .from("Rooms")
          .select()
          .eq("room_name", currentLocation);
        let roomDetails = currentRoom[0];
        console.log(roomDetails);
        let roomName = `
          ${roomDetails.room_name}
          `;
        let roomDescription = `
          ${roomDetails.description}
        `;
        setTerminal((prevTerminal) => [
          ...prevTerminal,
          {
            type: "system",
            message: `${roomName} 
                      ${roomDescription}
                                      `,
          }, // updated line
        ]);
      });
    });
    socket.on("equip item", () => {});
    socket.on("unequip item", () => {});
    socket.on("drop item", () => {});
    socket.on("attack check", () => {});
    socket.on("yield check", () => {});
    socket.on("use check", () => {});
    socket.on("loot check", () => {});
    socket.on("mount check", () => {});
    socket.on("move north", () => {});
    socket.on("move south", () => {});
    socket.on("move east", () => {});
    socket.on("move west", () => {});
    socket.on("enter check", () => {});
    socket.on("exit check", () => {});

    return () => {
      socket.disconnect();
    };
  }, []);

  // Scroll to bottom every time terminal updates
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollTop = chatEndRef.current.scrollHeight;
    }
  }, [terminal]);

  const submit = (e) => {
    e.preventDefault();
    if (socket) {
      socket.emit("game command", message);
      setMessage("");
    }
  };

  const colorSelector = (type) => {
    switch (type) {
      case "global":
        return "text-white";
      case "chat":
        return "text-green-300";
      default:
        return "text-yellow-400";
    }
  };

  return (
    <div
      className="flex justify-center items-center h-screen w-screen bg-[url(../public/space.jpg)]"
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="overflow-hidden flex flex-col justify-between text-white w-[60%] h-[80%] rounded p-6">
        <div
          ref={chatEndRef} // Assign the ref here
          className="overflow-auto custom-scrollbar bg-black mb-6 h-[100%] w-[100%] rounded-xl"
          style={{ minHeight: "150px" }}
        >
          {terminal.map((msg, idx) => (
            <p
              key={idx}
              className={`whitespace-pre ${colorSelector(msg.type)}`}
            >
              {msg.message}
            </p>
          ))}
        </div>
        <form onSubmit={submit} className="flex justify-between">
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter command or chat message"
            className="w-4/5 bg-gray-700 text-white p-2 rounded"
          />
          <button
            type="submit"
            className="w-1/5 bg-blue-600 text-white rounded"
          >
            Submit
          </button>
        </form>
      </div>
    </div>
  );
}
