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

  emptyList = () =>
    this.setState((prevState) => {
      prevState.selectedLangs.clear();
      return prevState;
    });

  resetList = () =>
    this.setState((prevState) => {
      // mark top 10 as selected
      prevState.selectedLangs.clear();

      for (let i = 0; i < 10; i++) {
        prevState.selectedLangs.add(this.state.langList[i].name);
      }

      return prevState;
    });

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
    const getRanks = (offset = 1) => {
      const counts = objectEntries(entries)
        .map(([name, stats]) => ({
          name,
          value: stats.slice(-offset)[0][this.state.metric],
        }))
        .sort((a, b) => b.value - a.value);

      let currRank: number;
      const ranks = counts.map(({ name, value }, i) => {
        let rank: number;

        // edge case for first element
        // if theres a tie, dont increment the rank
        if (i === 0) {
          rank = 1;
        } else if (counts[i - 1].value === value) {
          rank = currRank;
        } else {
          rank = currRank + 1;
        }
        currRank = rank;

        return {
          name,
          rank,
        };
      });

      return ranks;
    };

    const currentRanks = getRanks();
    const previousRanksMap: { [k: string]: number } = getRanks(5).reduce(
      (prev, curr) => ({ ...prev, [curr.name]: curr.rank }),
      {}
    );

    const langList = currentRanks.map((ele) => ({
      ...ele,
      color: colors[ele.name],
      diff: previousRanksMap[ele.name] - ele.rank,
    }));

    this.setState({ langList });
  }
}
