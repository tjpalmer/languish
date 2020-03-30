import { Chart, ChartColor, ChartDataSets } from "chart.js";

export interface CoreMetrics {
  issues: number;
  pulls: number;
  pushes: number;
  stars: number;
}

export interface Metrics extends CoreMetrics {
  mean: number;
}

export const labels = Object.freeze({
  date: "Date",
  issues: "Issues",
  mean: "Mean Score",
  pulls: "Pull Requests",
  pushes: "Pushes",
  stars: "Stars"
});

export interface DateMetrics extends Metrics {
  date: string;
}

export interface Entry extends DateMetrics {
  name: string;
}

export interface Metric {
  name: string;
  value: number;
}

export type Keyed<Item> = {
  [key: string]: Item;
};

export interface Data {
  colors: { [name: string]: string };
  dates: string[];
  entries: Keyed<Entry[]>;
  sums: Keyed<DateMetrics>;
}

export interface State {
  activeNames: Set<string>;
  data: Data;
  loaded: boolean;
  originalActiveNames: Set<string>;
  trimmed: boolean;
  trimmedNames: Set<string>;
  x: keyof DateMetrics;
  y: keyof Metrics;
}

export interface AppOptions extends Partial<State> {
  data: Data;
}

export class App {
  constructor(options: AppOptions) {
    this.state = {
      activeNames: new Set(options.activeNames || []),
      data: options.data,
      loaded: false,
      originalActiveNames: new Set(),
      trimmed: options.trimmed || false,
      trimmedNames: new Set(),
      x: options.x || "date",
      y: options.y || "mean"
    };
    // Rank them, including to determine default active names.
    let ranks = this.findLatestRanks();
    let actives = ranks.slice(0, 10);
    if (!this.state.activeNames.size) {
      this.state.activeNames = new Set(actives.map(active => active.name));
    }
    this.state.originalActiveNames = new Set(this.state.activeNames);
    // Render.
    this.chart = this.makeChart();
    this.makeLegend(ranks);
    this.makeOptions();
    document.querySelector(".xLabel")!.textContent = labels[this.state.x];
    let yLabel = document.querySelector(".yLabelText")!;
    yLabel.textContent = labels[this.state.y];
    this.updateLink();
    // Wire events.
    document.querySelector(".yLabel")!.addEventListener("click", () => {
      let display = document.querySelector(".display") as HTMLElement;
      display.classList.toggle("yOptionsExpanded");
    });
    document.querySelector(".clear")!.addEventListener("click", () => {
      this.clearActives();
    });
    document.querySelector(".reset")!.addEventListener("click", () => {
      this.resetActives();
    });
    document.querySelector(".trim")!.addEventListener("click", () => {
      this.toggleTrimmed();
    });
    // Search takeover of keyboard.
    let query = document.querySelector(".query input") as HTMLInputElement;
    let queryClear = document.querySelector(".queryClear")!;
    queryClear.addEventListener("click", () => this.clearQuery());
    window.addEventListener("keydown", event => {
      let clearQuery = () => {
        event.preventDefault();
        this.clearQuery();
        query.focus();
      };
      if (event.key == "Escape") {
        clearQuery();
      }
      if (event.target === document.body) {
        // Nix '/' search.
        event.stopPropagation();
        // And handle custom as wanted.
        switch (event.key) {
          case "Backspace":
          case "Delete":
          case "Escape": {
            clearQuery();
            break;
          }
        }
      }
    });
    window.addEventListener("keypress", event => {
      if (event.target !== query) {
        query.value = event.key;
        event.preventDefault();
        event.stopPropagation();
        // Timeout needed to avoid double-insert in Chrome.
        window.setTimeout(() => {
          query.focus();
        }, 0);
      }
      this.updateQuery();
    });
    query.addEventListener("keyup", () => this.updateQuery());
    // Done now.
    this.state.loaded = true;
  }

  private activateMarker(marker: HTMLElement, name: string) {
    marker.classList.add("active");
    marker.style.background = this.state.data.colors[name];
  }

  private chart: Chart;

  private clearActives() {
    this.state.activeNames.clear();
    this.chart.data.datasets = [];
    this.chart.update();
    let markers = document.querySelectorAll(".listBox .marker") as Iterable<
      HTMLElement
    >;
    for (let marker of markers) {
      marker.classList.remove("active");
      marker.style.background = "";
    }
    this.updateLink();
  }

  private clearQuery(retainTrim = false) {
    let query = document.querySelector(".query input") as HTMLInputElement;
    query.value = "";
    this.updateQuery(retainTrim);
  }

  private deactivateMarker(marker: HTMLElement) {
    marker.classList.remove("active");
    marker.style.background = "";
  }

  private findLatestRanks(offset = -1) {
    let date = this.latestDate();
    let key = this.state.y;
    let { entries } = this.state.data;
    let counts = Object.entries(entries).map(([name, langEntries]) => {
      let value = langEntries.slice(offset)[0][key];
      return { name, value } as Metric;
    });
    // Sort descending.
    // TODO Sort by sequence newest to oldest dates, current metric then mean.
    counts.sort((a, b) => b.value - a.value);
    countsToRanks(counts);
    return counts;
  }

  private highlight(name: string, value: boolean) {
    if (!this.state.activeNames.has(name)) {
      return;
    }
    let { chart } = this;
    let dataset = chart.data.datasets!.find(dataset => dataset.label == name)!;
    // More remote than point hover, so make it even wider than standard hover.
    // More noticeable that way.
    dataset.borderWidth = value ? 9 : 3;
    chart.update();
  }

  private latestDate() {
    return this.state.data.dates.slice(-1)[0];
  }

  private makeChart() {
    // TODO For Metrics Mean total, first norm by max for metric total, then mean.
    let plot = document.querySelector(".plot")!;
    let canvas = plot.querySelector("canvas")!;
    let context = canvas.getContext("2d")!;
    let chart = new Chart(context, {
      data: {
        datasets: this.makeDatasets(),
        labels: this.state.data.dates
      },
      options: {
        animation: {
          duration: 300
        },
        hover: {
          animationDuration: 200,
          mode: "dataset"
        },
        legend: {
          display: false
        },
        maintainAspectRatio: false,
        responsive: true,
        scales: {
          xAxes: [
            {
              ticks: {
                callback: date => {
                  return date.includes("Q1") ? date.replace("Q1", "") : "";
                },
                fontColor: "white"
              }
              // type: 'linear',
            }
          ],
          yAxes: [
            {
              // scaleLabel: {display: true, labelString: 'Stars'},
              ticks: {
                callback: value => `${value}%`,
                fontColor: "white",
                suggestedMin: 0
              }
            }
          ]
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
            }
          },
          // mode: 'x',  // Would need to highlight current and refine.
          position: "nearest",
          titleFontSize: 18,
          titleFontStyle: "normal"
        }
      },
      type: "line"
    });
    return chart;
  }

  private makeDataset(name: string) {
    let borderColor = this.state.data.colors[name];
    return {
      borderColor,
      cubicInterpolationMode: "monotone",
      data: this.makeEntryData(name),
      fill: false,
      hoverBorderColor: borderColor,
      hoverBorderWidth: 6,
      pointHoverBackgroundColor: borderColor,
      label: name,
      pointBackgroundColor: borderColor
    } as ChartDataSets;
  }

  private makeDatasets() {
    // The order doesn't really matter here.
    return [...this.state.activeNames].map(name => this.makeDataset(name));
  }

  private makeEntryData(name: string) {
    return this.state.data.entries[name].map(entry => {
      // Remember [{x, y}, ...] for 2D.
      return entry[this.state.y];
    });
  }

  private makeInfo(name: string) {
    let info = document.createElement("div");
    info.classList.add("info");
    function makeLink(name: string, title: string, href: string) {
      let link = document.createElement("a");
      link.classList.add("icolink");
      link.href = href;
      link.title = title;
      let icon = document.createElement("span");
      icon.classList.add(`icon-${name}`);
      link.appendChild(icon);
      return link;
    }
    // Encode things.
    let nameLower = name.toLowerCase();
    let nameChanges = {
      raku: "perl 6"
    } as { [name: string]: string };
    let nameChanged = nameChanges[nameLower] || nameLower;
    let defaultTopic = nameChanged.replace(/ /g, "-");
    let topics = {
      "c++": "cpp",
      "c#": "csharp",
      "f#": "fsharp",
      "f*": "fstar",
      "objective-c++": "objective-cpp",
      "perl 6": "perl6",
      "ren'py": "renpy",
      "visual basic .net": "visual-basic-net"
    } as { [name: string]: string };
    let topic = encodeURIComponent(topics[nameChanged] || defaultTopic);
    let nameEncoded = encodeURIComponent(nameChanged);
    let searchEncoded = encodeURIComponent(`${nameLower} language`);
    // Make links.
    info.appendChild(
      makeLink(
        "google",
        "Google Search",
        `https://www.google.com/search?q=${searchEncoded}`
      )
    );
    info.appendChild(
      makeLink(
        "github",
        "GitHub Topic",
        `https://github.com/topics/${topic}?l=${nameEncoded}`
      )
    );
    info.appendChild(
      makeLink(
        "trending-up",
        "GitHub Trending",
        `https://github.com/trending/${nameEncoded}?since=daily`
      )
    );
    return info;
  }

  private makeLegend(namedRanks: Metric[]) {
    let box = document.querySelector(".listBox")!;
    let { colors } = this.state.data;
    box.innerHTML = "";
    let table = document.createElement("table");
    let oldRanksRaw = this.findLatestRanks(-5);
    let worstRank = Math.min(
      oldRanksRaw.slice(-1)[0].value,
      namedRanks.slice(-1)[0].value
    );
    let oldRanks = metricArrayToObject(oldRanksRaw);
    namedRanks.forEach(namedRank => {
      let { name, value: rank } = namedRank;
      let row = document.createElement("tr");
      row.classList.add("interactive");
      row.dataset.name = name;
      row.addEventListener("click", event => this.toggle({ name, row }));
      row.addEventListener("mouseover", () => this.highlight(name, true));
      row.addEventListener("mouseout", () => this.highlight(name, false));
      // Marker.
      let marker = document.createElement("td");
      let color = colors[name];
      if (this.state.activeNames.has(name)) {
        marker.classList.add("active");
        marker.style.background = color;
      }
      marker.classList.add("marker");
      marker.textContent = String(rank + 1);
      row.appendChild(marker);
      // Label.
      let label = document.createElement("td");
      label.classList.add("label");
      label.textContent = name;
      label.appendChild(this.makeInfo(name));
      row.appendChild(label);
      // Rank change.
      let change = document.createElement("td");
      change.classList.add("change");
      let oldRank = oldRanks[name];
      let changeValue =
        Math.min(oldRank, worstRank) - Math.min(rank, worstRank);
      if (changeValue) {
        let prefix = changeValue > 0 ? "+" : "";
        change.textContent = `${prefix}${changeValue}`;
        change.title = "Change in rank vs 1 year earlier";
      }
      row.appendChild(change);
      // Row done.
      table.appendChild(row);
    });
    // Add it in.
    box.appendChild(table);
    // Hack filters.
    if (this.state.trimmed) {
      this.state.trimmed = !this.state.trimmed;
      this.toggleTrimmed();
    } else {
      this.updateQuery();
    }
  }

  makeOptions() {
    let list = document.querySelector(".yMetricsList")!;
    list.innerHTML = "";
    let keyLabels = Object.entries(labels).sort((a, b) => {
      return a[1].localeCompare(b[1]);
    }) as [keyof DateMetrics, string][];
    keyLabels.map(([key, label]) => {
      if (key != "date") {
        let option = document.createElement("li");
        option.addEventListener("click", () => this.setY(key));
        option.classList.add("interactive");
        option.classList.add(key);
        if (key == this.state.y) {
          option.classList.add("active");
        }
        option.textContent = label;
        list.appendChild(option);
      }
    });
  }

  queryRows() {
    return document.querySelectorAll(".listBox tr") as Iterable<HTMLElement>;
  }

  resetActives() {
    // TODO Factor out something callable from clearActives and toggle?
    // TODO At the moment, those are both more efficient (?) than this.
    // Set new to original.
    this.state.activeNames = new Set(this.state.originalActiveNames);
    let { activeNames } = this.state;
    // Keep matching datasets in hopes to avoid them animating,
    let datasets = this.chart.data.datasets!.filter(dataset =>
      activeNames.has(dataset.label!)
    );
    // Figure out what new ones to add, and add them.
    let extras = new Set(activeNames);
    for (let dataset of datasets) {
      extras.delete(dataset.label!);
    }
    for (let extra of extras) {
      datasets.push(this.makeDataset(extra));
    }
    this.chart.data.datasets = datasets;
    // Update markers.
    for (let row of this.queryRows()) {
      let name = row.dataset.name!;
      let marker = row.querySelector(".marker") as HTMLElement;
      if (activeNames.has(name)) {
        this.activateMarker(marker, name);
      } else {
        this.deactivateMarker(marker);
      }
    }
    // Update other portions.
    this.chart.update();
    this.clearQuery(true);
    this.updateLink();
    // Always reset trimmed names on reset.
    this.state.trimmedNames.clear();
    // And retrim if trimming.
    if (this.state.trimmed) {
      // Hack toggle.
      this.state.trimmed = false;
      this.toggleTrimmed();
    }
  }

  setY(key: keyof Metrics) {
    if (this.state.y != key) {
      let list = document.querySelector(".yMetricsList")!;
      this.state.y = key;
      this.updateData();
      document.querySelector(".yLabelText")!.textContent = labels[this.state.y];
      for (let option of list.querySelectorAll(".interactive")) {
        if (option.classList.contains(key)) {
          option.classList.add("active");
        } else {
          option.classList.remove("active");
        }
      }
      this.updateLink();
    }
  }

  private state: State;

  toggle(info: { name: string; row: HTMLElement }) {
    let { name, row } = info;
    let marker = row.querySelector(".marker") as HTMLElement;
    let datasets = this.chart.data.datasets!;
    let { activeNames } = this.state;
    if (activeNames.has(name)) {
      activeNames.delete(name);
      this.deactivateMarker(marker);
      this.chart.data.datasets = datasets.filter(
        dataset => dataset.label != name
      );
    } else {
      activeNames.add(name);
      this.activateMarker(marker, name);
      datasets.push(this.makeDataset(name));
    }
    this.chart.update();
    this.updateLink();
  }

  toggleTrimmed() {
    let wasTrim = this.state.trimmed;
    // Unquery.
    let query = document.querySelector(".query input") as HTMLInputElement;
    query.value = "";
    this.updateQuery();
    // Handle trim.
    let trim = document.querySelector(".trim")!;
    let rows = this.queryRows();
    let { activeNames, trimmedNames } = this.state;
    if (wasTrim) {
      // Untrim.
      for (let row of rows) {
        row.style.display = "";
      }
      trim.classList.remove("checked");
      this.state.trimmed = false;
      this.state.trimmedNames.clear();
    } else {
      // Trim.
      if (!trimmedNames.size) {
        trimmedNames = activeNames;
      }
      for (let row of rows) {
        row.style.display = trimmedNames.has(row.dataset.name!) ? "" : "none";
      }
      trim.classList.add("checked");
      this.state.trimmed = true;
      // Update it can the set is new from active names.
      this.state.trimmedNames = new Set(trimmedNames);
    }
  }

  updateData() {
    let counts = this.findLatestRanks();
    this.makeLegend(counts);
    for (let dataset of this.chart.data.datasets!) {
      let newData = this.makeEntryData(dataset.label!);
      dataset.data!.splice(0, dataset.data!.length, ...newData);
    }
    this.chart.update();
  }

  updateLink() {
    // Change the link.
    let params = new URLSearchParams();
    let names = [...this.state.activeNames].map(name => name.toLowerCase());
    params.append("y", this.state.y);
    params.append("names", names.join());
    let link = document.querySelector(".link") as HTMLAnchorElement;
    link.href = `#${params}`;
    // But hide it in the url, if we've finished initial construction.
    // I don't want to force back and forth through history, but I also don't
    // want to have a lying address bar.
    if (this.state.loaded) {
      let plainUri = window.location.href.replace(window.location.hash, "");
      window.history.replaceState(undefined, "", plainUri);
    }
  }

  updateQuery(retainTrim = false) {
    if (!retainTrim) {
      // Untrim.
      this.state.trimmed = false;
      document.querySelector(".trim")!.classList.remove("checked");
    }
    // Run query.
    let query = document.querySelector(".query input") as HTMLInputElement;
    let text = query.value.toLowerCase();
    let rows = document.querySelectorAll(".listBox tr") as Iterable<
      HTMLElement
    >;
    for (let row of rows) {
      let name = row
        .querySelector(".label")!
        .textContent!.trim()
        .toLowerCase();
      // Surround with spaces so we can easily mark ends.
      row.style.display = ` ${name} `.includes(text) ? "" : "none";
    }
    // Update query clear.
    let queryClear = document.querySelector(".queryClear")!;
    if (text) {
      queryClear.classList.add("icon-close");
      queryClear.classList.remove("icon-search");
    } else {
      queryClear.classList.remove("icon-close");
      queryClear.classList.add("icon-search");
    }
  }
}

function countsToRanks(counts: Metric[]) {
  let lastCount = NaN;
  let lastRank = 0;
  counts.forEach((count, rank) => {
    if (count.value == lastCount) {
      // Track ties.
      rank = lastRank;
    }
    // Remember new last.
    lastCount = count.value;
    lastRank = rank;
    // Update.
    count.value = rank;
  });
}

function metricArrayToObject(pairs: Metric[]) {
  let result = {} as { [name: string]: number };
  for (let pair of pairs) {
    result[pair.name] = pair.value;
  }
  return result;
}
