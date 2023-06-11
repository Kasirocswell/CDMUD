import React from "react";
import { useRouter } from "next/router";
import { useState } from "react";
import supabase from "../utils/supabase";

const Login = ({ LoggedIn, tabsToggle }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    // handle login
    const { user, session, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      console.log("Error Logging In:", error.message);
      return;
    }

    console.log("User Logged In");

    LoggedIn();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const { user, error } = await supabase.auth.signUp({
      email: email,
      password: password,
    });

    if (error) {
      console.log(error);
    } else {
      console.log("Success! Check your email for a confirmation link.");
    }
    console.log(user);
    //   const { data, error: insertError } = await supabase
    //     .from("Users")
    //     .insert([{ email: email, password: password }]);
  };

  return (
    <div className="w-screen h-screen flex ml-[35%] mt-[7%] overflow-hidden">
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
