(function () {
  var dock = document.getElementById("soundDock");
  var musicButton = document.getElementById("musicToggle");
  var sfxButton = document.getElementById("sfxToggle");
  var musicLabel = musicButton ? musicButton.querySelector(".sound-label") : null;
  var sfxLabel = sfxButton ? sfxButton.querySelector(".sound-label") : null;

  if (!dock || !musicButton || !sfxButton) return;

  var AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    dock.hidden = true;
    return;
  }

  // Energetic tracks with multiple voices/layers: drums, bass, chords, lead
  var TRACKS = [
    {
      name: "نبض حماسي",
      bpm: 128,
      wave: "sawtooth",
      bass:  [55, 55, 73.42, 73.42, 65.41, 65.41, 82.41, 73.42],
      chords:[
        [220, 277.18, 329.63],
        [220, 277.18, 329.63],
        [293.66, 369.99, 440],
        [293.66, 369.99, 440],
        [261.63, 329.63, 392],
        [261.63, 329.63, 392],
        [329.63, 415.3, 493.88],
        [293.66, 369.99, 440]
      ],
      lead: [440, 523.25, 659.25, 587.33, 523.25, 659.25, 880, 659.25, 587.33, 523.25, 440, 523.25, 659.25, 587.33, 523.25, 440]
    },
    {
      name: "سباق النور",
      bpm: 140,
      wave: "square",
      bass:  [65.41, 65.41, 87.31, 65.41, 73.42, 73.42, 98, 87.31],
      chords:[
        [261.63, 329.63, 392],
        [261.63, 329.63, 392],
        [349.23, 440, 523.25],
        [261.63, 329.63, 392],
        [293.66, 369.99, 440],
        [293.66, 369.99, 440],
        [392, 493.88, 587.33],
        [349.23, 440, 523.25]
      ],
      lead: [523.25, 659.25, 783.99, 659.25, 587.33, 698.46, 880, 783.99, 659.25, 587.33, 523.25, 587.33, 659.25, 783.99, 698.46, 523.25]
    },
    {
      name: "عزم",
      bpm: 134,
      wave: "sawtooth",
      bass:  [49, 49, 65.41, 49, 55, 55, 73.42, 65.41],
      chords:[
        [196, 246.94, 293.66],
        [196, 246.94, 293.66],
        [261.63, 329.63, 392],
        [196, 246.94, 293.66],
        [220, 277.18, 329.63],
        [220, 277.18, 329.63],
        [293.66, 369.99, 440],
        [261.63, 329.63, 392]
      ],
      lead: [392, 493.88, 587.33, 493.88, 440, 523.25, 659.25, 587.33, 493.88, 440, 392, 440, 493.88, 587.33, 523.25, 392]
    }
  ];

  var ctx = null;
  var master = null;
  var compressor = null;
  var sfxGain = null;
  var musicTimer = null;
  var trackTimer = null;
  var step = 0;
  var trackIndex = 0;
  var musicOn = false;
  var userPaused = false;
  var needsGesture = false;
  var sfxOn = readSfx();
  var noiseBuf = null;

  function readSfx() {
    try {
      return window.localStorage.getItem("yahya_site_sfx") !== "off";
    } catch (error) {
      return true;
    }
  }

  function writeSfx(value) {
    try {
      window.localStorage.setItem("yahya_site_sfx", value ? "on" : "off");
    } catch (error) {}
  }

  function ensureContext() {
    if (!ctx) {
      ctx = new AudioContextClass();

      compressor = ctx.createDynamicsCompressor();
      compressor.threshold.value = -16;
      compressor.knee.value = 20;
      compressor.ratio.value = 8;
      compressor.attack.value = 0.002;
      compressor.release.value = 0.2;
      compressor.connect(ctx.destination);

      master = ctx.createGain();
      master.gain.value = 0;
      master.connect(compressor);

      sfxGain = ctx.createGain();
      sfxGain.gain.value = 0.2;
      sfxGain.connect(compressor);
    }
    if (ctx.state === "suspended") {
      ctx.resume().catch(function () {});
    }
    return ctx;
  }

  function getNoise() {
    if (noiseBuf) return noiseBuf;
    var len = ctx.sampleRate;
    noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
    var data = noiseBuf.getChannelData(0);
    for (var i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    return noiseBuf;
  }

  function playTone(frequency, when, duration, volume, wave, destination, detune) {
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = wave || "sine";
    osc.frequency.setValueAtTime(frequency, when);
    if (detune) osc.detune.setValueAtTime(detune, when);
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.exponentialRampToValueAtTime(volume, when + 0.01);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, volume * 0.35), when + duration * 0.5);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);
    osc.connect(gain);
    gain.connect(destination);
    osc.start(when);
    osc.stop(when + duration + 0.05);
  }

  function playKick(when) {
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(150, when);
    osc.frequency.exponentialRampToValueAtTime(45, when + 0.12);
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.exponentialRampToValueAtTime(0.55, when + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + 0.28);
    osc.connect(gain);
    gain.connect(master);
    osc.start(when);
    osc.stop(when + 0.32);
  }

  function playSnare(when) {
    var src = ctx.createBufferSource();
    src.buffer = getNoise();
    var bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 1800;
    bp.Q.value = 0.8;
    var gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.exponentialRampToValueAtTime(0.22, when + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + 0.16);
    src.connect(bp);
    bp.connect(gain);
    gain.connect(master);
    src.start(when);
    src.stop(when + 0.2);
    playTone(180, when, 0.09, 0.12, "triangle", master, 0);
  }

  function playHat(when, open) {
    var src = ctx.createBufferSource();
    src.buffer = getNoise();
    var hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 7000;
    var gain = ctx.createGain();
    var dur = open ? 0.14 : 0.045;
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.exponentialRampToValueAtTime(open ? 0.09 : 0.06, when + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    src.connect(hp);
    hp.connect(gain);
    gain.connect(master);
    src.start(when);
    src.stop(when + dur + 0.03);
  }

  function playStep() {
    if (!musicOn || !ctx || ctx.state !== "running") return;
    var track = TRACKS[trackIndex];
    var stepDur = 60 / track.bpm / 2; // 8th notes
    var now = ctx.currentTime + 0.04;
    var s = step % 16;
    var barStep = step % 8;

    // Drums layer
    if (s % 4 === 0) playKick(now);
    if (s % 8 === 4) playSnare(now);
    playHat(now, s % 8 === 7);

    // Bass layer
    if (s % 2 === 0) {
      var b = track.bass[barStep];
      playTone(b, now, stepDur * 1.8, 0.18, "sawtooth", master, 0);
      playTone(b * 2, now, stepDur * 0.9, 0.04, "sine", master, 0);
    }

    // Chords/stabs layer (off-beats for energy)
    if (s % 4 === 2) {
      var chord = track.chords[barStep];
      for (var i = 0; i < chord.length; i++) {
        playTone(chord[i], now, stepDur * 1.4, 0.045, track.wave || "sawtooth", master, i === 1 ? 6 : -4);
      }
    }

    // Lead/melody layer
    var note = track.lead[s];
    if (note && s % 2 === 0) {
      playTone(note, now, stepDur * 1.6, 0.085, "triangle", master, 0);
      playTone(note * 2, now + stepDur * 0.1, stepDur * 0.7, 0.02, "sine", master, 0);
    } else if (note && (s === 3 || s === 11)) {
      playTone(note, now, stepDur * 0.9, 0.05, "sine", master, 0);
    }

    // Extra accent every bar for excitement
    if (s === 0) {
      playTone(track.bass[0] / 2, now, stepDur * 3, 0.08, "sine", master, 0);
    }

    step += 1;
  }

  function beginMusic() {
    musicOn = true;
    userPaused = false;
    needsGesture = false;
    step = 0;
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setValueAtTime(Math.max(master.gain.value, 0.0001), ctx.currentTime);
    master.gain.linearRampToValueAtTime(0.62, ctx.currentTime + 0.8);
    var track = TRACKS[trackIndex];
    var interval = 60000 / track.bpm / 2;
    playStep();
    if (musicTimer) window.clearInterval(musicTimer);
    musicTimer = window.setInterval(playStep, interval);
    if (trackTimer) window.clearInterval(trackTimer);
    trackTimer = window.setInterval(nextTrack, 45000);
    updateMusicButton();
  }

  function startMusic() {
    ensureContext();
    if (ctx.state === "running") {
      if (!musicOn) beginMusic();
      return;
    }
    ctx.resume().then(function () {
      if (!userPaused && !musicOn && ctx.state === "running") beginMusic();
    }).catch(function () {
      needsGesture = true;
      updateMusicButton();
    });
    needsGesture = true;
    updateMusicButton();
  }

  function stopMusic() {
    musicOn = false;
    if (musicTimer) {
      window.clearInterval(musicTimer);
      musicTimer = null;
    }
    if (trackTimer) {
      window.clearInterval(trackTimer);
      trackTimer = null;
    }
    if (ctx && master) {
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setValueAtTime(Math.max(master.gain.value, 0.0001), ctx.currentTime);
      master.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
    }
    updateMusicButton();
  }

  function nextTrack() {
    trackIndex = (trackIndex + 1) % TRACKS.length;
    step = 0;
    if (musicOn && ctx && ctx.state === "running") {
      // restart timer with new bpm
      if (musicTimer) window.clearInterval(musicTimer);
      var interval = 60000 / TRACKS[trackIndex].bpm / 2;
      playStep();
      musicTimer = window.setInterval(playStep, interval);
      playTone(TRACKS[trackIndex].lead[0], ctx.currentTime + 0.05, 0.25, 0.08, "triangle", master, 0);
    }
    updateMusicButton();
  }

  function updateMusicButton() {
    musicButton.classList.toggle("active", musicOn);
    musicButton.classList.toggle("attention", needsGesture && !musicOn);
    musicButton.setAttribute("aria-pressed", musicOn ? "true" : "false");
    var trackName = TRACKS[trackIndex] ? TRACKS[trackIndex].name : "";
    musicButton.setAttribute("aria-label", musicOn ? "إيقاف الموسيقى الحماسية" : "تشغيل موسيقى حماسية");
    musicButton.title = musicOn ? "موسيقى حماسية: " + trackName : "تشغيل موسيقى حماسية";
    if (musicLabel) musicLabel.textContent = musicOn ? "إيقاف" : "موسيقى";
  }

  function updateSfxButton() {
    sfxButton.classList.toggle("active", sfxOn);
    sfxButton.setAttribute("aria-pressed", sfxOn ? "true" : "false");
    sfxButton.setAttribute("aria-label", sfxOn ? "كتم أصوات الأزرار" : "تشغيل أصوات الأزرار");
    sfxButton.title = sfxOn ? "أصوات الأزرار مفعّلة" : "أصوات الأزرار مكتومة";
    if (sfxLabel) sfxLabel.textContent = sfxOn ? "أصوات" : "صامت";
  }

  function playUiSound() {
    if (!sfxOn) return;
    ensureContext();
    if (!ctx || ctx.state !== "running") return;
    var now = ctx.currentTime + 0.01;
    playTone(880, now, 0.1, 0.07, "sine", sfxGain, 0);
    playTone(1320, now + 0.05, 0.12, 0.045, "triangle", sfxGain, 0);
    playTone(660, now + 0.09, 0.08, 0.03, "sine", sfxGain, 0);
  }

  function unlockMusic(event) {
    if (event && event.target && event.target.closest && event.target.closest(".sound-dock")) return;
    if (userPaused || musicOn) return;
    startMusic();
  }

  musicButton.addEventListener("click", function () {
    if (musicOn) {
      userPaused = true;
      stopMusic();
    } else {
      startMusic();
    }
    playUiSound();
  });

  sfxButton.addEventListener("click", function () {
    sfxOn = !sfxOn;
    writeSfx(sfxOn);
    updateSfxButton();
    if (sfxOn) playUiSound();
  });

  // Optional: long press on music button to skip to next energetic track
  var pressTimer = null;
  var longPressed = false;
  musicButton.addEventListener("pointerdown", function () {
    longPressed = false;
    pressTimer = setTimeout(function () {
      longPressed = true;
      nextTrack();
      playUiSound();
    }, 600);
  });
  musicButton.addEventListener("pointerup", function () { if (pressTimer) clearTimeout(pressTimer); });
  musicButton.addEventListener("pointerleave", function () { if (pressTimer) clearTimeout(pressTimer); });
  musicButton.addEventListener("click", function (e) {
    if (longPressed) {
      e.stopImmediatePropagation();
      longPressed = false;
    }
  }, true);

  document.addEventListener("click", function (event) {
    unlockMusic(event);
    var target = event.target && event.target.closest ? event.target.closest("a,button,[role='button']") : null;
    if (!target) return;
    if (target === musicButton || target === sfxButton) return;
    if (target.closest(".sound-dock")) return;
    playUiSound();
  }, true);

  document.addEventListener("pointerdown", unlockMusic, { passive: true });
  document.addEventListener("keydown", unlockMusic);
  document.addEventListener("pointerdown", function () {
    if (ctx && musicOn && ctx.state === "suspended") {
      ctx.resume().catch(function () {});
    }
  }, { passive: true });

  updateMusicButton();
  updateSfxButton();
  startMusic();
})();
