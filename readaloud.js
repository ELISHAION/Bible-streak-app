/* ════════════════════════════════════════════════════════════
   READ ALOUD MODULE — Daily Manna
   Web-only audio Bible using the browser's native SpeechSynthesis
   API. No external services, no audio files.

   Isolated subsystem: exposes a single global, window.ReadAloud,
   with attach()/detach(). Nothing here reaches into app.js state
   directly — the caller (app.js) always hands over the verse
   array and container it wants read, and calls detach() whenever
   it navigates away. This keeps the reader decoupled from the
   Journey vs. Free-Reading rendering paths it plugs into.
   ════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const SUPPORTED = ('speechSynthesis' in window) && ('SpeechSynthesisUtterance' in window);

  if (SUPPORTED) {
    // Voice lists load async in most browsers; refresh the cache whenever
    // it changes so a late-arriving Telugu voice isn't missed.
    window.speechSynthesis.onvoiceschanged = () => {
      voicesCache = window.speechSynthesis.getVoices();
    };
  }

  const RATES = [0.75, 1, 1.25, 1.5, 2];

  /* ── module state (one player instance can be attached at a time) ── */
  let state = null;
  let voicesCache = null;
  let speechToken = 0; // increments on every cancel/restart; stale callbacks check this and no-op
  /*
    state = {
      containerEl, verses, lang,
      barEl,
      idx,            // current verse index, 0-based
      status,         // 'idle' | 'playing' | 'paused'
      rate,
      rowEls          // live NodeList/array of .verse-row elements, indexed by data-verse-idx
    }
  */

  function attach(opts) {
    detach(); // never allow two players/queues to coexist

    if (!SUPPORTED) {
      renderUnsupported(opts.containerEl, opts.mountBeforeEl);
      return;
    }
    if (!opts.verses || !opts.verses.length) return;

    const rowEls = {};
    opts.containerEl.querySelectorAll('.verse-row').forEach(el => {
      rowEls[el.getAttribute('data-verse-idx')] = el;
    });

    state = {
      containerEl: opts.containerEl,
      verses: opts.verses,
      lang: opts.lang || 'en',
      idx: 0,
      status: 'idle',
      rate: 1,
      rowEls
    };

    const bar = buildBar();
    state.barEl = bar;
    if (opts.mountBeforeEl && opts.mountBeforeEl.parentNode === opts.containerEl) {
      opts.containerEl.insertBefore(bar, opts.mountBeforeEl);
    } else {
      opts.containerEl.appendChild(bar);
    }

    updateBarUI();
  }

  function detach() {
    if (!SUPPORTED) { state = null; return; }
    cancelSpeech();
    if (state) {
      clearHighlight();
      if (state.barEl && state.barEl.parentNode) state.barEl.parentNode.removeChild(state.barEl);
    }
    state = null;
  }

  /* ── UI ── */

  function buildBar() {
    const bar = document.createElement('div');
    bar.className = 'ra-bar';
    bar.innerHTML = `
      <div class="ra-row">
        <button class="ra-btn ra-btn-icon" data-act="prev" title="Previous verse" aria-label="Previous verse">⏮</button>
        <button class="ra-btn ra-btn-play" data-act="playpause" title="Play" aria-label="Play">▶</button>
        <button class="ra-btn ra-btn-icon" data-act="stop" title="Stop" aria-label="Stop">⏹</button>
        <button class="ra-btn ra-btn-icon" data-act="next" title="Next verse" aria-label="Next verse">⏭</button>
        <div class="ra-speed-wrap">
          <select class="ra-speed" aria-label="Reading speed">
            ${RATES.map(r => `<option value="${r}" ${r === 1 ? 'selected' : ''}>${r}×</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="ra-status" data-role="status">Tap play to listen 🔊</div>`;

    bar.querySelectorAll('.ra-btn').forEach(btn => {
      btn.addEventListener('click', () => handleAction(btn.getAttribute('data-act')));
    });
    bar.querySelector('.ra-speed').addEventListener('change', (e) => {
      setRate(parseFloat(e.target.value));
    });
    return bar;
  }

  function handleAction(act) {
    if (!state) return;
    if (act === 'playpause') {
      if (state.status === 'playing') pause();
      else if (state.status === 'paused') resume();
      else playFrom(state.idx);
    } else if (act === 'stop') {
      stop();
    } else if (act === 'prev') {
      goToVerse(state.idx - 1);
    } else if (act === 'next') {
      goToVerse(state.idx + 1);
    }
  }

  function updateBarUI() {
    if (!state || !state.barEl) return;
    const playBtn = state.barEl.querySelector('.ra-btn-play');
    const statusEl = state.barEl.querySelector('[data-role="status"]');
    const prevBtn = state.barEl.querySelector('[data-act="prev"]');
    const nextBtn = state.barEl.querySelector('[data-act="next"]');

    if (state.status === 'playing') {
      playBtn.textContent = '⏸';
      playBtn.title = 'Pause';
      playBtn.setAttribute('aria-label', 'Pause');
    } else {
      playBtn.textContent = '▶';
      playBtn.title = state.status === 'paused' ? 'Resume' : 'Play';
      playBtn.setAttribute('aria-label', playBtn.title);
    }

    prevBtn.disabled = state.idx <= 0;
    nextBtn.disabled = state.idx >= state.verses.length - 1;

    const verseNum = state.idx + 1;
    if (state.status === 'playing') {
      statusEl.textContent = `🔊 Reading verse ${verseNum} of ${state.verses.length}`;
    } else if (state.status === 'paused') {
      statusEl.textContent = `⏸ Paused at verse ${verseNum} of ${state.verses.length}`;
    } else {
      statusEl.textContent = 'Tap play to listen 🔊';
    }
  }

  /* ── highlighting + scrolling ── */

  function clearHighlight() {
    if (!state) return;
    Object.values(state.rowEls).forEach(el => el && el.classList.remove('ra-highlight'));
  }

  function highlightVerse(idx) {
    if (!state) return;
    clearHighlight();
    const row = state.rowEls[idx];
    if (row) {
      row.classList.add('ra-highlight');
      row.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  /* ── playback control ── */

  function setRate(rate) {
    if (!state) return;
    state.rate = rate;
    // If mid-utterance, restart the current verse at the new rate —
    // SpeechSynthesisUtterance rate can't be changed once speaking.
    if (state.status === 'playing') {
      playFrom(state.idx);
    }
  }

  /** Bumps the token and cancels. Any in-flight utterance callback that
   *  captured the old token becomes a no-op, even if the browser fires
   *  it late/async after cancel() — this is what keeps highlight and
   *  audio in sync across rate changes, prev/next, and stop. */
  function cancelSpeech() {
    speechToken += 1;
    window.speechSynthesis.cancel();
  }

  function playFrom(idx) {
    if (!state) return;
    cancelSpeech();
    state.idx = Math.max(0, Math.min(idx, state.verses.length - 1));
    state.status = 'playing';
    speakCurrent();
    updateBarUI();
  }

  function speakCurrent() {
    if (!state) return;
    const myToken = speechToken;
    const text = (state.verses[state.idx] || '').trim();
    highlightVerse(state.idx);

    if (!text) { // skip empty verse text safely
      advance(myToken);
      return;
    }

    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = state.rate;
    const langTag = state.lang === 'te' ? 'te-IN' : 'en-US';
    utter.lang = langTag;
    const voice = pickVoice(langTag, state.lang);
    if (voice) utter.voice = voice;

    utter.onstart = () => {
      if (!state || myToken !== speechToken) return;
      state.status = 'playing';
      updateBarUI();
    };
    utter.onend = () => {
      if (myToken !== speechToken) return; // stale callback from a cancelled utterance — ignore
      advance(myToken);
    };
    utter.onerror = (e) => {
      if (myToken !== speechToken) return;
      if (e && e.error === 'interrupted') return; // expected from our own cancel(), not a real failure
      if (state.lang === 'te' && !voice) {
        showNoVoiceWarning();
        stop();
        return;
      }
      // Move on rather than stalling the whole chapter on one bad verse.
      advance(myToken);
    };

    window.speechSynthesis.speak(utter);
  }

  function advance(myToken) {
    if (!state || myToken !== speechToken) return;
    if (state.idx < state.verses.length - 1) {
      state.idx += 1;
      speakCurrent();
    } else {
      finishChapter();
    }
  }

  /** Returns a voice matching the requested language, preferring an exact
   *  langTag match, then any voice whose lang starts with the base
   *  language code (e.g. "te" matches "te-IN", "te-Telu", etc).
   *  Returns null if no matching voice is installed on this device. */
  function pickVoice(langTag, baseLang) {
    if (!voicesCache || !voicesCache.length) {
      voicesCache = window.speechSynthesis.getVoices();
    }
    if (!voicesCache || !voicesCache.length) return null;
    const exact = voicesCache.find(v => v.lang && v.lang.toLowerCase() === langTag.toLowerCase());
    if (exact) return exact;
    const partial = voicesCache.find(v => v.lang && v.lang.toLowerCase().startsWith(baseLang.toLowerCase()));
    return partial || null;
  }

  function showNoVoiceWarning() {
    if (!state || !state.barEl) return;
    const statusEl = state.barEl.querySelector('[data-role="status"]');
    if (statusEl) {
      statusEl.textContent = '🔇 No Telugu voice found on this device — try English, or install a Telugu voice in your system/browser settings.';
    }
  }

  function finishChapter() {
    if (!state) return;
    cancelSpeech();
    state.status = 'idle';
    state.idx = 0;
    clearHighlight();
    updateBarUI();
  }

  function pause() {
    if (!state || state.status !== 'playing') return;
    window.speechSynthesis.pause(); // not cancel — pause keeps the same utterance/token alive
    state.status = 'paused';
    updateBarUI();
  }

  function resume() {
    if (!state || state.status !== 'paused') return;
    window.speechSynthesis.resume();
    state.status = 'playing';
    updateBarUI();
  }

  function stop() {
    if (!state) return;
    cancelSpeech();
    state.status = 'idle';
    state.idx = 0;
    clearHighlight();
    updateBarUI();
  }

  function goToVerse(idx) {
    if (!state) return;
    if (idx < 0 || idx > state.verses.length - 1) return;
    const wasPlaying = (state.status === 'playing' || state.status === 'paused');
    cancelSpeech();
    state.idx = idx;
    if (wasPlaying) {
      state.status = 'playing';
      speakCurrent();
    } else {
      highlightVerse(idx);
      updateBarUI();
    }
  }

  /* ── unsupported-browser fallback ── */

  function renderUnsupported(containerEl, mountBeforeEl) {
    const note = document.createElement('div');
    note.className = 'ra-bar ra-unsupported';
    note.innerHTML = `<div class="ra-status">🔇 Read Aloud isn't supported in this browser.</div>`;
    if (mountBeforeEl && mountBeforeEl.parentNode === containerEl) {
      containerEl.insertBefore(note, mountBeforeEl);
    } else {
      containerEl.appendChild(note);
    }
  }

  window.ReadAloud = { attach, detach };
})();
