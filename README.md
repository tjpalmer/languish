# Languish &mdash; Programming Language Trends

## Links

- [Languish live site](https://tjpalmer.github.io/languish/)
  - Try it out!
- [Context Free video channel](https://www.youtube.com/channel/UCS4FAVeYW_IaZqAbqhlvxlA), for which this tool was originally designed
  - *Subscribe if you like programming languages!*
- [GitHut 2.0](https://madnight.github.io/githut/), where the current data comes from
  - Thanks much for the great work there!
  - Some of the data is handled differently here


## Features

- Defaults to a simple "Mean Score" of other percentages
  - I couldn't tell which individual metric was best
  - I don't want a fancy equation that allows me just to get the results I want
- Change y axis metric without changing language selections
- Provide access to all languages in the dataset
- Link to GitHub topics and trending repos by language
- Permalink to Languish configured selections and metric
- Only 140 KB (including data) and 6 HTTP requests
- *Limitation:* Works on my phone, but not carefully tailored for mobile


## Credits

- Uses data from [GitHut 2.0](https://madnight.github.io/githut/), who's data comes from GitHub
- Uses icons from [Feather Icons](https://feathericons.com/) and [Font Awesome](https://fontawesome.com/), via [IcoMoon](https://icomoon.io/)
- Uses dependencies as specified in the package.json file
- Please see their respective licenses


## Additional notes

- [Adding a language to GitHub](https://github.com/github/linguist/blob/master/CONTRIBUTING.md#adding-a-language)
- Stack Overflow tag query:
  ```sql
  select
    tags,
    extract(year from creation_date) year,
    extract(quarter from creation_date) quarter,
    count(*) count
  from `bigquery-public-data.stackoverflow.posts_questions`
  group by tags, year, quarter
  order by count(*) desc
  ```
- Also: https://data.stackexchange.com/ (with 50k row limit but updates sooner)
  ```sql
  SELECT
    t.TagName,
    DatePart(quarter, p.LastActivityDate) AS q,
    Year(p.LastActivityDate) AS y, 
    COUNT(p.Id) As NumPosts
  FROM Posts p
  JOIN PostTags pt ON p.Id = pt.PostId
  JOIN Tags t ON t.Id = pt.TagId
  WHERE Year(p.LastActivityDate) = 2021 AND DatePart(quarter, p.LastActivityDate) = 4
  GROUP BY DatePart(quarter, p.LastActivityDate), Year(p.LastActivityDate), t.TagName
  ORDER BY y, q, NumPosts DESC
  ```
- https://subredditstats.com/api/subreddit?name=Python
- https://wikimedia.org/api/rest_v1/
