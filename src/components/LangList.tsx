import { GlobalContext } from "context";
import { clx } from "helpers";
import React, { useContext, useMemo } from "react";
import LangItem from "./LangItem";

const LangList = () => {
  const global = useContext(GlobalContext);

  const langsToRender = useMemo(() => {
    if (global.trimmed) {
      return global.langList.filter((lang) =>
        global.selectedLangs.has(lang.name)
      );
    }

    return global.langList;
  }, [global.trimmed, global.selectedLangs, global.langList]);

  return (
    <div className="legend">
      <div className="list">
        <div className="listScroll">
          <div className="listBox">
            <table>
              {langsToRender.map((lang) => (
                <LangItem
                  {...lang}
                  onClick={() => global.toggleSelected(lang.name)}
                  selected={global.selectedLangs.has(lang.name)}
                />
              ))}
            </table>
          </div>
        </div>
      </div>
      <div className="tools">
        <div
          className="clear interactive"
          onClick={global.emptyList}
          title="Clear all language selections"
        >
          Empty
        </div>
        <div
          className="reset interactive"
          onClick={global.resetList}
          title="Reset to originally selected languages"
        >
          Reset
        </div>
        <div
          className={clx("trim interactive", global.trimmed && "checked")}
          onClick={global.toggleTrimmed}
          title="Toggle showing selected vs all languages"
        >
          Trim
        </div>
      </div>
      <label className="query">
        <span
          className={clx(
            "queryClear",
            global.searchTerm ? "icon-close" : "icon-search"
          )}
          onClick={() => global.updateSearchTerm("")}
        ></span>
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
