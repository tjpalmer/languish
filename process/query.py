import argparse
import csv
import pathlib as pth
import typing as typ
from google.cloud import bigquery


class Args(typ.TypedDict):
    query: typ.Literal["gh", "ghEvents", "so"]
    output: str


queries = {
    "gh": """
        select repo_name repo, lang.bytes bytes, lang.name lang
        from
            `bigquery-public-data.github_repos.languages` repo,
            unnest(repo.language) lang
        order by repo, bytes desc
    """,
    "ghEvents": """
        select
            count(*) count,
            event.type event,
            extract(year from event.created_at) year,
            extract(quarter from created_at) quarter,
            event.repo.name repo
        from `githubarchive.month.201801` event
        where event.type in (
            'IssuesEvent', 'PullRequestEvent', 'PushEvent', 'WatchEvent'
        )
        group by repo, year, quarter, event
        order by count(*) desc
    """,
    "ghNest": """
        select * from `bigquery-public-data.github_repos.languages`
    """,
    "so": """
        select
            count(*) count,
            tags,
            extract(year from creation_date) year,
            extract(quarter from creation_date) quarter
        from `bigquery-public-data.stackoverflow.posts_questions`
        group by tags, year, quarter
        order by count(*) desc
    """,
}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", required=True)
    parser.add_argument(
        "--query", choices=["gh", "ghEvents", "so"], required=True
    )
    args = parser.parse_args().__dict__
    run(args=args)


def run(*, args: Args):
    client = bigquery.Client()
    assert not pth.Path(args["output"]).exists()
    query_job = client.query(queries[args["query"]])
    # Only bother to open output after query started working.
    with open(args["output"], "w") as out_stream:
        writer = csv.writer(out_stream)
        keys: list[str] | None = None
        for row in query_job:
            if keys is None:
                keys = [*row.keys()]
                writer.writerow(keys)
            values = [row[key] for key in keys]
            writer.writerow(values)


if __name__ == "__main__":
    main()
