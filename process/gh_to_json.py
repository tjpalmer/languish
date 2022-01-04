import argparse
import pandas as pd
import pathlib as pth
import typing as typ


class Args(typ.TypedDict):
    csv: str
    outdir: str


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--csv", required=True)
    parser.add_argument("--outdir", required=True)
    args = parser.parse_args().__dict__
    run(args=args)


def run(*, args: Args):
    counts = pd.read_csv(args["csv"])
    counts.rename(columns={"lang": "name"}, inplace=True)
    counts = counts[counts["year"] >= 2012]
    outdir = pth.Path(args["outdir"])
    file_names = {
        "IssuesEvent": "gh-issue-event",
        "PullRequestEvent": "gh-pull-request",
        "WatchEvent": "gh-star-event",
    }
    group: pd.DataFrame
    for event, group in counts.groupby("event"):
        path = outdir / f"{file_names[event]}.json"
        group = group.drop(columns="event")
        group.to_json(path, indent=2, orient="records")


if __name__ == "__main__":
    main()
