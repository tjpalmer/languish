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
            extract(year from event.created_at) year,
            extract(quarter from event.created_at) quarter,
            count(*) count,
            event.type event,
            regexp_replace(
              repo.url,
              r'https:\/\/github\.com\/|https:\/\/api\.github\.com\/repos\/',
              ''
            ) as repo
        from (
            select * from `githubarchive.year.2011` union all
            select * from `githubarchive.year.2012` union all
            select * from `githubarchive.year.2013` union all
            select * from `githubarchive.year.2014` union all
            select * from `githubarchive.year.2015` union all
            select * from `githubarchive.year.2016` union all
            select * from `githubarchive.year.2017` union all
            select * from `githubarchive.year.2018` union all
            select * from `githubarchive.year.2019` union all
            select * from `githubarchive.year.2020` union all
            select * from `githubarchive.month.202101` union all
            select * from `githubarchive.month.202102` union all
            select * from `githubarchive.month.202103` union all
            select * from `githubarchive.month.202104` union all
            select * from `githubarchive.month.202105` union all
            select * from `githubarchive.month.202106` union all
            select * from `githubarchive.month.202107` union all
            select * from `githubarchive.month.202108` union all
            select * from `githubarchive.month.202109` union all
            select * from `githubarchive.month.202110` union all
            select * from `githubarchive.month.202111` union all
            select * from `githubarchive.month.202112`
        ) event
        where event.type in (
            'IssuesEvent', 'PullRequestEvent', 'WatchEvent'
        )
        group by repo, year, quarter, event
        having count(*) >= 10
        order by year, quarter, count(*) desc
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
