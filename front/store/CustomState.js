// CustomState.js

let state = {
  users: {},
};

let listeners = [];

const CustomState = {
  getState: () => state,

  dispatch: (action) => {
    if (typeof action === "function") {
      // if the action is a function, execute it
      action(CustomState.dispatch, CustomState.getState);
    } else if (typeof action === "object" && action !== null) {
      // if the action is an object, treat it as a state change
      // check if action has a user ID
      if (action.userId) {
        // update or initialize the state for the specified user
        const userState = state.users[action.userId] || {};
        state.users[action.userId] = { ...userState, ...action.payload };
      } else {
        // if no user ID is provided, just merge action into state
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

  getUserState: (userId) => {
    return state.users[userId];
  },
};

export default CustomState;
