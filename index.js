const dotenv = require('dotenv');
dotenv.config();
var qs = require("querystring");
var http = require("https");
const cron = require("node-cron");
const express = require("express");
const { IncomingWebhook } = require('@slack/webhook');
const url = process.env.SLACK_WEBHOOK_URL; 


// Initialize
const webhook = new IncomingWebhook(url);


var app = express();

const {
  Pool,
  Client
} = require("pg");

const pool = new Pool({
  user: process.env.PG_DB_USER,
  host: process.env.PG_DB_HOST,
  database:process.env.PG_DB,
  password:process.env.PG_DB_PASSWORD,
  port: process.env.PG_DB_PORT
});


function getLastDateOfLastMonth() {
  var d = new Date();
  d.setMonth(d.getMonth(), 0);
  d.setUTCHours(0);
  d.setUTCMinutes(0);
  d.setUTCMilliseconds(0);
  d.setUTCSeconds(0);
  return d;
}

function getLastMonthRangeInTicks() {
  var lastDateOfLastMonth = getLastDateOfLastMonth();
  var firstDateOfLastMonth = new Date(lastDateOfLastMonth);
  firstDateOfLastMonth.setDate(1);
  return `${firstDateOfLastMonth.getTime()/1000}_${lastDateOfLastMonth.getTime()/1000}`;
}

var options = {
  "method": "POST",
  "hostname": "api.uptimerobot.com",
  "port": null,
  "path": "/v2/getMonitors",
  "headers": {
    "cache-control": "no-cache",
    "content-type": "application/x-www-form-urlencoded"
  }
};


function callSlack(item){
  var message = {
      "channel": "#slack-test",
      "attachments": [{
          "fallback": "",
          "color": "#2eb886",
          "title": item.friendly_name,
          "title_link": item.url,
          "footer": "Medic Uptime Monitor [status.app.medicmobile.org]",
          "ts": new Date().getTime(),
          "fields": [
              {
                  "title": "All time Uptime Ratio ",
                  "value": item.all_time_uptime_ratio,
                  "short": true
              },
              {
                  "title": "Last Month Uptime Ratio",
                  "value": item.custom_uptime_ranges,
                  "short": true
              }
          ]
      }]
  };

  (async () => {
      await webhook.send(message);
    })();
}


function storeData(body) {
  var result = JSON.parse(body.toString());
  var month_date = getLastDateOfLastMonth().getTime() / 1000;
  var insertText = 'INSERT INTO uptime(date_month, uptime_robot_id, friendly_name, url,all_time_uptime_ratio, custom_uptime_ranges)VALUES(to_timestamp($1),$2,$3,$4,$5,$6 )RETURNING *';

  result.monitors.forEach(function (item) {
      var values = [month_date, item.id, item.friendly_name, item.url, item.all_time_uptime_ratio, item.custom_uptime_ranges];
      callSlack(item)
      pool
        .query(insertText, values)
        .then(res => {
          console.log(res.rows[0])
        })
        .catch(e => console.error(e.stack));
    }

  );
}



cron.schedule(process.env.CRON_SCHEDULE, function () {
  console.log("---------------------");
  console.log("Running Cron Job");

  var req = http.request(options, function (res) {
    var chunks = [];
    res.on("data", function (chunk) {
      chunks.push(chunk);
    });
  
    res.on("end", function () {
      var body = Buffer.concat(chunks);
      storeData(body);
    });
  });

  req.write(qs.stringify({
    api_key: process.env.UPTIME_ROBOT_API_KEY,
    format: 'json',
    custom_uptime_ranges: getLastMonthRangeInTicks(),
    all_time_uptime_ratio: 1
  }));
  req.end();


});

app.listen("1984");
