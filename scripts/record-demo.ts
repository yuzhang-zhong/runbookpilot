import { spawn, type ChildProcess } from "node:child_process";
import { once } from "node:events";
import { copyFile, mkdir, rm } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium, type Locator, type Page } from "playwright";

const root = resolve(import.meta.dirname, "..");
const url = "http://127.0.0.1:4173";
const rawDirectory = resolve(root, "artifacts/video-raw");
const output = resolve(root, "artifacts/screen-recording.webm");

async function waitForServer() {
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // Vite is still starting.
    }
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 150));
  }
  throw new Error(`Timed out waiting for ${url}. Build the demo before recording.`);
}

async function stop(child: ChildProcess) {
  if (child.exitCode !== null || child.killed) return;
  child.kill();
  await Promise.race([
    once(child, "exit"),
    new Promise((resolveDelay) => setTimeout(resolveDelay, 2_000))
  ]);
}

async function waitUntil(startedAt: number, second: number) {
  const remaining = startedAt + second * 1_000 - Date.now();
  if (remaining > 0) await new Promise((resolveDelay) => setTimeout(resolveDelay, remaining));
}

async function frame(page: Page, locator: Locator, block: ScrollLogicalPosition = "center") {
  await locator.evaluate((element, placement) => {
    element.scrollIntoView({ behavior: "smooth", block: placement as ScrollLogicalPosition });
  }, block);
  await page.waitForTimeout(1_100);
}

await mkdir(rawDirectory, { recursive: true });
await rm(output, { force: true });

const preview = spawn(
  process.execPath,
  [resolve(root, "apps/web/node_modules/vite/bin/vite.js"), "preview", "apps/web", "--host", "127.0.0.1", "--port", "4173"],
  { cwd: root, stdio: ["ignore", "pipe", "pipe"] }
);
preview.stdout?.on("data", (chunk) => process.stdout.write(chunk));
preview.stderr?.on("data", (chunk) => process.stderr.write(chunk));

let browser;
try {
  await waitForServer();
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
    colorScheme: "dark",
    reducedMotion: "no-preference",
    recordVideo: { dir: rawDirectory, size: { width: 1920, height: 1080 } }
  });
  const page = await context.newPage();
  const video = page.video();
  await page.goto(url, { waitUntil: "networkidle" });
  await page.getByText("SIMULATION MODE").waitFor();
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));

  const startedAt = Date.now();
  await waitUntil(startedAt, 18);
  await frame(page, page.locator(".architecture-strip"), "center");

  await waitUntil(startedAt, 44);
  await frame(page, page.locator(".console-header"), "start");
  await waitUntil(startedAt, 49);
  await page.getByTestId("start-run").click();
  await page.getByText("APPROVAL REQUIRED").waitFor();
  await frame(page, page.locator(".diagnosis-panel"), "center");

  await waitUntil(startedAt, 71);
  await frame(page, page.locator(".approval-gate"), "center");

  await waitUntil(startedAt, 97);
  await page.getByTestId("approve-action").click();
  await page.getByTestId("run-outcome").waitFor();
  await frame(page, page.locator(".metrics-grid"), "start");
  await waitUntil(startedAt, 109);
  await frame(page, page.getByTestId("run-outcome"), "center");

  await waitUntil(startedAt, 129);
  await frame(page, page.locator("#results"), "center");
  await waitUntil(startedAt, 155);
  await frame(page, page.locator(".proof-links"), "center");
  await waitUntil(startedAt, 167);

  await page.close();
  await context.close();
  if (!video) throw new Error("Playwright did not initialize video recording.");
  const videoPath = await video.path();
  await copyFile(videoPath, output);
  console.log(`Recorded browser demo: ${output}`);
} finally {
  await browser?.close();
  await stop(preview);
}
