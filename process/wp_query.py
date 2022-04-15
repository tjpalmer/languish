import argparse
import pandas as pd
import pathlib as pth
import time
import typing as typ
import urllib.parse
import requests


class Args(typ.Protocol):
    keys: str
    output: str


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
    parser.add_argument("--keys", required=True)
    parser.add_argument("--output", required=True)
    run(parser.parse_args())


def query_all(keys: pd.Series, out_dir: pth.Path):
    all_views = []
    for key_options in keys:
        for key in key_options.split("|"):
            views = handle_key(key=key, out_dir=out_dir)
            all_views.append(views)
    return pd.concat(all_views).reset_index(drop=True)


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


def run(args: Args):
    keys = pd.read_csv(args.keys)["wikipedia"]
    keys = keys[~keys.isnull()]
    out_dir = pth.Path(args.output) / "wikipedia"
    out_dir.mkdir(exist_ok=True, parents=True)
    views = query_all(keys=keys, out_dir=out_dir)
    print(views)


if __name__ == "__main__":
    main()
