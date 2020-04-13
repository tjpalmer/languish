import { clx } from "helpers";
import React, { memo } from "react";

const customNames: { [key: string]: string } = {
  raku: "perl 6",
};

const customTopics: { [key: string]: string } = {
  "c++": "cpp",
  "c#": "csharp",
  "f#": "fsharp",
  "f*": "fstar",
  "objective-c++": "objective-cpp",
  "perl 6": "perl6",
  "ren'py": "renpy",
  "visual basic .net": "visual-basic-net",
};

export interface LangItemProps {
  rank: number;
  color: string;
  name: string;
  diff: number;
  onClick: (name: string) => void;
  onMouseOver: (name: string) => void;
  onMouseOut: () => void;
  selected?: boolean;
}

const LangItem: React.FC<LangItemProps> = memo(
  ({ diff, name, rank, onClick, onMouseOver, onMouseOut, selected, color }) => {
    const lowerCaseName = name.toLowerCase();
    const customName = customNames[lowerCaseName] || lowerCaseName;
    const customTopic =
      customTopics[customName] || customName.replace(/ /g, "-");

    return (
      <tr
        className="interactive"
        data-name={name}
        onClick={() => onClick(name)}
        onMouseOver={selected ? () => onMouseOver(name) : undefined}
        onMouseOut={selected ? () => onMouseOut() : undefined}
      >
        <td
          className={clx("marker", selected && "active")}
          style={selected ? { backgroundColor: color } : undefined}
        >
          {rank}
        </td>
        <td className="label">
          {name}
          <div className="info">
            <a
              className="icolink"
              target="__blank"
              href={`https://www.google.com/search?q=${encodeURIComponent(
                lowerCaseName
              )}%20language`}
              title="Google Search"
            >
              <span className="icon-google"></span>
            </a>
            <a
              className="icolink"
              href={`https://github.com/topics/${encodeURIComponent(
                customTopic
              )}?l=${encodeURIComponent(customName)}`}
              title="GitHub Topic"
            >
              <span className="icon-github"></span>
            </a>
            <a
              className="icolink"
              target="__blank"
              href={`https://github.com/trending/${encodeURIComponent(
                customName
              )}?since=daily`}
              title="GitHub Trending"
            >
              <span className="icon-trending-up"></span>
            </a>
          </div>
        </td>
        <td className="change" title="Change in rank vs 1 year earlier">
          {diff > 0 && "+"}
          {diff !== 0 && diff}
        </td>
      </tr>
    );
  }
);

export default LangItem;
