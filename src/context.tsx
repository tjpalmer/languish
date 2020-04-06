import React from "react";

const defaultState = {
  searchTerm: "",
  isTrimmed: false,
};

// react context isnt very type-friendly, need to declare noops
const noopFuncs = {
  updateSearchTerm(searchTerm: string) {},
  toggleIsTrimmed() {},
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

  render = () => (
    <GlobalContext.Provider
      value={{
        ...this.state,
        updateSearchTerm: this.updateSearchTerm,
        toggleIsTrimmed: this.toggleIsTrimmed,
      }}
    >
      {this.props.children}
    </GlobalContext.Provider>
  );
}
