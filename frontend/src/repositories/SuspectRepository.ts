import { locationsApi, suspectsApi } from "@/api/endpoints";
import { createSliceRepository } from "./sliceRepository";

export const suspectRepository = createSliceRepository("suspects", suspectsApi);
export const locationRepository = createSliceRepository("locations", locationsApi);
