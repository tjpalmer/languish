import Header from "components/Header";
import LangList from "components/LangList";
import Metric from "components/Metric";
import Plot from "components/Plot";
import { useGlobal } from "context";
import { clx } from "helpers";
import React from "react";

const App = () => {
  const global = useGlobal();

  return (
    <div className="content">
      <Header />
      <div
        className={clx(
          "display",
          global.metricsAreExpanded && "yOptionsExpanded"
        )}
      >
        <Metric />
        <Plot />
        <LangList />
      </div>
    </div>
  );
};

export default App;
