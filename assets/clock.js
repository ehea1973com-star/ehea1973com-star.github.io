(function () {
  var TIME_ZONE = "Asia/Damascus";
  var hourHand = document.getElementById("clockHour");
  var minuteHand = document.getElementById("clockMinute");
  var secondHand = document.getElementById("clockSecond");
  var timeNode = document.getElementById("clockTime");
  var dateNode = document.getElementById("clockDate");
  var hijriNode = document.getElementById("clockHijri");
  var offsetNode = document.getElementById("clockOffset");
  var ticksNode = document.getElementById("clockTicks");

  if (!timeNode || !dateNode || !hourHand || !minuteHand || !secondHand) return;

  function buildTicks() {
    if (!ticksNode) return;
    for (var index = 0; index < 60; index += 1) {
      var tick = document.createElement("span");
      tick.className = "clock-tick" + (index % 5 === 0 ? " major" : "");
      tick.style.setProperty("--angle", (index * 6) + "deg");
      ticksNode.appendChild(tick);
    }
  }

  function parts(now, options) {
    var result = {};
    try {
      new Intl.DateTimeFormat("en-GB", options).formatToParts(now).forEach(function (part) {
        if (part.type !== "literal") result[part.type] = part.value;
      });
    } catch (error) {}
    return result;
  }

  function currentLang() {
    try { return localStorage.getItem("yahya_site_lang") || "ar"; } catch (e) { return "ar"; }
  }
  function localeFor(lang) {
    var map = {ar:"ar-SY",en:"en-US",fr:"fr-FR",es:"es-ES",de:"de-DE",tr:"tr-TR",ru:"ru-RU",pt:"pt-PT",it:"it-IT",nl:"nl-NL",id:"id-ID",hi:"hi-IN",ur:"ur-PK",fa:"fa-IR",zh:"zh-CN",ja:"ja-JP",ko:"ko-KR"};
    return map[lang] || "en-US";
  }
  function hijriLocale(lang) {
    if (lang === "ar" || lang === "ur" || lang === "fa") return lang === "ur" ? "ur-PK-u-ca-islamic-umalqura" : (lang === "fa" ? "fa-IR-u-ca-islamic-umalqura" : "ar-SA-u-ca-islamic-umalqura");
    return "en-US-u-ca-islamic-umalqura";
  }
  function tr(key, fb) {
    try { if (window.YahyaI18n && window.YahyaI18n.t) { var v = window.YahyaI18n.t(key); if (v) return v; } } catch (e) {}
    return fb || "";
  }

  function formatTime(now) {
    try {
      return new Intl.DateTimeFormat(localeFor(currentLang()), {
        timeZone: TIME_ZONE,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true
      }).format(now);
    } catch (error) {
      return "--:--:--";
    }
  }

  function formatDate(now) {
    try {
      return new Intl.DateTimeFormat(localeFor(currentLang()), {
        timeZone: TIME_ZONE,
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
      }).format(now);
    } catch (error) {
      return "";
    }
  }

  function formatHijri(now) {
    try {
      return new Intl.DateTimeFormat(hijriLocale(currentLang()), {
        timeZone: TIME_ZONE,
        day: "numeric",
        month: "long",
        year: "numeric"
      }).format(now);
    } catch (error) {
      return "";
    }
  }

  function formatOffset(now) {
    try {
      var part = new Intl.DateTimeFormat("en-US", {
        timeZone: TIME_ZONE,
        timeZoneName: "shortOffset"
      }).formatToParts(now).filter(function (item) {
        return item.type === "timeZoneName";
      })[0];
      return part ? String(part.value) : tr("clock.damascus","GMT+3");
    } catch (error) {
      return tr("clock.damascus","GMT+3");
    }
  }

  function tick() {
    var now = new Date();
    var values = parts(now, {
      timeZone: TIME_ZONE,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23"
    });
    var hour = Number(values.hour);
    var minute = Number(values.minute);
    var second = Number(values.second);

    if (isNaN(hour)) hour = now.getHours();
    if (isNaN(minute)) minute = now.getMinutes();
    if (isNaN(second)) second = now.getSeconds();

    var secondAngle = second * 6;
    var minuteAngle = minute * 6 + second * 0.1;
    var hourAngle = (hour % 12) * 30 + minute * 0.5;

    secondHand.style.transform = "translateX(-50%) rotate(" + secondAngle + "deg)";
    minuteHand.style.transform = "translateX(-50%) rotate(" + minuteAngle + "deg)";
    hourHand.style.transform = "translateX(-50%) rotate(" + hourAngle + "deg)";

    timeNode.textContent = formatTime(now);
    dateNode.textContent = formatDate(now);
    if (hijriNode) hijriNode.textContent = formatHijri(now);
    if (offsetNode) offsetNode.textContent = formatOffset(now);
  }

  buildTicks();
  tick();
  window.setInterval(tick, 1000);
})();
