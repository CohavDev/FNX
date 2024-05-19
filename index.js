const axios = require("axios");
const ws = require("ws");
let session_token_GLOBAL = "dcd15a09424d46a783e9ef5b5a2357ae4542935504";
const headers = {
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
};
const logIn = async () =>
  await fetch(
    "https://api-il.traffilog.com/appengine_3/D292D435-BCB8-4E6F-B3B2-2F9868337DAF/1/json",
    {
      headers: {
        headers,
      },
      body: '{"action":{"name":"user_login","parameters":[{"login_name":"ItaiT","password":"Aa1234"}],"session_token":"ACTION"}}',
      method: "POST",
    }
  ).then((res) =>
    res.json().then((data) => {
      session_token_GLOBAL = data.response.properties.session_token;
      console.log(session_token_GLOBAL);
    })
  );

const getInnerId = async (license_number) => {
  await fetch(
    "https://api-il.traffilog.com/appengine_3/D292D435-BCB8-4E6F-B3B2-2F9868337DAF/1/json",
    {
      credentials: "omit",
      headers: {
        headers,
      },
      body:
        '{"action": {"name": "fieldwork_phoenix_get_vehicle_specifics","parameters": [{"license_number": "' +
        license_number +
        '"}],"session_token": "' +
        session_token_GLOBAL +
        '"}}',
      method: "POST",
    }
  ).then((res) => {
    if (res) {
      res
        .json()
        .then((data) =>
          console.log(data.response.properties.data[0].serial_number)
        );
    }
  });
};
const getSubscriberNumber = async (license_number) => {
  await fetch(
    "https://api-il.traffilog.com/appengine_3/D292D435-BCB8-4E6F-B3B2-2F9868337DAF/1/json",
    {
      credentials: "omit",
      headers: {
        headers,
      },
      body:
        '{"action": {"name": "fieldwork_phoenix_get_vehicle_manui_specifics","parameters": [{"license_number": "' +
        license_number +
        '"}],"session_token": "' +
        session_token_GLOBAL +
        '"}}',
      method: "POST",
    }
  ).then((res) => {
    if (res) {
      res
        .json()
        .then((data) =>
          console.log(data.response.properties.data[0].TPVS_MEMBER_NUMBER)
        );
    }
  });
};
//       MAIN
async function main() {
  // await logIn();
  await getInnerId(36605002);
  await getSubscriberNumber(36605002);
}
// main();
const utilitiesWS = new ws(
  "wss://websocket.traffilog.com:8182/0309EF54-2931-4F5F-A8DE-906264884FCF/TOKEN/json"
);
const logInUtilities = {
  action: {
    name: "user_login",
    parameters: {
      login_name: "Shaulc",
      password: "SC123ab!",
      DLS: true,
      application_id: "344910",
      display_objects_version: 0,
      language_version: 0,
      sources_version: 0,
      permissions_version: 0,
      user_language: "he",
      language: "he",
      uuid: 8862869299,
      _action_name: "user_login",
    },
    mtkn: 0,
    session_token: null,
  },
  session_token: null,
};
utilitiesWS.on("open", () => {
  console.log("websocket openned");
  utilitiesWS.send(JSON.stringify(logInUtilities));
});
utilitiesWS.on("message", function incoming(data) {
  const jsonData = JSON.parse(data.toString());
  console.log(jsonData);
});
// await fetch("wss://websocket.traffilog.com:8182/0309EF54-2931-4F5F-A8DE-906264884FCF/TOKEN/json", {
//     "credentials": "include",
//     "headers": {
//         "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:126.0) Gecko/20100101 Firefox/126.0",
//         "Accept": "*/*",
//         "Accept-Language": "he,en-US;q=0.7,en;q=0.3",
//         "Sec-WebSocket-Version": "13",
//         "Sec-WebSocket-Extensions": "permessage-deflate",
//         "Sec-WebSocket-Key": "tthFF4tYaAvntZjfCnItyQ==",
//         "Sec-Fetch-Dest": "empty",
//         "Sec-Fetch-Mode": "websocket",
//         "Sec-Fetch-Site": "same-site",
//         "Pragma": "no-cache",
//         "Cache-Control": "no-cache"
//     },
//     "method": "GET",
//     "mode": "cors"
// });
