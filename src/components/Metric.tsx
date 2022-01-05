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
    mean: { label: "Mean Score" },
    issues: { label: "GH Issues" },
    pulls: {
      label: "GH Pull Requests",
      info: "Might exclude by default because bots",
    },
    stars: { label: "GH Stars" },
    soQuestions: {
      label: "SO Questions",
      info: "Excluded by default because incomplete",
    },
  };

  // map of available metrics to human readable strings
  const scales: { [k in Scale]: string } = {
    linear: "Linear",
    log: "Log",
  };

  function renderWeight(key: keyof Metrics) {
    if (key !== "mean") {
      const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        global.changeWeight(key, event.target.value);
      };
      return (
        <>
          <label
            className="weight"
            title={`${(items as any)[key].label} weight for mean`}
          >
            <input onChange={onChange} value={(global.weights as any)[key]} />
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
                    title={display.info}
                  >
                    {display.label}
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
