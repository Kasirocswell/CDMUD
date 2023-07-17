import React from "react";
import { useState } from "react";
import supabase from "../utils/supabase";
import CustomState from "../store/CustomState";

const Signup = ({ LoggedIn, tabsToggle }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  let currUser;

  const handleSubmit = async (event) => {
    event.preventDefault();

    const { data: userSignUp, error } = await supabase.auth.signUp({
      email: email,
      password: password,
    });

    const { data: user, userError } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      return user;
    };

    getUser().then(async (result) => {
      currUser = result;

      const createCharacter = async () => {
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
        const { data: attributesData, attributesDataError } = await supabase
          .from("Attributes")
          .select()
          .eq("uid", currUser.id)
          .single();
        CustomState.dispatch({
          type: "UPDATE_USER",
          payload: {
            userId: currUser.id,
            data: {
              character: {
                name: null,
                race: null,
                class: null,
                credits: `${characterData.char_credits}`,
                health: `${characterData.char_health}`,
                level: `${characterData.char_level}`,
                xp: `${characterData.char_xp}`,
                current_location: `${characterData.current_location}`,
                deathTime: null,
                respawn: `${characterData.current_location}`,
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
              attributes: {
                str: `${attributesData.str}`,
                spd: `${attributesData.spd}`,
                def: `${attributesData.def}`,
                int: `${attributesData.int}`,
                end: `${attributesData.end}`,
                agi: `${attributesData.agi}`,
                cha: `${attributesData.cha}`,
                lck: `${attributesData.lck}`,
                wis: `${attributesData.wis}`,
                per: `${attributesData.per}`,
              },
              inventory: [],
              vehicles: {},
            },
          },
        });
      };

      getUser().then(async (result) => {
        currUser = result;
        const { data: userData, error: insertError } = await supabase
          .from("Char")
          .insert([{ uid: currUser.id }]);

        const { data: equipmentData, error: equipmentError } = await supabase
          .from("Equipment")
          .insert([{ uid: currUser.id }]);

        const { data: attributesData, error: attributesError } = await supabase
          .from("Attributes")
          .insert([{ uid: currUser.id }]);

        const { data: startingPoint, error4 } = await supabase
          .from("Char")
          .update({ current_location: "Holding Cells" })
          .match({ uid: currUser.id });

        if (error) {
          console.log(error);
        } else {
          console.log("Success! Check your email for a confirmation link.");
          createCharacter();
          LoggedIn();
        }
      });
    });
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
