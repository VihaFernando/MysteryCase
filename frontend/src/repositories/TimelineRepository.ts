import { timelineApi } from "@/api/endpoints";
import { createSliceRepository } from "./sliceRepository";

export const timelineRepository = createSliceRepository("timeline", timelineApi);
