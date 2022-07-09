import argparse
from collections import defaultdict
import pandas as pd
import pathlib as pth
import typing as typ


class Args(typ.TypedDict):
    keys: str
    outdir: str
    so: list[str]


def drop_obsolete(results, counts):
    quarters = counts[["year", "quarter"]].drop_duplicates()
    for index, result in enumerate(results):
        merged = result.merge(quarters, how="outer", indicator=True)
        merged = merged[merged["_merge"] == "left_only"]
        if merged.shape[0] != result.shape[0]:
            merged.drop(columns="_merge", inplace=True)
            results[index] = merged


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--keys", required=True)
    parser.add_argument("--outdir", required=True)
    parser.add_argument("--so", nargs="+", required=True)
    args = parser.parse_args()
    run(args.__dict__)


def map_tags(keys, counts):
    counts = counts.copy()
    counts["name"] = counts["tags"].map(keys)
    counts = counts[~counts["name"].isnull()]
    counts.drop(columns="tags", inplace=True)
    return counts


def read_keys(name: str) -> dict[str, str]:
    keys = pd.read_csv(name)
    keys["stackoverflow"] = keys["stackoverflow"].str.split("|")
    keys = keys.explode("stackoverflow")
    keys = keys[~keys["stackoverflow"].isnull()]
    return dict(zip(keys["stackoverflow"], keys["key"]))


def read_so(name: str) -> pd.DataFrame:
    counts = pd.read_csv(name)
    if "TagName" in counts:
        return read_so_direct(counts)
    else:
        return read_so_bigquery(counts)


def read_so_bigquery(counts: pd.DataFrame) -> pd.DataFrame:
    # Process by year because memory limits.
    results = []
    for _, group in counts.groupby(["year", "quarter"]):
        group["tags"] = group["tags"].str.split("|")
        sums: pd.DataFrame
        sums = group.explode("tags").groupby(["year", "quarter", "tags"]).sum()
        sums.reset_index(inplace=True)
        results.append(sums)
    return pd.concat(results)


def read_so_direct(counts: pd.DataFrame) -> pd.DataFrame:
    counts = counts.rename(
        columns={"TagName": "tags", "q": "quarter", "y": "year", "NumPosts": "count"}
    )
    return counts


def run(args: Args):
    keys = read_keys(args["keys"])
    results: list[pd.DataFrame] = []
    for so_name in args["so"]:
        counts = read_so(so_name)
        counts = map_tags(keys, counts)
        drop_obsolete(results, counts)
        # Treat each as authoritative for the ranges it covers.
        results.append(counts)
    results_all = pd.concat(results)
    results_all = results_all[["name", "year", "quarter", "count"]]
    results_all = results_all.groupby(["name", "year", "quarter"]).sum()
    results_all.reset_index(inplace=True)
    results_all.sort_values(by=["name", "year", "quarter"], inplace=True)
    results_all.to_json(
        pth.Path(args["outdir"]) / "so-tags.json",
        indent=2,
        orient="records",
    )


if __name__ == "__main__":
    main()
