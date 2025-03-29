import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import PrivacyPolicy from "./pages/PrivacyPolicy";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
  },
  {
    path: "/privacy-policy",
    element: <PrivacyPolicy />,
  },
]); 