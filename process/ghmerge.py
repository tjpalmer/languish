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


def extract_data(data: dict[str, Repo | None]) -> pd.DataFrame:
    rows = []
    for obj in data.values():
        if obj is not None:
            lang = obj["primaryLanguage"]
            row: Row = {
                "fork": obj["isFork"],
                "found": True,
                "lang": lang["name"] if lang else "",
                "repo": obj["nameWithOwner"],
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


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--jsondir", required=True)
    parser.add_argument("--output", required=True)
    args = parser.parse_args().__dict__
    run(args=args)


def run(*, args: Args):
    assert not pth.Path(args["output"]).exists()
    parts = []
    for path in pth.Path(args["jsondir"]).iterdir():
        print(path)
        with open(path) as input:
            response = json.load(input)
        data = extract_data(response.get("data") or {})
        errors = extract_errors(response.get("errors", []))
        parts += [data, errors]
    langs = pd.concat(parts)
    langs.to_csv(args["output"], index=False)


if __name__ == "__main__":
    main()
