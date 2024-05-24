const axios = require("axios");
const fs = require("fs");

const username = "shaulc";
const password = "SC123ab!";
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
async function writeCookiesToFile(cookies) {
  const cookiesObj = {};
  cookiesObj["session_id"] =
    cookies +
    'EULA_APPROVED=1; APPLICATION_ROOT_NODE={"node":"-2"};LOGIN_DATA=;';
  try {
    fs.writeFileSync("./config.json", JSON.stringify(cookiesObj));
    console.log("SUCCESS: wrote cookies to file");
  } catch (error) {
    console.log("ERROR: could not write cookies to file", error);
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
    .then((res) => {
      const rawCookies = res.headers["set-cookie"];
      const cookies = processCookies(rawCookies).join(" ");
      //   console.log(cookies);
      writeCookiesToFile(cookies);
      const loginResult = logIn();
      return loginResult;
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
    .then((res) => {
      if (res.data.includes("REDIRECT")) {
        console.log("logged in successfully");
        return true;
      } else {
        console.log("log in failed", res.data);
        return false;
      }
    });
}

module.exports = { getServerCookies };
