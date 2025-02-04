import { createRoot } from "react-dom/client";
import { HashRouter, Route, Routes } from "react-router-dom";
import RunRoute from "./RunRoute";
import SigninRoute from "./SigninRoute";
import SignupRoute from "./SignupRoute";

export const serverReach = `http://localhost/deadbolt/app`;
// export const serverReach = `..`;

// console.clear();

createRoot(document.getElementById("root")).render(
  <HashRouter>
    <Routes>
      <Route path="/" element="Deadbolt-auto" />
      <Route path="/run" element={<RunRoute />} />
      <Route path="/signup" element={<SignupRoute />} />
      <Route path="/signin" element={<SigninRoute />} />
    </Routes>
  </HashRouter>
);
