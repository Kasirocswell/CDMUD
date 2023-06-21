import React from "react";
import { useState } from "react";
import supabase from "../utils/supabase";
import CustomState from "../store/CustomState";

const Signup = ({ LoggedIn, tabsToggle }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  let currUser;

  const createCharacter = async () => {
    let characterName = window.prompt("Enter your character name: ", "");
    const { data: char_name, error } = await supabase
      .from("Char")
      .update({ char_name: characterName })
      .match({ uid: currUser.id });

    const setRace = raceSelector();

    const { data: selectedRace, error2 } = await supabase
      .from("Char")
      .update({ char_race: setRace })
      .match({ uid: currUser.id });

    const { data: startingPoint, error4 } = await supabase
      .from("Char")
      .update({ current_location: "Holding Cells" })
      .match({ uid: currUser.id });

    const { data: characterData, dataError } = await supabase
      .from("Char")
      .select()
      .eq("uid", currUser.id)
      .single();

    const { data: equipmentData, equipmentDataError } = await supabase
      .from("Equipment")
      .select()
      .eq("uid", currUser.id)
      .single();

    CustomState.dispatch({
      userId: currUser.id,
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

  const raceSelector = () => {
    let raceSelection = window.prompt("Enter your character Race(1-4): ", "");
    if (raceSelection == 1) {
      return "Human";
    } else if (raceSelection == 2) {
      return "Draconian";
    } else if (raceSelection == 3) {
      return "Ventari";
    } else if (raceSelection == 4) {
      return "Dosha";
    } else {
      raceSelector();
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const { data: user, error } = await supabase.auth.signUp({
      email: email,
      password: password,
    });
    currUser = user.user;
    console.log(currUser);
    // Initialize character

    const { data: userData, error: insertError } = await supabase
      .from("Char")
      .insert([{ uid: user.user.id }]);

    const { data: equipmentData, error: equipmentError } = await supabase
      .from("Equipment")
      .insert([{ uid: user.user.id }]);

    const { data: attributesData, error: attributesError } = await supabase
      .from("Attributes")
      .insert([{ uid: user.user.id }]);

    const { data: startingPoint, error4 } = await supabase
      .from("Char")
      .update({ current_location: "Holding Cells" })
      .match({ uid: user.user.id });

    if (error) {
      console.log(error);
    } else {
      console.log("Success! Check your email for a confirmation link.");
      createCharacter();
      LoggedIn();
    }
  };
  return (
    <div className="w-screen h-screen flex ml-[35%] mt-[7%] overflow-hidden bg-transparent">
      <div className=" w-[40%] h-[60%] bg-white flex flex-col rounded-xl">
        <h1 className="mx-auto mt-4 text-blue-800 text-6xl font-title">
          Celestial Deep
        </h1>
        <div className="flex-row">
          <button className="text-black" onClick={tabsToggle}>
            Login/Signup
          </button>
        </div>
        <form className="flex flex-col mx-auto my-auto">
          <label className={`text-black`}>Username/Email</label>
          <input
            type="email"
            value={email}
            placeholder="email"
            className="w-[200px] rounded-sm"
            onChange={(e) => setEmail(e.target.value)}
          ></input>
          <label className="text-black mt-2 font-title">Password</label>
          <input
            type="password"
            value={password}
            placeholder="*********"
            className="w-[200px] rounded-sm"
            onChange={(e) => setPassword(e.target.value)}
          ></input>
          <div className=" text-black">
            <p>
              <a>Create Account</a>
            </p>
          </div>
          <button
            className="w-[150px] h-[50px] bg-green-500 text-black rounded-xl mt-8"
            type="submit"
            onClick={handleSubmit}
          >
            Sign Up
          </button>
        </form>
      </div>
    </div>
  );
};

export default Signup;
