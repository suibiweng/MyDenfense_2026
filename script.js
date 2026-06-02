const pageConfig = {
  title: "Doctoral Dissertation Defense Recording",
  date: "April 22, 2026",
  host: "Suibi Che-Chuan Weng",
  meta: "Suibi Che-Chuan Weng · April 22, 2026 · YouTube video, transcript, and meeting chat",

  // Paste only the YouTube video ID here.
  // Example: for https://www.youtube.com/watch?v=ABC123XYZ, use "ABC123XYZ".
  youtubeVideoId: "t63RfwAotnc",

  captions: "assets/captions.vtt",
  transcript: "assets/transcript.vtt",
  chat: "assets/chat.txt"
};

const $ = (selector) => document.querySelector(selector);
const missingMedia = $("#missingMedia");
const transcriptList = $("#transcriptList");
const chatList = $("#chatList");
const transcriptStatus = $("#transcriptStatus");
let allCues = [];
let ytPlayer = null;
let currentTimeTimer = null;

function isYouTubeReady() {
  return pageConfig.youtubeVideoId && !pageConfig.youtubeVideoId.includes("PASTE_YOUR_YOUTUBE_VIDEO_ID_HERE");
}

function applyConfig() {
  document.title = pageConfig.title;
  $("#recordingTitle").textContent = pageConfig.title;
  $("#recordingMeta").textContent = pageConfig.meta;
  $("#detailTopic").textContent = pageConfig.title.replace(" Recording", "");
  $("#detailDate").textContent = pageConfig.date;
  $("#detailHost").textContent = pageConfig.host;
  $("#downloadTranscript").href = pageConfig.transcript;
  $("#downloadCaptions").href = pageConfig.captions;
  $("#downloadChat").href = pageConfig.chat;

  const youtubeUrl = isYouTubeReady()
    ? `https://www.youtube.com/watch?v=${encodeURIComponent(pageConfig.youtubeVideoId)}`
    : "#";
  $("#openYouTube").href = youtubeUrl;
  $("#openYouTube").classList.toggle("disabled", !isYouTubeReady());
}

function onYouTubeIframeAPIReady() {
  if (!isYouTubeReady()) {
    missingMedia.hidden = false;
    return;
  }

  missingMedia.hidden = true;
  ytPlayer = new YT.Player("youtubePlayer", {
    videoId: pageConfig.youtubeVideoId,
    playerVars: {
      rel: 0,
      modestbranding: 1,
      playsinline: 1
    },
    events: {
      onReady: () => startTranscriptHighlightTimer()
    }
  });
}
window.onYouTubeIframeAPIReady = onYouTubeIframeAPIReady;

function getPlayerTime() {
  try {
    if (ytPlayer && typeof ytPlayer.getCurrentTime === "function") return ytPlayer.getCurrentTime();
  } catch {}
  return 0;
}

function seekPlayer(seconds) {
  if (ytPlayer && typeof ytPlayer.seekTo === "function") {
    ytPlayer.seekTo(Math.max(0, seconds), true);
    if (typeof ytPlayer.playVideo === "function") ytPlayer.playVideo();
  }
}

function jumpPlayer(delta) {
  seekPlayer(getPlayerTime() + delta);
}

function parseTimestamp(timestamp) {
  const clean = timestamp.replace(',', '.').trim();
  const parts = clean.split(':');
  let seconds = 0;
  if (parts.length === 3) {
    seconds += Number(parts[0]) * 3600;
    seconds += Number(parts[1]) * 60;
    seconds += Number(parts[2]);
  } else if (parts.length === 2) {
    seconds += Number(parts[0]) * 60;
    seconds += Number(parts[1]);
  }
  return seconds;
}

function formatTime(seconds) {
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  const m = Math.floor((seconds / 60) % 60).toString().padStart(2, '0');
  const h = Math.floor(seconds / 3600);
  return h > 0 ? `${h}:${m}:${s}` : `${m}:${s}`;
}

function escapeHTML(str) {
  return String(str).replace(/[&<>'"]/g, ch => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;'}[ch]));
}

function highlight(text, query) {
  const safe = escapeHTML(text);
  if (!query) return safe;
  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return safe.replace(new RegExp(`(${escapedQuery})`, 'ig'), '<mark>$1</mark>');
}

function parseVTT(text) {
  return text
    .replace(/^WEBVTT.*\n/i, '')
    .split(/\n\s*\n/)
    .map(block => block.trim())
    .filter(Boolean)
    .map(block => {
      const lines = block.split('\n').map(line => line.trim()).filter(Boolean);
      const timeLineIndex = lines.findIndex(line => line.includes('-->'));
      if (timeLineIndex === -1) return null;
      const [startRaw] = lines[timeLineIndex].split('-->').map(v => v.trim());
      let body = lines.slice(timeLineIndex + 1).join(' ').replace(/<[^>]+>/g, '').trim();
      let speaker = '';
      const speakerMatch = body.match(/^([^:]{2,60}):\s*(.*)$/);
      if (speakerMatch) {
        speaker = speakerMatch[1].trim();
        body = speakerMatch[2].trim();
      }
      return { start: parseTimestamp(startRaw), speaker, text: body };
    })
    .filter(item => item && item.text);
}

function renderTranscript(query = '') {
  transcriptList.innerHTML = '';
  const normalized = query.trim().toLowerCase();
  const filtered = normalized
    ? allCues.filter(cue => `${cue.speaker} ${cue.text}`.toLowerCase().includes(normalized))
    : allCues;

  if (!filtered.length) {
    transcriptList.innerHTML = '<p class="placeholder">No transcript lines match that search.</p>';
    return;
  }

  for (const cue of filtered) {
    const button = document.createElement('button');
    button.className = 'transcript-line';
    button.dataset.start = String(cue.start);
    button.innerHTML = `
      <span class="transcript-meta">
        <span class="transcript-time">${formatTime(cue.start)}</span>
        ${cue.speaker ? `<span class="transcript-speaker">${escapeHTML(cue.speaker)}</span>` : ''}
      </span>
      <span class="transcript-text">${highlight(cue.text, normalized)}</span>
    `;
    button.addEventListener('click', () => seekPlayer(cue.start));
    transcriptList.appendChild(button);
  }
}

function startTranscriptHighlightTimer() {
  if (currentTimeTimer) clearInterval(currentTimeTimer);
  currentTimeTimer = setInterval(() => {
    const now = getPlayerTime();
    let active = null;
    for (let i = 0; i < allCues.length; i++) {
      const start = allCues[i].start;
      const next = allCues[i + 1]?.start ?? Number.POSITIVE_INFINITY;
      if (now >= start && now < next) {
        active = start;
        break;
      }
    }
    document.querySelectorAll('.transcript-line').forEach(line => {
      line.classList.toggle('active', active !== null && Number(line.dataset.start) === active);
    });
  }, 700);
}

async function loadTranscript() {
  try {
    const response = await fetch(pageConfig.transcript, { cache: 'no-store' });
    if (!response.ok) throw new Error('Transcript not found');
    allCues = parseVTT(await response.text());
    if (!allCues.length) throw new Error('No transcript cues');
    transcriptStatus.textContent = `${allCues.length} lines`;
    renderTranscript();
  } catch (error) {
    transcriptStatus.textContent = 'Not added';
    transcriptList.innerHTML = '<p class="placeholder">Transcript file could not be loaded.</p>';
  }
}

function parseChat(text) {
  return text.split(/\n?\n/).map(line => line.trim()).filter(Boolean).map(line => {
    const parts = line.split('	');
    if (parts.length >= 3) return { time: parts[0], speaker: parts[1].replace(/:$/, ''), message: parts.slice(2).join(' ') };
    const match = line.match(/^(\d\d:\d\d:\d\d)\s+([^:]+):\s+(.*)$/);
    if (match) return { time: match[1], speaker: match[2], message: match[3] };
    return { time: '', speaker: '', message: line };
  });
}

async function loadChat() {
  try {
    const response = await fetch(pageConfig.chat, { cache: 'no-store' });
    if (!response.ok) throw new Error('Chat not found');
    const items = parseChat(await response.text());
    chatList.innerHTML = '';
    for (const item of items) {
      const div = document.createElement('div');
      div.className = 'chat-entry';
      div.innerHTML = `
        <div class="chat-meta">
          ${item.time ? `<span class="chat-time">${escapeHTML(item.time)}</span>` : ''}
          ${item.speaker ? `<span class="chat-speaker">${escapeHTML(item.speaker)}</span>` : ''}
        </div>
        <div class="chat-message">${escapeHTML(item.message)}</div>
      `;
      chatList.appendChild(div);
    }
  } catch (error) {
    chatList.innerHTML = '<p class="placeholder">Chat file could not be loaded.</p>';
  }
}

function showTab(tab) {
  const transcriptActive = tab === 'transcript';
  $('#tabTranscript').classList.toggle('active', transcriptActive);
  $('#tabChat').classList.toggle('active', !transcriptActive);
  $('#transcriptList').hidden = !transcriptActive;
  $('#transcriptTools').hidden = !transcriptActive;
  $('#chatList').hidden = transcriptActive;
  $('#panelTitle').textContent = transcriptActive ? 'Transcript' : 'Meeting Chat';
}

function bindControls() {
  document.querySelectorAll('[data-jump]').forEach(button => {
    button.addEventListener('click', () => jumpPlayer(Number(button.dataset.jump)));
  });

  $('#toggleSidePanel').addEventListener('click', () => {
    const panel = $('#transcriptPanel');
    const hidden = panel.style.display === 'none';
    panel.style.display = hidden ? 'flex' : 'none';
    $('#toggleSidePanel').classList.toggle('active', hidden);
  });

  $('#copyLink').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      $('#copyLink').textContent = 'Copied!';
      setTimeout(() => $('#copyLink').textContent = 'Copy page link', 1200);
    } catch {
      window.prompt('Copy this link:', window.location.href);
    }
  });

  $('#tabTranscript').addEventListener('click', () => showTab('transcript'));
  $('#tabChat').addEventListener('click', () => showTab('chat'));
  $('#transcriptSearch').addEventListener('input', event => renderTranscript(event.target.value));
}

applyConfig();
bindControls();
loadTranscript();
loadChat();

// If the YouTube API fails to load, keep the placeholder visible instead of showing a blank area.
setTimeout(() => {
  if (!isYouTubeReady() || !ytPlayer) missingMedia.hidden = false;
}, 2200);
