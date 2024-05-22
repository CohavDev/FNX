const axios = require("axios");
const fs = require("node:fs");
const { resolve } = require("node:path");

let global_cookies = "";
let global_tfl_session = "; TFL_SESSION=75D8EFA9-5133-4F53-AD3F-D349E8A66578";

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
  let arr = [];
  for (let i = 0; i < resultRegex.length; i++) {
    const temp = processPolicyOne(resultRegex[i]);
    arr.push(JSON.stringify(temp));
  }

  fs.writeFile("./policiesRawDB.json", "[" + arr.join(", ") + "]", (err) => {
    if (err) {
      console.log("error in writing to file");
    } else {
      console.log("successful file writing");
    }
  });
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
            "sec-fetch-site": "same-origin",
            cookie: global_cookies + global_tfl_session,

            Referer: "https://html5.traffilog.com/appv2/index.htm",
            "Referrer-Policy": "strict-origin-when-cross-origin",
          },
        }
      )
      .then((res) => {
        if (res.status !== 200 || res.data.includes("error")) {
          console.log("getVehicleIDAxios failed");
          return undefined;
        }
        const dict = buildLicenseDict(res.data);
        console.log("getVehicleIDAxios success");
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

            cookie: global_cookies + global_tfl_session,

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
async function getSessionID() {
  try {
    const response = await axios
      .get("https://html5.traffilog.com/AppEngine_2_1/default.aspx", {
        withCredentials: true,
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

          Referer: "https://html5.traffilog.com/appv2/index.htm",
          "Referrer-Policy": "strict-origin-when-cross-origin",
        },
      })
      .then((res) => {
        const cookies = res.headers["set-cookie"].join(";");
        console.log("getSessionID OK");
        return cookies;
      });
    return response;
  } catch (error) {
    console.log("getSessionID failed");
    return undefined;
  }
}
async function retry(callBackFunc) {
  const sessionID = await getSessionID();
  if (sessionID) {
    writeSessionID(sessionID);
    const result = await callBackFunc();
    return result;
  }
  return false;
}
function writeSessionID(sessionID) {
  try {
    fs.writeFile("./config.json", { session_id: sessionID }, (err) => {
      if (err) {
        console.log("session id write to file -- failed");
      } else {
        console.log("Wrote session id into file -- OK");
      }
    });
  } catch (error) {
    console.log("Wrote session id into file -- failed");
  }
}
async function readSessionID() {
  if (global_cookies !== "") {
    return;
  }
  try {
    if (fs.existsSync("./config.json")) {
      const data = fs.readFileSync("./config.json");
      global_cookies = JSON.parse(data).session_id;
      return;
    } else {
      const session_id = await getSessionID();
      writeSessionID(session_id);
    }
  } catch (error) {
    console.log("failure in read session ID");
  }
}

//       ####      USER FUNCTIONS      ####

async function getVehicleID(subscribercode) {
  readSessionID();
  const result = await getVehicleIDAxios(subscribercode);
  if (result == undefined) {
    console.log("trying again due to session id");
    retry((subscribercode) => getVehicleIDAxios(subscribercode));
  }
}
async function fetchPolicies() {
  readSessionID();
  const result = await fetchPoliciesAxios();
  if (result == undefined) {
    console.log("trying again due to session id");
    retry(() => fetchPoliciesAxios());
  }
}
getVehicleID(240013934653);
console.log(global_cookies);
module.exports = { getVehicleID, fetchPolicies };

// cookie:
// 'ASP.NET_SessionId=ybvh5w2uysashuv1wxlnfmpy; TFL_SESSION=75D8EFA9-5133-4F53-AD3F-D349E8A66578; EULA_APPROVED=1; APPLICATION_ROOT_NODE={"node":"-2"}; AWSALB=aucT8O3rW4NLUC+yH1doaZ5R2xo+b+iTvaixVK3CDwUhC9zQhh96qGP+A4VuXuUWVCy7TSOdT3Qg4+pSsbyOKl1VlFWx+x/iPZEHkJ3yxuApZ3s5le3BhhuXUSvP; AWSALBCORS=aucT8O3rW4NLUC+yH1doaZ5R2xo+b+iTvaixVK3CDwUhC9zQhh96qGP+A4VuXuUWVCy7TSOdT3Qg4+pSsbyOKl1VlFWx+x/iPZEHkJ3yxuApZ3s5le3BhhuXUSvP',
