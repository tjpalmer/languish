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
    parser.add_argument("--events", required=True)
    parser.add_argument("--outdir", required=True)
    args = parser.parse_args().__dict__
    run(args=args)


def run(*, args: Args):
    outdir = pth.Path(args["outdir"])
    # Count up events by repo.
    # repo_totals = collections.defaultdict(lambda: 0)
    totals = None
    counts = pd.read_csv(args["events"])
    print(f"events: {len(counts)}")
    counts = sum_counts(counts)
    print(f"repos: {len(counts)}")
    if args["dones"]:
        dones = pd.read_csv(args["dones"])
        counts = trim_dones(counts = counts, dones = dones)
    if outdir.exists():
        dones = ghmerge.load_projects(str(outdir))
        counts = trim_dones(counts = counts, dones = dones)
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
    for index, chunk in enumerate(split_frame(counts, chunk_size=2000)):
        try:
            query = build_query(chunk)
            # result = client.execute(gql.gql(query))
            response = client.post(endpoint, json={"query": query})
            # print(result)
            out = outdir / f"chunk{index + start}.json"
            if out.exists():
                raise RuntimeError(f"out exists: {out}")
            with open(out, "w") as output:
                json.dump(fp=output, indent=2, obj=response.json())
                # output.write(response.text)
            # break
        except:
            # Print and continue.
            traceback.print_exc()


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
