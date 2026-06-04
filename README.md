# coupang-order-agent

Local Slack + Playwright assistant for preparing Coupang orders. It receives `/coupang-order` requests in Slack, opens a modal, stores a local JSON order record, prepares the browser up to the pre-payment stage, and sends Slack confirmation buttons.

The final Coupang payment button is never clicked automatically. Keep `ALLOW_FINAL_PURCHASE=false`.

## Files

- `src/slack/app.ts` wires the Slack app.
- `src/slack/modals.ts` builds the order modal.
- `src/slack/blocks.ts` builds confirmation messages.
- `src/slack/commands.ts` handles `/coupang-order`.
- `src/slack/actions.ts` handles confirmation, cancel, retry, and screenshot buttons.
- `src/slack/handlers.ts` processes modal submissions.
- `src/queue/orderQueue.ts` runs one order at a time.
- `src/orders/orderStore.ts` stores local JSON records in `data/orders.json`.
- `src/orders/orderStatus.ts` defines status transitions.
- `src/orders/orderParser.ts` parses slash-command text.
- `src/server.ts` keeps the HTTP API.
- `src/browser.ts`, `src/coupang.ts`, and `src/safety.ts` handle browser preparation and safety limits.

## Run

```bash
npm install
cp .env.example .env
npm run dev
```

HTTP API runs on `PORT`, default `3030`.

## Slack App Setup

1. Create a Slack app.
2. Add a bot token and put it in `SLACK_BOT_TOKEN`.
3. Copy the signing secret into `SLACK_SIGNING_SECRET`.
4. Enable Socket Mode.
5. Create an app-level token with connections scope and put it in `SLACK_APP_TOKEN`.
6. Add slash command `/coupang-order`.
7. Enable Interactivity.
8. Install the app to the workspace.
9. Start this local bot before using Slack commands.

## Environment

See `.env.example`. Important values:

- `ALLOW_FINAL_PURCHASE=false`
- `MAX_TOTAL_ORDER_AMOUNT=300000`
- `SLACK_ALLOWED_USER_IDS` for user allowlist.
- `SLACK_ALLOWED_CHANNEL_IDS` for channel allowlist.
- `BROWSER_PROFILE_DIR` for the persistent Coupang browser profile.

## Request Example

```text
/coupang-order bottled water 70ml 3ea under 25000, exclude ria, rocket
```

Incomplete parsing is expected. The modal lets the user correct keyword, quantity, max price, required words, excluded words, delivery preference, and memo before submission.

## API

- `GET /health`
- `POST /orders/prepare`
- `POST /orders/confirm`
- `POST /orders/cancel`
- `GET /orders/:requestId`

## Tests

```bash
npm test
```

Covered areas: Slack permission checks, slash command parsing, modal validation, order status transitions, duplicate request IDs, price/exclusion safety, and dry-run behavior through `ALLOW_FINAL_PURCHASE=false`.

## Human Steps Still Required

- First Coupang login in the local browser profile.
- CAPTCHA or identity verification.
- Payment password or card authentication.
- Final order/payment button click.

## Not Implemented For Safety

- Coupang password storage.
- Payment password storage.
- Card data storage.
- CAPTCHA bypass.
- Identity verification automation.
- Bot detection bypass.
- Final payment automation.
- Order completion without explicit human action.

## Next Improvements

- Replace local JSON with Supabase through the `OrderStore` interface.
- Add richer Coupang product extraction selectors once tested against the live site.
- Add HTTP Events API adapter for hosted deployments.
- Upload screenshots directly to Slack files when bot permissions are available.
