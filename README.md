# Languish &mdash; Programming Language Trends

## Links

- [Languish live site](https://tjpalmer.github.io/languish/)
  - Try it out!
- [Context Free video channel](https://www.youtube.com/channel/UCS4FAVeYW_IaZqAbqhlvxlA), for which this tool was originally designed
  - *Subscribe if you like programming languages!*


## Features

- Currently provides data from GitHub and Stack Overflow
- Measures current activity/velocity rather than total past mass
- Defaults to a simple "Mean Score" of other percentages
  - I couldn't tell which individual metric was best
  - I don't want a fancy equation that allows me just to get the results I want
- Can change y axis metric without changing language selections
- Provides metrics for many languages
- Links to GitHub topics and trending repos by language
- Can permalink to Languish configured selections and metric
- Less than 250 KB (including data) and only 6 HTTP requests
- *Limitation:* Works on my phone, but not carefully tailored for mobile


## Credits

- Uses icons from [Feather Icons](https://feathericons.com/) and [Font Awesome](https://fontawesome.com/), via [IcoMoon](https://icomoon.io/)
- Uses dependencies as specified in the package.json file
- Please see their respective licenses
- Previously used data from [GitHut 2.0](https://madnight.github.io/githut/) and still bases some queries and analysis from here


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
  WHERE Year(p.LastActivityDate) = 2022 AND DatePart(quarter, p.LastActivityDate) = 4
  GROUP BY DatePart(quarter, p.LastActivityDate), Year(p.LastActivityDate), t.TagName
  ORDER BY y, q, NumPosts DESC
  ```
- https://subredditstats.com/api/subreddit?name=Python
- https://wikimedia.org/api/rest_v1/
