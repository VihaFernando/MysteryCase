import type { Doc } from "./db";

export interface Ctx {
  req: Request;
  method: string;
  /** URL path segments, e.g. /cases/1/clues -> ["cases","1","clues"] */
  parts: string[];
  body: () => Promise<Doc>;
}

export type Handler = (ctx: Ctx) => Response | Promise<Response> | null | Promise<Response | null>;

export const json = (data: unknown, status = 200) => Response.json(data, { status });
export const noContent = () => new Response(null, { status: 204 });
export const err = (status: number, message: string, code?: string) => json({ message, code }, status);
