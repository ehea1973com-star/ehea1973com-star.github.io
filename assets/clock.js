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

  function formatTime(now) {
    try {
      return new Intl.DateTimeFormat("ar-SY", {
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
      return new Intl.DateTimeFormat("ar-SY", {
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
      return new Intl.DateTimeFormat("ar-SA-u-ca-islamic-umalqura", {
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
      return part ? String(part.value).replace("GMT", "GMT") : "توقيت محلي";
    } catch (error) {
      return "توقيت محلي";
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
