let state = {
  users: {},
  items: {},
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

  getUserState: (userId) => {
    return state.users[userId];
  },
};

export default CustomState;
