import { cluesApi } from "@/api/endpoints";
import { createSliceRepository } from "./sliceRepository";

export const clueRepository = createSliceRepository("clues", cluesApi);
