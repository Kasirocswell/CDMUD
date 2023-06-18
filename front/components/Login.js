import React from "react";
import { useState } from "react";
import supabase from "../utils/supabase";
import { getUser, setUser } from "./utils/CharacterUtils";
import backgroundImage from "../public/space.jpg";

const Login = ({ LoggedIn, tabsToggle }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    // handle login
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    // const { data2, error2 } = await supabase.from;

    if (error) {
      console.log("Error Logging In:", error.message);
      return;
    }

    console.log("User Logged In");

    LoggedIn();
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
            className="w-[200px] rounded-sm bg-gray-200"
            onChange={(e) => setEmail(e.target.value)}
          ></input>
          <label className="text-black mt-2 font-title">Password</label>
          <input
            type="password"
            value={password}
            placeholder="*********"
            className="w-[200px] rounded-sm bg-gray-50"
            onChange={(e) => setPassword(e.target.value)}
          ></input>
          <div className=" text-black">
            <p>
              <a>Forgot Password?</a>
            </p>
          </div>
          <button
            className="w-[150px] h-[50px] bg-green-500 text-black rounded-xl mt-8"
            type="submit"
            onClick={handleLogin}
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
