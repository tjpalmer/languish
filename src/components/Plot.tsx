import { Chart, ChartColor, ChartDataSets } from "chart.js";
import { Scale, useGlobal } from "context";
import { trimTrailingFloat } from "helpers";
import { colors, dates, entries, Metrics } from "parsedData";
import React, { useEffect, useLayoutEffect, useRef } from "react";

function makeDataset(name: string, metric: keyof Metrics): ChartDataSets {
  const borderColor = colors[name];

  return {
    borderColor,
    cubicInterpolationMode: "monotone",
    data: entries[name].map((entry) => entry[metric]),
    fill: false,
    hoverBorderColor: borderColor,
    hoverBorderWidth: 6,
    pointHoverBackgroundColor: borderColor,
    label: name,
    pointBackgroundColor: borderColor,
  };
}

function chartJsScale(scale: Scale) {
  return scale === "log" ? "logarithmic" : "linear";
}

const Plot = () => {
  const global = useGlobal();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chart = useRef<Chart | undefined>();

  // create Chart object once after first render
  useLayoutEffect(() => {
    if (!canvasRef.current) return;

    const context = canvasRef.current.getContext("2d")!;
    chart.current = new Chart(context, {
      data: {
        datasets: [],
        labels: dates,
      },
      options: {
        animation: {
          duration: 300,
        },
        hover: {
          animationDuration: 200,
          mode: "dataset",
        },
        legend: {
          display: false,
        },
        maintainAspectRatio: false,
        responsive: true,
        scales: {
          xAxes: [
            {
              ticks: {
                callback: (date: string) => {
                  return date.includes("Q1") ? date.replace("Q1", "") : "";
                },
                fontColor: "white",
              },
              // type: 'linear',
            },
          ],
          yAxes: [
            {
              // scaleLabel: {display: true, labelString: 'Stars'},
              ticks: {
                callback: (value: number) => `${trimTrailingFloat(value)}%`,
                fontColor: "white",
                suggestedMin: 0,
              },
            },
          ],
        },
        tooltips: {
          bodyFontSize: 18,
          // I can't figure out how to remove the white border, but black here
          // softens it some.
          callbacks: {
            label: (item, data) =>
              `${data.datasets![item.datasetIndex!].label}: ` +
              `${Number(item.value).toFixed(2)}%`,
            labelColor: (item, chart) => {
              let dataset = chart.data.datasets![item.datasetIndex!];
              let color = dataset.borderColor as ChartColor;
              return { borderColor: "black", backgroundColor: color };
            },
          },
          // mode: 'x',  // Would need to highlight current and refine.
          position: "nearest",
          titleFontSize: 18,
          titleFontStyle: "normal",
        },
      },
      type: "line",
    });
  }, []);

  // reset the data when metrics change
  useEffect(() => {
    if (chart.current?.data.datasets) {
      chart.current.data.datasets = [];
    }
  }, [global.metric]);

  // react to changed in the global state
  useEffect(
    () => {
      if (!chart.current?.data.datasets) return;
      // set of currently rendered sets
      const available = new Set<string>();

      // filter out old data
      chart.current.data.datasets = chart.current.data.datasets.filter((e) => {
        available.add(e.label || "");
        return global.selectedLangs.has(e.label || "");
      });
      // add missing data
      for (const name of global.selectedLangs) {
        if (!available.has(name)) {
          chart.current.data.datasets.push(makeDataset(name, global.metric));
        }
      }

      chart.current.update();
    },
    // rule is disabled because global.selectedLangs never changes shallowly
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [global.metric, global.selectedLangs.size]
  );

  // react to changed in the global state
  useEffect(() => {
    chart.current!.options.scales!.yAxes![0].type = chartJsScale(global.scale);
    chart.current!.update();
  }, [global.scale]);

  // update highlighted element
  useEffect(() => {
    if (!chart.current?.data.datasets) return;

    for (const lang of chart.current.data.datasets) {
      lang.borderWidth = lang.label === global.highlighed ? 9 : 3;
    }

    chart.current.update();
  }, [global.highlighed]);

  return (
    <div className="plot">
      <div className="plotBox">
        <canvas ref={canvasRef}></canvas>
      </div>
      <div className="xAxis">
        <div className="xLabel interactive"></div>
      </div>
    </div>
  );
};

export default Plot;
