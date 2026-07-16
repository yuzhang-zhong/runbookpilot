import { serve } from "@hono/node-server";
import { createApp } from "./app.js";

const port = Number(process.env.PORT ?? 9000);
const app = createApp();

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`RunbookPilot API listening on http://0.0.0.0:${info.port}`);
});
