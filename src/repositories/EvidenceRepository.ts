import { evidenceApi } from "@/api/endpoints";
import { createSliceRepository } from "./sliceRepository";

export const evidenceRepository = createSliceRepository("evidence", evidenceApi);
