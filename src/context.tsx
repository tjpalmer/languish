import { LangItemProps } from "components/LangItem";
import { objectEntries } from "helpers";
import { colors, entries, Metrics } from "parsedData";
import React from "react";

const defaultState = {
  searchTerm: "",
  trimmed: false,
  metricsAreExpanded: false,
  metric: "mean" as keyof Metrics,
  langList: [] as Omit<LangItemProps, "selected">[],
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
    queueMicrotask(() => this.constructList());

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
    const selected = new Set<string>();

    for (let i = 0; i < 10; i++) {
      selected.add(this.state.langList[i].name);
    }

    this.setState({ selectedLangs: selected });
  };

  changeMetric = (metric: keyof Metrics) => this.setState({ metric });

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
    this.state.langList = counts.map((ele, i) => {
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

    this.resetList();
  }
}
