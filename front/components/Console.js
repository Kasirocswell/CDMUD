import { useEffect, useState, useRef } from "react";
import io from "socket.io-client";
import supabase from "../utils/supabase";
import { title } from "./AsciiArt";
import backgroundImage from "../public/space.jpg";
import CustomState from "../store/CustomState";

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

    // Character Check - Title - and initial Look call
    socket.on("character check", async () => {
      console.log("character check");
    });

    // System Command Event Listener functions
    socket.on("inventory check", () => {
      getUser().then(async (result) => {
        currUser = result;

        const { data: userInventory, userInventoryError } = await supabase
          .from("Inventory")
          .select()
          .eq("uid", currUser.id);

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
  Waist: ${equipm.waist}
  Hands: ${equipm.hands}
  Feet: ${equipm.feet}

  Your backpack contains:
  ${userInventory.map((item) => `${item.quantity} x ${item.name}\n`).join("")}
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
        let current_location = sessionStorage.getItem("current_location");
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
        Location: ${current_location}
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

        let currentLocation = sessionStorage.getItem("current_location");
        console.log(currentLocation);
        const { data: currentRoom, roomError } = await supabase
          .from("Rooms")
          .select()
          .eq("room_name", currentLocation);
        let roomDetails = currentRoom[0];
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
    socket.on("equip item", (itemName) => {
      let itemNameMessage = itemName.message;
      let itemNameCapitalized = itemNameMessage
        .toLowerCase()
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.substring(1))
        .join(" ");
      getUser().then(async (result) => {
        currUser = result;
        const { data: equipableItem, equipableItemError } = await supabase
          .from("Inventory")
          .select()
          .eq("uid", currUser.id)
          .eq("name", `${itemNameCapitalized}`);
        let equippedItem = equipableItem[0];
        const { data: weaponCheck, weaponError } = await supabase
          .from("Weapons")
          .select()
          .eq("name", `${itemNameCapitalized}`);

        const { data: armorCheck, armorError } = await supabase
          .from("Armor")
          .select()
          .eq("name", `${itemNameCapitalized}`);

        let itemSlotType;
        if (armorCheck.length > 0) {
          itemSlotType = armorCheck[0];
        } else if (weaponCheck.length > 0) {
          itemSlotType = weaponCheck[0];
        } else {
          console.log("item doesn't exist");
        }

        const { data: slotCheck, slotCheckError } = await supabase
          .from("Equipment")
          .select()
          .eq(`${itemSlotType.slot}`, "Empty");

        if (armorCheck.length > 0 && slotCheck.length > 0) {
          console.log("equipping armor");
          const { data: equipableItem, locationError } = await supabase
            .from("Equipment")
            .update({ [`${armorCheck[0].slot}`]: `${itemNameCapitalized}` })
            .eq("uid", currUser.id);

          const { data: addInvItem, error } = await supabase
            .from("Inventory")
            .delete()
            .eq("uid", currUser.id)
            .eq("name", armorCheck[0].name);

          setTerminal((prevTerminal) => [
            ...prevTerminal,
            {
              type: "system",
              message: `You equipped ${itemNameCapitalized}`,
            }, // updated line
          ]);
        } else if (weaponCheck.length > 0 && slotCheck.length) {
          const { data: equipableItem, locationError } = await supabase
            .from("Equipment")
            .update({
              [`${weaponCheck[0].slot}`]: `${itemNameCapitalized}`,
            })
            .eq("uid", currUser.id);

          const { data: deleteInvItem, error } = await supabase
            .from("Inventory")
            .delete()
            .eq("uid", currUser.id)
            .eq("name", weaponCheck[0].name);

          setTerminal((prevTerminal) => [
            ...prevTerminal,
            {
              type: "system",
              message: `You equipped ${itemNameCapitalized}`,
            }, // updated line
          ]);
        }
      });
    });
    socket.on("unequip item", (itemName) => {
      let itemNameMessage = itemName.message;
      let itemNameCapitalized = itemNameMessage
        .toLowerCase()
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.substring(1))
        .join(" ");

      getUser().then(async (result) => {
        currUser = result;
        const { data: weaponCheck, weaponError } = await supabase
          .from("Weapons")
          .select()
          .eq("name", `${itemNameCapitalized}`);

        const { data: armorCheck, armorError } = await supabase
          .from("Armor")
          .select()
          .eq("name", `${itemNameCapitalized}`);

        if (armorCheck.length > 0) {
          const { data: equipableItem, locationError } = await supabase
            .from("Equipment")
            .update({ [`${armorCheck[0].slot}`]: "Empty" })
            .eq("uid", currUser.id);

          const { data: addInvItem, error } = await supabase
            .from("Inventory")
            .insert({
              uid: currUser.id,
              name: armorCheck[0].name,
              quantity: 1,
            });

          setTerminal((prevTerminal) => [
            ...prevTerminal,
            {
              type: "system",
              message: `You unequipped ${itemNameCapitalized}`,
            }, // updated line
          ]);
        } else if (weaponCheck.length > 0) {
          const { data: equipableItem, locationError } = await supabase
            .from("Equipment")
            .update({ [`${weaponCheck[0].slot}`]: "Empty" })
            .eq("uid", currUser.id);

          const { data: addInvItem, error } = await supabase
            .from("Inventory")
            .insert({
              uid: currUser.id,
              name: weaponCheck[0].name,
              quantity: 1,
            });

          setTerminal((prevTerminal) => [
            ...prevTerminal,
            { type: "system", message: `You unequipped ${itemName.message}` }, // updated line
          ]);
        }
      });
    });
    socket.on("drop item", () => {});
    socket.on("pickup item", () => {});
    socket.on("attack check", () => {});
    socket.on("yield check", () => {});
    socket.on("use check", () => {});
    socket.on("loot check", () => {});
    socket.on("mount check", () => {});
    socket.on("move north", async () => {
      getUser().then(async (result) => {
        currUser = result;
        let current_location = sessionStorage.getItem("current_location");
        const { data: currentRoom, roomError } = await supabase
          .from("Rooms")
          .select()
          .eq("room_name", current_location);
        let roomDetails = currentRoom[0];
        if (roomDetails.north !== "None") {
          sessionStorage.setItem("current_location", `${roomDetails.north}`);
          socket.emit("game command", "look");
        } else {
          setTerminal((prevTerminal) => [
            ...prevTerminal,
            { type: "system", message: "You cannot go that way." }, // updated line
          ]);
        }
      });
    });
    socket.on("move south", () => {
      getUser().then(async (result) => {
        currUser = result;
        let current_location = sessionStorage.getItem("current_location");
        const { data: currentRoom, roomError } = await supabase
          .from("Rooms")
          .select()
          .eq("room_name", current_location);
        let roomDetails = currentRoom[0];
        if (roomDetails.south !== "None") {
          sessionStorage.setItem("current_location", `${roomDetails.south}`);
          socket.emit("game command", "look");
        } else {
          setTerminal((prevTerminal) => [
            ...prevTerminal,
            { type: "system", message: "You cannot go that way." }, // updated line
          ]);
        }
      });
    });
    socket.on("move east", () => {
      getUser().then(async (result) => {
        currUser = result;
        let current_location = sessionStorage.getItem("current_location");
        const { data: currentRoom, roomError } = await supabase
          .from("Rooms")
          .select()
          .eq("room_name", current_location);
        let roomDetails = currentRoom[0];
        if (roomDetails.east !== "None") {
          sessionStorage.setItem("current_location", `${roomDetails.east}`);
          socket.emit("game command", "look");
        } else {
          setTerminal((prevTerminal) => [
            ...prevTerminal,
            { type: "system", message: "You cannot go that way." }, // updated line
          ]);
        }
      });
    });
    socket.on("move west", () => {
      getUser().then(async (result) => {
        currUser = result;
        let current_location = sessionStorage.getItem("current_location");
        const { data: currentRoom, roomError } = await supabase
          .from("Rooms")
          .select()
          .eq("room_name", current_location);
        let roomDetails = currentRoom[0];
        if (roomDetails.west !== "None") {
          sessionStorage.setItem("current_location", `${roomDetails.west}`);
          socket.emit("game command", "look");
        } else {
          setTerminal((prevTerminal) => [
            ...prevTerminal,
            { type: "system", message: "You cannot go that way." }, // updated line
          ]);
        }
      });
    });
    socket.on("enter check", () => {
      getUser().then(async (result) => {
        currUser = result;
        let current_location = sessionStorage.getItem("current_location");
        const { data: currentRoom, roomError } = await supabase
          .from("Rooms")
          .select()
          .eq("room_name", current_location);
        let roomDetails = currentRoom[0];
        if (roomDetails.enter !== "None") {
          sessionStorage.setItem("current_location", `${roomDetails.enter}`);
          socket.emit("game command", "look");
        } else {
          setTerminal((prevTerminal) => [
            ...prevTerminal,
            { type: "system", message: "You cannot go that way." }, // updated line
          ]);
        }
      });
    });
    socket.on("exit check", () => {
      getUser().then(async (result) => {
        currUser = result;
        let current_location = sessionStorage.getItem("current_location");
        const { data: currentRoom, roomError } = await supabase
          .from("Rooms")
          .select()
          .eq("room_name", current_location);
        let roomDetails = currentRoom[0];
        if (roomDetails.exit !== "None") {
          sessionStorage.setItem("current_location", `${roomDetails.exit}`);
          socket.emit("game command", "look");
        } else {
          setTerminal((prevTerminal) => [
            ...prevTerminal,
            { type: "system", message: "You cannot go that way." }, // updated line
          ]);
        }
      });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const saveLocation = () => {
    getUser().then(async (result) => {
      currUser = result;
      let current_location = sessionStorage.getItem("current_location");
      const { data: currentLocationData, locationDataError } = await supabase
        .from("Char")
        .select()
        .eq("uid", currUser.id);
      let currentDbLocation = currentLocationData[0].current_location;
      console.log(current_location);
      console.log(currentDbLocation);
      if (currentDbLocation != current_location) {
        const { data: saveLocationData, locationError } = await supabase
          .from("Char")
          .update({
            [`current_location`]: `${current_location}`,
          })
          .eq("uid", currUser.id);

        console.log("Location Saved");
        setTimeout(saveLocation, 65000);
      } else {
        console.log(`player hasn't moved.`);
      }
    });
  };

  // saveLocation();

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
          className=" whitespace-pre-wrap overflow-auto custom-scrollbar bg-black mb-6 h-[100%] w-[100%] rounded-xl"
          style={{ minHeight: "150px" }}
        >
          {terminal.map((msg, idx) => (
            <p key={idx} className={` ${colorSelector(msg.type)} px-36`}>
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
