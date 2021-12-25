import { useGlobal, Scale } from "context";
import { clx, objectEntries } from "helpers";
import { Metrics } from "parsedData";
import React from "react";

const Metric = () => {
  const global = useGlobal();

  // map of available metrics to human readable strings
  const items: { [k in keyof Metrics]: string } = {
    mean: "Mean Score",
    issues: "GH Issues",
    pulls: "GH Pull Requests",
    pushes: "GH Pushes",
    stars: "GH Stars",
    soQuestions: "SO Questions",
  };

  // map of available metrics to human readable strings
  const scales: { [k in Scale]: string } = {
    linear: "Linear",
    log: "Log",
  };

  function renderWeight(key: string) {
    if (key !== "mean") {
      return (
        <>
          <label
            className="weight"
            title={`${(items as any)[key]} weight for mean`}
          >
            <input value={(global.weight as any)[key]} />
          </label>
          &nbsp;
        </>
      );
    } else {
      return <span></span>;
    }
  }

  return (
    <>
      <div className="yAxis">
        <div
          className="yLabel interactive"
          title="Change y axis options"
          onClick={global.toggleMetricsAreExpanded}
        >
          <span className="yLabelArrow"></span>{" "}
          <span className="yLabelText">
            {global.scale === "log" ? "Log " : ""}
            {items[global.metric]}
          </span>{" "}
          <span className="yLabelArrow"></span>
        </div>
      </div>
      <div className="yOptions">
        <div className="yOptionsBox">
          <h3>Metric</h3>
          <ul className="yMetricsList">
            {objectEntries(items).map(([real, display]) => (
              <li>
                <span className="metricRow">
                  {renderWeight(real)}
                  <span
                    className={clx(
                      "interactive",
                      "metric",
                      real,
                      global.metric === real && "active"
                    )}
                    onClick={() => global.changeMetric(real)}
                    title={`${
                      real == "pushes" ? "Excluded by default because bots" : ""
                    }`}
                  >
                    {display}
                  </span>
                </span>
              </li>
            ))}
          </ul>
          <h3>Scale</h3>
          <ul className="yScaleList">
            {objectEntries(scales).map(([real, display]) => (
              <li
                onClick={() => global.changeScale(real)}
                className={clx(
                  "interactive",
                  real,
                  global.scale === real && "active"
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
