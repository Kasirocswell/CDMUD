import supabase from "../../utils/supabase";
import {
  equipItem,
  unequipItem,
  addItemToInventory,
  removeItemFromInventory,
} from "./InventoryUtils";

// CHARACTER UTILS

let currUser;
let character;
let characterName;
let characterRace;

// Character creation function

export const createCharacter = async () => {
  characterName = window.prompt("Enter your character name: ", "");
  const { data, error } = await supabase
    .from("Char")
    .update({ char_name: characterName })
    .match({ uid: currUser.id });

  let raceSelection = window.prompt("Enter your character Race(1-4): ", "");
  if (raceSelection == 1) {
    characterRace = "Human";
  } else if (raceSelection == 2) {
    characterRace = "Draconian";
  } else if (raceSelection == 3) {
    characterRace = "Ventari";
  } else if (raceSelection == 4) {
    characterRace = "Dosha";
  } else {
    raceSelection = window.prompt("Enter your character Race(1-4): ", "");
  }

  const { data2, error2 } = await supabase
    .from("Char")
    .update({ char_race: characterRace })
    .match({ uid: currUser.id });

  const { data3, error3 } = await supabase
    .from("Char")
    .update({ char_health: 100 })
    .match({ uid: currUser.id });

  const { data4, error4 } = await supabase
    .from("Char")
    .update({ current_location: "Home" })
    .match({ uid: currUser.id });

  const { data5, error5 } = await supabase
    .from("Char")
    .update({ char_level: 1 })
    .match({ uid: currUser.id });
};

// Get current user function
export const getUser = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  console.log(user);
  setUser(user);
};

export const setUser = (user) => {
  currUser = user;
  console.log(currUser);
};

export const setCharacter = async () => {
  const characterLoading = await supabase
    .from("Char")
    .select("*")
    .eq("uid", currUser.id);
  console.log("Character Loaded");
  character = characterLoading.data[0];
  console.log(character);
  if (character.char_name === null || undefined) {
    createCharacter();
  } else {
    console.log("Your character is loaded and ready to adventure");
  }
};

//Character Check update
export const charCheck = async () => {
  const { data, error } = await supabase.from("Char").select("*");
  console.log(data);
  console.log(currUser);
};
