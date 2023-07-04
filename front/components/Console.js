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

  let currUser;

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

  const setItems = async () => {
    const { data, error } = await supabase.from("Items").select("*");

    if (error) {
      console.error("Error fetching data:", error);
    } else {
      CustomState.dispatch({
        type: "SET_TABLE_DATA",
        payload: { tableName: "Items", data },
      });
    }
  };
  const setEnemies = async () => {
    const { data, error } = await supabase.from("Enemies").select("*");

    if (error) {
      console.error("Error fetching data:", error);
    } else {
      CustomState.dispatch({
        type: "SET_TABLE_DATA",
        payload: { tableName: "Enemies", data },
      });
    }
  };
  setMap();
  setWeapons();
  setArmor();
  setItems();
  setEnemies();
  CustomState.printState();

  // Listening Events UseEffect
  useEffect(() => {
    socket = io("http://localhost:3000");

    socket.on("chat message", (msg) => {
      getUser().then((result) => {
        console.log(result);
        currUser = result;
        let local_user = CustomState.getUserState(currUser.id);
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

    // Character Check - Title
    socket.on("character check", async () => {
      console.log("character check");
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
        let roomInventory = CustomState.getState().RoomInventory;
        let find_current_room = CustomState.getState().Rooms.filter((room) => {
          if (room.room_name == local_user.character.current_location) {
            current_room = room;
          }
        });
        const loot = CustomState.getState().loot;
        let roomLoot = loot.map((loot) => {
          if (loot.room_name == local_user.character.current_location) {
            return `${loot.item_name}`;
          } else {
          }
        });
        let roomDetails = current_room;
        let enemies = CustomState.getState().Enemies.filter((enemy) => {
          return (
            enemy.current_location == local_user.character.current_location
          );
        });

        let enemiesInRoom = enemies.map((enemy) => enemy.name).join(", ");
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
    Loot in the room: ${roomLoot}
    Enemies in the room: ${enemiesInRoom}
    Players in the room: 
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
                    `${itemNameCapitalized}`, // Set right_hand to 'empty'
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
          let rawEquipmentData = CustomState.getUserState(
            currUser.id
          ).equipment;
          let rawInventoryData = CustomState.getUserState(
            currUser.id
          ).inventory;
          let equipmentData = Object.create(rawEquipmentData);
          if (rawInventoryData != {}) {
            CustomState.dispatch({
              type: "UPDATE_USER",
              payload: {
                userId: currUser.id,
                data: {
                  equipment: {
                    ...local_user.equipment, // Spread the current equipment data
                    slot: "Empty", // Set right_hand to 'empty'
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
                    `${itemNameCapitalized}`,

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
                  inventory: itemNameCapitalized, // Append unequipped item to inventory
                },
              },
            });
          }

          setTerminal((prevTerminal) => [
            ...prevTerminal,
            {
              type: "system",
              message: `You unequipped ${itemNameCapitalized}`,
            },
          ]);
        }
      });
    });
    socket.on("drop item", (itemName) => {
      let inInventory = false;
      let itemNameMessage = itemName.message;
      let itemNameCapitalized = itemNameMessage
        .toLowerCase()
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.substring(1))
        .join(" ");

      getUser().then(async (result) => {
        let currUser = result;
        let local_user = CustomState.getUserState(currUser.id);
        let newId = 10;
        let droppedItems = {
          id: newId, // this needs to be unique, so you can't just use 0
          created_at: new Date().toISOString(), // for current time in ISO format
          room_name: local_user.character.current_location,
          item_name: itemNameCapitalized,
          Quantity: "1",
        };
        let newInventory = [...CustomState.getState().loot, droppedItems];
        if (
          CustomState.getUserState(currUser.id).inventory.includes(
            `${itemNameCapitalized}`
          )
        ) {
          inInventory = true;
        }

        if (inInventory) {
          CustomState.dispatch({
            type: "SET_TABLE_DATA",
            payload: {
              tableName: "loot",
              data: newInventory,
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
              },
            },
          });
          setTerminal((prevTerminal) => [
            ...prevTerminal,
            { type: "system", message: `You dropped ${itemNameCapitalized}` }, // updated line
          ]);
        } else {
          console.log("You don't have that item");
        }
      });
    });
    socket.on("pickup item", (itemName) => {
      let inInventory = false;
      let itemNameMessage = itemName.message;
      let itemNameCapitalized = itemNameMessage
        .toLowerCase()
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.substring(1))
        .join(" ");

      getUser().then(async (result) => {
        let currUser = result;
        let local_user = CustomState.getUserState(currUser.id);

        let newInventory = [
          ...CustomState.getState().loot.filter((loot) => {
            loot.item_name != itemNameCapitalized;
          }),
        ];
        if (CustomState.getState().loot.includes(`${itemNameCapitalized}`)) {
          inInventory = true;
        }

        if (!inInventory) {
          CustomState.dispatch({
            type: "SET_TABLE_DATA",
            payload: {
              tableName: "loot",
              data: newInventory,
            },
          });
          CustomState.dispatch({
            type: "UPDATE_USER",
            payload: {
              userId: currUser.id,
              data: {
                inventory:
                  `${CustomState.getUserState(currUser.id).inventory}\n` +
                  `${itemNameCapitalized}`,
              },
            },
          });
          setTerminal((prevTerminal) => [
            ...prevTerminal,
            { type: "system", message: `You picked up ${itemNameCapitalized}` }, // updated line
          ]);
        } else {
          console.log("You don't have that item");
        }
      });
    });
    socket.on("enemy check", () => {
      let enemyHealth;
      getUser().then((result) => {
        currUser = result;
        let local_user = CustomState.getUserState(currUser.id);
        CustomState.getState().Enemies.filter((enemy) => {
          if (
            enemy.current_location === local_user.character.current_location
          ) {
            setTerminal((prevTerminal) => [
              ...prevTerminal,
              {
                type: "system",
                message: `${enemy.name} glares at you angrily.`,
              },
            ]);
          } else {
            console.log("something went horribly wrong");
          }
        });
      });

      function autoAttack() {
        getUser().then((result) => {
          currUser = result;
          let local_user = CustomState.getUserState(currUser.id);
          let enemies = CustomState.getState().Enemies.filter((enemy) => {
            if (
              enemy.current_location ===
                local_user.character.current_location &&
              enemy.health > 0 &&
              local_user.character.health > 0
            ) {
              enemyHealth = Number(enemy.health);
            }
          });
        });
        // Enemy attack
        setTimeout(function () {
          const enemyAttackInterval = setInterval(() => {
            getUser().then((result) => {
              currUser = result;
              let local_user = CustomState.getUserState(currUser.id);
              let enemies = CustomState.getState().Enemies.filter((enemy) => {
                let playerHealth = Number(local_user.character.health);
                if (
                  enemy.current_location ===
                    local_user.character.current_location &&
                  enemyHealth > 0 &&
                  local_user.character.health > 0
                ) {
                  let enemyDamage = 2;
                  playerHealth = playerHealth - enemyDamage * 2;
                  let attackMessage = `${enemy.name} attacked you for ${
                    enemyDamage * 2
                  } damage`;
                  setTerminal((prevTerminal) => [
                    ...prevTerminal,
                    { type: "system", message: `${attackMessage}` }, // updated line
                  ]);

                  CustomState.dispatch({
                    type: "UPDATE_USER",
                    payload: {
                      userId: currUser.id,
                      data: {
                        character: {
                          ...CustomState.getState().users[currUser.id]
                            .character, // Spread the current character data
                          health: `${playerHealth}`, // Update only health
                        },
                      },
                    },
                  });
                  console.log("END OF ENEMY ROUND");
                  console.log(playerHealth);
                } else {
                  clearInterval(playerAttackInterval);
                  clearInterval(enemyAttackInterval);
                }
              });
            });
          }, 2000); // Adjust interval length as necessary

          // Player attack
          const playerAttackInterval = setInterval(() => {
            getUser().then((result) => {
              currUser = result;
              let local_user = CustomState.getUserState(currUser.id);
              let enemies = CustomState.getState().Enemies.filter((enemy) => {
                let playerHealth = Number(local_user.character.health);
                if (
                  enemy.current_location ===
                    local_user.character.current_location &&
                  enemyHealth > 0 &&
                  playerHealth > 0
                ) {
                  let enemyDamage = 10;
                  enemyHealth = enemyHealth - 10;
                  let attackMessage = `You attacked ${enemy.name} for ${enemyDamage} damage`;
                  setTerminal((prevTerminal) => [
                    ...prevTerminal,
                    { type: "system", message: `${attackMessage}` }, // updated line
                  ]);

                  console.log("END OF PLAYER ROUND");
                  console.log(enemyHealth);
                  console.log(CustomState.getState().Enemies);
                } else {
                  clearInterval(playerAttackInterval);
                  clearInterval(enemyAttackInterval);
                }
              });
            });
          }, 1000);

          // Cleanup function
          return () => {
            clearInterval(playerAttackInterval);
            clearInterval(enemyAttackInterval);
          };
        }, 12000);
      }
      autoAttack();
    });
    socket.on("attack check", (target) => {
      // check if target is in the room
      // check if target is alive
      // check if target can be attacked
      // start battle sequence
      // when one party's health reaches zero end battle sequence
      // make battle results announcement
      // drop loot, set loot system
      // remove enemy from the room
      // create respawn system from enemies
      let targetMessage = target.message;
      let targetNameCapitalized = targetMessage
        .toLowerCase()
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.substring(1))
        .join(" ");

      getUser().then((result) => {
        let currUser = result;
        let local_user = CustomState.getUserState(currUser.id);

        // Check if the enemy is in the room
        let enemies = CustomState.getState().Enemies.filter((enemy) => {
          return (
            enemy.current_location == local_user.character.current_location
          );
        });

        let targetedEnemy = enemies[0];

        // check if target is alive
        let targetAlive;
        if (targetedEnemy.health > 0) {
          targetAlive = true;
        } else {
          targetAlive = false;
        }
        let canAttack = false;
        if (targetedEnemy.can_attack) {
          canAttack = true;
        } else {
          canAttack = false;
        }
        let playerAlive;
        if (local_user.character.health > 0) {
          playerAlive = true;
        } else {
          playerAlive = false;
        }
        let totalDamage;
        let natDamage = local_user.attributes.str * 2;
        totalDamage = natDamage;
        let weaponRightHand = CustomState.getWeaponState().filter((weapon) => {
          return weapon.name == local_user.equipment.right_hand;
        });
        let weaponLeftHand = "Empty";
        if (weaponRightHand != "Empty") {
          totalDamage += weaponRightHand.atk;
        }
        if (weaponLeftHand != "Empty") {
          totalDamage += weaponLeftHand.atk;
        }
        let autoAttackInterval = null;
        if (playerAlive && targetAlive && canAttack) {
          autoAttack();
        } else {
          console.log("You can't attack that.");
        }

        function autoAttack() {
          // Player attack
          const playerAttackInterval = setInterval(() => {
            getUser().then((result) => {
              currUser = result;
              let local_user = CustomState.getUserState(currUser.id);
              let enemies = CustomState.getState().Enemies.filter((enemy) => {
                console.log(enemy);
                if (
                  enemy.current_location ===
                    local_user.character.current_location &&
                  enemy.health > 0
                ) {
                  console.log("You can see the enemy");
                  let enemyDamage = 10;
                  enemy.health -= enemyDamage;
                  let attackMessage = `You attacked ${enemy.name} for ${enemyDamage} damage`;
                  setTerminal((prevTerminal) => [
                    ...prevTerminal,
                    { type: "system", message: `${attackMessage}` }, // updated line
                  ]);
                }
              });
            });
          }, 1000); // Adjust interval length as necessary

          // Enemy attack
          const enemyAttackInterval = setInterval(() => {
            getUser().then((result) => {
              currUser = result;
              let local_user = CustomState.getUserState(currUser.id);
              let enemies = CustomState.getState().Enemies.filter((enemy) => {
                console.log(enemy);
                if (
                  enemy.current_location ===
                    local_user.character.current_location &&
                  enemy.health > 0
                ) {
                  console.log("The enemy can see you");
                  let enemyDamage = enemy.atk;
                  local_user.character.char_health -= enemyDamage * 2;
                  let attackMessage = `${enemy.name} attacked you for ${
                    enemyDamage * 2
                  } damage`;
                  setTerminal((prevTerminal) => [
                    ...prevTerminal,
                    { type: "system", message: `${attackMessage}` }, // updated line
                  ]);
                }
              });
            });
          }, 2000); // Adjust interval length as necessary

          // Cleanup function
          return () => {
            clearInterval(playerAttackInterval);
            clearInterval(enemyAttackInterval);
          };
        }
      });
    });
    socket.on("yield check", () => {});
    socket.on("use check", (itemName) => {
      let canUse = false;
      let inInventory = false;
      let itemNameMessage = itemName.message;
      let itemNameCapitalized = itemNameMessage
        .toLowerCase()
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.substring(1))
        .join(" ");

      getUser().then((result) => {
        let currUser = result;
        let local_user = CustomState.getUserState(currUser.id);

        let newInventory = [
          ...CustomState.getState().loot.filter((loot) => {
            loot.item_name != itemNameCapitalized;
          }),
        ];

        if (CustomState.getState().loot.includes(`${itemNameCapitalized}`)) {
          inInventory = true;
        }
        CustomState.getState().items.map((item) => {
          if (item.name == itemName.message) {
            if (item.canUse == true) {
              canUse = true;
              console.log("can use?");
              console.log(canUse);
            }
          }
        });

        if (canUse) {
          CustomState.dispatch({
            type: "UPDATE_USER",
            payload: {
              userId: currUser.id,
              data: {
                inventory: CustomState.getUserState(
                  currUser.id
                ).inventory.replace(`${itemNameCapitalized}`, ""),
              },
            },
          });
          setTerminal((prevTerminal) => [
            ...prevTerminal,
            { type: "system", message: `You used ${itemNameCapitalized}` }, // updated line
          ]);
        } else {
          console.log("You can't use that");
        }
      });
    });
    socket.on("loot check", () => {
      // check if the corresponding enemy is indeed dead
      // check the dead enemy's inventory
      // loot all or some of the dead enemy inventory
      // add looted items to player inventory
      // remove looted items from dead enemy inventory
    });
    socket.on("mount check", () => {});
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
