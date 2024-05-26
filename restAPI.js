const Express = require("express");
const cors = require("cors");
var bodyParser = require("body-parser");
// const myTools = require("./index");
const htmlTool = require("./htmlFnx");

const app = Express();
app.use(cors());
app.use(bodyParser.json());

app.listen(5038, () => {
  console.log("port 5038 initallized");
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
app.get("/api/traffilogHtml/getVehicleByPolicy", (req, res) => {
  console.log("fetching all policies");
  async function run() {
    const subscriber = req.query.subscriber;
    const result = await htmlTool.getVehicleID(subscriber);
    console.log(result);
    res.send(result);
  }
  run();
});
// app.post("api/traffilogHtml/getVehicleID", (req, res) => {
//   const subscriber = req.data["subscriber"];
//   async function run() {
//     return await htmlTool.getVehicleID(subscriber);
//   }
//   const vehicles = run();
//   console.log(vehicles);
//   res.send(vehicles);
// });
