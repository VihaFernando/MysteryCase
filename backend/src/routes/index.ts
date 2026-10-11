import { config } from "../config";
import { err, json, type Ctx, type Handler } from "../lib/http";
import { analytics } from "./analytics";
import { app } from "./app";
import { cases } from "./cases";
import { media } from "./media";
import { notifications } from "./notifications";
import { users } from "./users";

const cms: Handler[] = [cases, media, users, notifications, analytics];

export async function route(ctx: Ctx): Promise<Response> {
  if (ctx.parts[0] === "health") return json({ ok: true });

  const pub = await app(ctx);
  if (pub) return pub;

  if (config.apiToken && ctx.req.headers.get("authorization") !== `Bearer ${config.apiToken}`) return err(401, "Unauthorized", "UNAUTHORIZED");

  for (const h of cms) {
    const res = await h(ctx);
    if (res) return res;
  }
  return err(404, "Not found");
}
