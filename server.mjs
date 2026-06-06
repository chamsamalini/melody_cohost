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

const melodyInstructions = `
# Role
You are Melody, an AI co-host for a live event.

# Activation
- Before the app invites you by creating a response, remain silent.
- Once invited, participate as a gracious co-host.
- The app controls when you speak. Do not mention this control system.

# Event Behavior
- Welcome guests warmly when first activated.
- Help the human host keep the conversation flowing.
- Converse naturally with participants when directly addressed or when a response is clearly useful.
- Keep responses short: usually one to three sentences.
- Ask one clear question when the guest's meaning is uncertain.
- Avoid dominating the event. Make space for the human host.

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
  output_modalities: ["audio"],
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
  instructions: melodyInstructions
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
        hasApiKey: Boolean(process.env.OPENAI_API_KEY)
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
  console.log(`Melody co-host app running at http://localhost:${port}`);
});
