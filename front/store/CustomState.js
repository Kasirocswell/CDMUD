let state = {
  users: {},
  items: [],
  loot: [],
  currentEnemies: {},
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
      } else if (action.type === "UPDATE_ENEMY") {
        const { enemyId, data } = action.payload;
        state.Enemies = state.Enemies.map((enemy) =>
          enemy.id === enemyId ? { ...enemy, ...data } : enemy
        );
      } else if (action.type === "SET_CURRENT_ENEMIES") {
        const { data } = action.payload;
        state.currentEnemies = data;
      } else if (action.type === "UPDATE_ENEMY_IN_TABLE") {
        const { tableName, enemyId, data } = action.payload;
        const enemyTable = state[tableName];
        const enemyIndex = enemyTable.findIndex(
          (enemy) => enemy.id === enemyId
        );
        if (enemyIndex >= 0) {
          state[tableName] = [
            ...enemyTable.slice(0, enemyIndex),
            { ...enemyTable[enemyIndex], ...data },
            ...enemyTable.slice(enemyIndex + 1),
          ];
        }
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
