import type { FastifyInstance } from "fastify";
import type { MultipartFile } from "@fastify/multipart";
import sharp from "sharp";

const REMOVE_BG_API_KEY = process.env.REMOVE_BG_API_KEY ?? "";

/**
 * Calls the remove.bg REST API (https://www.remove.bg/api).
 * Used when REMOVE_BG_API_KEY is configured.
 */
async function removeBgViaApi(imageBuffer: Buffer): Promise<Buffer> {
  const formData = new FormData();
  formData.append(
    "image_file",
    new Blob([imageBuffer], { type: "image/png" }),
    "image.png"
  );
  formData.append("size", "auto");

  const res = await fetch("https://api.remove.bg/v1.0/removebg", {
    method: "POST",
    headers: { "X-Api-Key": REMOVE_BG_API_KEY },
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`remove.bg API error ${res.status}: ${text}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

/**
 * Built-in luminance-based background removal using sharp.
 * Pixels brighter than `threshold` in all RGB channels → transparent.
 */
async function removeBgViaSHarp(imageBuffer: Buffer, threshold: number): Promise<Buffer> {
  const { data, info } = await sharp(imageBuffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  if (channels !== 4) throw new Error("Unexpected channel count");

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    if (r >= threshold && g >= threshold && b >= threshold) {
      data[i + 3] = 0;
    }
  }

  return sharp(data, { raw: { width, height, channels: 4 } })
    .png({ compressionLevel: 7 })
    .toBuffer();
}

/**
 * POST /api/remove-bg
 *
 * Accepts a multipart image upload (PNG / JPEG / WebP).
 * Uses sharp to:
 *   1. Convert to PNG (sharp always uses premultiplied alpha internally)
 *   2. Extract RGB channels + compute a luminance-based alpha mask to
 *      approximate background removal for plain/light backgrounds.
 *
 * ⚠️  This is a pure-JS approximation — for production quality, swap the
 *     sharp implementation with a call to the remove.bg REST API or run a
 *     local model like REMBG (Python sidecar).
 *
 * Returns: PNG image with transparency (Content-Type: image/png)
 */
export async function removeBgRoute(app: FastifyInstance) {
  app.post<{ Querystring: { threshold?: string } }>(
    "/remove-bg",
    {
      schema: {
        querystring: {
          type: "object",
          properties: {
            threshold: { type: "string", default: "240" },
          },
        },
        response: {
          400: {
            type: "object",
            properties: {
              statusCode: { type: "number" },
              error: { type: "string" },
              message: { type: "string" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      let file: MultipartFile | undefined;
      try {
        file = await request.file();
      } catch {
        return reply.status(400).send({
          statusCode: 400,
          error: "Bad Request",
          message: "No file uploaded.",
        });
      }

      if (!file) {
        return reply.status(400).send({
          statusCode: 400,
          error: "Bad Request",
          message: "No file uploaded. Send a multipart/form-data request with field 'file'.",
        });
      }

      const allowedMimes = ["image/png", "image/jpeg", "image/webp"];
      if (!allowedMimes.includes(file.mimetype)) {
        return reply.status(415).send({
          statusCode: 415,
          error: "Unsupported Media Type",
          message: `Only PNG, JPEG, and WebP images are supported. Got: ${file.mimetype}`,
        });
      }

      const threshold = Math.min(255, Math.max(0, parseInt(request.query.threshold ?? "240", 10)));

      try {
        const buffer = await file.toBuffer();

        let result: Buffer;
        if (REMOVE_BG_API_KEY) {
          // Production: use remove.bg API for AI-quality results
          request.log.info("Using remove.bg API key for background removal");
          result = await removeBgViaApi(buffer);
        } else {
          // Fallback: built-in luminance-based removal with sharp
          request.log.info({ threshold }, "Using built-in sharp fallback for background removal");
          result = await removeBgViaSHarp(buffer, threshold);
        }

        reply
          .header("Content-Type", "image/png")
          .header("Content-Disposition", "inline; filename=\"removed-bg.png\"")
          .header("X-Method", REMOVE_BG_API_KEY ? "remove.bg-api" : "sharp-luminance")
          .send(result);
      } catch (err) {
        request.log.error(err, "remove-bg processing error");
        return reply.status(500).send({
          statusCode: 500,
          error: "Internal Server Error",
          message: "Failed to process image.",
        });
      }
    }
  );
}
