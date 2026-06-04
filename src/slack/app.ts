import { App } from "@slack/bolt";
import { handleCancel, handleConfirm, handleRetry, handleScreenshot } from "./actions.js";
import { handleCoupangOrderCommand } from "./commands.js";
import { handleOrderSubmission } from "./handlers.js";

export function createSlackApp(): App {
  const app = new App({
    token: process.env.SLACK_BOT_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    socketMode: process.env.SLACK_SOCKET_MODE !== "false",
    appToken: process.env.SLACK_APP_TOKEN
  });

  app.command("/coupang-order", handleCoupangOrderCommand);
  app.view("coupang_order_submit", handleOrderSubmission);
  app.action("coupang_confirm", handleConfirm);
  app.action("coupang_cancel", handleCancel);
  app.action("coupang_retry", handleRetry);
  app.action("coupang_screenshot", handleScreenshot);
  return app;
}
