let newAttributes;

export function createAttributes() {
  return {
    str: Math.floor(Math.random() * 9) + 1,
    spd: Math.floor(Math.random() * 9) + 1,
    def: Math.floor(Math.random() * 9) + 1,
    int: Math.floor(Math.random() * 9) + 1,
    end: Math.floor(Math.random() * 9) + 1,
    agi: Math.floor(Math.random() * 9) + 1,
    cha: Math.floor(Math.random() * 9) + 1,
    lck: Math.floor(Math.random() * 9) + 1,
    wis: Math.floor(Math.random() * 9) + 1,
    per: Math.floor(Math.random() * 9) + 1,
  };
}

export let attributes = createAttributes();

export function createAttributesMessage() {
  return `
    These are your starting attributes, if these are suitable, type "keep", if you don't like them type "reroll" to generate new attributes but remember, you can only reroll twice!
  
       Strength: ${attributes.str}
       Speed: ${attributes.spd}
       Defense: ${attributes.def}
       Intelligence: ${attributes.int}
       Endurance: ${attributes.end}
       Agility: ${attributes.agi}
       Charisma: ${attributes.cha}
       Luck: ${attributes.lck}
       Wisdom: ${attributes.wis}
       Perception: ${attributes.per}
    `;
}

export let AttributeMessage = `
These are your starting attributes, if these are suitable, type "keep", if you don't like them type "reroll" to generate new attributes but remember, you can only reroll twice!

   Strength: ${attributes.str}
   Speed: ${attributes.spd}
   Defense: ${attributes.def}
   Intelligence: ${attributes.int}
   Endurance: ${attributes.end}
   Agility: ${attributes.agi}
   Charisma: ${attributes.cha}
   Luck: ${attributes.lck}
   Wisdom: ${attributes.wis}
   Perception: ${attributes.per}
`;

export function reroll() {
  attributes = createAttributes();
  AttributeMessage = createAttributesMessage();
}
