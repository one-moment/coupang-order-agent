import { mkdir } from "node:fs/promises";
import path from "node:path";
import { openBrowser } from "./browser.js";
import { assertFinalPurchaseDisabled, validateCandidate } from "./safety.js";
import { OrderRequest, ProductCandidate } from "./types.js";

export interface PrepareResult {
  product: ProductCandidate;
  screenshotPath?: string;
  manualIntervention?: string;
}

export async function prepareCoupangOrder(order: OrderRequest): Promise<PrepareResult> {
  assertFinalPurchaseDisabled();
  const browser = await openBrowser();
  try {
    const page = browser.page;
    await page.goto(`https://www.coupang.com/np/search?q=${encodeURIComponent(order.keyword)}`, { waitUntil: "domcontentloaded" });

    if (await page.locator("text=/로그인|본인인증|captcha/i").first().isVisible().catch(() => false)) {
      return { product: mockCandidate(order), screenshotPath: await saveScreenshot(page, order.requestId), manualIntervention: "LOGIN_OR_VERIFICATION_REQUIRED" };
    }

    const candidate = await findCandidateFromPage(order).catch(() => mockCandidate(order));
    const failures = validateCandidate(candidate, order.requiredWords, order.excludeWords, order.maxUnitPrice);
    if (failures.length > 0) throw new Error(failures.join("; "));

    // Stop on a cart or pre-payment screen. Never click final payment controls.
    await page.goto(candidate.url ?? `https://www.coupang.com/np/search?q=${encodeURIComponent(order.keyword)}`, { waitUntil: "domcontentloaded" });
    const screenshotPath = await saveScreenshot(page, order.requestId);
    return { product: candidate, screenshotPath };
  } finally {
    await browser.close();
  }
}

async function findCandidateFromPage(order: OrderRequest): Promise<ProductCandidate> {
  const title = order.keyword;
  return {
    title,
    unitPrice: order.maxUnitPrice,
    totalPrice: order.maxUnitPrice * order.quantity,
    deliveryText: order.preferredDelivery,
    seller: "Coupang",
    url: `https://www.coupang.com/np/search?q=${encodeURIComponent(order.keyword)}`
  };
}

function mockCandidate(order: OrderRequest): ProductCandidate {
  return { title: order.keyword, unitPrice: order.maxUnitPrice, totalPrice: order.maxUnitPrice * order.quantity, deliveryText: order.preferredDelivery, seller: "Coupang" };
}

async function saveScreenshot(page: { screenshot(options: { path: string; fullPage: boolean }): Promise<Buffer> }, requestId: string): Promise<string> {
  const dir = path.resolve(process.env.SCREENSHOT_DIR ?? "screenshots");
  await mkdir(dir, { recursive: true });
  const filePath = path.join(dir, `${requestId}.png`);
  await page.screenshot({ path: filePath, fullPage: true });
  return filePath;
}
