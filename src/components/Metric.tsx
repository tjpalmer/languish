import { GlobalContext } from "context";
import { clx, objectEntries } from "helpers";
import { Metrics } from "parsedData";
import React, { useContext } from "react";

const Metric = () => {
  const global = useContext(GlobalContext);

  // map of available metrics to human readable strings
  const items: { [k in keyof Metrics]: string } = {
    issues: "Issues",
    mean: "Mean Score",
    pulls: "Pull Requests",
    pushes: "Pushes",
    stars: "Stars",
  };

  return (
    <>
      <div className="yAxis">
        <div
          className="yLabel interactive"
          title="Change y axis options"
          onClick={global.toggleMetricsAreExpanded}
        >
          <span className="yLabelArrow"></span>
          <span className="yLabelText">{items[global.metric]}</span>
          <span className="yLabelArrow"></span>
        </div>
      </div>
      <div className="yOptions">
        <div className="yOptionsBox">
          <h3>Metric</h3>
          <ul className="yMetricsList">
            {objectEntries(items).map(([real, display]) => (
              <li
                onClick={() => global.changeMetric(real)}
                className={clx(
                  "interactive",
                  real,
                  global.metric === real && "active"
                )}
              >
                {display}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
};

export default Metric;
