const state = {
  mode: "observing",
  connected: false,
  connecting: false,
  waitingForResponse: false,
  autoConverse: true,
  triggerName: "Juno",
  pc: null,
  dc: null,
  micStream: null,
  systemStream: null,
  uplinkStream: null,
  mixContext: null,
  audioContext: null,
  analyser: null,
  meterAnimation: null,
  agendaText: "",
  agendaSource: "none",
  agendaUploadText: "",
  agendaUploadName: "",
  agendaNotesText: "",
  observationContextText: "",
  capturingAgenda: false,
  assistantTranscript: "",
  responseDelayMs: 3000,
  pendingResponseTimer: null,
  pendingResponseReason: "",
  pendingAudienceText: "",
  lastGuestTurn: "",
  queuedResponseReason: "",
  queuedAudienceText: "",
  useElevenLabs: false,
  ttsPlaying: false,
  ttsAbortController: null,
  ttsAudioUrl: "",
  theme: "violet"
};

const els = {
  connectionStatus: document.querySelector("#connectionStatus"),
  modeStatus: document.querySelector("#modeStatus"),
  transcriptLog: document.querySelector("#transcriptLog"),
  eventLog: document.querySelector("#eventLog"),
  meter: document.querySelector("#meter"),
  remoteAudio: document.querySelector("#remoteAudio"),
  responseSummary: document.querySelector("#responseSummary"),
  connectButton: document.querySelector("#connectButton"),
  disconnectButton: document.querySelector("#disconnectButton"),
  activateButton: document.querySelector("#activateButton"),
  pauseButton: document.querySelector("#pauseButton"),
  newSessionButton: document.querySelector("#newSessionButton"),
  clearLogButton: document.querySelector("#clearLogButton"),
  autoConverseToggle: document.querySelector("#autoConverseToggle"),
  autoConverseStatus: document.querySelector("#autoConverseStatus"),
  triggerInput: document.querySelector("#triggerInput"),
  themeSelect: document.querySelector("#themeSelect"),
  agendaFileInput: document.querySelector("#agendaFileInput"),
  agendaUploadStatus: document.querySelector("#agendaUploadStatus"),
  agendaStatus: document.querySelector("#agendaStatus"),
  agendaInput: document.querySelector("#agendaInput"),
  saveAgendaButton: document.querySelector("#saveAgendaButton"),
  clearAgendaButton: document.querySelector("#clearAgendaButton"),
  captureAgendaButton: document.querySelector("#captureAgendaButton")
};

const maxAgendaCharacters = 4000;
const themeStorageKey = "junoTheme";
const availableThemes = new Set(["violet", "fdm", "midnight", "sunset", "emerald"]);

const meterBars = Array.from({ length: 32 }, () => {
  const bar = document.createElement("span");
  bar.className = "meter-bar";
  els.meter.append(bar);
  return bar;
});

function setConnectionStatus(label) {
  els.connectionStatus.textContent = label;
}

function setMode(mode) {
  state.mode = mode;
  const label = mode.charAt(0).toUpperCase() + mode.slice(1);
  els.modeStatus.textContent = label;
  els.modeStatus.className = `status-pill mode-${mode}`;
  els.pauseButton.disabled = !state.connected || mode !== "active";
  els.activateButton.disabled = !state.connected || mode === "active";
}

function setControls() {
  els.connectButton.disabled = state.connected || state.connecting;
  els.disconnectButton.disabled = !state.connected && !state.connecting;
  els.activateButton.disabled =
    !state.connected || state.connecting || state.mode === "active";
  els.pauseButton.disabled = !state.connected || state.mode !== "active";
  els.captureAgendaButton.disabled = !state.connected && !state.capturingAgenda;
}

function updateAutoConverseStatus() {
  if (state.autoConverse) {
    els.autoConverseStatus.textContent =
      "Auto converse is enabled. Juno may respond after each participant turn while active.";
    els.autoConverseStatus.classList.remove("is-off");
    return;
  }

  els.autoConverseStatus.textContent =
    "Auto converse is disabled. Juno responds only when directly addressed, invited, or asked an explicit question.";
  els.autoConverseStatus.classList.add("is-off");
}

function appendTurn(speaker, text) {
  if (!text || !text.trim()) return;
  const turn = document.createElement("article");
  turn.className = "turn";
  const label = document.createElement("span");
  label.className = "speaker";
  label.textContent = speaker;
  const body = document.createElement("p");
  body.textContent = text.trim();
  turn.append(label, body);
  els.transcriptLog.append(turn);
  els.transcriptLog.scrollTop = els.transcriptLog.scrollHeight;

  while (els.transcriptLog.children.length > 80) {
    els.transcriptLog.firstElementChild.remove();
  }
}

function appendEvent(text) {
  const line = document.createElement("div");
  line.className = "event-line";
  const time = document.createElement("span");
  time.className = "event-time";
  time.textContent = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
  const body = document.createElement("span");
  body.textContent = text;
  line.append(time, body);
  els.eventLog.append(line);
  els.eventLog.scrollTop = els.eventLog.scrollHeight;

  while (els.eventLog.children.length > 40) {
    els.eventLog.firstElementChild.remove();
  }
}

function setResponseSummary(text) {
  const summaryText = (text || "").trim();
  els.responseSummary.textContent = summaryText || "No response summary yet.";
}

function applyTheme(themeName, { persist = false, announce = false } = {}) {
  const candidate = (themeName || "").trim().toLowerCase();
  const nextTheme = availableThemes.has(candidate) ? candidate : "violet";
  state.theme = nextTheme;
  document.body.dataset.theme = nextTheme;

  if (els.themeSelect && els.themeSelect.value !== nextTheme) {
    els.themeSelect.value = nextTheme;
  }

  if (persist) {
    try {
      localStorage.setItem(themeStorageKey, nextTheme);
    } catch {
      // Ignore storage failures and continue with in-memory theme.
    }
  }

  if (announce) {
    appendEvent(`Theme changed to ${nextTheme}.`);
  }
}

function initTheme() {
  let storedTheme = "violet";
  try {
    storedTheme = localStorage.getItem(themeStorageKey) || "violet";
  } catch {
    storedTheme = "violet";
  }
  applyTheme(storedTheme);
}

function normalizeAgendaText(text) {
  return (text || "").replace(/\s+/g, " ").trim();
}

function normalizeAgendaBlock(label, text) {
  const normalized = normalizeAgendaText(text);
  if (!normalized) return "";
  return `${label}:\n${normalized}`;
}

function agendaSummary(text) {
  const normalized = normalizeAgendaText(text);
  if (!normalized) return "";
  return normalized.length > maxAgendaCharacters
    ? `${normalized.slice(0, maxAgendaCharacters)}...`
    : normalized;
}

function agendaSourceLabel() {
  switch (state.agendaSource) {
    case "uploaded":
      return "Uploaded agenda saved";
    case "written":
      return "Written context saved";
    case "observation":
      return "Observation-derived context";
    case "verbal":
      return state.capturingAgenda
        ? "Capturing verbal agenda"
        : "Verbal agenda saved";
    case "updated":
      return "Agenda updated";
    default:
      return "No agenda provided";
  }
}

function updateAgendaUploadStatus() {
  els.agendaUploadStatus.textContent = state.agendaUploadName
    ? `Uploaded file: ${state.agendaUploadName}`
    : "No agenda uploaded";
}

function rebuildAgendaContext({ announce = false } = {}) {
  const uploadedAgenda = normalizeAgendaText(state.agendaUploadText);
  const writtenDetails = normalizeAgendaText(state.agendaNotesText);
  const observedContext = normalizeAgendaText(state.observationContextText);

  const segments = [];
  if (uploadedAgenda) {
    segments.push(normalizeAgendaBlock("Uploaded agenda", uploadedAgenda));
  }
  if (writtenDetails) {
    segments.push(normalizeAgendaBlock("Written context details", writtenDetails));
  }
  if (!uploadedAgenda && observedContext) {
    segments.push(normalizeAgendaBlock("Observation context", observedContext));
  }

  const nextText = agendaSummary(segments.filter(Boolean).join("\n\n"));
  const previousText = state.agendaText;
  state.agendaText = nextText;

  if (!nextText) {
    state.agendaSource = "none";
  } else if (uploadedAgenda) {
    state.agendaSource = "uploaded";
  } else if (observedContext) {
    state.agendaSource = writtenDetails ? "updated" : "observation";
  } else {
    state.agendaSource = "written";
  }

  updateAgendaStatus();

  if (announce && nextText && nextText !== previousText) {
    appendEvent(`${agendaSourceLabel()}.`);
  }

  return Boolean(nextText);
}

function updateAgendaStatus() {
  const hasAgenda = Boolean(state.agendaText);
  els.agendaStatus.textContent = hasAgenda
    ? `${agendaSourceLabel()} (${state.agendaText.length} characters)`
    : agendaSourceLabel();
  els.clearAgendaButton.disabled = !hasAgenda && !state.capturingAgenda;
  els.captureAgendaButton.textContent = state.capturingAgenda
    ? "Stop Verbal Capture"
    : "Capture Verbal Agenda";
}

function setAgenda(text, source) {
  const summary = agendaSummary(text);
  if (!summary) {
    appendEvent("Agenda content is empty.");
    return false;
  }

  if (source === "uploaded") {
    state.agendaUploadText = summary;
    updateAgendaUploadStatus();
    return rebuildAgendaContext({ announce: true });
  }

  if (source === "written") {
    state.agendaNotesText = summary;
    els.agendaInput.value = summary;
    return rebuildAgendaContext({ announce: true });
  }

  const existingAgenda = Boolean(state.agendaText);
  state.agendaText = summary;
  state.agendaSource = existingAgenda && source !== state.agendaSource ? "updated" : source;
  updateAgendaStatus();
  appendEvent(`${agendaSourceLabel()}.`);
  return true;
}

function saveDocumentAgenda() {
  state.agendaNotesText = els.agendaInput.value;
  if (rebuildAgendaContext({ announce: true })) {
    state.capturingAgenda = false;
    updateAgendaStatus();
  }
}

function clearAgendaUpload() {
  state.agendaUploadText = "";
  state.agendaUploadName = "";
  if (els.agendaFileInput) {
    els.agendaFileInput.value = "";
  }
  updateAgendaUploadStatus();
  rebuildAgendaContext();
}

function handleAgendaFileUpload(file) {
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    const content = typeof reader.result === "string" ? reader.result : "";
    const summary = agendaSummary(content);
    if (!summary) {
      appendEvent("Uploaded agenda file was empty.");
      return;
    }

    state.agendaUploadText = summary;
    state.agendaUploadName = file.name;
    updateAgendaUploadStatus();
    rebuildAgendaContext({ announce: true });
  };
  reader.onerror = () => {
    appendEvent("Unable to read the uploaded agenda file.");
  };
  reader.readAsText(file);
}

function clearAgenda() {
  state.agendaText = "";
  state.agendaSource = "none";
  state.agendaUploadText = "";
  state.agendaUploadName = "";
  state.agendaNotesText = "";
  state.observationContextText = "";
  state.capturingAgenda = false;
  els.agendaInput.value = "";
  if (els.agendaFileInput) {
    els.agendaFileInput.value = "";
  }
  updateAgendaUploadStatus();
  els.agendaInput.value = "";
  updateAgendaStatus();
  appendEvent("Agenda cleared.");
}

function toggleVerbalAgendaCapture() {
  if (!state.connected && !state.capturingAgenda) {
    appendEvent("Connect before capturing a verbal agenda.");
    return;
  }

  state.capturingAgenda = !state.capturingAgenda;
  if (state.capturingAgenda) {
    state.agendaSource = state.agendaText ? "updated" : "verbal";
    appendEvent("Verbal agenda capture started.");
  } else {
    appendEvent(
      state.agendaText
        ? "Verbal agenda capture stopped."
        : "Verbal agenda capture stopped without agenda content."
    );
    if (!state.agendaText) {
      state.agendaSource = "none";
    }
  }
  updateAgendaStatus();
  setControls();
}

function captureVerbalAgenda(text) {
  const spokenAgenda = normalizeAgendaText(text);
  if (!spokenAgenda) return;

  const combinedAgenda = state.agendaNotesText
    ? `${state.agendaNotesText}\n${spokenAgenda}`
    : spokenAgenda;
  state.agendaNotesText = agendaSummary(combinedAgenda);
  state.agendaSource = state.agendaSource === "none" ? "verbal" : "updated";
  els.agendaInput.value = state.agendaNotesText;
  rebuildAgendaContext({ announce: true });
  appendEvent("Verbal agenda content captured.");
}

function agendaInstructions() {
  if (!state.agendaText) {
    return `
Meeting agenda: not provided.
Do not invent agenda items, decisions, owners, timings, or outcomes.
If agenda-specific guidance is needed, ask the host for the agenda in one concise question.
`.trim();
  }

  return `
Meeting agenda source: ${agendaSourceLabel()}.
Use this agenda as meeting context. Do not add agenda items that were not provided.
Agenda:
${state.agendaText}
`.trim();
}

function eventTitleFromAgenda() {
  if (!state.agendaText) return "";
  const match = state.agendaText.match(
    /(?:event\s*title|title|topic|theme)\s*[:\-]\s*([^.;\n]+)/i
  );
  return (match?.[1] || "").trim();
}

function meetingScopeInstructions() {
  const eventTitle = eventTitleFromAgenda();
  if (eventTitle) {
    return `
Scope boundary:
- Stay within the current event context.
- Stay aligned to the event title: ${eventTitle}.
- Do not switch to new participant-introduced topics when they drift from the event title.
- If asked about an off-topic subject, acknowledge briefly and redirect to the event topic with one concise question.
`.trim();
  }

  return `
Scope boundary:
- Stay within the current event context.
- Use only host-provided agenda context to determine topic scope.
- Do not let participant topic changes redefine the event scope.
- If no host topic is available, ask one concise question to confirm the official event topic before elaborating.
`.trim();
}

function triggerPattern() {
  const escaped = state.triggerName
    .trim()
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`\\b${escaped}\\b`, "i");
}

function wasJunoCalled(text) {
  return Boolean(text && state.triggerName.trim() && triggerPattern().test(text));
}

function looksLikeInvitation(text) {
  return /welcome|introduce|join|answer|share|thought|think|question|help|please/i.test(
    text
  );
}

function shouldConverse(text) {
  if (!state.autoConverse) {
    return wasJunoCalled(text) || looksLikeInvitation(text) || /\?\s*$/.test(text);
  }
  return Boolean(text && text.trim());
}

function splitJunoResponse(text) {
  const cleaned = (text || "").trim();
  if (!cleaned) {
    return { responseText: "", summaryText: "" };
  }

  const summaryIndex = cleaned.lastIndexOf("\nSummary:");
  if (summaryIndex === -1) {
    return { responseText: cleaned, summaryText: "" };
  }

  const responseText = cleaned.slice(0, summaryIndex).trim();
  const summaryText = cleaned.slice(summaryIndex + "\nSummary:".length).trim();

  return {
    responseText: responseText || cleaned,
    summaryText
  };
}

function normalizeSummaryLine(text) {
  const cleaned = (text || "")
    .replace(/^summary\s*:\s*/i, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) {
    return "";
  }

  // Keep summary abstract and brief; avoid reciting the full audience turn.
  const withoutQuotedBlocks = cleaned.replace(/"[^"]+"/g, "").replace(/\s+/g, " ").trim();
  const source = withoutQuotedBlocks || cleaned;
  const words = source.split(" ").filter(Boolean);

  if (words.length <= 14) {
    return source;
  }

  return `${words.slice(0, 14).join(" ")}...`;
}

function looksLikeParaphrase(candidateText, guestText) {
  const candidateTokens = (candidateText || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 3);
  const guestTokens = (guestText || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 3);

  if (!candidateTokens.length || !guestTokens.length) {
    return false;
  }

  const guestSet = new Set(guestTokens);
  let overlap = 0;
  candidateTokens.forEach((token) => {
    if (guestSet.has(token)) {
      overlap += 1;
    }
  });

  return overlap / candidateTokens.length >= 0.6;
}

function fallbackCommentaryLine() {
  const options = [
    "Great point. What is the one decision we should lock in now?",
    "Nice momentum. Shall we convert this into one clear next action?",
    "That is useful context. Who owns the immediate next step?",
    "Strong input. What outcome should we prioritize first?"
  ];

  const index = Math.floor(Math.random() * options.length);
  return options[index];
}

function buildSingleLineJunoOutput(responseText, summaryText) {
  const summaryLine = normalizeSummaryLine(summaryText);
  if (summaryLine) {
    if (looksLikeParaphrase(summaryLine, state.lastGuestTurn)) {
      return fallbackCommentaryLine();
    }
    return summaryLine;
  }

  const fallback = normalizeSummaryLine(responseText);
  if (!fallback || looksLikeParaphrase(fallback, state.lastGuestTurn)) {
    return fallbackCommentaryLine();
  }
  return fallback;
}

function sendEvent(event) {
  if (!state.dc || state.dc.readyState !== "open") {
    appendEvent("Data channel is not ready.");
    return false;
  }
  state.dc.send(JSON.stringify(event));
  return true;
}

async function initVoiceMode() {
  try {
    const response = await fetch("/health");
    const health = await response.json();
    state.useElevenLabs = Boolean(health.elevenLabsEnabled);
    appendEvent(
      state.useElevenLabs
        ? "Voice engine: ElevenLabs streaming."
        : "Voice engine: OpenAI Realtime audio."
    );
  } catch {
    appendEvent("Voice engine detection failed. Using OpenAI Realtime audio.");
    state.useElevenLabs = false;
  }
}

function clearTtsAudioUrl() {
  if (!state.ttsAudioUrl) return;
  URL.revokeObjectURL(state.ttsAudioUrl);
  state.ttsAudioUrl = "";
}

function isAbortError(error) {
  return error?.name === "AbortError";
}

function shouldFallbackToRealtimeAudio(message) {
  if (!message) return false;
  return /paid_plan_required|payment_required|library voices/i.test(message);
}

function supportsMpegStreaming() {
  return typeof MediaSource !== "undefined" && MediaSource.isTypeSupported("audio/mpeg");
}

function waitForAudioEnded(signal) {
  return new Promise((resolve, reject) => {
    const onEnded = () => {
      cleanup();
      resolve();
    };
    const onError = () => {
      cleanup();
      reject(new Error("Juno playback failed."));
    };
    const onAbort = () => {
      cleanup();
      reject(new DOMException("Playback aborted.", "AbortError"));
    };

    function cleanup() {
      els.remoteAudio.removeEventListener("ended", onEnded);
      els.remoteAudio.removeEventListener("error", onError);
      signal?.removeEventListener("abort", onAbort);
    }

    els.remoteAudio.addEventListener("ended", onEnded, { once: true });
    els.remoteAudio.addEventListener("error", onError, { once: true });
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

function appendBufferAsync(sourceBuffer, chunk, signal) {
  return new Promise((resolve, reject) => {
    const onUpdateEnd = () => {
      cleanup();
      resolve();
    };
    const onError = () => {
      cleanup();
      reject(new Error("Audio buffer append failed."));
    };
    const onAbort = () => {
      cleanup();
      reject(new DOMException("Append aborted.", "AbortError"));
    };

    function cleanup() {
      sourceBuffer.removeEventListener("updateend", onUpdateEnd);
      sourceBuffer.removeEventListener("error", onError);
      signal?.removeEventListener("abort", onAbort);
    }

    sourceBuffer.addEventListener("updateend", onUpdateEnd, { once: true });
    sourceBuffer.addEventListener("error", onError, { once: true });
    signal?.addEventListener("abort", onAbort, { once: true });

    try {
      sourceBuffer.appendBuffer(chunk);
    } catch (error) {
      cleanup();
      reject(error);
    }
  });
}

async function playElevenLabsBlob(response, signal) {
  const audioBlob = await response.blob();
  clearTtsAudioUrl();
  state.ttsAudioUrl = URL.createObjectURL(audioBlob);
  els.remoteAudio.srcObject = null;
  els.remoteAudio.src = state.ttsAudioUrl;
  state.ttsPlaying = true;
  await els.remoteAudio.play();
  await waitForAudioEnded(signal);
}

async function playElevenLabsStream(response, signal) {
  if (!response.body) {
    throw new Error("ElevenLabs response stream is unavailable.");
  }

  const mediaSource = new MediaSource();
  clearTtsAudioUrl();
  state.ttsAudioUrl = URL.createObjectURL(mediaSource);
  els.remoteAudio.srcObject = null;
  els.remoteAudio.src = state.ttsAudioUrl;

  const sourceBuffer = await new Promise((resolve, reject) => {
    const onSourceOpen = () => {
      cleanup();
      try {
        const buffer = mediaSource.addSourceBuffer("audio/mpeg");
        buffer.mode = "sequence";
        resolve(buffer);
      } catch (error) {
        reject(error);
      }
    };
    const onError = () => {
      cleanup();
      reject(new Error("Unable to initialize audio stream."));
    };

    function cleanup() {
      mediaSource.removeEventListener("sourceopen", onSourceOpen);
      mediaSource.removeEventListener("error", onError);
    }

    mediaSource.addEventListener("sourceopen", onSourceOpen, { once: true });
    mediaSource.addEventListener("error", onError, { once: true });
  });

  const reader = response.body.getReader();
  let playbackStarted = false;

  while (true) {
    if (signal?.aborted) {
      throw new DOMException("Playback aborted.", "AbortError");
    }

    const { done, value } = await reader.read();
    if (done) break;
    if (!value || !value.byteLength) continue;

    await appendBufferAsync(sourceBuffer, value, signal);

    if (!playbackStarted) {
      state.ttsPlaying = true;
      await els.remoteAudio.play();
      playbackStarted = true;
    }
  }

  if (mediaSource.readyState === "open") {
    mediaSource.endOfStream();
  }

  if (playbackStarted) {
    await waitForAudioEnded(signal);
  }
}

function stopElevenLabsPlayback(reason = "Juno playback interrupted.") {
  if (!state.useElevenLabs) return;

  if (state.ttsAbortController) {
    state.ttsAbortController.abort();
    state.ttsAbortController = null;
  }

  els.remoteAudio.pause();
  els.remoteAudio.removeAttribute("src");
  els.remoteAudio.load();
  clearTtsAudioUrl();

  if (state.ttsPlaying) {
    appendEvent(reason);
  }

  state.ttsPlaying = false;
}

async function speakWithElevenLabs(text) {
  if (!state.useElevenLabs) return;

  const spokenText = (text || "").trim();
  if (!spokenText) return;

  stopElevenLabsPlayback();
  appendEvent("Synthesizing Juno audio.");

  const controller = new AbortController();
  state.ttsAbortController = controller;

  try {
    const response = await fetch("/tts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ text: spokenText }),
      signal: controller.signal
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || "ElevenLabs synthesis failed.");
    }

    if (supportsMpegStreaming()) {
      await playElevenLabsStream(response, controller.signal);
    } else {
      await playElevenLabsBlob(response, controller.signal);
    }
  } catch (error) {
    if (!isAbortError(error)) {
      const message = error.message || "ElevenLabs audio failed.";
      appendEvent(message);

      // If ElevenLabs rejects synthesis due to plan/voice restrictions,
      // continue with native Realtime audio for later turns.
      if (shouldFallbackToRealtimeAudio(message)) {
        state.useElevenLabs = false;
        appendEvent("Falling back to OpenAI Realtime audio.");
      }
    }
  } finally {
    state.ttsAbortController = null;
    state.ttsPlaying = false;
    clearTtsAudioUrl();
    els.remoteAudio.removeAttribute("src");
    els.remoteAudio.load();
    state.waitingForResponse = false;
    flushQueuedResponse();
  }
}

function createJunoResponse(reason, extraInstructions = "") {
  if (state.waitingForResponse) {
    appendEvent("Juno is finishing the current response.");
    return;
  }

  const responseInstructions = `
You are Juno, the online meeting co-host.
Current app state: ${state.mode}.
Reason for this turn: ${reason}.
Language: Respond exclusively in English unless the participant explicitly requests another language.
${agendaInstructions()}
${meetingScopeInstructions()}
${extraInstructions}
Use the conversation so far and stay strictly within the current meeting context.
Do not drift into unrelated topics.
Digest the participant's latest message before responding.
If the participant response is unclear, missing detail, or ambiguous, ask one concise clarifying probe question.
Keep the response warm, concise, useful, and human.
If this is your first spoken turn, welcome the meeting participants and acknowledge the host briefly.
Do not quote, summarize, or restate the participant transcript verbatim.
Prefer spontaneous commentary that moves the discussion forward.
Return exactly one short spoken line and nothing else, maximum 14 words.
`.trim();

  const sent = sendEvent({
    type: "response.create",
    response: {
      output_modalities: state.useElevenLabs ? ["text"] : ["audio"],
      instructions: responseInstructions
    }
  });

  if (sent) {
    state.waitingForResponse = true;
    appendEvent(`Response requested: ${reason}`);
  }
}

function clearPendingResponse(reason = "") {
  if (!state.pendingResponseTimer) return;
  clearTimeout(state.pendingResponseTimer);
  state.pendingResponseTimer = null;
  state.pendingResponseReason = "";
  state.pendingAudienceText = "";
  if (reason) {
    appendEvent(reason);
  }
}

function scheduleJunoResponse(reason, audienceText = "") {
  const guestText = (audienceText || "").trim();

  if (!state.connected || state.mode !== "active") {
    return;
  }

  if (state.waitingForResponse) {
    state.queuedResponseReason = reason;
    state.queuedAudienceText = guestText;
    appendEvent("Juno queued the next turn after the current response.");
    return;
  }

  clearPendingResponse();
  state.pendingResponseReason = reason;
  state.pendingAudienceText = guestText;

  appendEvent(
    `Waiting ${Math.round(state.responseDelayMs / 1000)} seconds for follow-up before responding.`
  );

  state.pendingResponseTimer = setTimeout(() => {
    const scheduledReason = state.pendingResponseReason || reason;
    const scheduledText = state.pendingAudienceText;
    state.pendingResponseTimer = null;
    state.pendingResponseReason = "";
    state.pendingAudienceText = "";

    const followUpInstructions = scheduledText
      ? `Latest participant message: "${scheduledText}"\nRespond only if this message is within the host-defined event topic. If it is off-topic, do not elaborate on it; redirect back to the event topic in one short line.`
      : "";

    createJunoResponse(scheduledReason, followUpInstructions);
  }, state.responseDelayMs);
}

function flushQueuedResponse() {
  if (!state.queuedResponseReason) return;

  const queuedReason = state.queuedResponseReason;
  const queuedText = state.queuedAudienceText;
  state.queuedResponseReason = "";
  state.queuedAudienceText = "";
  scheduleJunoResponse(queuedReason, queuedText);
}

function activateJuno(source, options = {}) {
  if (!state.connected) return;

  const immediateWelcome = options.immediateWelcome !== false;
  const audienceText = options.audienceText || "";

  clearPendingResponse();
  state.queuedResponseReason = "";
  state.queuedAudienceText = "";

  setMode("active");
  appendEvent(`Juno activated by ${source}.`);

  if (immediateWelcome) {
    createJunoResponse(
      "activation",
      "The host or participant has invited you by name. Welcome everyone to the online meeting and offer a brief, natural opening."
    );
    return;
  }

  scheduleJunoResponse("direct address", audienceText);
}

function pauseJuno() {
  clearPendingResponse("Pending response canceled while paused.");
  state.queuedResponseReason = "";
  state.queuedAudienceText = "";
  setMode("paused");
  appendEvent("Juno paused.");
}

function handleTranscript(text) {
  appendTurn("Guest", text);
  state.lastGuestTurn = text || "";

  if (!state.agendaUploadText) {
    const observedTurn = normalizeAgendaText(text);
    if (observedTurn) {
      const nextObservation = state.observationContextText
        ? `${state.observationContextText}\n${observedTurn}`
        : observedTurn;
      state.observationContextText = agendaSummary(nextObservation);
      rebuildAgendaContext();
    }
  }

  if (state.capturingAgenda) {
    captureVerbalAgenda(text);
    return;
  }

  if (state.mode !== "active" && wasJunoCalled(text)) {
    activateJuno("voice trigger", {
      immediateWelcome: false,
      audienceText: text
    });
    return;
  }

  if (state.mode === "active" && shouldConverse(text)) {
    const reason = wasJunoCalled(text)
      ? "direct address"
      : "active co-host conversation";
    scheduleJunoResponse(reason, text);
  }
}

function handleServerEvent(event) {
  switch (event.type) {
    case "session.created":
      appendEvent("Realtime session created.");
      break;

    case "session.updated":
      appendEvent("Realtime session updated.");
      break;

    case "input_audio_buffer.speech_started":
      appendEvent("Speech started.");
      clearPendingResponse("Follow-up detected. Re-evaluating before responding.");
      break;

    case "input_audio_buffer.speech_stopped":
      appendEvent("Speech stopped.");
      break;

    case "conversation.item.input_audio_transcription.completed":
      if (
        state.useElevenLabs &&
        (state.ttsPlaying || state.ttsAbortController) &&
        wasJunoCalled(event.transcript || "")
      ) {
        stopElevenLabsPlayback("Direct interruption detected. Juno yields the floor.");
      }
      handleTranscript(event.transcript || "");
      break;

    case "response.created":
      state.waitingForResponse = true;
      appendEvent("Juno is speaking.");
      break;

    case "response.output_text.delta":
    case "response.text.delta":
      state.assistantTranscript += event.delta || "";
      break;

    case "response.output_text.done":
    case "response.text.done": {
      const completedText = event.text || event.transcript || "";
      if (completedText.trim()) {
        state.assistantTranscript = completedText;
      }
      break;
    }

    case "response.output_audio_transcript.delta":
      state.assistantTranscript += event.delta || "";
      break;

    case "response.output_audio_transcript.done":
      state.assistantTranscript = event.transcript || state.assistantTranscript;
      break;

    case "response.done": {
      const junoText = state.assistantTranscript.trim();
      state.assistantTranscript = "";

      const { responseText, summaryText } = splitJunoResponse(junoText);
      const conciseSummary = buildSingleLineJunoOutput(responseText, summaryText);

      appendTurn("Juno", conciseSummary);

      if (conciseSummary) {
        appendEvent(`Response summary: ${conciseSummary}`);
        setResponseSummary(conciseSummary);
      } else {
        setResponseSummary("");
      }

      if (state.useElevenLabs && conciseSummary) {
        void speakWithElevenLabs(conciseSummary);
      } else {
        state.waitingForResponse = false;
        flushQueuedResponse();
      }
      break;
    }

    case "response.cancelled":
      state.waitingForResponse = false;
      state.assistantTranscript = "";
      if (state.useElevenLabs) {
        stopElevenLabsPlayback("Juno response canceled.");
      }
      flushQueuedResponse();
      break;

    case "error":
      state.waitingForResponse = false;
      appendEvent(event.error?.message || "Realtime error.");
      flushQueuedResponse();
      break;

    default:
      break;
  }
}

function setupDataChannel(channel) {
  channel.addEventListener("open", () => {
    appendEvent("Control channel open.");
    setConnectionStatus("Connected");
  });

  channel.addEventListener("close", () => {
    appendEvent("Control channel closed.");
  });

  channel.addEventListener("message", (message) => {
    try {
      handleServerEvent(JSON.parse(message.data));
    } catch {
      appendEvent("Unrecognized server event.");
    }
  });
}

function startMeter(stream) {
  stopMeter();
  state.audioContext = new AudioContext();
  const source = state.audioContext.createMediaStreamSource(stream);
  state.analyser = state.audioContext.createAnalyser();
  state.analyser.fftSize = 128;
  source.connect(state.analyser);

  const data = new Uint8Array(state.analyser.frequencyBinCount);
  const draw = () => {
    state.analyser.getByteFrequencyData(data);
    meterBars.forEach((bar, index) => {
      const value = data[index % data.length] || 0;
      const height = Math.max(8, Math.round((value / 255) * 96));
      bar.style.height = `${height}%`;
    });
    state.meterAnimation = requestAnimationFrame(draw);
  };
  draw();
}

function stopMeter() {
  if (state.meterAnimation) {
    cancelAnimationFrame(state.meterAnimation);
  }
  state.meterAnimation = null;

  if (state.audioContext) {
    state.audioContext.close();
  }
  state.audioContext = null;
  state.analyser = null;

  meterBars.forEach((bar) => {
    bar.style.height = "8%";
  });
}

async function requestSystemAudioStream() {
  if (!navigator.mediaDevices?.getDisplayMedia) {
    appendEvent("System audio capture is not supported in this browser.");
    return null;
  }

  try {
    appendEvent("Choose the meeting window/tab and enable Share audio.");
    const displayStream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: false
      }
    });

    const audioTracks = displayStream.getAudioTracks();
    if (!audioTracks.length) {
      displayStream.getTracks().forEach((track) => track.stop());
      appendEvent("No system audio track found. Continuing with microphone only.");
      return null;
    }

    return displayStream;
  } catch {
    appendEvent("System audio was not shared. Continuing with microphone only.");
    return null;
  }
}

function buildMixedUplinkStream(micStream, systemStream) {
  if (!systemStream) {
    return { stream: micStream, mixContext: null };
  }

  const mixContext = new AudioContext();
  const destination = mixContext.createMediaStreamDestination();

  const micSource = mixContext.createMediaStreamSource(micStream);
  micSource.connect(destination);

  const systemSource = mixContext.createMediaStreamSource(systemStream);
  const systemGain = mixContext.createGain();
  systemGain.gain.value = 0.9;
  systemSource.connect(systemGain).connect(destination);

  return { stream: destination.stream, mixContext };
}

async function connect() {
  if (state.connected || state.connecting) return;

  state.connecting = true;
  setControls();
  setConnectionStatus("Connecting");
  appendEvent("Opening microphone and system audio.");

  try {
    const pc = new RTCPeerConnection();
    state.pc = pc;

    pc.addEventListener("track", (event) => {
      if (state.useElevenLabs) return;
      els.remoteAudio.srcObject = event.streams[0];
    });

    pc.addEventListener("connectionstatechange", () => {
      setConnectionStatus(
        pc.connectionState === "connected" ? "Connected" : pc.connectionState
      );
    });

    const micStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    });

    const systemStream = await requestSystemAudioStream();
    const { stream: uplinkStream, mixContext } = buildMixedUplinkStream(
      micStream,
      systemStream
    );

    state.micStream = micStream;
    state.systemStream = systemStream;
    state.uplinkStream = uplinkStream;
    state.mixContext = mixContext;

    uplinkStream.getAudioTracks().forEach((track) => pc.addTrack(track, uplinkStream));
    startMeter(uplinkStream);

    appendEvent(
      systemStream
        ? "Observing with microphone + system audio."
        : "Observing with microphone only."
    );

    const channel = pc.createDataChannel("oai-events");
    state.dc = channel;
    setupDataChannel(channel);

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    const sessionResponse = await fetch("/session", {
      method: "POST",
      headers: {
        "Content-Type": "application/sdp"
      },
      body: offer.sdp
    });

    if (!sessionResponse.ok) {
      const error = await sessionResponse.json().catch(() => ({}));
      throw new Error(error.error || "Session creation failed.");
    }

    const answer = {
      type: "answer",
      sdp: await sessionResponse.text()
    };
    await pc.setRemoteDescription(answer);

    state.connected = true;
    state.connecting = false;
    setMode("observing");
    setControls();
    appendEvent("Juno is observing.");
  } catch (error) {
    appendEvent(error.message || "Connection failed.");
    disconnect();
  }
}

function disconnect() {
  clearPendingResponse();
  state.queuedResponseReason = "";
  state.queuedAudienceText = "";
  stopElevenLabsPlayback("Session stopped.");

  if (state.dc) {
    state.dc.close();
  }
  if (state.pc) {
    state.pc.close();
  }
  if (state.micStream) {
    state.micStream.getTracks().forEach((track) => track.stop());
  }
  if (state.systemStream) {
    state.systemStream.getTracks().forEach((track) => track.stop());
  }
  if (state.uplinkStream) {
    state.uplinkStream.getTracks().forEach((track) => track.stop());
  }
  if (state.mixContext) {
    state.mixContext.close();
  }

  stopMeter();
  state.pc = null;
  state.dc = null;
  state.micStream = null;
  state.systemStream = null;
  state.uplinkStream = null;
  state.mixContext = null;
  state.connected = false;
  state.connecting = false;
  state.waitingForResponse = false;
  state.assistantTranscript = "";
  state.capturingAgenda = false;
  setResponseSummary("");
  setConnectionStatus("Offline");
  setMode("observing");
  setControls();
  updateAgendaStatus();
  updateAgendaUploadStatus();
  appendEvent("Session stopped.");
}

async function newSession() {
  const shouldReconnect = state.connected;
  disconnect();
  els.transcriptLog.replaceChildren();
  clearAgenda();
  if (shouldReconnect) {
    await connect();
  }
}

els.connectButton.addEventListener("click", connect);
els.disconnectButton.addEventListener("click", disconnect);
els.activateButton.addEventListener("click", () =>
  activateJuno("host button", { immediateWelcome: true })
);
els.pauseButton.addEventListener("click", pauseJuno);
els.newSessionButton.addEventListener("click", newSession);
els.clearLogButton.addEventListener("click", () => els.transcriptLog.replaceChildren());
els.saveAgendaButton.addEventListener("click", saveDocumentAgenda);
els.clearAgendaButton.addEventListener("click", clearAgenda);
els.captureAgendaButton.addEventListener("click", toggleVerbalAgendaCapture);
els.agendaInput.addEventListener("input", () => {
  state.agendaNotesText = els.agendaInput.value;
  rebuildAgendaContext();
});
els.agendaFileInput.addEventListener("change", () => {
  const [file] = els.agendaFileInput.files || [];
  handleAgendaFileUpload(file);
});
els.autoConverseToggle.addEventListener("change", () => {
  state.autoConverse = els.autoConverseToggle.checked;
  updateAutoConverseStatus();
  appendEvent(
    state.autoConverse ? "Auto converse enabled." : "Auto converse disabled."
  );
});
els.triggerInput.addEventListener("input", () => {
  state.triggerName = els.triggerInput.value || "Juno";
});
els.themeSelect.addEventListener("change", () => {
  applyTheme(els.themeSelect.value, { persist: true, announce: true });
});

initTheme();
setMode("observing");
setControls();
updateAgendaStatus();
updateAutoConverseStatus();
setResponseSummary("");
appendEvent("Ready.");
void initVoiceMode();
