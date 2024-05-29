const axios = require("axios");
const ws = require("ws");
let fieldwork_session_token_GLOBAL =
  "dcd15a09424d46a783e9ef5b5a2357ae4542935504";
let utilities_session_token_GLOBAL =
  "36222B226E01455CB30DA3D86F96AA004543049242";
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
const logInFieldWork = async () => {
  const result = await fetch(
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
      fieldwork_session_token_GLOBAL = data.response.properties.session_token;
      console.log(fieldwork_session_token_GLOBAL);
    })
  );
  return fieldwork_session_token_GLOBAL;
};

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
        fieldwork_session_token_GLOBAL +
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
        fieldwork_session_token_GLOBAL +
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
function connectUnit(subscriber, license, innerID) {
  const msgData = {
    action: {
      name: "fnx_connect_unit_to_vehicle",
      parameters: {
        subscribercode: subscriber,
        license_nmbr: license,
        inner_id: innerID,
        _action_name: "fnx_connect_unit_to_vehicle",
      },
      mtkn: 4,
      session_token: utilities_session_token_GLOBAL,
    },
    session_token: utilities_session_token_GLOBAL,
  };
  console.log("connecting unit to vehicle");
  utilitiesWS.send(JSON.stringify(msgData));
}

var utilitiesWS;
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

const utilitiesBuffer = [];
//       MAIN
async function conenctUnitUser(
  subscriber,
  license,
  innerID,
  callbackFunc,
  myWebsocket,
  setWebSocketCallback
) {
  let islogged = false;
  let openNew = false;
  if (myWebsocket === undefined) {
    openNew = true;
  } else {
    if (myWebsocket.readyState === ws.CLOSED) {
      openNew = true;
    }
  }
  if (openNew) {
    utilitiesWS = new ws(
      "wss://websocket.traffilog.com:8182/0309EF54-2931-4F5F-A8DE-906264884FCF/TOKEN/json"
    );
    setWebSocketCallback(utilitiesWS);
    utilitiesWS.on("open", () => {
      console.log("websocket openned");
      utilitiesWS.send(JSON.stringify(logInUtilities));
    });
  } else {
    //need fix
    utilitiesWS = myWebsocket;
    islogged = true;
    connectUnit(subscriber, license, innerID);
  }
  utilitiesWS.on("message", function incoming(data) {
    const jsonData = utilitiesBuffer.push(data.toString());
    console.log("pushed message to buffer");
    // first server message is recieved in 3 different messages one after the other
    if (utilitiesBuffer.length % 3 == 0 && utilitiesBuffer.length > 0) {
      const responseObj = JSON.parse(utilitiesBuffer.slice(-3).join(""));
      const sessionToken = responseObj.response.properties.session_token;
      const description = responseObj.response.properties.description;
      console.log(responseObj);
      utilities_session_token_GLOBAL = sessionToken;
      if (!islogged && openNew) {
        connectUnit(subscriber, license, innerID);
        islogged = true;
      } else {
        callbackFunc(description.toString());
      }
    }
  });
}

module.exports = {
  conenctUnitUser,
  logInFieldWork,
  logInUtilities,
};
