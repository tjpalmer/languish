import { GlobalContext } from "context";
import React, { useContext } from "react";

const LangList = () => {
  const global = useContext(GlobalContext);

  return (
    <div className="legend">
      <div className="list">
        <div className="listScroll">
          <div className="listBox"></div>
        </div>
      </div>
      <div className="tools">
        <div
          className="clear interactive"
          title="Clear all language selections"
        >
          Empty
        </div>
        <div
          className="reset interactive"
          title="Reset to originally selected languages"
        >
          Reset
        </div>
        <div
          className={"trim interactive" + (global.isTrimmed ? " checked" : "")}
          onClick={() => global.toggleIsTrimmed()}
          title="Toggle showing selected vs all languages"
        >
          Trim
        </div>
      </div>
      <label className="query">
        <span className="queryClear icon-search"></span>
        <input
          title="Filter by name"
          value={global.searchTerm}
          onChange={(e) => global.updateSearchTerm(e.target.value)}
        />
      </label>
    </div>
  );
};

export default LangList;
