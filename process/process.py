import csv
from contextlib import contextmanager
from dataclasses import dataclass
from typing import Iterator, TextIO


@dataclass(frozen=True, order=True)
class ComboKey:
    name: str
    year: int
    quarter: int


def combos_iter(*, keys_name: str, so_name: str) -> Iterator[tuple[ComboKey, int]]:
    keys = read_keys(keys_name)
    with open_or_stdin(so_name) as so_in:
        reader = csv.DictReader(so_in)
        for row in reader:
            names = {keys[tag] for tag in row["tags"].split("|") if tag in keys}
            year = int(row["year"])
            quarter = int(row["quarter"])
            count = int(row["count"])
            for name in names:
                combo = ComboKey(name=name, year=year, quarter=quarter)
                yield combo, count


def main():
    from argparse import ArgumentParser

    parser = ArgumentParser()
    parser.add_argument("--keys", required=True)
    parser.add_argument("--so", nargs="+", required=True)
    args = parser.parse_args()
    run(keys_name=args.keys, so_names=args.so)


@contextmanager
def open_or_stdin(name: str) -> Iterator[TextIO]:
    from sys import stdin

    if name == "-":
        yield stdin
    else:
        with open(name) as io:
            yield io


def read_keys(keys_name: str) -> dict[str, str]:
    from csv import DictReader

    keys = {}
    with open(keys_name) as keys_in:
        for row in DictReader(keys_in):
            for tag in row["stackoverflow"].split("|"):
                keys[tag] = row["key"]
    return keys


def run(*, keys_name: str, so_names: list[str]):
    from collections import defaultdict
    from json import dumps

    counts: dict[ComboKey, int] = defaultdict(int)
    for so_name in so_names:
        for combo, count in combos_iter(keys_name=keys_name, so_name=so_name):
            counts[combo] += count
    rows = []
    for combo, count in sorted(counts.items()):
        row = combo.__dict__.copy()
        row.update(count=count)
        rows.append(row)
    print(dumps(rows, indent=2))


if __name__ == "__main__":
    main()
