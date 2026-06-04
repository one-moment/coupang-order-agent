import { AllMiddlewareArgs, SlackCommandMiddlewareArgs } from "@slack/bolt";
import { parseOrderText } from "../orders/orderParser.js";
import { isAllowedSlackRequest } from "./permissions.js";
import { orderModal } from "./modals.js";

export async function handleCoupangOrderCommand({ ack, command, client }: SlackCommandMiddlewareArgs & AllMiddlewareArgs): Promise<void> {
  await ack();
  if (!isAllowedSlackRequest(command.user_id, command.channel_id)) {
    await client.chat.postEphemeral({ channel: command.channel_id, user: command.user_id, text: "You are not allowed to request Coupang orders here." });
    return;
  }
  const modal = orderModal(command.trigger_id, parseOrderText(command.text));
  modal.view.private_metadata = command.channel_id;
  await client.views.open(modal);
}
