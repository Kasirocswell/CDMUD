import supabase from "../../utils/supabase";

// character utils

let currUser;
let character;
let characterName;

// Character creation function

export const createCharacter = async () => {
  characterName = window.prompt("Enter your character name: ", "");
  const { userData, error: insertError } = await supabase
    .from("Char")
    .select("*")
    .eq("uid", currUser.id)
    .insert([{ char_name: characterName }]);
};

// current user function
export const getUser = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  console.log(user);
  setUser(user);
};
//hello
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
  console.log(character.char_name);
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
  //   .eq(data.user.id);
};
