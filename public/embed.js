(function () {
  var script = document.currentScript;
  if (!script || !script.src) return;
  var origin = new URL(script.src).origin;
  var OPTIONS = ["theme", "lang", "size", "style", "reciter", "accent", "bg", "card", "text", "radius", "host"];

  var query = new URLSearchParams();
  OPTIONS.forEach(function (name) {
    var value = script.getAttribute("data-" + name);
    if (value) query.set(name, value);
  });

  var frame = document.createElement("iframe");
  frame.src = origin + "/embed" + (query.toString() ? "?" + query.toString() : "");
  frame.title = "Tilawah";
  frame.loading = "lazy";
  frame.allow = "autoplay; encrypted-media";
  frame.setAttribute("scrolling", "no");
  frame.style.cssText = "display:block;width:100%;max-width:36rem;margin:0 auto;border:0;height:" + (script.getAttribute("data-size") === "compact" ? "24rem" : "40rem");

  window.addEventListener("message", function (event) {
    if (event.origin !== origin || event.source !== frame.contentWindow) return;
    var data = event.data;
    if (data && data.type === "tilawah:resize" && typeof data.height === "number" && data.height > 0) frame.style.height = Math.ceil(data.height) + "px";
  });

  var target = script.getAttribute("data-target");
  var container = target && document.querySelector(target);
  if (container) container.appendChild(frame);
  else script.parentNode.insertBefore(frame, script.nextSibling);
})();
