import Header from "components/Header";
import LangList from "components/LangList";
import Metric from "components/Metric";
import Plot from "components/Plot";
import { GlobalContext } from "context";
import React, { useContext } from "react";

function App() {
  const global = useContext(GlobalContext);

  return (
    <div className="content">
      <Header />
      <div
        className={
          "display" + (global.metricsAreExpanded ? " yOptionsExpanded" : "")
        }
      >
        <Metric />
        <Plot />
        <LangList />
      </div>
    </div>
  );
}

export default App;
