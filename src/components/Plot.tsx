import { Chart, ChartColor, ChartDataSets } from "chart.js";
import { useGlobal } from "context";
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
                callback: (date) => {
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
                callback: (value) => `${value}%`,
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
      if (!chart.current || !chart.current.data.datasets) return;
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
