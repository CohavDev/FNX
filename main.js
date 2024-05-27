const axios = require("axios");

const URL = "http://localhost:5038/api/utilities/connectUnit";
axios
  .post(
    URL,
    {
      subscriber: 240013564529,
      license: 4239169,
      innerId: 864259066652253,
    },
    {
      headers: {
        "Content-type": "application/json; charset=UTF-8",
      },
    }
  )
  .then((res) => console.log(res.data));
