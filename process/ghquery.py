import argparse
from unicodedata import name
import ghmerge
import json
import os
import pandas as pd
import pathlib as pth
import re
import requests
import traceback
import typing as typ
import urllib3


class Args(typ.TypedDict):
    dones: str
    events: list[str]
    outdir: str


# class EventRow(typ.TypedDict):
#     count: str
#     event: str
#     quarter: str
#     repo: str
#     year: str


def build_query(chunk: pd.DataFrame) -> pd.DataFrame:
    parts = ["query {"]
    for index, repo in enumerate(chunk["repo"]):
        try:
            owner, name = [json.dumps(part) for part in repo.split("/")]
        except ValueError:
            # print(f"bad: {repo}")
            continue
        start = f"r{index}: repository(owner: {owner}, name: {name})"
        parts += [f"  {start} {{nameWithOwner isFork primaryLanguage {{name}}}}"]
    # parts += ["  rateLimit(dryRun: true) {cost limit nodeCount remaining resetAt used}"]
    parts += ["}"]
    query = "\n".join(parts)
    # print(query)
    return query


endpoint = "https://api.github.com/graphql"


def init_client():
    session = requests.Session()
    session.headers.update({"Authorization": f"Bearer {os.environ['GITHUB_TOKEN']}"})
    return session


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dones")
    parser.add_argument("--events", nargs="+", required=True)
    parser.add_argument("--outdir", required=True)
    args = parser.parse_args().__dict__
    run(args=args)


def run(*, args: Args):
    outdir = pth.Path(args["outdir"])
    # Count up events by repo.
    # repo_totals = collections.defaultdict(lambda: 0)
    totals = None
    counts = pd.concat([pd.read_csv(name) for name in args["events"]])
    print(f"events: {len(counts)}")
    counts = sum_counts(counts)
    print(f"repos: {len(counts)}")
    if args["dones"]:
        dones = pd.read_csv(args["dones"])
        counts = trim_dones(counts=counts, dones=dones)
    if outdir.exists():
        dones = ghmerge.load_projects(str(outdir))
        counts = trim_dones(counts=counts, dones=dones)
        # Figure out the starting index.
        start = -1
        for kid in outdir.iterdir():
            match = re.match(r"chunk(\d+)\.json", kid.name)
            if match:
                start = max(start, int(match.group(1)))
        start += 1
    else:
        start = 0
    print(f"starting from: {start}")
    counts = counts[counts["repo"].str.contains("/")]
    print(f"goods: {len(counts)}")
    counts.sort_values(by=["count", "repo"], ascending=[False, True], inplace=True)
    client = init_client()
    outdir.mkdir(exist_ok=True, parents=True)
    err_count = 0
    total_count = 0
    for index, chunk in enumerate(split_frame(counts, chunk_size=500)):
        total_count += 1
        try:
            query = build_query(chunk)
            # result = client.execute(gql.gql(query))
            try:
                response = client.post(endpoint, json={"query": query})
            except (
                # All these things appear in the nested exceptions.
                # To be sloppy, just ignore them all.
                urllib3.exceptions.InvalidChunkLength,
                urllib3.exceptions.ProtocolError,
                requests.exceptions.ChunkedEncodingError,
                ValueError,
            ):
                print("*", end="", flush=True)
                err_count += 1
                continue
            # print(result)
            out = outdir / f"chunk{index + start}.json"
            if out.exists():
                raise RuntimeError(f"out exists: {out}")
            with open(out, "w") as output:
                json.dump(fp=output, indent=2, obj=response.json())
                # output.write(response.text)
            # break
            print(".", end="", flush=True)
        except:
            # Print and continue.
            err_count += 1
            traceback.print_exc()
    print(f"\nerrors: {err_count} / {total_count} total")


def split_frame(frame: pd.DataFrame, *, chunk_size: int) -> typ.Iterable[pd.DataFrame]:
    for begin in range(0, len(frame), chunk_size):
        yield frame.iloc[begin : begin + chunk_size]


def sum_counts(counts: pd.DataFrame) -> pd.DataFrame:
    return counts.groupby("repo")["count"].sum().to_frame().reset_index()


def trim_dones(counts: pd.DateOffset, dones: pd.DataFrame) -> pd.DataFrame:
    counts = counts[~counts["repo"].isin(set(dones["repo"]))]
    print(f"remaining: {len(counts)}")
    return counts


if __name__ == "__main__":
    main()
