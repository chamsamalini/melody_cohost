const state = {
  mode: "observing",
  connected: false,
  connecting: false,
  waitingForResponse: false,
  autoConverse: true,
  triggerName: "Melody",
  pc: null,
  dc: null,
  micStream: null,
  audioContext: null,
  analyser: null,
  meterAnimation: null,
  assistantTranscript: ""
};

const els = {
  connectionStatus: document.querySelector("#connectionStatus"),
  modeStatus: document.querySelector("#modeStatus"),
  transcriptLog: document.querySelector("#transcriptLog"),
  eventLog: document.querySelector("#eventLog"),
  meter: document.querySelector("#meter"),
  remoteAudio: document.querySelector("#remoteAudio"),
  connectButton: document.querySelector("#connectButton"),
  disconnectButton: document.querySelector("#disconnectButton"),
  activateButton: document.querySelector("#activateButton"),
  pauseButton: document.querySelector("#pauseButton"),
  newSessionButton: document.querySelector("#newSessionButton"),
  clearLogButton: document.querySelector("#clearLogButton"),
  autoConverseToggle: document.querySelector("#autoConverseToggle"),
  triggerInput: document.querySelector("#triggerInput")
};

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

function triggerPattern() {
  const escaped = state.triggerName
    .trim()
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`\\b${escaped}\\b`, "i");
}

function wasMelodyCalled(text) {
  return Boolean(text && state.triggerName.trim() && triggerPattern().test(text));
}

function looksLikeInvitation(text) {
  return /welcome|introduce|join|answer|share|thought|think|question|help|please/i.test(
    text
  );
}

function shouldConverse(text) {
  if (!state.autoConverse) {
    return wasMelodyCalled(text) || looksLikeInvitation(text) || /\?\s*$/.test(text);
  }
  return Boolean(text && text.trim());
}

function sendEvent(event) {
  if (!state.dc || state.dc.readyState !== "open") {
    appendEvent("Data channel is not ready.");
    return false;
  }
  state.dc.send(JSON.stringify(event));
  return true;
}

function createMelodyResponse(reason, extraInstructions = "") {
  if (state.waitingForResponse) {
    appendEvent("Melody is finishing the current response.");
    return;
  }

  const responseInstructions = `
You are Melody, the event co-host.
Current app state: ${state.mode}.
Reason for this turn: ${reason}.
${extraInstructions}
Use the conversation so far. Keep the response warm, concise, and useful.
If this is your first spoken turn, welcome the guests and acknowledge the host briefly.
`.trim();

  const sent = sendEvent({
    type: "response.create",
    response: {
      output_modalities: ["audio"],
      instructions: responseInstructions
    }
  });

  if (sent) {
    state.waitingForResponse = true;
    appendEvent(`Response requested: ${reason}`);
  }
}

function activateMelody(source) {
  if (!state.connected) return;
  setMode("active");
  appendEvent(`Melody activated by ${source}.`);
  createMelodyResponse(
    "activation",
    "The host or participant has invited you by name. Welcome everyone and offer a brief, natural opening."
  );
}

function pauseMelody() {
  setMode("paused");
  appendEvent("Melody paused.");
}

function handleTranscript(text) {
  appendTurn("Guest", text);

  if (state.mode !== "active" && wasMelodyCalled(text)) {
    activateMelody("voice trigger");
    return;
  }

  if (state.mode === "active" && shouldConverse(text)) {
    const reason = wasMelodyCalled(text)
      ? "direct address"
      : "active co-host conversation";
    createMelodyResponse(reason);
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
      break;

    case "input_audio_buffer.speech_stopped":
      appendEvent("Speech stopped.");
      break;

    case "conversation.item.input_audio_transcription.completed":
      handleTranscript(event.transcript || "");
      break;

    case "response.created":
      state.waitingForResponse = true;
      appendEvent("Melody is speaking.");
      break;

    case "response.output_audio_transcript.delta":
      state.assistantTranscript += event.delta || "";
      break;

    case "response.output_audio_transcript.done":
      appendTurn("Melody", event.transcript || state.assistantTranscript);
      state.assistantTranscript = "";
      break;

    case "response.done":
    case "response.cancelled":
      state.waitingForResponse = false;
      break;

    case "error":
      state.waitingForResponse = false;
      appendEvent(event.error?.message || "Realtime error.");
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

async function connect() {
  if (state.connected || state.connecting) return;

  state.connecting = true;
  setControls();
  setConnectionStatus("Connecting");
  appendEvent("Opening microphone.");

  try {
    const pc = new RTCPeerConnection();
    state.pc = pc;

    pc.addEventListener("track", (event) => {
      els.remoteAudio.srcObject = event.streams[0];
    });

    pc.addEventListener("connectionstatechange", () => {
      setConnectionStatus(
        pc.connectionState === "connected" ? "Connected" : pc.connectionState
      );
    });

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    });
    state.micStream = stream;
    stream.getTracks().forEach((track) => pc.addTrack(track, stream));
    startMeter(stream);

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
    appendEvent("Melody is observing.");
  } catch (error) {
    appendEvent(error.message || "Connection failed.");
    disconnect();
  }
}

function disconnect() {
  if (state.dc) {
    state.dc.close();
  }
  if (state.pc) {
    state.pc.close();
  }
  if (state.micStream) {
    state.micStream.getTracks().forEach((track) => track.stop());
  }

  stopMeter();
  state.pc = null;
  state.dc = null;
  state.micStream = null;
  state.connected = false;
  state.connecting = false;
  state.waitingForResponse = false;
  state.assistantTranscript = "";
  setConnectionStatus("Offline");
  setMode("observing");
  setControls();
  appendEvent("Session stopped.");
}

async function newSession() {
  const shouldReconnect = state.connected;
  disconnect();
  els.transcriptLog.replaceChildren();
  if (shouldReconnect) {
    await connect();
  }
}

els.connectButton.addEventListener("click", connect);
els.disconnectButton.addEventListener("click", disconnect);
els.activateButton.addEventListener("click", () => activateMelody("host button"));
els.pauseButton.addEventListener("click", pauseMelody);
els.newSessionButton.addEventListener("click", newSession);
els.clearLogButton.addEventListener("click", () => els.transcriptLog.replaceChildren());
els.autoConverseToggle.addEventListener("change", () => {
  state.autoConverse = els.autoConverseToggle.checked;
  appendEvent(
    state.autoConverse ? "Auto converse enabled." : "Auto converse disabled."
  );
});
els.triggerInput.addEventListener("input", () => {
  state.triggerName = els.triggerInput.value || "Melody";
});

setMode("observing");
setControls();
appendEvent("Ready.");
