import { GlobalProvider } from "context";
import React from "react";
import ReactDOM from "react-dom";
import "styles/index.css";
import App from "./components/App";

// Polyfill from MDN.
if (typeof window.queueMicrotask !== "function") {
  window.queueMicrotask = function (callback) {
    Promise.resolve()
      .then(callback)
      .catch(e => setTimeout(() => { throw e; }));
  };
}

ReactDOM.render(
  <GlobalProvider>
    <App />
  </GlobalProvider>,
  document.getElementById("root")
);
