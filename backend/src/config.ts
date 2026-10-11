export const config = {
  port: Number(process.env.PORT ?? 3001),
  corsOrigin: process.env.CORS_ORIGIN ?? "*",
  apiToken: process.env.API_TOKEN, // ponytail: single shared token; swap for real user auth/roles when needed
  mongoUri: process.env.MONGODB_URI ?? "mongodb://localhost:27017",
  mongoDb: process.env.MONGODB_DB ?? "mysterycase",
};
