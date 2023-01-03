import argparse
import pandas as pd
import pathlib as pth
import typing as typ


class Args(typ.TypedDict):
    events: str
    langs: str
    output: str


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--events", nargs="+", required=True)
    parser.add_argument("--langs", required=True)
    parser.add_argument("--output", required=True)
    args = parser.parse_args().__dict__
    run(args=args)


def run(*, args: Args):
    assert not pth.Path(args["output"]).exists()
    events = pd.concat([pd.read_csv(name) for name in args["events"]])
    langs = pd.read_csv(args["langs"])
    events = events.merge(langs[["repo", "lang"]], on="repo")
    group_keys = ["year", "quarter", "event", "lang"]
    events = events.groupby(group_keys)[["count"]].sum().reset_index()
    events.sort_values(
        ascending=[True, True, True, False],
        by=["year", "quarter", "event", "count"],
        inplace=True,
    )
    events.to_csv(args["output"], index=False)


if __name__ == "__main__":
    main()
