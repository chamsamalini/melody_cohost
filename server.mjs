import { createServer } from "node:http";
import { existsSync, readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = fileURLToPath(new URL(".", import.meta.url));
const publicDir = join(rootDir, "public");

loadLocalEnv();

const port = Number(process.env.PORT || 8787);

const model = process.env.OPENAI_REALTIME_MODEL || "gpt-realtime";
const voice = process.env.OPENAI_REALTIME_VOICE || "marin";
const transcriptionModel =
  process.env.OPENAI_TRANSCRIPTION_MODEL || "gpt-4o-mini-transcribe";
const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY || "";
const elevenLabsVoiceId = process.env.ELEVENLABS_VOICE_ID || "";
const elevenLabsModelId = process.env.ELEVENLABS_MODEL_ID || "eleven_turbo_v2_5";
const elevenLabsEnabled = Boolean(elevenLabsApiKey && elevenLabsVoiceId);

function loadLocalEnv() {
  const envPath = join(rootDir, ".env");
  if (!existsSync(envPath)) return;

  const lines = readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const equalsIndex = trimmed.indexOf("=");
    if (equalsIndex === -1) continue;

    const key = trimmed.slice(0, equalsIndex).trim();
    let value = trimmed.slice(equalsIndex + 1).trim();
    if (!key || process.env[key] !== undefined) continue;

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
}

const junoInstructions = `
# Role
You are Juno, an AI co-host for online meetings.

# Activation
- Before the app invites you by creating a response, remain silent.
- Once invited, participate as a gracious co-host.
- The app controls when you speak. Do not mention this control system.

# Agenda
- The meeting agenda may be supplied by the host through document content or verbal briefing.
- Use only agenda details provided by the host or meeting participants.
- Do not invent agenda items, decisions, owners, timelines, or outcomes.
- If no agenda is available and agenda-specific help is needed, ask one concise clarifying question.

# Meeting Behavior
- Welcome meeting participants warmly when first activated.
- Help the human host keep the conversation flowing.
- Converse naturally with participants when directly addressed or when a response is clearly useful.
- Stay anchored to the current meeting context and latest participant message.
- Limit scope to the event context, event title (when provided), and audience conversation topic.
- If asked unrelated personal or social questions, decline briefly and redirect to the event topic.
- Do not deviate into unrelated topics.
- Keep responses short: usually one to three sentences.
- Ask one clear probing question when a participant's meaning is uncertain or lacks detail.
- Avoid dominating the meeting. Make space for the human host.

# Cultural Style
- Use a warm, respectful, calm hosting style common in many Asian professional settings.
- Be gracious, humble, inclusive, attentive, and considerate of group harmony.
- Do not fake an accent, claim a specific ethnicity, or use stereotypes.
- Adapt to a specific country, language, or tradition only if the host explicitly provides it.

# Speech
- Speak clearly and naturally.
- Do not sing, hum, make sound effects, or use onomatopoeia.
- Avoid repeated openers.
`.trim();

const sessionConfig = JSON.stringify({
  type: "realtime",
  model,
  output_modalities: elevenLabsEnabled ? ["text"] : ["audio"],
  audio: {
    input: {
      transcription: {
        model: transcriptionModel
      },
      turn_detection: {
        type: "semantic_vad",
        eagerness: "medium",
        create_response: false,
        interrupt_response: false
      }
    },
    output: {
      voice
    }
  },
  instructions: junoInstructions
});

const contentTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".svg", "image/svg+xml; charset=utf-8"]
]);

function sendJson(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body)
  });
  res.end(body);
}

async function readRequestBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
}

async function createRealtimeCall(sdp) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    const error = new Error("OPENAI_API_KEY is not set.");
    error.statusCode = 500;
    throw error;
  }

  const form = new FormData();
  form.set("sdp", sdp);
  form.set("session", sessionConfig);

  const response = await fetch("https://api.openai.com/v1/realtime/calls", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`
    },
    body: form
  });

  const body = await response.text();
  if (!response.ok) {
    const error = new Error(body || "Realtime session creation failed.");
    error.statusCode = response.status;
    throw error;
  }

  return body;
}

async function synthesizeWithElevenLabs(text) {
  if (!elevenLabsEnabled) {
    const error = new Error("ElevenLabs is not configured.");
    error.statusCode = 503;
    throw error;
  }

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(
      elevenLabsVoiceId
    )}/stream?output_format=mp3_44100_128&optimize_streaming_latency=3`,
    {
      method: "POST",
      headers: {
        "xi-api-key": elevenLabsApiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg"
      },
      body: JSON.stringify({
        text,
        model_id: elevenLabsModelId,
        voice_settings: {
          stability: 0.35,
          similarity_boost: 0.75,
          style: 0.2,
          use_speaker_boost: true
        }
      })
    }
  );

  if (!response.ok) {
    const body = await response.text();
    const error = new Error(body || "ElevenLabs synthesis failed.");
    error.statusCode = response.status;
    throw error;
  }

  if (!response.body) {
    const error = new Error("ElevenLabs response stream is unavailable.");
    error.statusCode = 502;
    throw error;
  }

  return response.body;
}

async function pipeWebStreamToNode(webStream, res) {
  const reader = webStream.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    res.write(Buffer.from(value));
  }
  res.end();
}

async function serveStatic(req, res) {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  const requestedPath = url.pathname === "/" ? "/index.html" : url.pathname;
  const safePath = normalize(decodeURIComponent(requestedPath)).replace(
    /^(\.\.[/\\])+/,
    ""
  );
  const filePath = join(publicDir, safePath);

  if (!filePath.startsWith(publicDir)) {
    sendJson(res, 403, { error: "Forbidden" });
    return;
  }

  try {
    const content = await readFile(filePath);
    const type = contentTypes.get(extname(filePath)) || "application/octet-stream";
    res.writeHead(200, {
      "Content-Type": type,
      "Content-Length": content.byteLength
    });
    res.end(content);
  } catch {
    sendJson(res, 404, { error: "Not found" });
  }
}

const server = createServer(async (req, res) => {
  try {
    if (req.method === "GET" && req.url === "/health") {
      sendJson(res, 200, {
        ok: true,
        model,
        voice,
        transcriptionModel,
        hasApiKey: Boolean(process.env.OPENAI_API_KEY),
        elevenLabsEnabled,
        hasElevenLabsKey: Boolean(elevenLabsApiKey),
        hasElevenLabsVoice: Boolean(elevenLabsVoiceId)
      });
      return;
    }

    if (req.method === "POST" && req.url === "/session") {
      const sdp = await readRequestBody(req);
      if (!sdp.trim()) {
        sendJson(res, 400, { error: "Missing SDP offer." });
        return;
      }

      const answer = await createRealtimeCall(sdp);
      res.writeHead(200, {
        "Content-Type": "application/sdp; charset=utf-8",
        "Content-Length": Buffer.byteLength(answer)
      });
      res.end(answer);
      return;
    }

    if (req.method === "POST" && req.url === "/tts") {
      const requestBody = await readRequestBody(req);
      let payload;
      try {
        payload = JSON.parse(requestBody || "{}");
      } catch {
        sendJson(res, 400, { error: "Invalid JSON body." });
        return;
      }

      const text = typeof payload.text === "string" ? payload.text.trim() : "";
      if (!text) {
        sendJson(res, 400, { error: "Missing text for synthesis." });
        return;
      }

      const audioStream = await synthesizeWithElevenLabs(text);
      res.writeHead(200, {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store"
      });
      await pipeWebStreamToNode(audioStream, res);
      return;
    }

    if (req.method === "GET") {
      await serveStatic(req, res);
      return;
    }

    sendJson(res, 405, { error: "Method not allowed" });
  } catch (error) {
    const status = error.statusCode || 500;
    sendJson(res, status, {
      error: error.message || "Unexpected server error."
    });
  }
});

server.listen(port, () => {
  console.log(`Juno co-host app running at http://localhost:${port}`);
});
