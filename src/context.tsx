import { LangItemProps } from "components/LangItem";
import { objectEntries } from "helpers";
import { colors, entries, Metrics } from "parsedData";
import React from "react";

const defaultState = {
  searchTerm: "",
  trimmed: false,
  metricsAreExpanded: false,
  metric: "mean" as keyof Metrics,
  langList: [] as Omit<LangItemProps, "selected" | "onClick">[],
  selectedLangs: new Set<string>(),
};

// react context isnt very type-friendly, need to declare noops
const noopFuncs = {
  updateSearchTerm(searchTerm: string) {},
  toggleTrimmed() {},
  toggleMetricsAreExpanded() {},
  emptyList() {},
  resetList() {},
  changeMetric(metric: keyof Metrics) {},
  toggleSelected(name: string) {},
};

export const GlobalContext = React.createContext({
  ...defaultState,
  ...noopFuncs,
});

export class GlobalProvider extends React.Component<{}, typeof defaultState> {
  state = defaultState;

  constructor(props: {}) {
    super(props);

    // queuing because using setState in a constructor is forbidden
    queueMicrotask(() => {
      this.constructList();
      queueMicrotask(() => this.resetList());
    });

    console.log(this.state.langList);
  }

  updateSearchTerm = (searchTerm: string) => this.setState({ searchTerm });

  toggleTrimmed = () =>
    this.setState((prevState) => ({
      trimmed: !prevState.trimmed,
    }));

  toggleMetricsAreExpanded = () =>
    this.setState((prevState) => ({
      metricsAreExpanded: !prevState.metricsAreExpanded,
    }));

  emptyList = () => {};

  resetList = () => {
    // mark top 10 as selected
    const selectedLangs = new Set<string>();

    for (let i = 0; i < 10; i++) {
      selectedLangs.add(this.state.langList[i].name);
    }

    this.setState({ selectedLangs });
  };

  changeMetric = (metric: keyof Metrics) =>
    this.setState({ metric }, this.constructList);

  toggleSelected = (name: string) =>
    this.setState((prevState) => {
      if (prevState.selectedLangs.has(name)) {
        prevState.selectedLangs.delete(name);
      } else {
        prevState.selectedLangs.add(name);
      }
      return { selectedLangs: prevState.selectedLangs };
    });

  render = () => (
    <GlobalContext.Provider
      value={{
        ...this.state,
        updateSearchTerm: this.updateSearchTerm,
        toggleTrimmed: this.toggleTrimmed,
        toggleMetricsAreExpanded: this.toggleMetricsAreExpanded,
        emptyList: this.emptyList,
        resetList: this.resetList,
        changeMetric: this.changeMetric,
        toggleSelected: this.toggleSelected,
      }}
    >
      {this.props.children}
    </GlobalContext.Provider>
  );

  private constructList() {
    const counts = objectEntries(entries)
      .map(([name, stats]) => ({
        name,
        value: stats[stats.length - 1][this.state.metric],
      }))
      .sort((a, b) => b.value - a.value);

    let currRank: number;
    const langList = counts.map((ele, i) => {
      let rank: number;

      // edge case for first element
      // if theres a tie, dont increment the rank
      if (i === 0) {
        rank = 1;
      } else if (counts[i - 1].value === ele.value) {
        rank = currRank;
      } else {
        rank = currRank + 1;
      }
      currRank = rank;

      return {
        name: ele.name,
        rank,
        color: colors[ele.name],
        diff: -1,
      };
    });

    this.setState({ langList });
  }
}
