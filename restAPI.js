const Express = require("express");
const cors = require("cors");
var bodyParser = require("body-parser");
const utiliTools = require("./utilitiesFnx");
const htmlTool = require("./htmlFnx");

const app = Express();
app.use(cors());
app.use(bodyParser.json());

app.listen(5038, () => {
  console.log("port 5038 initallized");
});

app.get("/api/traffilogHtml/getVehicleByPolicy", (req, res) => {
  console.log("get vehicle by policy");
  async function run() {
    const subscriber = req.query.subscriber;
    const result = await htmlTool.getVehicleID(subscriber);
    console.log(result);
    res.send(result);
  }
  run();
});
app.get("/api/traffilogHtml/getClientID", (req, res) => {
  console.log("Retrieving client ID ");
  async function run() {
    const subscriber = req.query.subscriber;
    const result = await htmlTool.getClientID(subscriber);
    res.send(result);
  }
  run();
});
app.get("/api/traffilogHtml/getAllPolicies", (req, res) => {
  console.log("fetching all policies");
  async function run() {
    const result = await htmlTool.fetchPolicies();
    console.log(result);
    res.send(result);
  }
  run();
});
app.post("/api/utilities/connectUnit", (req, res) => {
  const subscriber = req.body["subscriber"];
  const license = req.body["subscriber"];
  const innerId = req.body["subscriber"];

  function logServerMsg(msg) {
    console.log(msg.length);
    if (msg.length !== 0) {
      console.log("server msg = ", msg);
      res.send(msg);
    }
  }
  async function run() {
    console.log("connecting unit...");
    const result = await utiliTools.conenctUnitUser(
      subscriber,
      license,
      innerId,
      logServerMsg
    );
  }

  run();
});
