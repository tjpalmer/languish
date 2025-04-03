import argparse
import json
import pandas as pd
import pathlib as pth
import re
import typing as typ


class Args(typ.TypedDict):
    jsondir: str
    output: str


class Error(typ.TypedDict):
    message: str


class Language(typ.TypedDict):
    name: str


class Repo(typ.TypedDict):
    isFork: bool
    nameWithOwner: str
    primaryLanguage: Language | None


class Row(typ.TypedDict):
    fork: bool | None
    found: bool
    lang: str
    repo: str


def extract_data(data: dict[str, Repo | None], path: pth.Path) -> pd.DataFrame:
    rows = []
    for obj in data.values():
        if obj is not None:
            lang = obj["primaryLanguage"]
            row: Row = {
                "fork": obj["isFork"],
                "found": True,
                "lang": normalize_name(lang["name"]) if lang else "",
                "repo": obj["nameWithOwner"],
                "path": path,
            }
            rows.append(row)
    return pd.DataFrame(rows)


def extract_errors(errors: list[Error]) -> pd.DataFrame:
    rows = []
    pattern = re.compile(r"'([^/]*/[^/]*)'")
    for err in errors:
        match = pattern.search(err["message"])
        if match:
            row = {"fork": None, "found": False, "lang": "", "repo": match.group(1)}
            rows.append(row)
    return pd.DataFrame(rows)


def load_projects(dir: str) -> pd.DataFrame:
    parts = []
    cwd = pth.Path.cwd()
    for path in pth.Path(dir).iterdir():
        with open(path) as input:
            try:
                response = json.load(input)
            except:
                print(f"Error reading: {path}")
                raise
        path = path.resolve().relative_to(cwd)
        data = extract_data(response.get("data") or {}, path=path)
        # errors = extract_errors(response.get("errors", []))
        # parts += [data, errors]
        parts.append(data)
    return pd.concat(parts).drop_duplicates(subset=["found", "lang", "repo"])


def main():
    pd.set_option("display.max_columns", None)
    parser = argparse.ArgumentParser()
    parser.add_argument("--jsondir", required=True)
    parser.add_argument("--output", required=True)
    args = parser.parse_args().__dict__
    run(args=args)


def normalize_name(name: str) -> str:
    if name == "Vim script":
        # GitHub changed this later, so normalize it.
        return "Vim Script"
    return name


def run(*, args: Args):
    assert not pth.Path(args["output"]).exists()
    langs = load_projects(args["jsondir"])
    # Check for strangeness.
    dupe_counts = langs.drop_duplicates().groupby("repo")["lang"].count()
    multis = dupe_counts[dupe_counts > 1].index
    contras = langs[langs["repo"].isin(multis)].sort_values(by=["repo", "lang"])
    print("Contradictions")
    print(contras)
    # Then arbitrarily move on.
    # I had 4 repos in this category early on. Now many.
    contras.to_csv(pth.Path(args["output"]).parent / "contras.csv", index=False)
    langs = langs.drop_duplicates(subset="repo")
    langs.to_csv(args["output"], index=False)


if __name__ == "__main__":
    main()
