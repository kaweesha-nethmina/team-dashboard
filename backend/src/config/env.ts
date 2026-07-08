import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

export const env = {
  port: parseInt(process.env.PORT || "4000", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  jwtSecret: process.env.JWT_SECRET || "fallback-secret",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",
  geminiApiKey: process.env.GEMINI_API_KEY || "",
  databaseUrl: process.env.DATABASE_URL || "",
  supabaseUrl: process.env.SUPABASE_URL || "",
  supabaseSecretKey: process.env.SUPABASE_SECRET_KEY || "",
};
