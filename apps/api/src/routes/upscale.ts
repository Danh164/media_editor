import type { FastifyInstance } from "fastify";
import type { MultipartFile } from "@fastify/multipart";
import sharp from "sharp";

/**
 * POST /api/upscale
 *
 * Accepts a multipart image upload (PNG / JPEG / WebP).
 * Query params:
 *   - scale: 2 | 3 | 4  (default: 2)
 *   - format: "png" | "jpeg" | "webp"  (default: same as input)
 *
 * Uses sharp's Lanczos algorithm for high-quality upscaling.
 * For true AI super-resolution, integrate ESRGAN or Real-ESRGAN as a sidecar.
 *
 * Returns: upscaled image at the requested format.
 */
export async function upscaleRoute(app: FastifyInstance) {
  app.post<{ Querystring: { scale?: string; format?: string } }>(
    "/upscale",
    {
      schema: {
        querystring: {
          type: "object",
          properties: {
            scale: { type: "string", enum: ["2", "3", "4"], default: "2" },
            format: { type: "string", enum: ["png", "jpeg", "webp"], default: "png" },
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
          message: `Only PNG, JPEG, and WebP are supported. Got: ${file.mimetype}`,
        });
      }

      const scale = Math.min(4, Math.max(2, parseInt(request.query.scale ?? "2", 10)));
      const outFormat = (request.query.format ?? "png") as "png" | "jpeg" | "webp";

      try {
        const buffer = await file.toBuffer();

        // Get original dimensions
        const meta = await sharp(buffer).metadata();
        const origW = meta.width ?? 512;
        const origH = meta.height ?? 512;

        const newW = origW * scale;
        const newH = origH * scale;

        // Upscale with Lanczos (kernel: "lanczos3")
        let pipeline = sharp(buffer)
          .resize(newW, newH, {
            kernel: sharp.kernel.lanczos3,
            fit: "fill",
          });

        // Apply light unsharp mask to enhance detail
        pipeline = pipeline.sharpen({
          sigma: 0.8,
          m1: 1.5,
          m2: 0.7,
          x1: 2.0,
          y2: 10.0,
          y3: 20.0,
        });

        let resultBuffer: Buffer;
        let contentType: string;

        if (outFormat === "jpeg") {
          resultBuffer = await pipeline.jpeg({ quality: 90, mozjpeg: true }).toBuffer();
          contentType = "image/jpeg";
        } else if (outFormat === "webp") {
          resultBuffer = await pipeline.webp({ quality: 90, effort: 4 }).toBuffer();
          contentType = "image/webp";
        } else {
          resultBuffer = await pipeline.png({ compressionLevel: 7 }).toBuffer();
          contentType = "image/png";
        }

        reply
          .header("Content-Type", contentType)
          .header("X-Original-Width", origW.toString())
          .header("X-Original-Height", origH.toString())
          .header("X-Upscaled-Width", newW.toString())
          .header("X-Upscaled-Height", newH.toString())
          .header("Content-Disposition", `inline; filename="upscaled-${scale}x.${outFormat}"`)
          .send(resultBuffer);
      } catch (err) {
        request.log.error(err, "upscale processing error");
        return reply.status(500).send({
          statusCode: 500,
          error: "Internal Server Error",
          message: "Failed to process image.",
        });
      }
    }
  );
}
