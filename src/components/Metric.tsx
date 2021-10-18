import { useGlobal, Scale } from "context";
import { clx, objectEntries } from "helpers";
import { Metrics } from "parsedData";
import React from "react";

type MetricItem = {
  info?: string;
  label: string;
};

const Metric = () => {
  const global = useGlobal();

  // map of available metrics to human readable strings
  const items: { [k in keyof Metrics]: MetricItem } = {
    issues: { label: "Issues" },
    mean: { label: "Mean Score", info: "Excludes pushes because bots" },
    pulls: { label: "Pull Requests" },
    pushes: { label: "Pushes" },
    stars: { label: "Stars" },
  };

  // map of available metrics to human readable strings
  const scales: { [k in Scale]: string } = {
    linear: "Linear",
    log: "Log",
  };

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
            {items[global.metric].label}
          </span>{" "}
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
                title={display.info}
              >
                {display.label}
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
