import supabase from "../../utils/supabase";
import { useState } from "react";
import CustomState from "../../store/CustomState";

// CHARACTER UTILS
let characterName;
let characterRace;

const raceSelector = () => {
  let raceSelection = window.prompt("Enter your character Race(1-4): ", "");
  if (raceSelection == 1) {
    return (characterRace = "Human");
  } else if (raceSelection == 2) {
    return (characterRace = "Draconian");
  } else if (raceSelection == 3) {
    return (characterRace = "Ventari");
  } else if (raceSelection == 4) {
    return (characterRace = "Dosha");
  } else {
    raceSelector();
  }
};

export const createCharacter = async () => {
  characterName = window.prompt("Enter your character name: ", "");
  const { data: char_name, error } = await supabase
    .from("Char")
    .update({ char_name: characterName })
    .match({ uid: user.user.id });

  const setRace = raceSelector();

  const { selectedRace, error2 } = await supabase
    .from("Char")
    .update({ char_race: setRace })
    .match({ uid: user.user.id });

  const { startingPoint, error4 } = await supabase
    .from("Char")
    .update({ current_location: "Holding Cells" })
    .match({ uid: user.user.id });

  const { data: characterData, dataError } = await supabase
    .from("Char")
    .select()
    .eq("uid", user.user.id)
    .single();

  const { data: equipmentData, equipmentDataError } = await supabase
    .from("Equipment")
    .select()
    .eq("uid", user.user.id)
    .single();

  CustomState.dispatch({
    userId: user.user.id,
    payload: {
      character: {
        name: `${characterData.char_name}`,
        race: `${characterData.char_race}`,
        level: `${characterData.char_level}`,
        xp: `${characterData.char_xp}`,
        current_location: `${characterData.current_location}`,
      },
      equipment: {
        right_hand: `${equipmentData.right_hand}`,
        left_hand: `${equipmentData.left_hand}`,
        head: `${equipmentData.head}`,
        neck: `${equipmentData.neck}`,
        chest: `${equipmentData.chest}`,
        back: `${equipmentData.back}`,
        arms: `${equipmentData.arms}`,
        hands: `${equipmentData.hands}`,
        waist: `${equipmentData.waist}`,
        legs: `${equipmentData.legs}`,
        feet: `${equipmentData.feet}`,
      },
      inventory: {},
      vehicles: {},
    },
  });
};

export const getUser = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
};
