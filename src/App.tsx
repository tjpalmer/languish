import Header from "components/Header";
import LangList from "components/LangList";
import { GlobalProvider } from "context";
import React from "react";

function App() {
  return (
    <GlobalProvider>
      <Header />
      <LangList />
    </GlobalProvider>
  );
}

export default App;
