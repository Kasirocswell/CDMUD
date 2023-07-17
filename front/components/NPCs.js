export const NPCs = [
  {
    name: "Old Man",
    location: "Holding Cells",
    details:
      "The Old Man stands at edge of his cell, hands on the plasma barrier that keeps him confined",
    dialogue: {
      greeting: {
        text: "How you holding up in here?",
        responses: {
          shop: "What do you have for sale?",
          quest: "I'm looking for a quest.",
          chat: "Just passing by.",
          leave: "Bye",
        },
      },
      shop: {
        text: "I'm not a damned shop keeper, anymore.",
        responses: {
          shop: "What do you have for sale?",
          quest: "I'm looking for a quest.",
          chat: "Just passing by.",
          leave: "Bye",
        },
      },
      joke: {
        text: "oh you want a joke, from me!?  I don't have a mirror",
        responses: {
          nice: "What do you have for sale?",
          indifferent: "I'm looking for a quest.",
          angry: "Just passing by.",
          leave: "Bye",
        },
      },
    },
    quests: {},
    itemsForSale: {},
  },

  {
    name: "Xyreon Soldier",
    location: "Xyreon Starport Terminal",
    dialogue: {
      greeting: {
        text: "Watch where you're going, civilian.",
        responses: {
          shop: "What do you have for sale?",
          quest: "I'm looking for a quest.",
          chat: "Just passing by.",
        },
      },
      shop: {
        text: "Here are my wares. Take a look.",
      },
    },
    quests: {},
    itemsForSale: {},
  },

  {
    name: "Ragnar",
    location: "home",
    dialogue: {
      greeting: {
        text: "Hey you, you need a bigger gun, let me talk to you for a second.",
        responses: {
          shop: "What do you have for sale?",
          quest: "I'm looking for a quest.",
          chat: "Just passing by.",
        },
      },
      shop: {
        text: "I could supply a small army, check these out.",
      },
    },
    quests: {},
    itemsForSale: {},
  },
];
