import { useGlobal } from "context";
import { clx } from "helpers";
import React, { useLayoutEffect, useMemo, useRef } from "react";
import LangItem from "./LangItem";

const LangList = () => {
  const global = useGlobal();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const langsToRender = useMemo(() => {
    const lowerCaseSearchTerm = global.searchTerm.toLocaleLowerCase();

    // if trimmed filter out the non-selected langs + those that do not match the query
    if (global.trimmed) {
      return global.langList.filter(
        (lang) =>
          global.selectedLangs.has(lang.name) &&
          lang.name.toLocaleLowerCase().includes(lowerCaseSearchTerm)
      );
    }

    // filter out those do not match the query
    return global.langList.filter((lang) =>
      lang.name.toLocaleLowerCase().includes(lowerCaseSearchTerm)
    );
  }, [
    global.trimmed,
    global.selectedLangs,
    global.langList,
    global.searchTerm,
  ]);

  // window wide event for query input
  useLayoutEffect(() => {
    const handleType = (event: KeyboardEvent) => {
      // skip event if we are already focused on input
      if (event.target === inputRef.current) return;

      event.preventDefault();
      event.stopPropagation();
      global.updateSearchTerm(inputRef.current?.value + event.key);
      inputRef.current?.focus();
    };

    window.addEventListener("keypress", handleType);

    return () => window.removeEventListener("keypress", handleType);
  }, []);

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
          ref={inputRef}
          title="Filter by name"
          value={global.searchTerm}
          onChange={(e) => global.updateSearchTerm(e.target.value)}
        />
      </label>
    </div>
  );
};

export default LangList;
