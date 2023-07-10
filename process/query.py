import argparse
import csv
import pathlib as pth
import typing as typ
from google.cloud import bigquery


class Args(typ.TypedDict):
    query: typ.Literal["gh", "ghEvents", "so"]
    output: str


queries = {
    # This query will process 194.51 MB when run.
    "gh": """
        select repo_name repo, lang.bytes bytes, lang.name lang
        from
            `bigquery-public-data.github_repos.languages` repo,
            unnest(repo.language) lang
        order by repo, bytes desc
    """,
    # This query will process 310.49 GB when run.
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
            select * from `githubarchive.month.202304` union all
            select * from `githubarchive.month.202305` union all
            select * from `githubarchive.month.202306`
        ) event
        where event.type in (
            'IssuesEvent', 'PullRequestEvent', 'WatchEvent'
        )
        group by repo, year, quarter, event
        having count(*) >= 10
        order by year, quarter, count(*) desc
    """,
    # select * from `githubarchive.year.2011` union all
    # select * from `githubarchive.year.2012` union all
    # select * from `githubarchive.year.2013` union all
    # select * from `githubarchive.year.2014` union all
    # select * from `githubarchive.year.2015` union all
    # select * from `githubarchive.year.2016` union all
    # select * from `githubarchive.year.2017` union all
    # select * from `githubarchive.year.2018` union all
    # select * from `githubarchive.year.2019` union all
    # select * from `githubarchive.year.2020` union all
    # select * from `githubarchive.year.2021` union all
    # select * from `githubarchive.month.202201` union all
    # select * from `githubarchive.month.202202` union all
    # select * from `githubarchive.month.202203` union all
    # select * from `githubarchive.month.202204` union all
    # select * from `githubarchive.month.202205` union all
    # select * from `githubarchive.month.202206` union all
    # select * from `githubarchive.month.202207` union all
    # select * from `githubarchive.month.202208` union all
    # select * from `githubarchive.month.202209` union all
    "ghNest": """
        select * from `bigquery-public-data.github_repos.languages`
    """,
    # This query will process 754.25 MB when run.
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
    output = pth.Path(args["output"])
    output.parent.mkdir(exist_ok=True, parents=True)
    assert not output.exists()
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
