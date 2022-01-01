import argparse
import collections
import csv
import gql
# import pandas as pd
import pathlib as pth
import typing as typ


class Args(typ.TypedDict):
    events: list[str]
    output: str


class EventRow(typ.TypedDict):
    count: str
    event: str
    quarter: str
    repo: str
    year: str


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--events", nargs="+", required=True)
    parser.add_argument("--output", required=True)
    args = parser.parse_args().__dict__
    run(args=args)


def load_repo_counts(*, path: str) -> dict[str, int]:
    repo_counts: dict[str, int] = collections.defaultdict(lambda: 0)
    with open(path) as input:
        reader = csv.DictReader(input)
        row: EventRow
        for row in reader:
            repo_counts[row["repo"]] += int(row["count"])
    print(f"repos: {len(repo_counts)}")
    return repo_counts


def run(*, args: Args):
    print(args)
    assert not pth.Path(args["output"]).exists()
    # Count up events by repo.
    repo_totals = collections.defaultdict(lambda: 0)
    for event_path in args["events"]:
        print(event_path)
        for repo, count in load_repo_counts(path=event_path).items():
            repo_totals[repo] += count
        print(f"total repos: {len(repo_totals)}")
    repo_totals_sorted = sorted(repo_totals.items(), key=lambda pair: -pair[1])


if __name__ == "__main__":
    main()
