import { spawn, type ChildProcess } from "node:child_process";
import { once } from "node:events";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const children: ChildProcess[] = [];

function launch(args: string[]) {
  const child = spawn(process.execPath, args, {
    cwd: root,
    stdio: ["ignore", "pipe", "pipe"]
  });
  child.stdout?.on("data", (chunk) => process.stdout.write(chunk));
  child.stderr?.on("data", (chunk) => process.stderr.write(chunk));
  children.push(child);
  return child;
}

async function waitFor(url: string) {
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // The process is still starting.
    }
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 150));
  }
  throw new Error(`Timed out waiting for ${url}`);
}

async function stop(child: ChildProcess) {
  if (child.exitCode !== null || child.killed) return;
  child.kill();
  await Promise.race([
    once(child, "exit"),
    new Promise((resolveDelay) => setTimeout(resolveDelay, 2_000))
  ]);
}

let exitCode = 1;
try {
  launch([resolve(root, "apps/api/dist/server.js")]);
  launch([
    resolve(root, "apps/web/node_modules/vite/bin/vite.js"),
    "preview",
    "apps/web",
    "--host",
    "127.0.0.1",
    "--port",
    "5173"
  ]);
  await Promise.all([
    waitFor("http://127.0.0.1:9000/api/health"),
    waitFor("http://127.0.0.1:5173")
  ]);

  const tests = spawn(
    process.execPath,
    [resolve(root, "node_modules/@playwright/test/cli.js"), "test"],
    { cwd: root, stdio: "inherit" }
  );
  const [code] = (await once(tests, "exit")) as [number | null];
  exitCode = code ?? 1;
} finally {
  await Promise.all(children.map(stop));
}

process.exitCode = exitCode;
