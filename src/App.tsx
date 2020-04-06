import Header from "components/Header";
import LangList from "components/LangList";
import Metric from "components/Metric";
import Plot from "components/Plot";
import { GlobalProvider } from "context";
import React from "react";

function App() {
  return (
    <GlobalProvider>
      <div className="content">
        <Header />
        <div className="display">
          <Metric />
          <Plot />
          <LangList />
        </div>
      </div>
    </GlobalProvider>
  );
}

export default App;
