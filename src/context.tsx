import { Metrics } from "parsedData";
import React from "react";

const defaultState = {
  searchTerm: "",
  isTrimmed: false,
  metricsAreExpanded: false,
  metric: "mean" as keyof Metrics,
};

// react context isnt very type-friendly, need to declare noops
const noopFuncs = {
  updateSearchTerm(searchTerm: string) {},
  toggleIsTrimmed() {},
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

  updateSearchTerm = (searchTerm: string) => this.setState({ searchTerm });

  toggleIsTrimmed = () =>
    this.setState((prevState) => ({
      isTrimmed: !prevState.isTrimmed,
    }));

  toggleMetricsAreExpanded = () =>
    this.setState((prevState) => ({
      metricsAreExpanded: !prevState.metricsAreExpanded,
    }));

  emptyList = () => {};

  resetList = () => {};

  changeMetric = (metric: keyof Metrics) => this.setState({ metric });

  render = () => (
    <GlobalContext.Provider
      value={{
        ...this.state,
        updateSearchTerm: this.updateSearchTerm,
        toggleIsTrimmed: this.toggleIsTrimmed,
        toggleMetricsAreExpanded: this.toggleMetricsAreExpanded,
        emptyList: this.emptyList,
        resetList: this.resetList,
        changeMetric: this.changeMetric,
      }}
    >
      {this.props.children}
    </GlobalContext.Provider>
  );
}
