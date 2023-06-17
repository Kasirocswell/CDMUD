import { useEffect, useState, useRef } from "react";
import io from "socket.io-client";
import supabase from "../utils/supabase";
import { getUser, setCharacter, charCheck } from "./utils/CharacterUtils";
import { title } from "./AsciiArt";

let socket;

export default function Home() {
  const [message, setMessage] = useState("");
  const [terminal, setTerminal] = useState([]);

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

    // System Command Event Listeners
    socket.on("inventory check", () => {});

    return () => {
      socket.disconnect();
    };
  }, []);

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
    <div className="flex justify-center items-center h-screen bg-gray-800">
      <div
        className="flex flex-col justify-between bg-black text-white w-64 h-64 rounded p-6"
        style={{ width: "500px", height: "500px" }}
      >
        <div
          className="overflow-auto bg-black mb-6 h-[500px]"
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
            className="w-1/5 bg-blue-500 text-white p-2 rounded"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
