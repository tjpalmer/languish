import argparse
import pandas as pd
import pathlib as pth
import time
import typing as typ
import urllib.parse
import requests


class Args(typ.Protocol):
    cache: str
    keys: str


def encode(key: str) -> str:
    return urllib.parse.quote(key, safe="")


def handle_key(key: str, out_dir: pth.Path):
    name = encode(key)
    out_path = out_dir / f"{name}.csv"
    if out_path.exists():
        views = pd.read_csv(out_path)
    else:
        # Supposed to limit to 200/s, so easy limit to below 100/s.
        time.sleep(0.01)
        views = query_views(key=key)
        if views is not None:
            views.to_csv(out_path, index=False)
    return views


def main():
    # Limit to 200/s
    # https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/en.wikipedia.org/all-access/user/C_Sharp_%28programming_language%29/monthly/20100101/20220331
    parser = argparse.ArgumentParser()
    parser.add_argument("--cache", required=True)
    parser.add_argument("--keys", required=True)
    run(parser.parse_args())


def munge(views: pd.DataFrame) -> pd.DataFrame:
    views = views.copy()
    views["timestamp"] = pd.to_datetime(views["timestamp"], format="%Y%m%d00")
    grouped = views.groupby(["article", views["timestamp"].dt.to_period("Q")])
    views = grouped[["views"]].sum().reset_index()
    views["year"] = views["timestamp"].dt.year
    views["quarter"] = views["timestamp"].dt.quarter
    views.drop(columns="timestamp", inplace=True)
    views.rename(columns={"article": "wikipedia", "views": "count"}, inplace=True)
    return views


def query_all(keys: pd.Series, out_dir: pth.Path):
    all_views = []
    for key in keys:
        views = handle_key(key=key, out_dir=out_dir)
        all_views.append(views)
    result = pd.concat(all_views).reset_index(drop=True)
    result = munge(result)
    return result


def query_views(key: str) -> pd.DataFrame | None:
    url = "/".join(
        [
            "https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article",
            "en.wikipedia.org/all-access/user",
            encode(key),
            "monthly/20100101/20220331",
        ]
    )
    # Wikipedia also requires an easily reachable user agent.
    headers = {"User-Agent": "https://tjpalmer.github.io/languish/"}
    print(f"Querying: {key}")
    data = requests.get(headers=headers, url=url).json()
    if "items" in data:
        return pd.DataFrame(data["items"])
    else:
        print(data)
        return None


def rekey(keys: pd.DataFrame, views: pd.DataFrame) -> pd.DataFrame:
    views = views.merge(keys, on="wikipedia")
    views = views.groupby(["key", "year", "quarter"])[["count"]].sum()
    views = views.reset_index()
    views.rename(columns={"key": "name"}, inplace=True)
    return views


def run(args: Args):
    keys = pd.read_csv(args.keys)
    keys = keys[~keys["wikipedia"].isnull()]
    keys["wikipedia"] = keys["wikipedia"].str.split("|")
    keys = keys.explode("wikipedia").reset_index(drop=True)
    cache_dir = pth.Path(args.cache) / "wikipedia"
    cache_dir.mkdir(exist_ok=True, parents=True)
    views = query_all(keys=keys["wikipedia"], out_dir=cache_dir)
    views = rekey(keys=keys, views=views)
    out_path = pth.Path(args.keys).parent / "wp-views.json"
    views.to_json(out_path, indent=2, orient="records")
    print(views)


if __name__ == "__main__":
    main()
