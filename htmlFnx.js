const axios = require("axios");
const fs = require("node:fs");
const loginTool = require("./htmlLogin");
const { resolve } = require("node:path");

let global_cookies = "";
let global_tfl_session = "";
// 339D0C11-2203-4CB1-A4EB-CBA500692FCE
// 75D8EFA9-5133-4F53-AD3F-D349E8A66578
// ; TFL_SESSION=75D8EFA9-5133-4F53-AD3F-D349E8A66578

const buildLicenseDict = (rawDB) => {
  let regexLicense = /LICENSE_NUMBER=([^VEHICLE_ID]*)/g;
  let regexVehicleID = /VEHICLE_ID=([^VEHICLE_TYPE]*)/g;

  let matchLicense = rawDB.matchAll(regexLicense);
  let matchVehicelID = rawDB.matchAll(regexVehicleID);

  let resultsLicense = Array.from(matchLicense, (m) =>
    m[1].replace(/"/g, "").trim()
  );
  let resultsVehicleID = Array.from(matchVehicelID, (m) =>
    m[1].replace(/"/g, "").trim()
  );
  const jsonObject = {};
  for (let i = 0; i < resultsLicense.length; i++) {
    jsonObject[resultsLicense[i]] = resultsVehicleID[i];
  }
  console.log(jsonObject);
  return jsonObject;
};
function processPolicyOne(policy_str) {
  // const temp =
  //   "SUBSCRIBER_CODE=240013887339 ID_NUMBER=216018143 DRIVER_NAME=שולמן עילאי ADMIN_ID_NUMBER=306497017 ADMIN_NAME=שולמן ניר CLIENT_ID=216228 POLICY_STATUS=פוליסה פעילה POLICY_START_DATE=01";
  temp = policy_str;
  const pairs = temp.split(" ");
  const obj = {};
  pairs.forEach((pair) => {
    const [key, value] = pair.split("=");
    if (key === "SUBSCRIBER_CODE" || key === "CLIENT_ID") {
      obj[key] = value;
    }
  });
  // console.log(obj);
  return obj;
}
function processPolicies(policiesData) {
  console.log("writing data to file...");
  let regex = /<Data([^/>]*)/g;
  let match = policiesData.matchAll(regex);
  let resultRegex = Array.from(match, (m) => m[1].replace(/"/g, "").trim());
  let arr = {};
  for (let i = 0; i < resultRegex.length; i++) {
    const tempObject = processPolicyOne(resultRegex[i]);
    const tempSubscriber = tempObject["SUBSCRIBER_CODE"];
    arr[tempSubscriber] = tempObject;
  }

  fs.writeFile("./policiesRawDB.json", JSON.stringify(arr), (err) => {
    if (err) {
      console.log("error in writing to file");
    } else {
      console.log("successful file writing");
    }
  });
}
function processClientDelivery(details) {
  //regex to split by spaces, only if its not inside quotes
  const resultSplit = details.split(/ +(?=(?:(?:[^"]*"){2})*[^"]*$)/);
  const body = resultSplit.join("&").replace(/['"]+/g, "");
  const additional_details =
    "FREE_TEXT=&REPLACE_ID=1&EDIT_DELIVERY_DETAILS=0&SPECIAL_NOTES=&NEW_INNER_ID=&action=FNX_REPLACE_INNER&VERSION_ID=2";
  return body + additional_details;
}
async function getVehicleIDAxios(subscribercode) {
  try {
    const result = axios
      .post(
        "https://html5.traffilog.com/AppEngine_2_1/default.aspx",
        "SUBSCRIBER_CODE=" +
          subscribercode +
          "&action=GET_POLICY_VEHICLES&VERSION_ID=2",
        {
          headers: {
            accept: "*/*",
            "accept-language": "he-IL,he;q=0.9",
            "content-type": "application/x-www-form-urlencoded",
            priority: "u=1, i",
            "sec-ch-ua":
              '"Google Chrome";v="125", "Chromium";v="125", "Not.A/Brand";v="24"',
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": '"Windows"',
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "cross-origin",
            cookie: global_cookies,

            Referer: "https://html5.traffilog.com/appv2/index.htm",
            "Referrer-Policy": "strict-origin-when-cross-origin",
          },
        }
      )
      .then((res) => {
        if (
          res.status !== 200 ||
          res.data.includes("error") ||
          res.data.includes("LOGOFF")
        ) {
          console.log("getVehicleIDAxios failed", res.data);
          return undefined;
        }
        if (!res.data.includes("DATASOURCE")) {
          console.log(
            "getVehicleIDAxios failed -- subscriber not found",
            res.data
          );
          return false;
        }
        const dict = buildLicenseDict(res.data);
        console.log("getVehicleIDAxios success", res.data);

        return dict;
      });
    return result;
  } catch (error) {
    console.log("getVehicleIDAxios failed");
    return undefined;
  }
}

async function fetchPoliciesAxios() {
  try {
    const result = axios
      .post(
        "https://html5.traffilog.com/AppEngine_2_1/default.aspx",
        "&action=GET_POLICIES&VERSION_ID=2",
        {
          headers: {
            accept: "*/*",
            "accept-language": "he-IL,he;q=0.9",
            "content-type": "application/x-www-form-urlencoded",
            priority: "u=1, i",
            "sec-ch-ua":
              '"Google Chrome";v="125", "Chromium";v="125", "Not.A/Brand";v="24"',
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": '"Windows"',
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-origin",

            cookie: global_cookies,

            Referer: "https://html5.traffilog.com/appv2/index.htm",
            "Referrer-Policy": "strict-origin-when-cross-origin",
          },
        }
      )
      .then((res) => {
        if (res.status !== 200 || res.data.length < 1000) {
          console.log("policy fetch failed. server logged-out");
          console.log(res.data);
          return false;
        }
        console.log(res.data.length);
        processPolicies(res.data);
        return true;
      });
    return result;
  } catch (error) {
    console.log("policy fetch failed");
    return false;
  }
}
async function getClientID(subscriber) {
  if (fs.existsSync("./policiesRawDB.json")) {
    try {
      const fileRaw = fs.readFileSync("./policiesRawDB.json");
      const fileJson = JSON.parse(fileRaw);
      const search = fileJson[subscriber];
      if (search === undefined) {
        // fetch policies again
        return await retryGetClient();
      }
      //else
      return search;
    } catch (error) {
      console.log(error);
      return false;
    }
  }
}
async function retryGetClient(subscriber) {
  console.log("Fetching policies again for getclient...");
  const isfetched = await fetchPolicies();
  if (!isfetched) {
    return false;
  }
  const fileRaw = fs.readFileSync("./policiesRawDB.json");
  const fileJson = JSON.parse(fileRaw);
  const search = fileJson[subscriber];
  if (search === undefined) {
    return false;
  }
  //else
  return true;
}
async function getClientOrderDetailsAxios(license, vehicle_id) {
  console.log("Getting client's order details");
  const result = await axios
    .post(
      "https://html5.traffilog.com/AppEngine_2_1/default.aspx",
      "LICENSE_NUMBER=" +
        license +
        "&VEHICLE_ID=" +
        vehicle_id +
        "&action=FNX_GET_VEHICLES_DETAILS&VERSION_ID=2",
      {
        headers: {
          accept: "*/*",
          "accept-language": "he-IL,he;q=0.9",
          "content-type": "application/x-www-form-urlencoded",
          priority: "u=1, i",
          "sec-ch-ua":
            '"Google Chrome";v="125", "Chromium";v="125", "Not.A/Brand";v="24"',
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": '"Windows"',
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "cross-origin",
          cookie: global_cookies,

          Referer: "https://html5.traffilog.com/appv2/index.htm",
          "Referrer-Policy": "strict-origin-when-cross-origin",
        },
      }
    )
    .then((res) => {
      console.log("finished with status = ", res.status);
      const regex = /<DATA ([^/>]*)/;
      let result = res.data.match(regex);
      if (result) {
        result = result[1];
        const details = processClientDelivery(result);
        console.log(details);
        return details;
      }
      return false;
    });
}
async function replaceUnit(license, vehicle_id) {
  const deliveryDetails = await getClientOrderDetails(license, vehicle_id);
  console.log("replacing unit...  ", license);
  await axios
    .post(
      "https://html5.traffilog.com/AppEngine_2_1/default.aspx",
      deliveryDetails,
      {
        headers: {
          accept: "*/*",
          "accept-language": "he-IL,he;q=0.9",
          "content-type": "application/x-www-form-urlencoded",
          priority: "u=1, i",
          "sec-ch-ua":
            '"Google Chrome";v="125", "Chromium";v="125", "Not.A/Brand";v="24"',
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": '"Windows"',
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "same-origin",

          cookie: global_cookies,

          Referer: "https://html5.traffilog.com/appv2/index.htm",
          "Referrer-Policy": "strict-origin-when-cross-origin",
        },
      }
    )
    .then((res) => console.log(res.data));
}
async function retry(callBackFunc) {
  console.log("trying again due to session id");
  const loginCookies = await loginTool.getServerCookies();
  console.log(loginCookies);
  // const isLoggedIn = true;
  if (loginCookies !== undefined) {
    // global_cookies = loginCookies;
    await readSessionIDFromFile();
    const result = await callBackFunc();
    if (result === undefined) {
      return false;
    }
    return result;
  }
  return false;
}

async function readSessionIDFromFile() {
  if (global_cookies !== "") {
    return;
  }
  try {
    if (!fs.existsSync("./config.json")) {
      await loginTool.getServerCookies();
    }
    const data = fs.readFileSync("./config.json");
    global_cookies = JSON.parse(data).session_id;
    console.log("Read cookies from file");
  } catch (error) {
    console.log("failure in read session ID");
  }
}
//   Helper func for user functions
async function userFunc(callbackFunc) {
  await readSessionIDFromFile();
  const result = await callbackFunc();
  if (result == undefined) {
    return retry(callbackFunc);
  }
  return result;
}
//       ####      USER FUNCTIONS      ####

async function getVehicleID(subscribercode) {
  return userFunc(() => getVehicleIDAxios(subscribercode));
  // await readSessionIDFromFile();
  // const result = await getVehicleIDAxios(subscribercode);
  // if (result == undefined) {
  //   return retry(() => getVehicleIDAxios(subscribercode));
  // }
  // return result;
}
async function fetchPolicies() {
  return userFunc(() => fetchPoliciesAxios());
  // readSessionIDFromFile();
  // const result = await fetchPoliciesAxios();
  // if (result == undefined) {
  //   return retry(() => fetchPoliciesAxios());
  // }
  // return result;
}
async function getClientOrderDetails(license, vehicleId) {
  return userFunc(() => getClientOrderDetailsAxios(license, vehicleId));
}
// replaceUnit() TODO:check this
// getClientOrderDetails(3105133, 1792547);
// getVehicleID()
// const details = processClientDelivery(
//   'VEHICLE_ID="1792547" LICENSE_NUMBER="3105133" INNER_ID="1062851" SUB_NUMBER="230013076633" ADMIN_ID="31811599" ADMIN_NAME="שטטמן אביעד" DELIVERYCITY="יצהר" DELIVERYSTREET="פרי הארץ" DELIVERYHOUSE="224" DELIVERYFLAT="0" DELIVERYPHONE="0508331188" SPECIALNOTES=""'
// );
module.exports = { getVehicleID, fetchPolicies, getClientID };

// ####         REPLACE UNIT HTML         ####
//      Details of license for delivery:

// await fetch("https://html5.traffilog.com/AppEngine_2_1/default.aspx", {
//     "credentials": "include",
//     "headers": {
//         "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:126.0) Gecko/20100101 Firefox/126.0",
//         "Accept": "*/*",
//         "Accept-Language": "he,en-US;q=0.7,en;q=0.3",
//         "Content-Type": "application/x-www-form-urlencoded",
//         "Sec-Fetch-Dest": "empty",
//         "Sec-Fetch-Mode": "cors",
//         "Sec-Fetch-Site": "same-origin",
//         "Priority": "u=1"
//     },
//     "referrer": "https://html5.traffilog.com/appv2/index.htm",
//     "body": "LICENSE_NUMBER=12011103&VEHICLE_ID=1701446&action=FNX_GET_VEHICLES_DETAILS&VERSION_ID=2",
//     "method": "POST",
//     "mode": "cors"
// });

// Replace unit -- save
// await fetch("https://html5.traffilog.com/AppEngine_2_1/default.aspx", {
//     "credentials": "include",
//     "headers": {
//         "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:126.0) Gecko/20100101 Firefox/126.0",
//         "Accept": "*/*",
//         "Accept-Language": "he,en-US;q=0.7,en;q=0.3",
//         "Content-Type": "application/x-www-form-urlencoded",
//         "Sec-Fetch-Dest": "empty",
//         "Sec-Fetch-Mode": "cors",
//         "Sec-Fetch-Site": "same-origin",
//         "Priority": "u=1"
//     },
//     "referrer": "https://html5.traffilog.com/appv2/index.htm",
//     "body": "VEHICLE_ID=1873489&INNER_ID=863251070316919&SUB_NUMBER=240013884944&ADMIN_ID=341281020&ADMIN_NAME=%D7%91%D7%99%D7%A0%D7%A0%D7%A4%D7%9C%D7%93%20%D7%93%D7%95%D7%93&FREE_TEXT=%D7%9C%D7%90%20%D7%9E%D7%A9%D7%93%D7%A8%D7%AA&REPLACE_ID=1&EDIT_DELIVERY_DETAILS=0&DELIVERYPHONE=0584161456&DELIVERYCITY=%D7%91%D7%99%D7%AA%20%D7%A9%D7%9E%D7%A9&DELIVERYSTREET=%D7%A0%D7%97%D7%9C%20%D7%A2%D7%99%D7%9F%20%D7%92%D7%93%D7%99&DELIVERYHOUSE=43&DELIVERYFLAT=0&SPECIALNOTES=&NEW_INNER_ID=&action=FNX_REPLACE_INNER&VERSION_ID=2",
//     "method": "POST",
//     "mode": "cors"
// });

// VEHICLE_ID=1873489&INNER_ID=863251070316919&SUB_NUMBER=240013884944&ADMIN_ID=341281020&ADMIN_NAME=%D7%91%D7%99%D7%A0%D7%A0%D7%A4%D7%9C%D7%93%20%D7%93%D7%95%D7%93&FREE_TEXT=%D7%9C%D7%90%20%D7%9E%D7%A9%D7%93%D7%A8%D7%AA&REPLACE_ID=1&EDIT_DELIVERY_DETAILS=0&DELIVERYPHONE=0584161456&DELIVERYCITY=%D7%91%D7%99%D7%AA%20%D7%A9%D7%9E%D7%A9&DELIVERYSTREET=%D7%A0%D7%97%D7%9C%20%D7%A2%D7%99%D7%9F%20%D7%92%D7%93%D7%99&DELIVERYHOUSE=43&DELIVERYFLAT=0&SPECIALNOTES=&NEW_INNER_ID=&action=FNX_REPLACE_INNER&VERSION_ID=2

// response:
// ​<MESSAGE><TEXT>Some error occurred. SessionID=g4s2hyvx4w5pyu0lzwwfymst.</TEXT></MESSAGE>
