import { createRoot } from "react-dom/client";
import { RouterProvider, createHashRouter } from "react-router-dom";
import SigninRoute from "./SigninRoute";

import SignupRoute from "./SignupRoute";


// export const serverReach = `http://localhost/app/deadbolt`;
export const serverReach = `..`;

const router = createHashRouter([
  {
    path: "/",
    element: "DEADBOLT-AUTO",
  },
  {
    path: "signin",
    element: <SigninRoute />,
  },
  {
    path: "signup",
    element: <SignupRoute />,
  },
]);

createRoot(document.getElementById("root")).render(
  <RouterProvider router={router} />
);
