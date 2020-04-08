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
  stars: "Stars",
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
      y: options.y || "mean",
    };
    // Rank them, including to determine default active names.
    let ranks = this.findLatestRanks();
    let actives = ranks.slice(0, 10);
    if (!this.state.activeNames.size) {
      this.state.activeNames = new Set(actives.map((active) => active.name));
    }
    this.state.originalActiveNames = new Set(this.state.activeNames);
    // Render.
    this.makeLegend(ranks);
    document.querySelector(".xLabel")!.textContent = labels[this.state.x];
    let yLabel = document.querySelector(".yLabelText")!;
    yLabel.textContent = labels[this.state.y];
    // Wire events.
    document.querySelector(".yLabel")!.addEventListener("click", () => {
      let display = document.querySelector(".display") as HTMLElement;
      display.classList.toggle("yOptionsExpanded");
    });
    // Search takeover of keyboard.
    let query = document.querySelector(".query input") as HTMLInputElement;
    let queryClear = document.querySelector(".queryClear")!;
    window.addEventListener("keydown", (event) => {
      let clearQuery = () => {
        event.preventDefault();
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
    window.addEventListener("keypress", (event) => {
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

  private findLatestRanks(offset = -1) {
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
    let dataset = chart.data.datasets!.find(
      (dataset) => dataset.label == name
    )!;
    // More remote than point hover, so make it even wider than standard hover.
    // More noticeable that way.
    dataset.borderWidth = value ? 9 : 3;
    chart.update();
  }

  private makeEntryData(name: string) {
    return this.state.data.entries[name].map((entry) => {
      // Remember [{x, y}, ...] for 2D.
      return entry[this.state.y];
    });
  }

  private makeLegend(namedRanks: Metric[]) {
    let box = document.querySelector(".listBox")!;
    box.innerHTML = "";
    let table = document.createElement("table");
    let oldRanksRaw = this.findLatestRanks(-5);
    let worstRank = Math.min(
      oldRanksRaw.slice(-1)[0].value,
      namedRanks.slice(-1)[0].value
    );
    let oldRanks = metricArrayToObject(oldRanksRaw);
    namedRanks.forEach((namedRank) => {
      let { name, value: rank } = namedRank;
      let row = document.createElement("tr");
      row.addEventListener("mouseover", () => this.highlight(name, true));
      row.addEventListener("mouseout", () => this.highlight(name, false));
      // Rank change.
      let oldRank = oldRanks[name];
      let changeValue =
        Math.min(oldRank, worstRank) - Math.min(rank, worstRank);
      // Row done.
      table.appendChild(row);
    });
    // Add it in.
    box.appendChild(table);
    // Hack filters.
    if (this.state.trimmed) {
      this.state.trimmed = !this.state.trimmed;
    } else {
      this.updateQuery();
    }
  }

  queryRows() {
    return document.querySelectorAll(".listBox tr") as Iterable<HTMLElement>;
  }

  setY(key: keyof Metrics) {
    if (this.state.y != key) {
      this.updateData();
    }
  }

  private state: State;

  updateData() {
    let counts = this.findLatestRanks();
    this.makeLegend(counts);
    for (let dataset of this.chart.data.datasets!) {
      let newData = this.makeEntryData(dataset.label!);
      dataset.data!.splice(0, dataset.data!.length, ...newData);
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
      let name = row.querySelector(".label")!.textContent!.trim().toLowerCase();
      // Surround with spaces so we can easily mark ends.
      row.style.display = ` ${name} `.includes(text) ? "" : "none";
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
