import React from "react";

const defaultState = {
  searchTerm: "",
};

// react context isnt very type-friendly, need to declare noops
const noopFuncs = {
  updateSearchTerm(searchTerm: string) {},
};

export const GlobalContext = React.createContext({
  ...defaultState,
  ...noopFuncs,
});

export class GlobalProvider extends React.Component {
  state = defaultState;

  updateSearchTerm = (searchTerm: string) => this.setState({ searchTerm });

  render = () => (
    <GlobalContext.Provider
      value={{ ...this.state, updateSearchTerm: this.updateSearchTerm }}
    >
      {this.props.children}
    </GlobalContext.Provider>
  );
}
