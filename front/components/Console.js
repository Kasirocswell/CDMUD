import { useEffect, useState, useRef } from "react";
import io from "socket.io-client";
import supabase from "../utils/supabase";
import { title } from "./AsciiArt";
import backgroundImage from "../public/space.jpg";
import CustomState from "../store/CustomState";
import { GAME_STATES } from "../store/CustomState";
import { raceMessage } from "./RaceMessage";
import { ClassMessage } from "./ClassMessage";
import { getRandomAttackPhrase } from "./utils/AttackPhrases";
import { getRandomEnemyAttackPhrase } from "./utils/EnemyAttackPhrases";
import {
  createAttributesMessage,
  AttributeMessage,
  createAttributes,
  attributes,
  reroll,
} from "./AttributeMessage";

let socket;

export default function Home() {
  const [message, setMessage] = useState("");
  const [terminal, setTerminal] = useState([]);
  const [rollCount, setRollCount] = useState(1);
  const chatEndRef = useRef(null);
  const didRun = useRef(false);
  const startSpawn = useRef(false);
  const corpseCheck = useRef(false);
  const firstLook = useRef(false);
  let gameState = CustomState.getGameState();

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

  function sendToDeadRoom(player) {
    getUser().then(async (result) => {
      currUser = result;
      let local_user = CustomState.getUserState(currUser.id);
      await CustomState.dispatch({
        type: "UPDATE_USER",
        payload: {
          userId: currUser.id,
          data: {
            character: {
              ...local_user.character,
              current_location: `DEAD`,
            },
          },
        },
      });

      socket.emit("game command", "look");

      // Calculating the respawn time
      const respawnTime = 40 * local_user.character.level;

      // Set timeout until player should be respawned
      setTimeout(() => respawnPlayer(player), respawnTime);
    });

    function respawnPlayer(player) {
      getUser().then(async (result) => {
        currUser = result;
        let local_user = CustomState.getUserState(currUser.id);
        const { data: characterData, dataError } = await supabase
          .from("Char")
          .select()
          .eq("uid", currUser.id)
          .single();

        await CustomState.dispatch({
          type: "UPDATE_USER",
          payload: {
            userId: currUser.id,
            data: {
              character: {
                ...local_user.character,
                health: `${characterData.char_health}`,
                xp: `${characterData.char_xp}`,
                current_location: `${characterData.char_respawn}`,
                deathTime: null,
                respawn: `${characterData.char_respawn}`,
              },
              equipment: {
                right_hand: `Empty`,
                left_hand: `Empty`,
                head: `Empty`,
                neck: `Empty`,
                chest: `Empty`,
                back: `Empty`,
                arms: `Empty`,
                hands: `Empty`,
                waist: `Empty`,
                legs: `Empty`,
                feet: `Empty`,
              },
            },
          },
        });

        await CustomState.dispatch({
          type: "UPDATE_GAME_STATE",
          payload: GAME_STATES.GAME, // Or whatever the next game state is
        });

        // Get updated state
        local_user = CustomState.getUserState(currUser.id);
        // Notify player of respawn
        console.log("RESPAWNED LOCAL USER");
        console.log(local_user);
        console.log("LOCAL USER RESPAWN LOCATION");
        console.log(local_user.character.current_location);
        console.log("ROOM DATA");
        console.log(CustomState.getState().Rooms);
        await setTerminal((prevTerminal) => [
          ...prevTerminal,
          {
            type: "system",
            message: `${local_user.character.name}, you have been fully healed and returned to ${local_user.character.respawn}.`,
          },
        ]);
      });
    }
  }

  let combatTimers = {};
  let enemyHealth = {};
  let playerHealth = {};

  async function endCombat(enemy) {
    let combatState = CustomState.getState().combatState;
    console.log(`end combat enemy ID`);
    console.log(enemy.id);
    if (combatState[enemy.id]) {
      delete combatState[enemy.id];
      clearInterval(combatTimers[`${enemy.id}_enemy`]); // This line stops the enemy combat timer
      clearInterval(combatTimers[`${enemy.id}_player`]); // This line stops the player combat timer
      delete combatTimers[`${enemy.id}_enemy`];
      delete combatTimers[`${enemy.id}_player`];
      CustomState.dispatch({
        type: "UPDATE_COMBAT_STATE",
        payload: combatState,
      });

      CustomState.dispatch({
        type: "UPDATE_GAME_STATE",
        payload: GAME_STATES.GAME, // Or whatever the next game state is
      });
    }
  }

  async function playerAttack(player, enemy) {
    await getUser().then((result) => {
      currUser = result;
      let local_user = CustomState.getUserState(currUser.id);
      let weaponRight = local_user.equipment.right_hand;
      let weaponLeft = local_user.equipment.left_hand;
      let weaponRightDamage = CustomState.getWeaponState().map((weapon) => {
        if (weaponRight == weapon.name) {
          return Number(weapon.atk);
        }
      });
      let totalDamage;

      if (weaponRight != undefined) {
        totalDamage =
          Number(local_user.attributes.str) + Number(weaponRightDamage);
      } else {
        totalDamage = Number(local_user.attributes.str);
      }

      enemyHealth[enemy.id] -= totalDamage;

      setTerminal((prevTerminal) => [
        ...prevTerminal,
        {
          type: "system",
          message: getRandomAttackPhrase(player.name, enemy.name, totalDamage),
        },
      ]);
    });
  }

  async function enemyAttack(enemy, player) {
    getUser().then((result) => {
      currUser = result;
      let local_user = CustomState.getUserState(currUser.id);
      if (local_user.character.health > 0) {
        playerHealth -= enemy.atk;
        setTerminal((prevTerminal) => [
          ...prevTerminal,
          {
            type: "system",
            message: getRandomEnemyAttackPhrase(
              enemy.name,
              player.name,
              enemy.atk
            ),
          },
        ]);
        CustomState.dispatch({
          type: "UPDATE_USER",
          payload: {
            userId: currUser.id,
            data: {
              character: {
                ...local_user.character,
                health: playerHealth,
              },
            },
          },
        });
      } else {
        endCombat(enemy);
        console.log("COMBAT ENDING HERE");
        console.log("ENEMY ATTACK");
      }
    });
  }

  async function performEnemyCombatAction(player, enemy) {
    let game_state = CustomState.getGameState();
    getUser().then(async (result) => {
      currUser = result;
      let local_user = CustomState.getUserState(currUser.id);
      if (
        player.health &&
        playerHealth &&
        enemyHealth[enemy.id] > 0 &&
        local_user.character.health > 0 &&
        game_state == "COMBAT" &&
        local_user.character.current_location == enemy.current_location
      ) {
        let combatState = CustomState.getState().combatState;
        let players = combatState[enemy.id];

        // pick a target and attack
        let target = players[Math.floor(Math.random() * players.length)];
        await enemyAttack(enemy, target);
      } else {
        endCombat(enemy);
        console.log("COMBAT ENDING HERE");
        console.log("PERFORMENEMY COMBAT ACTION");
      }
    });
  }

  async function performPlayerCombatAction(player, enemy) {
    let game_state = CustomState.getGameState();
    getUser().then(async (result) => {
      currUser = result;
      let local_user = CustomState.getUserState(currUser.id);
      if (
        playerHealth > 0 &&
        game_state == "COMBAT" &&
        local_user.character.current_location == enemy.current_location
      ) {
        let combatState = CustomState.getState().combatState;
        console.log("ACTIVE COMBAT TIMERS");
        console.log(combatTimers);
        await playerAttack(player, enemy);
      } else {
        endCombat(enemy);
        console.log("COMBAT ENDING HERE");
        console.log("PERFORM PLAYER COMBAT ACTION");
      }
    });
  }

  function startEnemyCombatTimer(player, enemy) {
    let trueSpeed = 40 * enemy.speed;
    let combatInterval = 5000 - trueSpeed;
    console.log("start enemy timer enemy id");
    console.log(enemy.id);
    combatTimers[`${enemy.id}_enemy`] = setInterval(async () => {
      let game_state = CustomState.getGameState();
      if (playerHealth > 0 && game_state == "COMBAT") {
        await performEnemyCombatAction(player, enemy);
      } else if (
        playerHealth <= 0 &&
        game_state == "COMBAT" &&
        player.current_location == enemy.current_location
      ) {
        endCombat(enemy);
        setTerminal((prevTerminal) => [
          ...prevTerminal,
          {
            type: "system",
            message: `The ${enemy.name} has killed ${player.name}.`,
          },
        ]);
        createPlayerCorpse(player);
        CustomState.dispatch({
          type: "UPDATE_GAME_STATE",
          payload: GAME_STATES.GAME,
        });
        playerDies(player);
      } else {
        endCombat(enemy);
        console.log("COMBAT ENDING HERE");
        console.log("START ENEMY COMBAT TIMER");
      }
    }, combatInterval);
  }

  function startPlayerCombatTimer(player, enemy) {
    let trueSpeed = 40 * enemy.speed;
    let combatInterval = 5000 - trueSpeed;
    combatTimers[`${enemy.id}_player`] = setInterval(async () => {
      if (enemyHealth[enemy.id] > 0) {
        console.log("PLAYER TIMER ENEMY HEALTH");
        console.log(enemyHealth[enemy.id]);
        await performPlayerCombatAction(player, enemy);
      } else if (enemyHealth[enemy.id] <= 0) {
        endCombat(enemy);
        setTerminal((prevTerminal) => [
          ...prevTerminal,
          {
            type: "system",
            message: `${player.name} has killed the ${enemy.name}.`,
          },
        ]);
        enemyDies(enemy);
      } else {
        endCombat(enemy);
        console.log("COMBAT ENDING HERE");
        console.log("START PLAYER COMBAT TIMER");
      }
    }, combatInterval);
  }

  function enterCombat(player, enemy) {
    let combatState = CustomState.getState().combatState;
    if (combatState[enemy.id]) {
      combatState[enemy.id].push(player);
      playerHealth = player.health;
    } else {
      combatState[enemy.id] = [player];
      playerHealth = player.health;
      enemyHealth[enemy.id] = enemy.health;
    }

    CustomState.dispatch({
      type: "UPDATE_COMBAT_STATE",
      payload: combatState,
    });

    CustomState.dispatch({
      type: "UPDATE_GAME_STATE",
      payload: GAME_STATES.COMBAT,
    });

    let game_state = CustomState.getGameState();
    console.log("COMBAT STATE ENGAGED");
    console.log(game_state);

    startEnemyCombatTimer(player, enemy);
    startPlayerCombatTimer(player, enemy);

    setTerminal((prevTerminal) => [
      ...prevTerminal,
      {
        type: "system",
        message: `${player.name} prepares for combat with the ${enemy.name}.`,
      },
    ]);
  }

  async function createPlayerCorpse(player) {
    let now = new Date();
    return getUser().then((result) => {
      currUser = result;
      let local_user = CustomState.getUserState(currUser.id);
      console.log("PLAYER CORPSE DATA");
      console.log(player);
      return {
        corpseId: currUser.id,
        corpseType: "player",
        corpseName: `${player.name}'s Corpse`,
        corpseOwner: player.name,
        current_location: player.current_location,
        items: local_user.character.inventory,
        deathTime: now.getTime(), // getTime() gives you a timestamp in milliseconds
      };
    });
  }

  function createEnemyCorpse(enemy) {
    console.log(enemy);
    let now = new Date();
    return {
      corpseId: enemy.id,
      corpseType: "enemy",
      corpseName: enemy.name + `'s Corpse`,
      corpseOwner: enemy.name,
      current_location: enemy.respawn,
      items: enemy.inventory,
      deathTime: now.getTime(), // getTime() gives you a timestamp in milliseconds
    };
  }

  function removeOldCorpses() {
    let now = new Date().getTime();
    console.log("ENEMY CORPSES");
    console.log(CustomState.getState().corpses);

    let newCorpses = CustomState.getState().corpses.filter((corpse) => {
      return now - corpse.deathTime < 5 * 60 * 1000;
    });

    CustomState.dispatch({
      type: "UPDATE_CORPSES",
      payload: newCorpses,
    });
  }

  function updateEnemy(enemyId, newData) {
    console.log("UPDATE ENEMY ID");
    console.log(enemyId);
    CustomState.dispatch({
      type: "UPDATE_ENEMY",
      payload: { enemyId, data: newData },
    });
  }

  async function playerDies(player) {
    const corpse = await createPlayerCorpse(player);
    CustomState.dispatch({ type: "ADD_CORPSE", payload: corpse });
    sendToDeadRoom(player);
  }

  async function enemyDies(enemy) {
    const corpse = createEnemyCorpse(enemy);
    CustomState.dispatch({ type: "ADD_CORPSE", payload: corpse });
    console.log("CORPSE DATA");
    console.log(corpse);
    await updateEnemyLocationInDatabase(enemy.id, "DEAD");
    await setEnemies();
  }

  async function updateEnemyLocationInDatabase(enemyId, newLocation) {
    const { data, error } = await supabase
      .from("Enemies")
      .update({ current_location: newLocation })
      .eq("id", enemyId);

    if (error) {
      console.error("Error updating enemy location:", error);
    } else {
      console.log("Enemy location updated successfully:", data);
    }
  }

  function respawnAllEnemies() {
    // Get the current state of all enemies
    const enemies = CustomState.getState().Enemies;

    // For each enemy, update their location to their respawn point
    enemies.map(async (enemy) => {
      if (enemy.current_location == "DEAD") {
        await updateEnemyLocationInDatabase(enemy.id, enemy.respawn);
      }
      await setEnemies();
    });
  }
  let respawnIntervalId;
  if (startSpawn.current == false) {
    respawnIntervalId = setInterval(respawnAllEnemies, 300000);
    startSpawn.current = true;
  }

  let corpseIntervalId;
  if (corpseCheck.current == false) {
    setInterval(removeOldCorpses, 60 * 1000);
    corpseCheck.current = true;
  }
  setMap();
  setWeapons();
  setArmor();
  setItems();
  setEnemies();
  CustomState.printState();

  // Listening Events UseEffect
  useEffect(() => {
    socket = io("http://localhost:3000");

    process.on("SIGINT", clearRespawnInterval);
    process.on("SIGTERM", clearRespawnInterval);
    process.on("SIGINT", removeOldCorpses);
    process.on("SIGTERM", removeOldCorpses);

    function clearRespawnInterval() {
      // Stop respawning enemies
      clearInterval(respawnIntervalId);

      // Exit the process to allow the server to shut down
      process.exit();
    }

    socket.on("disconnect", () => {});
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
    let game_state = CustomState.getGameState();
    socket.on("title", () => {
      setTerminal((prevTerminal) => [
        ...prevTerminal,
        { type: "system", message: title }, // updated line
      ]);
    });
    // Character Check - Title
    let nameProcess = false;
    let raceProcess = false;
    let classProcess = false;
    let attributesProcess = false;

    socket.on("character check", async () => {
      getUser().then(async (result) => {
        currUser = result;
        console.log("GAME STATE NAME");
        console.log(game_state);
        const { data: characterData, dataError } = await supabase
          .from("Char")
          .select()
          .eq("uid", currUser.id)
          .single();

        if (gameState === GAME_STATES.NAME && nameProcess == false) {
          setTerminal((prevTerminal) => [
            ...prevTerminal,
            {
              type: "system",
              message: `Enter your name! Choose wisely, this is permanent!`,
            }, // updated line
          ]);
          nameProcess = true;
          socket.emit("character check");
        }
        game_state = CustomState.getGameState();
        if (game_state == "RACE" && raceProcess == false) {
          setTerminal((prevTerminal) => [
            ...prevTerminal,
            {
              type: "system",
              message: raceMessage,
            }, // updated line
          ]);
          raceProcess == true;
        }
        game_state = CustomState.getGameState();
        if (game_state == "CLASS" && classProcess == false) {
          setTerminal((prevTerminal) => [
            ...prevTerminal,
            {
              type: "system",
              message: ClassMessage,
            }, // updated line
          ]);
          classProcess == true;
        }
        game_state = CustomState.getGameState();
        if (game_state == "ATTRIBUTES" && attributesProcess == false) {
          setTerminal((prevTerminal) => [
            ...prevTerminal,
            {
              type: "system",
              message: AttributeMessage,
            }, // updated line
          ]);
          attributesProcess == true;
        }
      });
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
        Health: ${local_user.character.health}
        Level: ${local_user.character.level}
        XP: ${local_user.character.xp}
        Location: ${local_user.character.current_location}

        *Attributes* 
        Strength: ${local_user.attributes.str}
        Speed: ${local_user.attributes.spd}
        Defense: ${local_user.attributes.def}
        Intelligence: ${local_user.attributes.int}
        Endurance: ${local_user.attributes.end}
        Agility: ${local_user.attributes.agi}
        Wisdom: ${local_user.attributes.wis}
        Charisma: ${local_user.attributes.cha}
        Luck: ${local_user.attributes.lck}
        Perception: ${local_user.attributes.per}
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
        let corpsesInRoom = CustomState.getState()
          .corpses.map((corpse) => {
            console.log("CORPSE DATA");
            console.log(corpse);
            if (
              corpse.current_location == local_user.character.current_location
            ) {
              return corpse.corpseName;
            } else {
              return;
            }
          })
          .join(", ");

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
    Loot in the room: ${roomLoot} ${corpsesInRoom}
    
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
          id: newId,
          created_at: new Date().toISOString(),
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
          setTerminal((prevTerminal) => [
            ...prevTerminal,
            { type: "system", message: `You don't have that item.` }, // updated line
          ]);
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
          setTerminal((prevTerminal) => [
            ...prevTerminal,
            { type: "system", message: `You don't have that item.` }, // updated line
          ]);
        }
      });
    });
    socket.on("enemy check", () => {
      // let enemyHealth = null;
      // function enemyBark() {
      //   getUser().then((result) => {
      //     currUser = result;
      //     let local_user = CustomState.getUserState(currUser.id);
      //     let enemies = CustomState.getState().Enemies.filter((enemy) => {
      //       if (
      //         enemy.current_location ===
      //           local_user.character.current_location &&
      //         enemy.health > 0 &&
      //         local_user.character.health > 0
      //       ) {
      //         setTerminal((prevTerminal) => [
      //           ...prevTerminal,
      //           {
      //             type: "system",
      //             message: `${enemy.name} stares are you while grinding his teeth.`,
      //           }, // updated line
      //         ]);
      //       }
      //     });
      //   });
      // }
      // function autoAttack() {
      //   getUser().then((result) => {
      //     currUser = result;
      //     let local_user = CustomState.getUserState(currUser.id);
      //     let enemies = CustomState.getState().Enemies.filter((enemy) => {
      //       if (
      //         enemy.current_location ===
      //           local_user.character.current_location &&
      //         enemy.health > 0 &&
      //         local_user.character.health > 0 &&
      //         enemyHealth == null
      //       ) {
      //         enemyHealth = Number(enemy.health);
      //       }
      //     });
      //   });
      //   // Enemy attack
      //   setTimeout(function () {
      //     const enemyAttackInterval = setInterval(() => {
      //       getUser().then((result) => {
      //         currUser = result;
      //         let local_user = CustomState.getUserState(currUser.id);
      //         let enemies = CustomState.getState().Enemies.filter((enemy) => {
      //           let playerHealth = Number(local_user.character.health);
      //           if (
      //             enemy.current_location ===
      //               local_user.character.current_location &&
      //             enemyHealth > 0 &&
      //             local_user.character.health > 0
      //           ) {
      //             let enemyDamage = 2;
      //             playerHealth = playerHealth - enemyDamage * 2;
      //             let attackMessage = `${enemy.name} attacked you for ${
      //               enemyDamage * 2
      //             } damage`;
      //             setTerminal((prevTerminal) => [
      //               ...prevTerminal,
      //               { type: "system", message: `${attackMessage}` }, // updated line
      //             ]);
      //             CustomState.dispatch({
      //               type: "UPDATE_USER",
      //               payload: {
      //                 userId: currUser.id,
      //                 data: {
      //                   character: {
      //                     ...CustomState.getState().users[currUser.id]
      //                       .character, // Spread the current character data
      //                     health: `${playerHealth}`, // Update only health
      //                   },
      //                 },
      //               },
      //             });
      //           } else if (enemyHealth == null) {
      //           } else {
      //             clearInterval(playerAttackInterval);
      //             clearInterval(enemyAttackInterval);
      //             setTerminal((prevTerminal) => [
      //               ...prevTerminal,
      //               {
      //                 type: "system",
      //                 message: `${local_user.character.name} was killed by ${enemy.name}`,
      //               }, // updated line
      //             ]);
      //           }
      //         });
      //       });
      //     }, 2000); // Adjust interval length as necessary
      //     // Player attack
      //     const playerAttackInterval = setInterval(() => {
      //       getUser().then((result) => {
      //         currUser = result;
      //         let local_user = CustomState.getUserState(currUser.id);
      //         let enemies = CustomState.getState().Enemies.filter((enemy) => {
      //           let playerHealth = Number(local_user.character.health);
      //           if (
      //             enemy.current_location ===
      //               local_user.character.current_location &&
      //             enemyHealth > 0 &&
      //             playerHealth > 0
      //           ) {
      //             let enemyDamage = 10;
      //             enemyHealth = enemyHealth - 10;
      //             let attackMessage = `You attacked ${enemy.name} for ${enemyDamage} damage`;
      //             setTerminal((prevTerminal) => [
      //               ...prevTerminal,
      //               { type: "system", message: `${attackMessage}` }, // updated line
      //             ]);
      //           } else if (enemyHealth == null) {
      //           } else {
      //             clearInterval(playerAttackInterval);
      //             clearInterval(enemyAttackInterval);
      //             setTerminal((prevTerminal) => [
      //               ...prevTerminal,
      //               {
      //                 type: "system",
      //                 message: `${local_user.character.name} killed the ${enemy.name}`,
      //               }, // updated line
      //             ]);
      //           }
      //         });
      //       });
      //     }, 1000);
      //     // Cleanup function
      //     return () => {
      //       clearInterval(playerAttackInterval);
      //       clearInterval(enemyAttackInterval);
      //     };
      //   }, 6000);
      // }
      // autoAttack();
      // if (!didRun.current) {
      //   setTimeout(enemyBark, 3000);
      //   didRun.current = true;
      // }
    });

    // ATTACK FUNCTION HERE
    socket.on("attack check", (target) => {
      /////////////////////// *** WHEN PLAYER DIES *** ///////////////////////////
      // message "You Died"
      // all player loot is dropped current room
      // player is sent to respawn point with nothing
      /////////////////////// *** WHEN ENEMY DIES *** ///////////////////////////
      // message "Enemy Killed"
      // enemy loot dropped
      // player can pick it up or leave it
      // enemy is on cool down for preset time
      getUser().then((result) => {
        currUser = result;
        let local_user = CustomState.getUserState(currUser.id);
        let enemy;
        const targetName = target.message;

        const matchedEnemies = CustomState.getState().Enemies.map((enemy) => {
          if (enemy) {
            if (
              enemy.name.toLowerCase() == targetName &&
              enemy.current_location == local_user.character.current_location
            ) {
              console.log("enemy found");
              return enemy;
            } else {
              console.log("enemy not found");
            }
          } else {
            console.log("Enemy doesn't exist");
          }
        });

        enemy = matchedEnemies[0];
        if (
          enemy != undefined ||
          (enemy != null &&
            enemy.current_location == local_user.character.current_location)
        ) {
          enterCombat(local_user.character, enemy);
        } else {
          console.log("That enemy isn't in the room");
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

    socket.on("inspect", (_target) => {
      let target = _target.message.toLowerCase();

      CustomState.getState().Weapons.map((weapon) => {
        if (weapon.name.toLowerCase() == target) {
          return setTerminal((prevTerminal) => [
            ...prevTerminal,
            { type: "system", message: `${weapon.description}` }, // updated line
          ]);
        } else {
        }
      });

      CustomState.getState().Armor.map((armor) => {
        if (armor.name.toLowerCase() == target) {
          return setTerminal((prevTerminal) => [
            ...prevTerminal,
            { type: "system", message: `${armor.description}` }, // updated line
          ]);
        } else {
        }
      });

      CustomState.getState().Rooms.map((room) => {
        if (target == "room") {
          getUser().then((result) => {
            currUser = result;
            let local_user = CustomState.getUserState(currUser.id);
            let current_room = local_user.character.current_location;
            if (room.room_name.toLowerCase() == current_room.toLowerCase()) {
              return setTerminal((prevTerminal) => [
                ...prevTerminal,
                { type: "system", message: `${room.description}` }, // updated line
              ]);
            } else {
            }
          });
        } else {
        }
      });

      CustomState.getState().Enemies.map((enemy) => {
        if (enemy.name.toLowerCase() == target) {
          return setTerminal((prevTerminal) => [
            ...prevTerminal,
            { type: "system", message: `${enemy.description}` }, // updated line
          ]);
        } else {
        }
      });

      CustomState.getState().corpses.map((corpse) => {
        if (corpse.corpseName.toLowerCase() == target) {
          return setTerminal((prevTerminal) => [
            ...prevTerminal,
            {
              type: "system",
              message: `This is ${corpse.corpseName}'s corpse`,
            }, // updated line
          ]);
        } else {
        }
      });

      Object.values(CustomState.getState().users).map((user) => {
        if (user.character.name.toLowerCase() == target) {
          return setTerminal((prevTerminal) => [
            ...prevTerminal,
            {
              type: "system",
              message: `${user.character.name} is level: ${user.character.level}`,
            }, // updated line
          ]);
        } else {
        }
      });
    });
    socket.on("loot check", (_target) => {
      // ONLY LEWIS CAN DO THIS
      // current room of player && enemy, have to be in same room
      // loot just take all enemies inventory and then remove looted items from dead enemy inventory
      let canLoot = false;
      let target = _target.message
        .toLowerCase()
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.substring(1))
        .join(" ");
      getUser().then(async (result) => {
        let currUser = result;
        let local_user = CustomState.getUserState(currUser.id);
        CustomState.getState().corpses.map((corpse) => {
          if (
            corpse.current_location == local_user.character.current_location
          ) {
            canLoot = true;
          }
        });
        if (canLoot) {
          let newCorpse = CustomState.getState().corpses.map((corpse) => {
            console.log("CORPSE DATA");
            console.log(target);
            console.log(corpse);
            if (corpse.corpseName == target) {
              return corpse;
            }
          });
          let corpseTarget = newCorpse[0];
          console.log("NEW CORPSE DATA");
          console.log(corpseTarget.items);
        }
      });
    });
    socket.on("mount check", () => {});
    // AND THIS; JUST IN CASE YOU GET BORED
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
    const gameState = CustomState.getState().gameState;

    if (socket) {
      let game_state = CustomState.getGameState();
      if (gameState === GAME_STATES.NAME) {
        async function checkName() {
          const { data: nameCheck, error } = await supabase
            .from("Char")
            .select("char_name");

          const isNameTaken = nameCheck.some(
            (char) => char.char_name == message
          );
          if (isNameTaken) {
            setTerminal((prevTerminal) => [
              ...prevTerminal,
              {
                type: "system",
                message: `This name is already in use, please try again`,
              }, // updated line
            ]);
            socket.emit("character check");
          } else {
            getUser().then(async (result) => {
              currUser = result;
              let local_user = CustomState.getUserState(currUser.id);
              const { data: char_name, error } = await supabase
                .from("Char")
                .update({ char_name: message })
                .match({ uid: currUser.id });
              if (error) {
                console.log(error);
                console.log(
                  "There has been an error saving the name to supabase"
                );
              }
              CustomState.dispatch({
                type: "UPDATE_USER",
                payload: {
                  userId: currUser.id,
                  data: {
                    character: {
                      ...local_user.character,
                      name: message,
                    },
                  },
                },
              });
              setTerminal((prevTerminal) => [
                ...prevTerminal,
                {
                  type: "system",
                  message: `Your name is now set to ${message}`,
                }, // updated line
              ]);
              CustomState.dispatch({
                type: "UPDATE_GAME_STATE",
                payload: GAME_STATES.RACE, // Or whatever the next game state is
              });
              socket.emit("character check");
            });
          }
        }
        checkName();
      } else if (game_state == "RACE") {
        if (message == 1) {
          getUser().then(async (result) => {
            currUser = result;
            let local_user = CustomState.getUserState(currUser.id);
            const { data: char_race, error } = await supabase
              .from("Char")
              .update({ char_race: `Human` })
              .match({ uid: currUser.id });

            if (error) {
              console.log(error);
              console.log(
                "There has been an error saving the name to supabase"
              );
            }

            CustomState.dispatch({
              type: "UPDATE_USER",
              payload: {
                userId: currUser.id,
                data: {
                  character: {
                    ...local_user.character,
                    race: `Human`,
                  },
                },
              },
            });
          });
          setTerminal((prevTerminal) => [
            ...prevTerminal,
            { type: "system", message: `Your race is now set to Human.` }, // updated line
          ]);
          CustomState.dispatch({
            type: "UPDATE_GAME_STATE",
            payload: GAME_STATES.CLASS, // Or whatever the next game state is
          });
          socket.emit("character check");
        } else if (message == 2) {
          getUser().then(async (result) => {
            currUser = result;
            let local_user = CustomState.getUserState(currUser.id);
            const { data: char_race, error } = await supabase
              .from("Char")
              .update({ char_race: `Draconian` })
              .match({ uid: currUser.id });

            if (error) {
              console.log(error);
              console.log(
                "There has been an error saving the name to supabase"
              );
            }
            CustomState.dispatch({
              type: "UPDATE_USER",
              payload: {
                userId: currUser.id,
                data: {
                  character: {
                    ...local_user.character,
                    race: `Draconian`,
                  },
                },
              },
            });
          });
          setTerminal((prevTerminal) => [
            ...prevTerminal,
            { type: "system", message: `Your race is now set to Draconian.` }, // updated line
          ]);
          CustomState.dispatch({
            type: "UPDATE_GAME_STATE",
            payload: GAME_STATES.CLASS, // Or whatever the next game state is
          });
          socket.emit("character check");
        } else if (message == 3) {
          getUser().then(async (result) => {
            currUser = result;
            let local_user = CustomState.getUserState(currUser.id);
            const { data: char_race, error } = await supabase
              .from("Char")
              .update({ char_race: `Ventari` })
              .match({ uid: currUser.id });

            if (error) {
              console.log(error);
              console.log(
                "There has been an error saving the name to supabase"
              );
            }

            CustomState.dispatch({
              type: "UPDATE_USER",
              payload: {
                userId: currUser.id,
                data: {
                  character: {
                    ...local_user.character,
                    race: `Ventari`,
                  },
                },
              },
            });
          });
          setTerminal((prevTerminal) => [
            ...prevTerminal,
            { type: "system", message: `Your race is now set to Ventari.` }, // updated line
          ]);
          CustomState.dispatch({
            type: "UPDATE_GAME_STATE",
            payload: GAME_STATES.CLASS, // Or whatever the next game state is
          });
          socket.emit("character check");
        } else if (message == 4) {
          getUser().then(async (result) => {
            currUser = result;
            let local_user = CustomState.getUserState(currUser.id);
            const { data: char_race, error } = await supabase
              .from("Char")
              .update({ char_race: `Dosha` })
              .match({ uid: currUser.id });

            if (error) {
              console.log(error);
              console.log(
                "There has been an error saving the name to supabase"
              );
            }

            CustomState.dispatch({
              type: "UPDATE_USER",
              payload: {
                userId: currUser.id,
                data: {
                  character: {
                    ...local_user.character,
                    race: `Dosha`,
                  },
                },
              },
            });
          });
          setTerminal((prevTerminal) => [
            ...prevTerminal,
            { type: "system", message: `Your race is now set to Dosha.` }, // updated line
          ]);
          CustomState.dispatch({
            type: "UPDATE_GAME_STATE",
            payload: GAME_STATES.CLASS, // Or whatever the next game state is
          });
          socket.emit("character check");
        } else {
          setTerminal((prevTerminal) => [
            ...prevTerminal,
            {
              type: "system",
              message: `That is not an appropriate response. Please select 1 - 4.`,
            }, // updated line
          ]);
          socket.emit("character check");
        }
      } else if (gameState === GAME_STATES.CLASS) {
        if (message == 1) {
          getUser().then(async (result) => {
            currUser = result;
            let local_user = CustomState.getUserState(currUser.id);
            const { data: char_class, error } = await supabase
              .from("Char")
              .update({ char_class: `Bounty Hunter` })
              .match({ uid: currUser.id });

            if (error) {
              console.log(error);
              console.log(
                "There has been an error saving the class to supabase"
              );
            }

            CustomState.dispatch({
              type: "UPDATE_USER",
              payload: {
                userId: currUser.id,
                data: {
                  character: {
                    ...local_user.character,
                    class: `Bounty Hunter`,
                  },
                },
              },
            });
          });
          setTerminal((prevTerminal) => [
            ...prevTerminal,
            {
              type: "system",
              message: `Your class is now set to Bounty Hunter.`,
            }, // updated line
          ]);
          CustomState.dispatch({
            type: "UPDATE_GAME_STATE",
            payload: GAME_STATES.ATTRIBUTES, // Or whatever the next game state is
          });
          socket.emit("character check");
        } else if (message == 2) {
          getUser().then(async (result) => {
            currUser = result;
            let local_user = CustomState.getUserState(currUser.id);
            const { data: char_class, error } = await supabase
              .from("Char")
              .update({ char_class: `Smuggler` })
              .match({ uid: currUser.id });

            if (error) {
              console.log(error);
              console.log(
                "There has been an error saving the class to supabase"
              );
            }

            CustomState.dispatch({
              type: "UPDATE_USER",
              payload: {
                userId: currUser.id,
                data: {
                  character: {
                    ...local_user.character,
                    class: `Smuggler`,
                  },
                },
              },
            });
          });
          setTerminal((prevTerminal) => [
            ...prevTerminal,
            {
              type: "system",
              message: `Your class is now set to Smuggler.`,
            }, // updated line
          ]);
          CustomState.dispatch({
            type: "UPDATE_GAME_STATE",
            payload: GAME_STATES.ATTRIBUTES, // Or whatever the next game state is
          });
          socket.emit("character check");
        } else if (message == 3) {
          getUser().then(async (result) => {
            currUser = result;
            let local_user = CustomState.getUserState(currUser.id);
            const { data: char_class, error } = await supabase
              .from("Char")
              .update({ char_class: `Pilot` })
              .match({ uid: currUser.id });

            if (error) {
              console.log(error);
              console.log(
                "There has been an error saving the class to supabase"
              );
            }

            CustomState.dispatch({
              type: "UPDATE_USER",
              payload: {
                userId: currUser.id,
                data: {
                  character: {
                    ...local_user.character,
                    class: `Pilot`,
                  },
                },
              },
            });
          });
          setTerminal((prevTerminal) => [
            ...prevTerminal,
            {
              type: "system",
              message: `Your class is now set to Pilot`,
            }, // updated line
          ]);
          CustomState.dispatch({
            type: "UPDATE_GAME_STATE",
            payload: GAME_STATES.ATTRIBUTES, // Or whatever the next game state is
          });
          socket.emit("character check");
        } else if (message == 4) {
          getUser().then(async (result) => {
            currUser = result;
            let local_user = CustomState.getUserState(currUser.id);
            const { data: char_class, error } = await supabase
              .from("Char")
              .update({ char_class: `Soldier` })
              .match({ uid: currUser.id });

            if (error) {
              console.log(error);
              console.log(
                "There has been an error saving the class to supabase"
              );
            }

            CustomState.dispatch({
              type: "UPDATE_USER",
              payload: {
                userId: currUser.id,
                data: {
                  character: {
                    ...local_user.character,
                    class: `Soldier`,
                  },
                },
              },
            });
          });
          setTerminal((prevTerminal) => [
            ...prevTerminal,
            {
              type: "system",
              message: `Your class is now set to Soldier.`,
            }, // updated line
          ]);
          CustomState.dispatch({
            type: "UPDATE_GAME_STATE",
            payload: GAME_STATES.ATTRIBUTES, // Or whatever the next game state is
          });
          socket.emit("character check");
        } else if (message == 5) {
          getUser().then(async (result) => {
            currUser = result;
            let local_user = CustomState.getUserState(currUser.id);
            const { data: char_class, error } = await supabase
              .from("Char")
              .update({ char_class: `Medic` })
              .match({ uid: currUser.id });

            if (error) {
              console.log(error);
              console.log(
                "There has been an error saving the class to supabase"
              );
            }

            CustomState.dispatch({
              type: "UPDATE_USER",
              payload: {
                userId: currUser.id,
                data: {
                  character: {
                    ...local_user.character,
                    class: `Medic`,
                  },
                },
              },
            });
          });
          setTerminal((prevTerminal) => [
            ...prevTerminal,
            {
              type: "system",
              message: `Your class is now set to Medic.`,
            }, // updated line
          ]);
          CustomState.dispatch({
            type: "UPDATE_GAME_STATE",
            payload: GAME_STATES.ATTRIBUTES, // Or whatever the next game state is
          });
          socket.emit("character check");
        } else if (message == 6) {
          getUser().then(async (result) => {
            currUser = result;
            let local_user = CustomState.getUserState(currUser.id);
            const { data: char_class, error } = await supabase
              .from("Char")
              .update({ char_class: `Hacker` })
              .match({ uid: currUser.id });

            if (error) {
              console.log(error);
              console.log(
                "There has been an error saving the class to supabase"
              );
            }

            CustomState.dispatch({
              type: "UPDATE_USER",
              payload: {
                userId: currUser.id,
                data: {
                  character: {
                    ...local_user.character,
                    class: `Hacker`,
                  },
                },
              },
            });
          });
          setTerminal((prevTerminal) => [
            ...prevTerminal,
            {
              type: "system",
              message: `Your class is now set to Hacker.`,
            }, // updated line
          ]);
          CustomState.dispatch({
            type: "UPDATE_GAME_STATE",
            payload: GAME_STATES.ATTRIBUTES, // Or whatever the next game state is
          });
          socket.emit("character check");
        } else if (message == 7) {
          getUser().then(async (result) => {
            currUser = result;
            let local_user = CustomState.getUserState(currUser.id);
            const { data: char_class, error } = await supabase
              .from("Char")
              .update({ char_class: `Engineer` })
              .match({ uid: currUser.id });

            if (error) {
              console.log(error);
              console.log(
                "There has been an error saving the class to supabase"
              );
            }

            CustomState.dispatch({
              type: "UPDATE_USER",
              payload: {
                userId: currUser.id,
                data: {
                  character: {
                    ...local_user.character,
                    class: `Engineer`,
                  },
                },
              },
            });
          });
          setTerminal((prevTerminal) => [
            ...prevTerminal,
            {
              type: "system",
              message: `Your class is now set to Engineer.`,
            }, // updated line
          ]);
          CustomState.dispatch({
            type: "UPDATE_GAME_STATE",
            payload: GAME_STATES.ATTRIBUTES, // Or whatever the next game state is
          });
          socket.emit("character check");
        } else if (message == 8) {
          getUser().then(async (result) => {
            currUser = result;
            let local_user = CustomState.getUserState(currUser.id);
            const { data: char_class, error } = await supabase
              .from("Char")
              .update({ char_class: `Operative` })
              .match({ uid: currUser.id });

            if (error) {
              console.log(error);
              console.log(
                "There has been an error saving the class to supabase"
              );
            }

            CustomState.dispatch({
              type: "UPDATE_USER",
              payload: {
                userId: currUser.id,
                data: {
                  character: {
                    ...local_user.character,
                    class: `Operative`,
                  },
                },
              },
            });
          });
          setTerminal((prevTerminal) => [
            ...prevTerminal,
            {
              type: "system",
              message: `Your class is now set to Operative.`,
            }, // updated line
          ]);
          CustomState.dispatch({
            type: "UPDATE_GAME_STATE",
            payload: GAME_STATES.ATTRIBUTES, // Or whatever the next game state is
          });
          socket.emit("character check");
        } else {
          setTerminal((prevTerminal) => [
            ...prevTerminal,
            {
              type: "system",
              message: `That isn't a valid class selection.  Please enter 1-8.`,
            }, // updated line
          ]);
        }
      } else if (game_state == "ATTRIBUTES") {
        if (message == "keep" || message == "Keep") {
          console.log("KEEPING");
          async function setAttributes() {
            getUser().then(async (result) => {
              currUser = result;
              const { data: att_str, str_error } = await supabase
                .from("Attributes")
                .update({ str: attributes.str })
                .match({ uid: currUser.id });

              const { data: att_def, def_error } = await supabase
                .from("Attributes")
                .update({ def: attributes.def })
                .match({ uid: currUser.id });

              const { data: att_spd, spd_error } = await supabase
                .from("Attributes")
                .update({ spd: attributes.spd })
                .match({ uid: currUser.id });

              const { data: att_int, int_error } = await supabase
                .from("Attributes")
                .update({ int: attributes.int })
                .match({ uid: currUser.id });

              const { data: att_end, end_error } = await supabase
                .from("Attributes")
                .update({ end: attributes.end })
                .match({ uid: currUser.id });

              const { data: att_agi, agi_error } = await supabase
                .from("Attributes")
                .update({ agi: attributes.agi })
                .match({ uid: currUser.id });

              const { data: att_wis, wis_error } = await supabase
                .from("Attributes")
                .update({ wis: attributes.wis })
                .match({ uid: currUser.id });

              const { data: att_cha, cha_error } = await supabase
                .from("Attributes")
                .update({ cha: attributes.cha })
                .match({ uid: currUser.id });

              const { data: att_lck, lck_error } = await supabase
                .from("Attributes")
                .update({ lck: attributes.lck })
                .match({ uid: currUser.id });

              const { data: att_per, per_error } = await supabase
                .from("Attributes")
                .update({ per: attributes.per })
                .match({ uid: currUser.id });

              CustomState.dispatch({
                type: "UPDATE_USER",
                payload: {
                  userId: currUser.id,
                  data: {
                    attributes: {
                      str: `${attributes.str}`,
                      spd: `${attributes.spd}`,
                      def: `${attributes.def}`,
                      int: `${attributes.int}`,
                      end: `${attributes.end}`,
                      agi: `${attributes.agi}`,
                      cha: `${attributes.cha}`,
                      lck: `${attributes.lck}`,
                      wis: `${attributes.wis}`,
                      per: `${attributes.per}`,
                    },
                  },
                },
              });
            });
          }
          setAttributes();

          CustomState.dispatch({
            type: "UPDATE_GAME_STATE",
            payload: GAME_STATES.GAME, // Or whatever the next game state is
          });
        } else if (message == "reroll" && rollCount < 4) {
          console.log("REROLLING");
          setRollCount(rollCount + 1);
          console.log(rollCount);
          reroll();
          setTerminal((prevTerminal) => [
            ...prevTerminal,
            {
              type: "system",
              message: AttributeMessage,
            }, // updated line
          ]);
        } else if (rollCount >= 4) {
          setTerminal((prevTerminal) => [
            ...prevTerminal,
            {
              type: "system",
              message: `You've used your last reroll.  Please keep your attributes.`,
            }, // updated line
          ]);
        } else {
          setTerminal((prevTerminal) => [
            ...prevTerminal,
            {
              type: "system",
              message: `That isn't a valid selection.  Please "keep" or "reroll"`,
            }, // updated line
          ]);
        }
      } else if (game_state == "COMBAT") {
        let lastRunAttempt = null;

        if (message == "run" || message == "Run") {
          let now = Date.now();

          if (lastRunAttempt === null || now - lastRunAttempt >= 5000) {
            // Check if it's been 5 seconds
            let runChance = Math.floor(Math.random() * 100) + 1; // generate a number between 1 and 100

            if (runChance > 70) {
              let runDirection = Math.floor(Math.random() * 4) + 1;
              if (runDirection == 1) {
                socket.emit("run north");
              } else if ((runDirection = 2)) {
                socket.emit("run south");
              } else if (runDirection == 3) {
                socket.emit("run east");
              } else if (runDirection == 4) {
                socket.emit("run west");
              }
            } else {
              // player failed to run away
              console.log("You failed to run away!");
              setTerminal((prevTerminal) => [
                ...prevTerminal,
                {
                  type: "system",
                  message: `You failed to run away`,
                }, // updated line
              ]);
            }

            lastRunAttempt = now; // Record the time of this run attempt
          } else {
            console.log(
              "You are too tired to run away again so soon. Please wait a moment and try again."
            );
            setTerminal((prevTerminal) => [
              ...prevTerminal,
              {
                type: "system",
                message: `You're too tired to run right now.'`,
              }, // updated line
            ]);
          }
        }
        // KASI YOU HAVE TO WORK WITH LEWIS ON THIS
      } else if (game_state == "DEAD") {
      } else if (game_state == "STORE") {
      } else if (game_state == "TRADE") {
      } else {
        socket.emit("game command", message);
      }
      setMessage("");
    }
  };

  let game_state = CustomState.getGameState();
  useEffect(() => {
    function FirstLook() {
      socket.emit("first look");
    }
    if (game_state == "GAME") {
      if (!firstLook.current) {
        setTimeout(FirstLook, 1000);
        firstLook.current = true;
      }
    }
  }, [game_state]);

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
