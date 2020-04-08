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
    this.state.originalActiveNames = new Set(this.state.activeNames);
    // Render.
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
    // Done now.
    this.state.loaded = true;
  }

  private makeEntryData(name: string) {
    return this.state.data.entries[name].map((entry) => {
      // Remember [{x, y}, ...] for 2D.
      return entry[this.state.y];
    });
  }

  queryRows() {
    return document.querySelectorAll(".listBox tr") as Iterable<HTMLElement>;
  }

  private state: State;

  updateData() {
    for (let dataset of this.chart.data.datasets!) {
      let newData = this.makeEntryData(dataset.label!);
      dataset.data!.splice(0, dataset.data!.length, ...newData);
    }
  }
}
