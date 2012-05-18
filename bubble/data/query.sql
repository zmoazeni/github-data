SELECT repository_language, created_at, created_at_formatted,
count(distinct(repository_name)) as active_repos,
count(repository_language) as pushes, sum(repository_size) as size
FROM (
     SELECT UTC_USEC_TO_DAY(PARSE_UTC_USEC(created_at)) as created_at,
     STRFTIME_UTC_USEC(UTC_USEC_TO_DAY(PARSE_UTC_USEC(created_at)),
     "%b %d") as created_at_formatted, repository_language,
     repository_name, repository_size
     FROM [githubarchive:github.timeline]
     WHERE type= "PushEvent"
)
GROUP BY repository_language, created_at, created_at_formatted
ORDER BY repository_language, created_at

-- circle size: active_repos
-- x: sum of active repo sizes
-- y: # of pushes that day

