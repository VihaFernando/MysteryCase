import mongoose, { Schema, type Model } from "mongoose";
import { config } from "../config";

// Documents-in-MongoDB: the frontend types are the schema, so each entity kind is a schemaless collection keyed by its id.
await mongoose.connect(config.mongoUri, { dbName: config.mongoDb });

export type Doc = Record<string, any>;

const models = new Map<string, Model<Doc>>();
const model = (kind: string) => {
  let m = models.get(kind);
  if (!m) {
    const schema = new Schema({ _id: String, _at: Number }, { strict: false, versionKey: false, minimize: false, id: false });
    models.set(kind, (m = mongoose.model<Doc>(kind, schema, kind)));
  }
  return m;
};

let seq = Date.now() * 1000;
const nextSeq = () => ++seq; // insertion order, so list() can return newest first

const strip = ({ _id, _at, ...rest }: Doc): Doc => rest;

export const list = async (kind: string): Promise<Doc[]> => (await model(kind).find().sort({ _at: -1 }).lean<Doc[]>()).map(strip);

export const get = async (kind: string, id: string): Promise<Doc | null> => {
  const r = await model(kind).findById(id).lean<Doc>();
  return r ? strip(r) : null;
};

export const put = async (kind: string, id: string, v: Doc) => {
  const m = model(kind);
  const prev = await m.findById(id).select("_at").lean<Doc>();
  await m.replaceOne({ _id: id }, { ...v, _at: prev?._at ?? nextSeq() }, { upsert: true });
};

export const del = async (kind: string, id: string) => void (await model(kind).deleteOne({ _id: id }));

/** First run: load seed.json (exported from the frontend demo data) into an empty database. Reversed so list() keeps the seed's order. */
export async function seedIfEmpty() {
  const meta = model("meta");
  if (await meta.exists({ _id: "seeded" })) return;
  const file = Bun.file(new URL("../../seed.json", import.meta.url));
  if (!(await file.exists())) return console.warn("seed.json missing — starting with an empty database");
  const seed = (await file.json()) as Record<string, Doc[]>;
  for (const [kind, docs] of Object.entries(seed)) {
    await model(kind).insertMany([...docs].reverse().map((d, i) => ({ ...d, _id: d.id ?? d.case?.id ?? `${kind}-${i}`, _at: nextSeq() })));
  }
  await meta.create({ _id: "seeded", at: new Date().toISOString() });
  console.log(`Seeded database: ${Object.entries(seed).map(([k, v]) => `${k}=${v.length}`).join(" ")}`);
}
