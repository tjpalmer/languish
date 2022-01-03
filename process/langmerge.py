import argparse
import pandas as pd
import pathlib as pth
import typing as typ


class Args(typ.TypedDict):
    drops: list[typ.Literal["empty", "multi"]]
    inputs: list[str]
    output: str


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--drops", choices=["empty", "multi"], nargs="+")
    parser.add_argument("--inputs", nargs="+", required=True)
    parser.add_argument("--output", required=True)
    args = parser.parse_args().__dict__
    run(args=args)


def run(*, args: Args):
    assert not pth.Path(args["output"]).exists()
    parts = []
    for path in args["inputs"]:
        print(path)
        part = pd.read_csv(path)
        if "bytes" in part:
            # Keep only primary language.
            part.sort_values(by=["repo", "bytes"], ascending=[True, False], inplace=True)
            part.drop_duplicates(inplace=True, subset="repo")
        if "fork" not in part:
            part["fork"] = None
        if "found" not in part:
            part["found"] = True
        part = part[["fork", "found", "lang", "repo"]]
        parts.append(part)
    langs = pd.concat(parts)
    print(f"full: {len(langs)}")
    if "empty" in args["drops"]:
        langs = langs[~langs["lang"].isnull()]
        print(f"non-empty: {len(langs)}")
    if "multi" in args["drops"]:
        # Load order matters here.
        # Oldest first avoids anachronism at cost of wrong present status.
        langs.drop_duplicates(inplace=True, subset="repo")
    else:
        langs.drop_duplicates(inplace=True)
    print(f"non-dupe: {len(langs)}")
    langs.to_csv(args["output"], index=False)


if __name__ == "__main__":
    main()
