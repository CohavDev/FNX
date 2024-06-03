const Express = require("express");
const cors = require("cors");
var bodyParser = require("body-parser");
const utiliTools = require("./utilitiesFnx");
const htmlTool = require("./htmlFnx");

const app = Express();
app.use(
  cors({
    origin: "*",
  })
);
app.use(bodyParser.json());

var myWebsocket;

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
app.post("/api/traffilogHtml/replaceUnit", (req, res) => {
  const license = req.body["license"];
  const vehicle_id = req.body["vehicle_id"];
  async function run() {
    const result = await htmlTool.replaceUnit(license, vehicle_id);
    res.send(result);
  }
  run();
});
app.post("/api/utilities/realNewWorkOrder", (req, res) => {
  const subscriber = req.body["subscriber"];
  const vehicle_id = req.body["vehicle_id"];
  const client_id = req.body["client_id"];

  async function run() {
    const result = await utiliTools.realNewWorkOrderUser(
      subscriber,
      client_id,
      vehicle_id,
      (msg) => logServerMsgNewWorkOrder(msg, res),
      undefined // utiliTools.getWebSocket()
    );
    // res.send(result);
  }
  run();
});
app.post("/api/utilities/fakeNewWorkOrder", (req, res) => {
  const subscriber = req.body["subscriber"];
  const vehicle_id = req.body["vehicle_id"];
  const client_id = req.body["client_id"];

  async function run() {
    const result = await utiliTools.fakeNewWorkOrderUser(
      subscriber,
      client_id,
      vehicle_id,
      (msg) => logServerMsgNewWorkOrder(msg, res),
      undefined // utiliTools.getWebSocket()
    );
    // res.send(result);
  }
  run();
});
app.post("/api/utilities/disconnectUnit", (req, res) => {
  const inner_id = req.body["inner_id"];
  async function run() {
    const result = await utiliTools.disconnectUnit(inner_id);
    res.send(result);
  }
  run();
});
app.post("/api/utilities/connectUnit", (req, res) => {
  const subscriber = req.body["subscriber"];
  const license = req.body["license"];
  const innerId = req.body["innerId"];
  function logServerMsg(msg, res) {
    console.log(msg.length);
    if (msg.length !== 0) {
      console.log("server msg = ", msg);
      res.send(msg);
    } else {
      console.log(
        "server message = [empty], which means successfull connect unit operation"
      );
      res.send("Unit connected to vehicle successfully");
    }
  }
  async function run() {
    console.log("connecting unit...");
    console.log("websocket: ", myWebsocket === undefined);
    const result = await utiliTools.connectUnitUser(
      subscriber,
      license,
      innerId,
      (msg) => logServerMsg(msg, res),
      undefined // utiliTools.getWebSocket()
    );
  }

  run();
});
function logServerMsgNewWorkOrder(msg, res) {
  console.log(msg.length);
  if (msg.length !== 0) {
    console.log("server msg = ", msg);
    res.send(msg);
  } else {
    console.log(
      "server message = [empty], which means successfull new work order"
    );
    res.send("נפתחה שליחות חדשה");
  }
}
