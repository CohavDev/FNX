const axios = require("axios");
const fs = require("fs");

const username = "shaulc";
const password = "SC123ab!";
let session_id_GLOBAL = "";
const URL = "https://html5.traffilog.com/AppEngine_2_1/default.aspx";
function processCookies(cookies) {
  const regex = /.*?;/;
  const arr = [];
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i];
    const result = cookie.match(regex)[0];
    // console.log("cookie ==== ", result);
    arr.push(result);
  }
  return arr;
}
function getSession_Id(cookies) {
  const regex = /ASP.NET_SessionId=([^;]*;)/;
  const result = cookies.match(regex)[0];
  return result;
}
async function writeCookiesToFile(cookies) {
  const cookiesObj = {};
  // replace session_id token
  const regex = /ASP.NET_SessionId=([^;]*;)/;
  cookies.replace(regex, session_id_GLOBAL);
  cookiesObj["session_id"] =
    cookies +
    'EULA_APPROVED=1; APPLICATION_ROOT_NODE={"node":"-2"};LOGIN_DATA=;';
  try {
    fs.writeFileSync("./config.json", JSON.stringify(cookiesObj));
    console.log("SUCCESS: wrote cookies to file");
    return cookiesObj.session_id;
  } catch (error) {
    console.log("ERROR: could not write cookies to file", error);
    return undefined;
  }
}
async function getServerCookies() {
  return await axios
    .post(
      URL,
      {
        action: "APPLICATION_DEPENDENCIES",
        VERSION_ID: "2",
        displayNode: "-1",
      },
      {
        // withCredentials: true,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:126.0) Gecko/20100101 Firefox/126.0",
          Accept: "*/*",
          "Accept-Language": "he,en-US;q=0.7,en;q=0.3",
          "Content-Type": "application/x-www-form-urlencoded",
          "Sec-GPC": "1",
          "Sec-Fetch-Dest": "empty",
          "Sec-Fetch-Mode": "cors",
          "Sec-Fetch-Site": "same-origin",
        },
      }
    )
    .then(async (res) => {
      const rawCookies = res.headers["set-cookie"];
      const cookies = processCookies(rawCookies).join(" ");
      session_id_GLOBAL = getSession_Id(cookies);
      const loginCookies = await logIn(cookies);
      return loginCookies;
    });
}
async function logIn(cookiesStr) {
  return await axios
    .post(
      URL,
      {
        username: username,
        password: password,
        language: "7001",
        BOL_SAVE_COOKIE: "0",
        action: "APPLICATION_LOGIN",
        VERSION_ID: "2",
      },
      {
        // withCredentials: true,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:126.0) Gecko/20100101 Firefox/126.0",
          Accept: "*/*",
          "Accept-Language": "he,en-US;q=0.7,en;q=0.3",
          "Content-Type": "application/x-www-form-urlencoded",
          "Sec-GPC": "1",
          "Sec-Fetch-Dest": "empty",
          "Sec-Fetch-Mode": "cors",
          "Sec-Fetch-Site": "same-origin",
          Priority: "u=1",
          cookies: cookiesStr,
        },
      }
    )
    .then(async (res) => {
      if (res.data.includes("REDIRECT")) {
        console.log("logged in successfully");
        const rawCookies = res.headers["set-cookie"];
        const cookies = processCookies(rawCookies).join(" ");
        const cookiesInFile = await writeCookiesToFile(cookies);
        return cookiesInFile;
      } else {
        console.log("log in failed", res.data);
        return undefined;
      }
    });
}
// getServerCookies();
module.exports = { getServerCookies };
