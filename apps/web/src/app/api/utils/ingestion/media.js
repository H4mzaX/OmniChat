let ffmpegStatic, fluentFfmpeg;

async function getFfmpeg() {
  if (!ffmpegStatic) {
    ffmpegStatic = (await import("ffmpeg-static")).default;
  }
  if (!fluentFfmpeg) {
    fluentFfmpeg = (await import("fluent-ffmpeg")).default;
    fluentFfmpeg.setFfmpegPath(ffmpegStatic);
  }
  return fluentFfmpeg;
}

export async function getMediaInfo(buffer, name) {
  const ffmpeg = await getFfmpeg();
  return new Promise((resolve, reject) => {
    ffmpeg({ source: buffer })
      .ffprobe((err, data) => {
        if (err) return reject(err);
        const stream = data.streams?.[0] || {};
        resolve({
          duration: stream.duration ? parseFloat(stream.duration) : null,
          codec: stream.codec_name,
          bitrate: stream.bit_rate ? parseInt(stream.bit_rate) : null,
          sampleRate: stream.sample_rate ? parseInt(stream.sample_rate) : null,
          channels: stream.channels,
          width: stream.width,
          height: stream.height,
          fps: stream.r_frame_rate,
          format: data.format?.format_name,
          size: data.format?.size ? parseInt(data.format.size) : null,
        });
      });
  });
}

export async function extractAudioText(buffer) {
  return {
    text: "[Audio transcription requires Whisper or external API. Provide audio file for processing.]",
    format: "audio",
    duration: null,
    segments: [],
  };
}

export async function extractVideoFrames(buffer, count = 8) {
  const ffmpeg = await getFfmpeg();
  const frames = [];

  return new Promise((resolve, reject) => {
    const tmpDir = "/tmp/omniclaude-frames-" + Date.now();
    require("fs").mkdirSync(tmpDir, { recursive: true });

    ffmpeg({ source: buffer })
      .on("end", () => {
        const fs = require("fs");
        const files = fs.readdirSync(tmpDir).sort();
        for (const f of files.slice(0, count)) {
          const buf = fs.readFileSync(`${tmpDir}/${f}`);
          frames.push(buf.toString("base64"));
          fs.unlinkSync(`${tmpDir}/${f}`);
        }
        fs.rmdirSync(tmpDir);
        resolve(frames);
      })
      .on("error", reject)
      .screenshots({
        count,
        folder: tmpDir,
        filename: "frame-%i.png",
        size: "800x?",
      });
  });
}

export async function transcribeAudio(buffer) {
  return {
    text: "[Audio transcription pending - requires Whisper model or API key]",
    segments: [],
    language: null,
    duration: null,
    note: "Configure Whisper (local) or OpenAI/Deepgram API for transcription",
  };
}

export async function analyzeVideo(buffer) {
  const info = await getMediaInfo(buffer, "video.mp4");
  const frames = await extractVideoFrames(buffer, 6);

  return {
    info,
    frames,
    frameCount: frames.length,
    sceneChanges: null,
    transcript: null,
  };
}
