import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import ffmpegPath from "ffmpeg-static";

const args = new Map<string, string>();
for (let index = 2; index < process.argv.length; index += 2) {
  const key = process.argv[index];
  const value = process.argv[index + 1];
  if (key && value) args.set(key, value);
}

const screen = args.get("--screen") ?? "artifacts/screen-recording.mp4";
const voice = args.get("--voice") ?? "artifacts/demo-narration.wav";
const captions = args.get("--captions") ?? "submission/demo-captions.srt";
const output = args.get("--output") ?? "artifacts/runbookpilot-demo.mp4";
if (!ffmpegPath) throw new Error("ffmpeg-static did not provide an executable.");
await mkdir(output.replace(/[\\/][^\\/]+$/, ""), { recursive: true });

const ffmpegArgs = [
  "-y",
  "-i",
  screen,
  "-i",
  voice,
  "-vf",
  `subtitles=${captions.replace(/\\/g, "/").replace(":", "\\:")}`,
  "-map",
  "0:v:0",
  "-map",
  "1:a:0",
  "-c:v",
  "libx264",
  "-preset",
  "medium",
  "-crf",
  "20",
  "-c:a",
  "aac",
  "-b:a",
  "192k",
  "-shortest",
  "-movflags",
  "+faststart",
  output
];

await new Promise<void>((resolve, reject) => {
  const child = spawn(ffmpegPath, ffmpegArgs, { stdio: "inherit" });
  child.on("error", reject);
  child.on("exit", (code) =>
    code === 0 ? resolve() : reject(new Error(`ffmpeg exited with code ${code ?? "unknown"}`))
  );
});
console.log(`Muxed demo video: ${output}`);
