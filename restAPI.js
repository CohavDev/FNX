const Express = require("express");
const cors = require("cors");
const myTools = require("./index");
const app = Express();
app.use(cors());

app.listen(5038, () => {
  console.log("port 5038 initallized");
});

app.get("api/login/fieldwork", async (req, res) => {
  const fieldwork_sessionID = await myTools.logInFieldWork();
  console.log(fieldwork_sessionID);
});
