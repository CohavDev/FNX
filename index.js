const axios = require("axios");

fetch(
  "https://api-il.traffilog.com/appengine_3/D292D435-BCB8-4E6F-B3B2-2F9868337DAF/1/json",
  {
    headers: {
      accept: "*/*",
      "accept-language": "he,en;q=0.9,en-GB;q=0.8,en-US;q=0.7",
      "content-type": "application/x-www-form-urlencoded",
      priority: "u=1, i",
      "sec-ch-ua":
        '"Chromium";v="124", "Microsoft Edge";v="124", "Not-A.Brand";v="99"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Windows"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-site",
      Referer: "https://fieldwork.traffilog.com/",
      "Referrer-Policy": "strict-origin-when-cross-origin",
    },
    body: '{"action":{"name":"user_login","parameters":[{"login_name":"ItaiT","password":"Aa1234"}],"session_token":"ACTION"}}',
    method: "POST",
  }
).then((res) => res.json().then((data) => console.log(data)));
