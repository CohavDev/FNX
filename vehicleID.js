const axios = require("axios");
const fs = require("node:fs");

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
    arr.push(temp);
  }

  fs.writeFile("./policiesRawDB.txt", arr.join(", "), (err) => {
    if (err) {
      console.log("error in writing to file");
    } else {
      console.log("successful file writing");
    }
  });
}
async function getVehicleIDAxios(subscribercode) {
  axios
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
          cookie:
            'ASP.NET_SessionId=bek3c0wgkzzxnvd3s5ltvcow; TFL_SESSION=AE988BB4-CB14-473C-B80C-513E29FAB9BB; EULA_APPROVED=1; APPLICATION_ROOT_NODE={"node":"-2"}; AWSALB=aucT8O3rW4NLUC+yH1doaZ5R2xo+b+iTvaixVK3CDwUhC9zQhh96qGP+A4VuXuUWVCy7TSOdT3Qg4+pSsbyOKl1VlFWx+x/iPZEHkJ3yxuApZ3s5le3BhhuXUSvP; AWSALBCORS=aucT8O3rW4NLUC+yH1doaZ5R2xo+b+iTvaixVK3CDwUhC9zQhh96qGP+A4VuXuUWVCy7TSOdT3Qg4+pSsbyOKl1VlFWx+x/iPZEHkJ3yxuApZ3s5le3BhhuXUSvP',
          Referer: "https://html5.traffilog.com/appv2/index.htm",
          "Referrer-Policy": "strict-origin-when-cross-origin",
        },
      }
    )
    .then(
      (res) => {
        console.log(res.data);
        console.log(res.data.length);
        return buildLicenseDict(res.data);
      }
      //   data.json().then((data) => {
      //     // let endDate = new Date();
      //     // console.log("Time passed: ", Math.abs(endDate - startDate), "ms");
      //     console.log(data.length);
      //     return buildLicenseDict(data);
      //   })
    );
}
async function getSubscriberCars(subscribercode) {
  let startDate = new Date();
  await fetch("https://html5.traffilog.com/AppEngine_2_1/default.aspx", {
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
      cookie:
        'ASP.NET_SessionId=pknh12bntf4g4zwjjhf3q4xl; TFL_SESSION=AE988BB4-CB14-473C-B80C-513E29FAB9BB; EULA_APPROVED=1; APPLICATION_ROOT_NODE={"node":"-2"}; AWSALB=aucT8O3rW4NLUC+yH1doaZ5R2xo+b+iTvaixVK3CDwUhC9zQhh96qGP+A4VuXuUWVCy7TSOdT3Qg4+pSsbyOKl1VlFWx+x/iPZEHkJ3yxuApZ3s5le3BhhuXUSvP; AWSALBCORS=aucT8O3rW4NLUC+yH1doaZ5R2xo+b+iTvaixVK3CDwUhC9zQhh96qGP+A4VuXuUWVCy7TSOdT3Qg4+pSsbyOKl1VlFWx+x/iPZEHkJ3yxuApZ3s5le3BhhuXUSvP',
      Referer: "https://html5.traffilog.com/appv2/index.htm",
      "Referrer-Policy": "strict-origin-when-cross-origin",
    },
    body:
      "SUBSCRIBER_CODE=" +
      subscribercode +
      "&action=GET_POLICY_VEHICLES&VERSION_ID=2",
    method: "POST",
  }).then((data) =>
    data.text().then((data) => {
      let endDate = new Date();
      console.log("Time passed: ", Math.abs(endDate - startDate), "ms");
      console.log(data.length);
      return buildLicenseDict(data);
    })
  );
}
async function fetchPolicies() {
  axios
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
          cookie:
            'ASP.NET_SessionId=bek3c0wgkzzxnvd3s5ltvcow; TFL_SESSION=AE988BB4-CB14-473C-B80C-513E29FAB9BB; EULA_APPROVED=1; APPLICATION_ROOT_NODE={"node":"-2"}; AWSALB=aucT8O3rW4NLUC+yH1doaZ5R2xo+b+iTvaixVK3CDwUhC9zQhh96qGP+A4VuXuUWVCy7TSOdT3Qg4+pSsbyOKl1VlFWx+x/iPZEHkJ3yxuApZ3s5le3BhhuXUSvP; AWSALBCORS=aucT8O3rW4NLUC+yH1doaZ5R2xo+b+iTvaixVK3CDwUhC9zQhh96qGP+A4VuXuUWVCy7TSOdT3Qg4+pSsbyOKl1VlFWx+x/iPZEHkJ3yxuApZ3s5le3BhhuXUSvP',
          Referer: "https://html5.traffilog.com/appv2/index.htm",
          "Referrer-Policy": "strict-origin-when-cross-origin",
        },
      }
    )
    .then((res) => {
      if (res.data.length < 1000) {
        console.log("policy fetch failed. server logged-out");
        return;
      }
      console.log(res.data.length);
      processPolicies(res.data);
      // return buildLicenseDict(res.data);
    });
}
// getVehicleIDAxios(210010544439);
fetchPolicies();
// processPolicyOne("");
module.exports = { getSubscriberCars };
