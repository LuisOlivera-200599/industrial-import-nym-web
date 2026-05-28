const fs = require("node:fs/promises");
const path = require("node:path");
const { spawn } = require("node:child_process");
const ffmpeg = require("ffmpeg-static");

const input = path.join(process.cwd(), "videos", "hero-electronica.mp4");
const output = path.join(process.cwd(), "videos", "hero-electronica-optimized.mp4");

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit" });
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg exited with ${code}`));
    });
  });
}

(async () => {
  try {
    await fs.access(input);
  } catch {
    await fs.access(output);
    console.log("Original video source is not committed; optimized video already exists.");
    return;
  }

  await run(ffmpeg, [
    "-y",
    "-i",
    input,
    "-vf",
    "scale='min(1280,iw)':-2",
    "-an",
    "-c:v",
    "libx264",
    "-preset",
    "slow",
    "-crf",
    "30",
    "-movflags",
    "+faststart",
    output,
  ]);

  console.log(`Optimized video written to ${path.relative(process.cwd(), output)}`);
})();
