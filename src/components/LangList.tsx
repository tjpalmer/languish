import { GlobalContext } from "context";
import React, { useContext } from "react";

interface LangItemProps {
  rank: number;
  name: string;
  diff: number;
}

const LangItem: React.FC<LangItemProps> = ({ diff, name, rank }) => {
  return (
    <tr className="interactive" data-name="GLSL">
      <td className="marker">{rank}</td>
      <td className="label">
        {name}
        <div className="info">
          <a
            className="icolink"
            href="https://www.google.com/search?q=glsl%20language"
            title="Google Search"
          >
            <span className="icon-google"></span>
          </a>
          <a
            className="icolink"
            href="https://github.com/topics/glsl?l=glsl"
            title="GitHub Topic"
          >
            <span className="icon-github"></span>
          </a>
          <a
            className="icolink"
            href="https://github.com/trending/glsl?since=daily"
            title="GitHub Trending"
          >
            <span className="icon-trending-up"></span>
          </a>
        </div>
      </td>
      <td className="change" title="Change in rank vs 1 year earlier">
        {diff > 0 && "+"}
        {diff}
      </td>
    </tr>
  );
};

const LangList = () => {
  const global = useContext(GlobalContext);

  return (
    <div className="legend">
      <div className="list">
        <div className="listScroll">
          <div className="listBox">
            <table>
              <LangItem diff={-12} name={"JavaScript"} rank={123} />
              <LangItem diff={-0} name={"Rust"} rank={113} />
              <LangItem diff={0} name={"WEb"} rank={13} />
              <LangItem diff={22} name={"asda"} rank={1} />
            </table>
          </div>
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
