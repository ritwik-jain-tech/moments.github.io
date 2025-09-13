import { createHashRouter } from "react-router-dom";
import App from "./App";
import PrivacyPolicy from "./pages/PrivacyPolicy";

export const router = createHashRouter([
  {
    path: "/",
    element: <App />,
  }
]); 