import type { FastifyInstance } from "fastify";
import type { MultipartFile } from "@fastify/multipart";
import { OpenAI } from "openai";
import { Readable } from "stream";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY ?? "";

/**
 * POST /api/transcribe
 * 
 * Accepts a multipart audio file upload.
 * Transcribes the audio using OpenAI Whisper.
 * If no API key is set, returns a mock transcription for demo purposes.
 */
export async function transcribeRoute(app: FastifyInstance) {
  app.post(
    "/transcribe",
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
          message: "No file uploaded.",
        });
      }

      try {
        const buffer = await file.toBuffer();
        
        if (!OPENAI_API_KEY) {
           request.log.warn("OPENAI_API_KEY not set. Returning mock subtitles.");
           // Mock subtitles for demo: 5-second intervals
           const mockSubs = [
             { start: 1, end: 4, text: "Welcome to our AI-powered media editor!" },
             { start: 5, end: 9, text: "In this tutorial, we will explore advanced features." },
             { start: 10, end: 14, text: "Generating subtitles is now easier than ever." },
             { start: 15, end: 20, text: "Let's get started with your creative project." }
           ];
           return reply.send({ subtitles: mockSubs });
        }

        const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
        
        // Convert Buffer to a File object Whisper can handle (using a stream fake)
        const transcription = await openai.audio.transcriptions.create({
          file: await toFile(buffer, "audio.mp3"),
          model: "whisper-1",
          response_format: "verbose_json",
          timestamp_granularities: ["segment"],
        });

        const subtitles = (transcription as any).segments.map((s: any) => ({
          id: crypto.randomUUID(),
          start: s.start,
          end: s.end,
          text: s.text.trim(),
        }));

        return reply.send({ subtitles });
      } catch (err) {
        request.log.error(err, "Transcription error");
        return reply.status(500).send({
          statusCode: 500,
          error: "Internal Server Error",
          message: "Failed to transcribe audio.",
        });
      }
    }
  );
}

/**
 * Utility to convert Buffer to a File-like object for OpenAI SDK
 */
async function toFile(buffer: Buffer, name: string) {
  const blob = new Blob([buffer]);
  return new File([blob], name, { type: "audio/mpeg" });
}

// Since File and Blob might not be globally available in all Node environments (even though recent Node has them),
// we use a safe check or a polyfill if needed. Fastify/undici usually provides them in Node 18+.
