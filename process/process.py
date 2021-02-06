from contextlib import contextmanager
from dataclasses import dataclass
from typing import Iterator, TextIO


@dataclass(frozen=True, order=True)
class ComboKey:
    name: str
    year: int
    quarter: int


def combos_iter(*, keys_name: str, so_name: str) -> Iterator[ComboKey]:
    keys = read_keys(keys_name)
    with open_or_stdin(so_name) as so_in:
        # Skip header row then read the rest.
        so_in.readline()
        for line in so_in:
            parts = line.strip().split(",")
            tags = parts[0].split("|")
            year, quarter, count = [int(_) for _ in parts[1:]]
            for tag in tags:
                name = keys.get(tag)
                if name is not None:
                    yield ComboKey(name=name, year=year, quarter=quarter)


def main():
    from argparse import ArgumentParser

    parser = ArgumentParser()
    parser.add_argument("--keys", required=True)
    parser.add_argument("--so", required=True)
    args = parser.parse_args()
    run(keys_name=args.keys, so_name=args.so)


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
            keys[row["stackoverflow"]] = row["key"]
    return keys


def run(*, keys_name: str, so_name: str):
    from collections import defaultdict
    from json import dumps

    counts: dict[ComboKey, int] = defaultdict(int)
    for combo in combos_iter(keys_name=keys_name, so_name=so_name):
        counts[combo] += 1
    rows = []
    for combo, count in sorted(counts.items()):
        row = combo.__dict__.copy()
        row.update(count=count)
        rows.append(row)
    print(dumps(rows, indent=2))


if __name__ == "__main__":
    main()
