import argparse
import json
import numpy as np
import os
import pandas as pd
import pathlib as pth
import requests
import typing as typ


class Args(typ.TypedDict):
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
            print(f"bad: {repo}")
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
    # transport = gql.transport.aiohttp.AIOHTTPTransport(
    #     headers={"Authorization": f"Bearer {os.environ['GITHUB_TOKEN']}"},
    #     url="https://api.github.com/graphql",
    # )
    # client = gql.Client(fetch_schema_from_transport=True, transport=transport)
    # client = gql.Client(transport=transport)
    # return client


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--events", required=True)
    parser.add_argument("--outdir", required=True)
    args = parser.parse_args().__dict__
    run(args=args)


def run(*, args: Args):
    outdir = pth.Path(args["outdir"])
    assert not outdir.exists()
    # Count up events by repo.
    # repo_totals = collections.defaultdict(lambda: 0)
    totals = None
    counts = pd.read_csv(args["events"])
    print(f"events: {len(counts)}")
    counts = sum_counts(counts)
    print(f"repos: {len(counts)}")
    counts.sort_values(by=["count", "repo"], ascending=[False, True], inplace=True)
    client = init_client()
    outdir.mkdir(parents=True)
    for index, chunk in enumerate(split_frame(counts, chunk_size=2000)):
        query = build_query(chunk)
        # result = client.execute(gql.gql(query))
        response = client.post(endpoint, json={"query": query})
        # print(result)
        with open(outdir / f"chunk{index}.json", "w") as output:
            json.dump(fp=output, indent=2, obj=response.json())
            # output.write(response.text)
        # break


def split_frame(frame: pd.DataFrame, *, chunk_size: int) -> typ.Iterable[pd.DataFrame]:
    for begin in range(0, len(frame), chunk_size):
        yield frame.iloc[begin : begin + chunk_size]


def sum_counts(counts: pd.DataFrame) -> pd.DataFrame:
    return counts.groupby("repo")["count"].sum().to_frame().reset_index()


if __name__ == "__main__":
    main()
