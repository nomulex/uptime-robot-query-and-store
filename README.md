# uptime-robot-query-and-store
Query Uptime Robot and store results to a postgres database and post the same to slack.

This repo has a script to query the uptime robot api and store the results in a postgres database and post the same to a slack channel. 

To set it up you will need to first crete a file named `.env` for you to store your environment variables. 

Your `.env` file should look like this one below. 

```env
PG_DB_USER="uptimerobot"
PG_DB_HOST="localhost"
PG_DB="uptime_robot"
PG_DB_PASSWORD="top_secret"
PG_DB_PORT="5432"
SLACK_WEBHOOK_URL="https://slack-webhook-url.com"
CRON_SCHEDULE="0 3 1 * *"
```
