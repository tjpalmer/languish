import argparse
import csv
import pathlib as pth
import typing as typ
from google.cloud import bigquery


class Args(typ.TypedDict):
    output: str


query = """
    select
        tags,
        extract(year from creation_date) year,
        extract(quarter from creation_date) quarter,
        count(*) count
    from `bigquery-public-data.stackoverflow.posts_questions`
    group by tags, year, quarter
    order by count(*) desc
"""


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", required=True)
    args = parser.parse_args().__dict__
    run(args=args)


def run(*, args: Args):
    client = bigquery.Client()
    assert not pth.Path(args["output"]).exists()
    with open(args["output"], "w") as out_stream:
        writer = csv.writer(out_stream)
        keys: list[str] | None = None
        query_job = client.query(query)
        for row in query_job:
            if keys is None:
                keys = [*row.keys()]
                writer.writerow(keys)
            values = [row[key] for key in keys]
            writer.writerow(values)


if __name__ == "__main__":
    main()
