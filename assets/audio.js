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

  var TRACKS = [
    {
      name: "نسيم الفجر",
      wave: "sine",
      chords: [
        [220.00, 261.63, 329.63, 440.00],
        [174.61, 220.00, 261.63, 349.23],
        [196.00, 246.94, 293.66, 392.00],
        [130.81, 196.00, 261.63, 329.63]
      ]
    },
    {
      name: "ضوء القمر",
      wave: "triangle",
      chords: [
        [261.63, 329.63, 392.00, 523.25],
        [220.00, 261.63, 329.63, 440.00],
        [174.61, 220.00, 261.63, 349.23],
        [196.00, 246.94, 293.66, 392.00]
      ]
    },
    {
      name: "مطر هادئ",
      wave: "sine",
      chords: [
        [293.66, 349.23, 440.00, 587.33],
        [261.63, 329.63, 392.00, 523.25],
        [220.00, 261.63, 329.63, 440.00],
        [246.94, 293.66, 369.99, 493.88]
      ]
    },
    {
      name: "أفق بعيد",
      wave: "triangle",
      chords: [
        [196.00, 246.94, 293.66, 392.00],
        [174.61, 220.00, 261.63, 349.23],
        [146.83, 196.00, 246.94, 293.66],
        [164.81, 220.00, 261.63, 329.63]
      ]
    }
  ];

  var ctx = null;
  var master = null;
  var sfxGain = null;
  var delay = null;
  var feedback = null;
  var wet = null;
  var musicTimer = null;
  var trackTimer = null;
  var step = 0;
  var trackIndex = 0;
  var musicOn = false;
  var userPaused = false;
  var needsGesture = false;
  var sfxOn = readSfx();

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
      master = ctx.createGain();
      master.gain.value = 0;
      master.connect(ctx.destination);

      sfxGain = ctx.createGain();
      sfxGain.gain.value = 0.05;
      sfxGain.connect(ctx.destination);

      delay = ctx.createDelay(1);
      delay.delayTime.value = 0.42;
      feedback = ctx.createGain();
      feedback.gain.value = 0.28;
      wet = ctx.createGain();
      wet.gain.value = 0.2;
      master.connect(delay);
      delay.connect(feedback);
      feedback.connect(delay);
      delay.connect(wet);
      wet.connect(ctx.destination);
    }
    if (ctx.state === "suspended") {
      ctx.resume().catch(function () {});
    }
    return ctx;
  }

  function playTone(frequency, when, duration, volume, wave, destination) {
    var oscillator = ctx.createOscillator();
    var gain = ctx.createGain();
    oscillator.type = wave || "sine";
    oscillator.frequency.setValueAtTime(frequency, when);
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.exponentialRampToValueAtTime(volume, when + 0.09);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);
    oscillator.connect(gain);
    gain.connect(destination);
    oscillator.start(when);
    oscillator.stop(when + duration + 0.08);
  }

  function playStep() {
    if (!musicOn || !ctx || ctx.state !== "running") return;
    var track = TRACKS[trackIndex];
    var chord = track.chords[step % track.chords.length];
    var now = ctx.currentTime + 0.05;

    for (var index = 0; index < chord.length; index += 1) {
      playTone(
        chord[index],
        now + index * 0.05,
        4.4,
        index === 0 ? 0.034 : 0.021,
        index % 2 ? track.wave : "sine",
        master
      );
    }

    var arpeggio = [0, 2, 1, 3, 2, 1, 0, 2];
    playTone(chord[arpeggio[step % arpeggio.length]] * 2, now + 0.35, 2.0, 0.009, "sine", master);

    if (step % 2 === 0) {
      playTone(chord[3] * 2, now + 0.55, 2.4, 0.006, "sine", master);
    }

    if (step % 4 === 0) {
      playTone(chord[0] / 2, now, 5.2, 0.025, "sine", master);
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
    master.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 1.4);
    playStep();
    if (musicTimer) window.clearInterval(musicTimer);
    musicTimer = window.setInterval(playStep, 4600);
    if (trackTimer) window.clearInterval(trackTimer);
    trackTimer = window.setInterval(nextTrack, 60000);
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
    if (ctx) {
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setValueAtTime(Math.max(master.gain.value, 0.0001), ctx.currentTime);
      master.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.6);
    }
    updateMusicButton();
  }

  function nextTrack() {
    trackIndex = (trackIndex + 1) % TRACKS.length;
    step = 0;
    if (musicOn && ctx && ctx.state === "running") {
      playTone(TRACKS[trackIndex].chords[0][0] * 2, ctx.currentTime + 0.1, 0.9, 0.012, "sine", master);
    }
    updateMusicButton();
  }

  function updateMusicButton() {
    musicButton.classList.toggle("active", musicOn);
    musicButton.classList.toggle("attention", needsGesture && !musicOn);
    musicButton.setAttribute("aria-pressed", musicOn ? "true" : "false");
    musicButton.setAttribute("aria-label", musicOn ? "إيقاف موسيقى الموقع" : "تشغيل موسيقى الموقع");
    musicButton.title = musicOn ? "الموسيقى: " + TRACKS[trackIndex].name : "تشغيل موسيقى الموقع";
    if (musicLabel) musicLabel.textContent = musicOn ? "إيقاف" : "موسيقى";
  }

  function updateSfxButton() {
    sfxButton.classList.toggle("active", sfxOn);
    sfxButton.setAttribute("aria-pressed", sfxOn ? "true" : "false");
    sfxButton.setAttribute("aria-label", sfxOn ? "كتم أصوات الأزرار" : "تشغيل أصوات الأزرار");
    if (sfxLabel) sfxLabel.textContent = sfxOn ? "أصوات" : "صامت";
  }

  function playUiSound() {
    if (!sfxOn) return;
    ensureContext();
    if (ctx.state !== "running") return;
    var now = ctx.currentTime + 0.01;
    playTone(660, now, 0.14, 0.04, "sine", sfxGain);
    playTone(990, now + 0.07, 0.18, 0.02, "sine", sfxGain);
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
