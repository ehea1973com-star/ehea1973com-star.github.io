(function () {
  var dock = document.getElementById("soundDock");
  var sfxButton = document.getElementById("sfxToggle");
  var sfxLabel = sfxButton ? sfxButton.querySelector(".sound-label") : null;

  if (!sfxButton) {
    if (dock) dock.hidden = true;
    return;
  }

  var AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    if (dock) dock.hidden = true;
    return;
  }

  var ctx = null;
  var compressor = null;
  var sfxGain = null;
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
      compressor = ctx.createDynamicsCompressor();
      compressor.threshold.value = -18;
      compressor.knee.value = 20;
      compressor.ratio.value = 6;
      compressor.attack.value = 0.003;
      compressor.release.value = 0.2;
      compressor.connect(ctx.destination);

      sfxGain = ctx.createGain();
      sfxGain.gain.value = 0.18;
      sfxGain.connect(compressor);
    }
    if (ctx.state === "suspended") {
      ctx.resume().catch(function () {});
    }
    return ctx;
  }

  function playTone(frequency, when, duration, volume, wave, destination) {
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = wave || "sine";
    osc.frequency.setValueAtTime(frequency, when);
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.exponentialRampToValueAtTime(volume, when + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);
    osc.connect(gain);
    gain.connect(destination);
    osc.start(when);
    osc.stop(when + duration + 0.04);
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
    playTone(880, now, 0.09, 0.06, "sine", sfxGain);
    playTone(1320, now + 0.045, 0.1, 0.035, "triangle", sfxGain);
  }

  sfxButton.addEventListener("click", function () {
    sfxOn = !sfxOn;
    writeSfx(sfxOn);
    updateSfxButton();
    if (sfxOn) playUiSound();
  });

  document.addEventListener("click", function (event) {
    var target = event.target && event.target.closest ? event.target.closest("a,button,[role='button']") : null;
    if (!target) return;
    if (target === sfxButton) return;
    if (target.closest && target.closest(".sound-dock")) return;
    playUiSound();
  }, true);

  document.addEventListener("pointerdown", function () {
    if (ctx && ctx.state === "suspended") ctx.resume().catch(function () {});
  }, { passive: true });

  updateSfxButton();
})();
