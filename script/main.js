// Portfolio interactions: theme toggle, sticky nav, active section, reveal-on-scroll.
(function () {
  "use strict";

  var root = document.documentElement;
  root.classList.add("js");

  // ----- Theme toggle -----
  var toggle = document.getElementById("theme-toggle");
  var themeMeta = document.querySelector('meta[name="theme-color"]');

  function applyTheme(theme) {
    root.dataset.theme = theme;
    if (themeMeta) themeMeta.setAttribute("content", theme === "light" ? "#f7f7f4" : "#0b0d12");
  }

  applyTheme(root.dataset.theme || "light");

  if (toggle) {
    toggle.addEventListener("click", function () {
      var next = root.dataset.theme === "light" ? "dark" : "light";
      applyTheme(next);
      try { localStorage.setItem("theme", next); } catch (e) {}
    });
  }

  // ----- Nav background on scroll -----
  var nav = document.getElementById("nav");
  function onScroll() {
    if (nav) nav.classList.toggle("is-scrolled", window.scrollY > 8);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // ----- Footer year -----
  var year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());

  // ----- Analytics: click tracking (Google Analytics 4 + Seline) -----
  function track(name, params) {
    try { if (typeof window.gtag === "function") window.gtag("event", name, params); } catch (e) {}
    try { if (window.seline && typeof window.seline.track === "function") window.seline.track(name, params); } catch (e) {}
  }

  function classifyLink(a) {
    var href = a.getAttribute("href") || "";
    if (/\.pdf($|\?)/i.test(href)) return "resume_open";
    if (href.indexOf("mailto:") === 0) return "email_click";
    if (/linkedin\.com/i.test(href)) return "linkedin_click";
    if (a.closest("#achievements")) return "certificate_click";
    if (a.closest("#profiles")) return "profile_click";
    if (/^https?:/i.test(href) && a.hostname !== location.hostname) return "outbound_click";
    return null;
  }

  function linkLocation(a) {
    if (a.closest(".nav")) return "nav";
    var section = a.closest("section[id]");
    return section ? section.id : "other";
  }

  function linkLabel(a) {
    var heading = a.querySelector("h3, span:not(.link-hint)");
    return ((heading || a).textContent || "").replace(/\s+/g, " ").trim().slice(0, 80);
  }

  document.addEventListener("click", function (event) {
    var a = event.target.closest ? event.target.closest("a[href]") : null;
    if (!a) return;
    var name = classifyLink(a);
    if (!name) return;
    track(name, {
      link_label: linkLabel(a),
      link_location: linkLocation(a),
      link_url: a.href
    });
  });

  if (!("IntersectionObserver" in window)) {
    document.querySelectorAll(".reveal").forEach(function (el) { el.classList.add("is-visible"); });
    return;
  }

  // ----- Analytics: which sections people actually reach -----
  var seenSections = {};
  var sectionViewObserver = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        var id = entry.target.id;
        if (!entry.isIntersecting || seenSections[id]) return;
        seenSections[id] = true;
        track("section_view", { section_name: id });
        sectionViewObserver.unobserve(entry.target);
      });
    },
    { rootMargin: "0px 0px -35% 0px", threshold: 0 }
  );
  document.querySelectorAll("main section[id]").forEach(function (s) {
    if (s.id !== "top") sectionViewObserver.observe(s);
  });

  // ----- Reveal on scroll -----
  var revealObserver = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
  );
  document.querySelectorAll(".reveal").forEach(function (el) { revealObserver.observe(el); });

  // ----- Active nav link -----
  var links = document.querySelectorAll(".nav-links a");
  var linkById = {};
  links.forEach(function (a) { linkById[a.getAttribute("href").slice(1)] = a; });

  var sectionObserver = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        links.forEach(function (a) { a.classList.remove("is-active"); });
        var link = linkById[entry.target.id];
        if (link) link.classList.add("is-active");
      });
    },
    { rootMargin: "-45% 0px -50% 0px" }
  );
  Object.keys(linkById).forEach(function (id) {
    var section = document.getElementById(id);
    if (section) sectionObserver.observe(section);
  });
})();
