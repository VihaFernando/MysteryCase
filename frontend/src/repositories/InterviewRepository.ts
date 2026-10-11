import { interviewsApi } from "@/api/endpoints";
import { createSliceRepository } from "./sliceRepository";

export const interviewRepository = createSliceRepository("interviews", interviewsApi);
