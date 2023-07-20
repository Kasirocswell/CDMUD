import { NPCs } from "../components/NPCs";

export const GAME_STATES = {
  NAME: "NAME",
  NAME_CONFIRMATION: "NAME_CONFIRMATION",
  RACE: "RACE",
  CLASS: "CLASS",
  ATTRIBUTES: "ATTRIBUTES",
  GAME: "GAME",
  COMBAT: "COMBAT",
  STORE: "STORE",
  TRADE: "TRADE",
  DEAD: "DEAD",
  LEVELUP: "LEVELUP",
};

export const ENEMY_STATES = {
  IDLE: "IDLE",
  COMBAT: "COMBAT",
  DEAD: "DEAD",
};

let state = {
  users: {},
  items: [],
  loot: [],
  combatState: {},
  corpses: [],
  npcs: [...NPCs],
  gameState: GAME_STATES.NAME,
  enemyState: ENEMY_STATES.IDLE,
};

let listeners = [];

const CustomState = {
  getState: () => state,

  dispatch: (action) => {
    if (typeof action === "function") {
      action(CustomState.dispatch, CustomState.getState);
    } else if (typeof action === "object" && action !== null) {
      if (action.type === "UPDATE_USER") {
        const { userId, data } = action.payload;
        const userState = state.users[userId] || {};
        state.users[userId] = { ...userState, ...data };
      } else if (action.type === "SET_TABLE_DATA") {
        const { tableName, data } = action.payload;
        state[tableName] = data;
      } else if (action.type === "UPDATE_COMBAT_STATE") {
        state.combatState = action.payload;
      } else if (action.type === "ADD_CORPSE") {
        state.corpses.push(action.payload);
      } else if (action.type === "UPDATE_CORPSES") {
        state.corpses = action.payload;
      } else if (action.type === "UPDATE_ENEMY") {
        const { enemyId, data } = action.payload;
        const updatedEnemies = state.Enemies.map((enemy) =>
          enemy.id === enemyId ? { ...enemy, ...data } : enemy
        );
        state = { ...state, Enemies: updatedEnemies };
      } else if (action.type === "UPDATE_GAME_STATE") {
        state.gameState = action.payload;
      } else if (action.type === "SET_CURRENT_ENEMIES") {
        const { data } = action.payload;
        state.currentEnemies = data;
      } else if (action.type === "UPDATE_NPC") {
        const { npcId, data } = action.payload;
        const updatedNPCs = state.npcs.map((npc) =>
          npc.id === npcId ? { ...npc, ...data } : npc
        );
        state = { ...state, npcs: updatedNPCs };
      } else {
        state = { ...state, ...action };
      }
      listeners.forEach((listener) => listener(state));
    }
  },

  subscribe: (listener) => {
    listeners.push(listener);
    const unsubscribe = () => {
      listeners = listeners.filter((l) => l !== listener);
    };
    return unsubscribe;
  },

  printState: () => {
    console.log("current state");
    console.log(state);
  },

  getGameState: () => {
    return state.gameState;
  },

  getRoomState: () => {
    return state?.Rooms || {};
  },

  getWeaponState: () => {
    return state?.Weapons || {};
  },

  getArmorState: () => {
    return state?.Armor || {};
  },

  getItemState: () => {
    return state?.items || [];
  },

  getUserState: (userId) => {
    return state.users[userId];
  },
};

export default CustomState;
