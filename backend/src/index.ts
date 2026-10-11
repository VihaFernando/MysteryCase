import { config } from "./config";
import { seedIfEmpty } from "./lib/db";
import { err } from "./lib/http";
import { bindServer } from "./lib/realtime";
import { route } from "./routes";

await seedIfEmpty();

const cors = {
  "Access-Control-Allow-Origin": config.corsOrigin,
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
  "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
};

const server = Bun.serve({
  port: config.port,
  async fetch(req, srv) {
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    const url = new URL(req.url);
    if (url.pathname === "/ws") return srv.upgrade(req) ? undefined : err(400, "Expected websocket");

    const res = await route({
      req,
      method: req.method,
      parts: url.pathname.split("/").filter(Boolean),
      body: async () => (await req.json().catch(() => ({}))) as Record<string, any>,
    }).catch((e) => { console.error(e); return err(500, "Internal error"); });
    for (const [k, v] of Object.entries(cors)) res.headers.set(k, v);
    return res;
  },
  websocket: { open: (ws) => void ws.subscribe("all"), message() {} },
});
bindServer(server);

console.log(`API + WS on http://localhost:${server.port}`);
