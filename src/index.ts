import "dotenv/config";
import { createServer } from "./server.js";
import { createSlackApp } from "./slack/app.js";
import { assertFinalPurchaseDisabled } from "./safety.js";

assertFinalPurchaseDisabled();

const port = Number(process.env.PORT ?? 3030);
const server = createServer();
server.listen(port, () => console.log(`HTTP API listening on ${port}`));

if (process.env.SLACK_BOT_TOKEN && process.env.SLACK_SIGNING_SECRET) {
  const slack = createSlackApp();
  await slack.start();
  console.log("Slack app started");
} else {
  console.log("Slack env vars are missing; HTTP API only mode started");
}
