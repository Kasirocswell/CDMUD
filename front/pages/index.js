import Login from "../components/Login";
import Signup from "../components/Singup";
import Console from "../components/Console";
import { useState } from "react";

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState();
  const [loginTab, setLoginTab] = useState(true);
  const [signupTab, setSignupTab] = useState(false);

  const isAuthenticated = () => {
    setIsLoggedIn(true);
  };

  function toggleTabs() {
    if (loginTab) {
      setLoginTab(!loginTab);
      setSignupTab(!signupTab);
      console.log("tabs toggled");
    } else if (signupTab) {
      setLoginTab(!loginTab);
      setSignupTab(!signupTab);
      console.log("tabs toggled");
    }
  }

  return (
    <div className="w-screen h-screen bg-gray-800 flex overflow-hidden">
      {!isLoggedIn ? (
        <div>
          {loginTab ? (
            <Login tabsToggle={toggleTabs} LoggedIn={isAuthenticated} />
          ) : (
            <Signup LoggedIn={isAuthenticated} tabsToggle={toggleTabs} />
          )}
        </div>
      ) : (
        <Console />
      )}
    </div>
  );
}
