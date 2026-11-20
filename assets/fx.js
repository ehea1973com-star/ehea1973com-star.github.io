(function () {
  function ready(fn){ if (document.readyState !== "loading") fn(); else document.addEventListener("DOMContentLoaded", fn); }

  function ensureLayer(){
    var layer = document.getElementById("fxLayer");
    if (layer) return layer;
    layer = document.createElement("div");
    layer.id = "fxLayer";
    layer.className = "fx-layer";
    layer.setAttribute("aria-hidden", "true");
    document.body.appendChild(layer);
    return layer;
  }

  function burstAt(x, y, count){
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    var layer = ensureLayer();
    var symbols = ["❄","✦","✧","★","✶","❅","✺","•"];
    var colors = ["#7cf4ff","#9d8cff","#ff8bd1","#ffe08a","#ffffff"];
    for (var i=0;i<count;i++){
      var p = document.createElement("span");
      p.className = "fx-particle";
      var sym = symbols[Math.floor(Math.random()*symbols.length)];
      p.textContent = sym;
      var size = 10 + Math.random()*18;
      var dx = (Math.random() - 0.5) * 220;
      var dy = 80 + Math.random()*320;
      var rot = (Math.random() - 0.5) * 540;
      var dur = 900 + Math.random()*1200;
      var delay = Math.random()*120;
      p.style.left = x + "px";
      p.style.top = y + "px";
      p.style.fontSize = size + "px";
      p.style.color = colors[Math.floor(Math.random()*colors.length)];
      p.style.setProperty("--dx", dx.toFixed(1) + "px");
      p.style.setProperty("--dy", dy.toFixed(1) + "px");
      p.style.setProperty("--rot", rot.toFixed(1) + "deg");
      p.style.animationDuration = dur + "ms";
      p.style.animationDelay = delay + "ms";
      layer.appendChild(p);
      (function(el, life){ setTimeout(function(){ if(el && el.parentNode) el.parentNode.removeChild(el); }, life); })(p, dur + delay + 100);
    }
  }

  function burstFromEl(el){
    var r = el.getBoundingClientRect();
    burstAt(r.left + r.width/2, r.top + r.height/2 + window.scrollY*0, 18);
  }

  function isInternalNav(a){
    if (!a) return false;
    if (a.target === "_blank") return false;
    if (a.hasAttribute("download")) return false;
    var href = a.getAttribute("href") || "";
    if (!href || href.charAt(0) === "#" ) return false;
    if (/^(mailto:|tel:|javascript:)/i.test(href)) return false;
    try {
      var url = new URL(href, window.location.href);
      if (url.origin !== window.location.origin) return false;
      // same page hash-only handled above
      if (url.pathname === window.location.pathname && url.hash) return false;
      return true;
    } catch(e){ return false; }
  }

  ready(function(){
    document.body.classList.add("page-enter");
    requestAnimationFrame(function(){
      requestAnimationFrame(function(){ document.body.classList.add("page-enter-active"); });
    });

    document.addEventListener("click", function(ev){
      var t = ev.target;
      if (!t || !t.closest) return;
      var btn = t.closest("button, .btn, .mini-btn, .google-chip, .nav-toggle, .install-btn, .modal-close, [role='button']");
      if (btn){
        var x = ev.clientX, y = ev.clientY;
        if ((!x && x !== 0) || (!y && y !== 0)) {
          var r = btn.getBoundingClientRect();
          x = r.left + r.width/2; y = r.top + r.height/2;
        }
        burstAt(x, y, btn.classList.contains("btn") || btn.tagName === "BUTTON" ? 22 : 14);
      }
    }, false);

    document.addEventListener("click", function(ev){
      var t = ev.target;
      if (!t || !t.closest) return;
      var a = t.closest("a");
      if (!a) return;
      if (ev.defaultPrevented) return;
      if (ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey || ev.button !== 0) return;
      if (!isInternalNav(a)) return;
      ev.preventDefault();
      var href = a.href;
      document.body.classList.add("page-leave");
      burstFromEl(a);
      setTimeout(function(){ window.location.href = href; }, 220);
    }, false);

    window.addEventListener("pageshow", function(){
      document.body.classList.remove("page-leave");
      document.body.classList.add("page-enter","page-enter-active");
    });
  });
})();
