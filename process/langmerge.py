import argparse
import pandas as pd
import pathlib as pth
import typing as typ


class Args(typ.TypedDict):
    inputs: list[str]
    output: str


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--inputs", nargs="+", required=True)
    parser.add_argument("--output", required=True)
    args = parser.parse_args().__dict__
    run(args=args)


def run(*, args: Args):
    assert not pth.Path(args["output"]).exists()
    parts = []
    for path in args["inputs"]:
        part = pd.read_csv(path)
        if "fork" not in part:
            part["fork"] = None
        if "found" not in part:
            part["found"] = True
        part = part[["fork", "found", "lang", "repo"]]
        parts.append(part)
    langs = pd.concat(parts)
    langs.drop_duplicates(inplace=True)
    langs.to_csv(args["output"], index=False)


if __name__ == "__main__":
    main()
