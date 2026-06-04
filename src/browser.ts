import { chromium, Page } from "playwright";
import path from "node:path";

export interface BrowserSession {
  page: Page;
  close(): Promise<void>;
}

export async function openBrowser(): Promise<BrowserSession> {
  const profileDir = path.resolve(process.env.BROWSER_PROFILE_DIR ?? ".browser-profile");
  const headless = process.env.HEADLESS === "true";
  const context = await chromium.launchPersistentContext(profileDir, { headless, viewport: { width: 1365, height: 900 } });
  const page = context.pages()[0] ?? (await context.newPage());
  return { page, close: () => context.close() };
}
