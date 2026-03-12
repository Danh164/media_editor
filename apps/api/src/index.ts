import Fastify from "fastify";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import rateLimit from "@fastify/rate-limit";
import { removeBgRoute } from "./routes/remove-bg.js";
import { upscaleRoute } from "./routes/upscale.js";
import { healthRoute } from "./routes/health.js";

const HOST = process.env.HOST ?? "0.0.0.0";
const PORT = parseInt(process.env.PORT ?? "4000", 10);

async function bootstrap() {
  const app = Fastify({
    logger: {
      transport: {
        target: "pino-pretty",
        options: { colorize: true, translateTime: "SYS:HH:MM:ss" },
      },
    },
    bodyLimit: 50 * 1024 * 1024, // 50 MB max upload
  });

  // ── Plugins ────────────────────────────────────────────────────────────────
  await app.register(cors, {
    origin: [
      "http://localhost:3000",
      process.env.WEB_ORIGIN ?? "http://localhost:3000",
    ],
    methods: ["GET", "POST", "OPTIONS"],
  });

  await app.register(multipart, {
    limits: {
      fileSize: 50 * 1024 * 1024, // 50 MB
    },
  });

  await app.register(rateLimit, {
    max: 60,
    timeWindow: "1 minute",
    errorResponseBuilder: () => ({
      statusCode: 429,
      error: "Too Many Requests",
      message: "You have reached the request limit. Please wait a moment.",
    }),
  });

  // ── Routes ──────────────────────────────────────────────────────────────────
  await app.register(healthRoute);
  await app.register(removeBgRoute, { prefix: "/api" });
  await app.register(upscaleRoute, { prefix: "/api" });

  // ── Global error handler ───────────────────────────────────────────────────
  app.setErrorHandler((error, _request, reply) => {
    app.log.error(error);
    const status = error.statusCode ?? 500;
    reply.status(status).send({
      statusCode: status,
      error: error.name,
      message: error.message,
    });
  });

  try {
    await app.listen({ host: HOST, port: PORT });
    app.log.info(`🚀 API running at http://${HOST}:${PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

bootstrap();
