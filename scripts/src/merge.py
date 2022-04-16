import json
import pathlib as pth
import pandas as pd
import typing as typ


canonical_names = {
    "AL Code": "AL",
    "BlitzBasic": "BlitzMax",
    "Classic ASP": "ASP",
    "Csound Document": "Csound",
    "Csound Score": "Csound",
    "FORTRAN": "Fortran",
    "Graphviz (DOT)": "DOT",
    "Matlab": "MATLAB",
    "Nimrod": "Nim",
    "PAWN": "Pawn",
    "Perl6": "Raku",
    "Perl 6": "Raku",
    "REALbasic": "Xojo",
    "Sass": "Sass/SCSS",
    "SCSS": "Sass/SCSS",
    "VimL": "Vim script",
}


files = {
    "issues": "gh-issue-event.json",
    "pulls": "gh-pull-request.json",
    "stars": "gh-star-event.json",
    "soQuestions": "so-tags.json",
    "wpViews": "wp-views.json",
}


class Rowed(typ.TypedDict):
    keys: list[str]
    rows: list[list]


def to_rowed(frame: pd.DataFrame) -> Rowed:
    return {
        "keys": frame.columns.tolist(),
        "rows": frame.values.tolist(),
    }


def main():
    dir = pth.Path("./scripts/data")
    result: pd.DataFrame = read(dir=dir, key="issues")
    merge_keys = ["name", "date"]
    for key in files:
        if key not in result:
            other = read(dir=dir, key=key)
            result = result.merge(other, on=merge_keys, how="outer")
    # TODO Only fill 0 where data for each column starts.
    result.fillna(0, inplace=True)
    count_keys = result.select_dtypes(include=["float64"]).columns
    for key in count_keys:
        result[key] = result[key].astype(int)
    # result = result[:100]
    print(result)
    obj = {
        "items": to_rowed(result),
        "sums": to_rowed(result.groupby("date")[count_keys].sum().reset_index()),
        "translations": to_rowed(pd.read_csv("./scripts/data/keys.csv").fillna("")),
    }
    with open("src/data.json", "w") as output:
        json.dump(obj, output, separators=(",", ":"))


def read(dir: pth.Path, key: str) -> pd.DataFrame:
    counts = pd.read_json(dir / files[key])
    counts.rename(columns={"count": key}, inplace=True)
    counts["date"] = (
        counts["year"].astype("str") + "Q" + counts["quarter"].astype("str")
    )
    counts.drop(columns=["year", "quarter"], inplace=True)
    counts["name"] = counts["name"].map(canonical_names).fillna(counts["name"])
    counts = counts.groupby(["name", "date"]).sum().reset_index()
    return counts


if __name__ == "__main__":
    main()
