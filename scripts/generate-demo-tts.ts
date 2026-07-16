import { mkdir, readFile, writeFile } from "node:fs/promises";
import OpenAI from "openai";
import { config as loadEnv } from "dotenv";

loadEnv({ override: true, quiet: true });

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY is required to generate demo narration.");
}

const inputPath = process.argv[2] ?? "submission/demo-narration.txt";
const outputPath = process.argv[3] ?? "artifacts/demo-narration.wav";
const input = (await readFile(inputPath, "utf8")).trim();
if (!input) throw new Error(`Narration is empty: ${inputPath}`);

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const audio = await client.audio.speech.create({
  model: "gpt-4o-mini-tts",
  voice: "marin",
  input,
  response_format: "wav",
  instructions:
    "Confident, calm SRE incident commander. Crisp technical English, natural pacing, restrained urgency. Pause briefly between sections. Do not sound promotional."
});

await mkdir(outputPath.replace(/[\\/][^\\/]+$/, ""), { recursive: true });
await writeFile(outputPath, Buffer.from(await audio.arrayBuffer()));
console.log(`Generated AI narration with OpenAI gpt-4o-mini-tts (marin): ${outputPath}`);
