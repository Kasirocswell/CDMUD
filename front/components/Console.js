import { useEffect, useState, useRef } from "react";
import io from "socket.io-client";
import supabase from "../utils/supabase";
import { title } from "./AsciiArt";
import backgroundImage from "../public/space.jpg";
import CustomState from "../store/CustomState";

let socket;

export default function Home() {
  const [message, setMessage] = useState("");
  const [getData, setData] = useState("");
  const [terminal, setTerminal] = useState([]);
  const chatEndRef = useRef(null);

  const getUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  };

  const setMap = async () => {
    const { data, error } = await supabase.from("Rooms").select("*");

    if (error) {
      console.error("Error fetching data:", error);
    } else {
      CustomState.dispatch({
        type: "SET_TABLE_DATA",
        payload: { tableName: "Rooms", data },
      });
    }
  };

  const setWeapons = async () => {
    const { data, error } = await supabase.from("Weapons").select("*");

    if (error) {
      console.error("Error fetching data:", error);
    } else {
      CustomState.dispatch({
        type: "SET_TABLE_DATA",
        payload: { tableName: "Weapons", data },
      });
    }
  };

  const setArmor = async () => {
    const { data, error } = await supabase.from("Armor").select("*");

    if (error) {
      console.error("Error fetching data:", error);
    } else {
      CustomState.dispatch({
        type: "SET_TABLE_DATA",
        payload: { tableName: "Armor", data },
      });
    }
  };

  const setRoomInventory = async () => {
    const { data, error } = await supabase.from("Weapons").select("*");

    if (error) {
      console.error("Error fetching data:", error);
    } else {
      CustomState.dispatch({
        type: "SET_TABLE_DATA",
        payload: { tableName: "RoomInventory", data },
      });
    }
  };
  setMap();
  setWeapons();
  setArmor();
  setRoomInventory();
  let rooms = CustomState.getRoomState();
  console.log("logging rooms");
  console.log(rooms);
  let weapons = CustomState.getWeaponState();
  let armor = CustomState.getArmorState();
  let roomInventory = customState.getState().RoomInventory;
  const dataCheck = () => {
    if (rooms == null || rooms == undefined || typeof rooms != "array") {
      setMap();
      rooms = CustomState.getRoomState();
      console.log("Map Set");
      CustomState.printState();
    }

    if (weapons == null || weapons == undefined) {
      setWeapons();
      weapons = CustomState.getWeaponState();
      console.log("Weapons Set");
      CustomState.printState();
    }

    if (armor == null || armor == undefined) {
      setArmor();
      armor = CustomState.getArmorState();
      console.log("Armor Set");
      CustomState.printState();
    }

    if (
      roomInventory == null ||
      roomInventory == undefined ||
      typeof roomInventory != "array"
    ) {
      setRoomInventory();
      rooms = CustomState.getState().RoomInventory;
      console.log("Room Inventory Set");
      CustomState.printState();
    }
  };
  dataCheck();

  // Listening Events UseEffect
  useEffect(() => {
    socket = io("http://localhost:3000");

    socket.on("chat message", (msg) => {
      getUser().then((result) => {
        console.log(result);
        let currUser = result;
        let local_user = CustomState.getUserState(currUser.id);
        console.log(local_user);
        setTerminal((prevTerminal) => [
          ...prevTerminal,
          {
            type: "chat",
            message: `${local_user.character.name}: ` + msg.message,
          }, // updated line
        ]);
      });
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
      socket.emit("game command", "look");
    });

    // System Command Event Listener functions
    socket.on("inventory check", () => {
      getUser().then(async (result) => {
        let currUser = result;
        let local_user = CustomState.getUserState(currUser.id);

        let invList = `
  Weapons:

  Right Hand: ${local_user.equipment.right_hand}
  Left Hand: ${local_user.equipment.left_hand}

  You are currently wearing:

  Head: ${local_user.equipment.head}
  Neck: ${local_user.equipment.neck}
  Chest: ${local_user.equipment.chest}
  Back: ${local_user.equipment.back}
  Arms: ${local_user.equipment.arms}
  Waist: ${local_user.equipment.waist}
  Hands: ${local_user.equipment.hands}
  Feet: ${local_user.equipment.feet}

  Your backpack contains:
  ${CustomState.getUserState(currUser.id).inventory}\n
  `;

        setTerminal((prevTerminal) => [
          ...prevTerminal,
          { type: "system", message: invList }, // updated line
        ]);
      });
    });

    socket.on("status check", () => {
      getUser().then(async (result) => {
        let currUser = result;
        let local_user = CustomState.getUserState(currUser.id);
        let statsList = `
        Name: ${local_user.character.name}
        Race: ${local_user.character.race}
        Level: ${local_user.character.level}
        XP: ${local_user.character.xp}
        Location: ${local_user.character.current_location}
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
        let currUser = result;
        let local_user = CustomState.getUserState(currUser.id);
        let current_room;
        let find_current_room = CustomState.getState().Rooms.filter((room) => {
          if (room.room_name == local_user.character.current_location) {
            current_room = room;
          }
        });

        let roomDetails = current_room;
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
        let currUser = result;
        let local_user = CustomState.getUserState(currUser.id);
        let slot;
        let inInventory = false;
        let isWeapon = false;
        let isArmor = false;
        let inventory = [...CustomState.getUserState(currUser.id).inventory];
        console.log("inventory data");
        console.log(inventory);

        if (
          CustomState.getUserState(currUser.id).inventory.includes(
            `${itemNameCapitalized}`
          )
        ) {
          inInventory = true;
        }
        CustomState.getState().Weapons.filter((item) => {
          if (item.name == `${itemNameCapitalized}`) {
            isWeapon = true;
            slot = item.slot;
          }
        });

        CustomState.getState().Armor.filter((item) => {
          if (item.name == `${itemNameCapitalized}`) {
            isArmor = true;
            slot = item.slot;
          }
        });

        if (isArmor) {
          CustomState.dispatch({
            type: "UPDATE_USER",
            payload: {
              userId: currUser.id,
              data: {
                equipment: {
                  ...local_user.equipment, // Spread the current equipment data
                  [slot]: `${itemNameCapitalized}`, // Set right_hand to 'empty'
                },
              },
            },
          });
          CustomState.dispatch({
            type: "UPDATE_USER",
            payload: {
              userId: currUser.id,
              data: {
                inventory:
                  CustomState.getUserState(currUser.id).inventory -
                  `${itemNameCapitalized}`,
                // Set right_hand to 'empty'
                // Append unequipped item to inventory
              },
            },
          });
          setTerminal((prevTerminal) => [
            ...prevTerminal,
            {
              type: "system",
              message: `You equipped ${itemNameCapitalized}`,
            }, // updated line
          ]);
        } else if (isWeapon) {
          CustomState.dispatch({
            type: "UPDATE_USER",
            payload: {
              userId: currUser.id,
              data: {
                equipment: {
                  ...local_user.equipment, // Spread the current equipment data
                  [slot]: `${itemNameCapitalized}`, // Set right_hand to 'empty'
                },
              },
            },
          });
          CustomState.dispatch({
            type: "UPDATE_USER",
            payload: {
              userId: currUser.id,
              data: {
                inventory: CustomState.getUserState(
                  currUser.id
                ).inventory.replace(`${itemNameCapitalized}`, ""),
                // Set right_hand to 'empty'
                // Append unequipped item to inventory
              },
            },
          });
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
        let currUser = result;
        let local_user = CustomState.getUserState(currUser.id);
        let slot;
        let isEquipped = false;
        let isWeapon = false;
        let isArmor = false;
        let equipment = local_user.equipment;
        let equipmentValues = Object.values(equipment);
        equipmentValues.map((item) => {
          if (item == itemNameCapitalized) {
            isEquipped = true;
          }
        });

        CustomState.getState().Weapons.filter((item) => {
          if (item.name == itemNameCapitalized) {
            isWeapon = true;
            slot = item.slot;
          }
        });

        CustomState.getState().Armor.filter((item) => {
          if (item.name == itemNameCapitalized) {
            isArmor = true;
            slot = item.slot;
          }
        });

        if (isArmor) {
          console.log("user equipment");
          let rawEquipmentData = CustomState.getUserState(
            currUser.id
          ).equipment;
          let rawInventoryData = CustomState.getUserState(
            currUser.id
          ).inventory;
          let equipmentData = Object.create(rawEquipmentData);
          console.log("Raw Data");
          if (rawInventoryData != {}) {
            CustomState.dispatch({
              type: "UPDATE_USER",
              payload: {
                userId: currUser.id,
                data: {
                  equipment: {
                    ...local_user.equipment, // Spread the current equipment data
                    [slot]: "Empty", // Set right_hand to 'empty'
                  },
                },
              },
            });
            CustomState.dispatch({
              type: "UPDATE_USER",
              payload: {
                userId: currUser.id,
                data: {
                  inventory:
                    `${CustomState.getUserState(currUser.id).inventory}\n` +
                    `[${itemNameCapitalized}]`, // Set right_hand to 'empty'
                  // Append unequipped item to inventory
                },
              },
            });
          } else {
            CustomState.dispatch({
              type: "UPDATE_USER",
              payload: {
                userId: currUser.id,
                data: {
                  equipment: {
                    ...equipmentData, // Spread the current equipment data
                    [slot]: "empty", // Set right_hand to 'empty'
                  },
                  inventory: [itemNameCapitalized], // Append unequipped item to inventory
                },
              },
            });
          }
          setTerminal((prevTerminal) => [
            ...prevTerminal,
            {
              type: "system",
              message: `You unequipped ${itemNameCapitalized}`,
            }, // updated line
          ]);
        } else if (isWeapon) {
          console.log("user equipment");
          let rawEquipmentData = CustomState.getUserState(
            currUser.id
          ).equipment;
          let rawInventoryData = CustomState.getUserState(
            currUser.id
          ).inventory;
          let equipmentData = Object.create(rawEquipmentData);
          console.log("Raw Data");
          if (rawInventoryData != {}) {
            CustomState.dispatch({
              type: "UPDATE_USER",
              payload: {
                userId: currUser.id,
                data: {
                  equipment: {
                    ...local_user.equipment, // Spread the current equipment data
                    [slot]: "Empty", // Set right_hand to 'empty'
                  },
                },
              },
            });
            CustomState.dispatch({
              type: "UPDATE_USER",
              payload: {
                userId: currUser.id,
                data: {
                  inventory:
                    `${CustomState.getUserState(currUser.id).inventory}\n` +
                    `[${itemNameCapitalized}]`,

                  // Append unequipped item to inventory
                },
              },
            });
          } else {
            CustomState.dispatch({
              type: "UPDATE_USER",
              payload: {
                userId: currUser.id,
                data: {
                  equipment: {
                    ...equipmentData, // Spread the current equipment data
                    [slot]: "empty", // Set right_hand to 'empty'
                  },
                  inventory: [itemNameCapitalized], // Append unequipped item to inventory
                },
              },
            });
          }

          setTerminal((prevTerminal) => [
            ...prevTerminal,
            {
              type: "system",
              message: `You unequipped ${itemNameCapitalized}`,
            }, // updated line
          ]);
        }
      });
    });
    socket.on("drop item", () => {
      // Check if user has this item in their inventory
      // add the item to cooresponding room inventory
      // remove the item from the user inventory
    });
    socket.on("pickup item", () => {
      // Check if the item exists in room inventory
      // add item to the player inventory
      // remove item from the room inventory
    });
    socket.on("attack check", () => {});
    socket.on("yield check", () => {});
    socket.on("use check", () => {});
    socket.on("loot check", () => {
      // check if the corresponding enemy is indeed dead
      // check the dead enemy's inventory
      // loot all or some of the dead enemy inventory
      // add looted items to player inventory
      // remove looted items from dead enemy inventory
    });
    // socket.on("mount check", () => {});
    socket.on("move north", async () => {
      getUser().then(async (result) => {
        let currUser = result;
        let local_user = CustomState.getUserState(currUser.id);
        let current_location = CustomState.getUserState(currUser.id).character
          .current_location;
        let current_room_data;
        let current_room = CustomState.getState().Rooms.filter((room) => {
          if (room.room_name == local_user.character.current_location) {
            current_room_data = room;
          }
        });
        if (current_room_data.north !== "None") {
          CustomState.dispatch({
            type: "UPDATE_USER",
            payload: {
              userId: currUser.id,
              data: {
                character: {
                  ...local_user.character,
                  current_location: `${current_room_data.north}`,
                },
              },
            },
          });
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
        let currUser = result;
        let local_user = CustomState.getUserState(currUser.id);
        let current_location = CustomState.getUserState(currUser.id).character
          .current_location;
        let current_room_data;
        let current_room = CustomState.getState().Rooms.filter((room) => {
          if (room.room_name == local_user.character.current_location) {
            current_room_data = room;
          }
        });
        console.log("current location data");
        console.log(current_room_data);
        if (current_room_data.south !== "None") {
          CustomState.dispatch({
            type: "UPDATE_USER",
            payload: {
              userId: currUser.id,
              data: {
                character: {
                  ...local_user.character,
                  current_location: `${current_room_data.south}`,
                },
              },
            },
          });
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
        let currUser = result;
        let local_user = CustomState.getUserState(currUser.id);
        let current_location = CustomState.getUserState(currUser.id).character
          .current_location;
        let current_room_data;
        let current_room = CustomState.getState().Rooms.filter((room) => {
          if (room.room_name == local_user.character.current_location) {
            current_room_data = room;
          }
        });
        if (current_room_data.east !== "None") {
          CustomState.dispatch({
            type: "UPDATE_USER",
            payload: {
              userId: currUser.id,
              data: {
                character: {
                  ...local_user.character,
                  current_location: `${current_room_data.east}`,
                },
              },
            },
          });
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
        let currUser = result;
        let local_user = CustomState.getUserState(currUser.id);
        let current_location = CustomState.getUserState(currUser.id).character
          .current_location;
        let current_room_data;
        let current_room = CustomState.getState().Rooms.filter((room) => {
          if (room.room_name == local_user.character.current_location) {
            current_room_data = room;
          }
        });
        if (current_room_data.west !== "None") {
          CustomState.dispatch({
            type: "UPDATE_USER",
            payload: {
              userId: currUser.id,
              data: {
                character: {
                  ...local_user.character,
                  current_location: `${current_room_data.west}`,
                },
              },
            },
          });
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
        let currUser = result;
        let local_user = CustomState.getUserState(currUser.id);
        let current_location = CustomState.getUserState(currUser.id).character
          .current_location;
        let current_room_data;
        let current_room = CustomState.getState().Rooms.filter((room) => {
          if (room.room_name == local_user.character.current_location) {
            current_room_data = room;
          }
        });
        if (current_room_data.enter !== "None") {
          CustomState.dispatch({
            type: "UPDATE_USER",
            payload: {
              userId: currUser.id,
              data: {
                character: {
                  ...local_user.character,
                  current_location: `${current_room_data.enter}`,
                },
              },
            },
          });
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
        let currUser = result;
        let local_user = CustomState.getUserState(currUser.id);
        let current_location = CustomState.getUserState(currUser.id).character
          .current_location;
        let current_room_data;
        let current_room = CustomState.getState().Rooms.filter((room) => {
          if (room.room_name == local_user.character.current_location) {
            current_room_data = room;
          }
        });
        if (current_room_data.exit !== "None") {
          CustomState.dispatch({
            type: "UPDATE_USER",
            payload: {
              userId: currUser.id,
              data: {
                character: {
                  ...local_user.character,
                  current_location: `${current_room_data.exit}`,
                },
              },
            },
          });
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
