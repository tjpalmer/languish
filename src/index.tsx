import { GlobalProvider } from "context";
import React from "react";
import ReactDOM from "react-dom";
import "styles/index.css";
import App from "./components/App";

ReactDOM.render(
  <GlobalProvider>
    <App />
  </GlobalProvider>,
  document.getElementById("root")
);
