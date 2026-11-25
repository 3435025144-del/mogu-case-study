(function () {
  "use strict";

  document.documentElement.classList.add("js");

  var presentationMode = true;
  if (presentationMode) document.documentElement.classList.add("presentation");

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var menuButton = document.querySelector(".menu-toggle");
  var siteNav = document.querySelector(".site-nav");

  if (menuButton && siteNav) {
    menuButton.addEventListener("click", function () {
      var open = siteNav.classList.toggle("is-open");
      menuButton.setAttribute("aria-expanded", String(open));
    });

    siteNav.addEventListener("click", function (event) {
      if (!event.target.closest("a")) return;
      siteNav.classList.remove("is-open");
      menuButton.setAttribute("aria-expanded", "false");
    });
  }

  var revealItems = document.querySelectorAll("[data-reveal]");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealItems.forEach(function (item) {
      item.classList.add("is-visible");
    });
  } else {
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -7% 0px", threshold: 0.08 }
    );

    revealItems.forEach(function (item) {
      revealObserver.observe(item);
    });
  }

  var navLinks = Array.prototype.slice.call(document.querySelectorAll(".site-nav a"));
  var navMap = {
    top: "",
    context: "",
    product: "",
    research: "research",
    why: "problem-def",
    journey: "journey",
    "problem-def": "problem-def",
    brainstorm: "brainstorm",
    improvements: "improvements",
    "wow-1": "improvements",
    "wow-2": "improvements",
    "wow-3": "improvements",
    "wow-4": "improvements",
    system: "improvements",
    "system-character": "improvements",
    widgets: "improvements",
    testing: "testing",
    demo: "demo"
  };
  var sections = Array.prototype.slice.call(document.querySelectorAll("main > section"));

  function setActiveNav(id) {
    var target = navMap[id] || id;
    navLinks.forEach(function (link) {
      link.classList.toggle(
        "is-active",
        Boolean(target) && link.getAttribute("href") === "#" + target
      );
    });
  }

  if (sections.length && "IntersectionObserver" in window && !presentationMode) {
    var sectionObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) setActiveNav(entry.target.id);
        });
      },
      { rootMargin: "-28% 0px -60% 0px", threshold: 0 }
    );

    sections.forEach(function (section) {
      sectionObserver.observe(section);
    });
  }

  function clearActiveAtTop() {
    if (window.scrollY > 360) return;
    navLinks.forEach(function (link) {
      link.classList.remove("is-active");
    });
  }

  function setupPresentation() {
    if (!presentationMode || !sections.length) return;
    var current = 0;
    var slides = [];
    var prevButton = document.querySelector("[data-deck-prev]");
    var nextButton = document.querySelector("[data-deck-next]");
    var currentLabel = document.querySelector("[data-deck-current]");
    var totalLabel = document.querySelector("[data-deck-total]");

    function cloneHeader(header) {
      var clone = header.cloneNode(true);
      clone.setAttribute("aria-hidden", "true");
      clone.classList.add("deck-clone-header");
      clone.removeAttribute("id");
      clone.querySelectorAll("[id]").forEach(function (el) {
        el.removeAttribute("id");
      });
      return clone;
    }

    function outerHeight(el) {
      var styles = window.getComputedStyle(el);
      return el.getBoundingClientRect().height
        + (parseFloat(styles.marginTop) || 0)
        + (parseFloat(styles.marginBottom) || 0);
    }

    function deckMetrics(container) {
      var probe = document.createElement("div");
      probe.className = "deck-group";
      var inner = document.createElement("div");
      inner.className = "deck-group__inner";
      probe.appendChild(inner);
      container.appendChild(probe);
      var groupStyles = window.getComputedStyle(probe);
      var innerStyles = window.getComputedStyle(inner);
      var metrics = {
        available: Math.max(240, probe.clientHeight
          - (parseFloat(groupStyles.paddingTop) || 0)
          - (parseFloat(groupStyles.paddingBottom) || 0)),
        gap: parseFloat(innerStyles.rowGap) || 24
      };
      probe.parentNode.removeChild(probe);
      return metrics;
    }

    function fitSlides() {
      slides.forEach(function (slide) {
        if (!slide.inner || !slide.group) return;
        if (slide.section.classList.contains("features")) return;
        slide.inner.style.zoom = "1";
        var styles = window.getComputedStyle(slide.group);
        var available = slide.group.clientHeight
          - (parseFloat(styles.paddingTop) || 0)
          - (parseFloat(styles.paddingBottom) || 0);
        var content = slide.inner.scrollHeight;
        if (!available || !content || content <= available) return;
        var scale = Math.max(0.5, Math.min(1, available / content));
        slide.inner.style.zoom = String(scale);
      });
    }

    function buildSlides() {
      document.querySelectorAll(".deck-group").forEach(function (group) {
        group.querySelectorAll(".deck-clone-header").forEach(function (clone) {
          clone.parentNode.removeChild(clone);
        });
        var inner = group.querySelector(":scope > .deck-group__inner") || group;
        while (inner.firstChild) group.parentNode.appendChild(inner.firstChild);
        group.parentNode.removeChild(group);
      });

      slides = [];
      sections.forEach(function (section) {
        var container = section.querySelector(":scope > .wrap") || section;
        var children = Array.prototype.slice.call(container.children);
        if (!children.length) {
          slides.push({ section: section, group: null, inner: null });
          return;
        }

        container.querySelectorAll("img").forEach(function (img) {
          if (!img.complete) img.addEventListener("load", fitSlides, { once: true });
        });

        var metrics = deckMetrics(container);
        var header = children.filter(function (el) {
          return el.classList && el.classList.contains("section-head");
        })[0];
        var headerExtra = header ? header.getBoundingClientRect().height + metrics.gap : 0;
        var heights = children.map(outerHeight);
        var total = heights.reduce(function (sum, h) { return sum + h; }, 0)
          + metrics.gap * (children.length - 1);

        var count = 1;
        var singleSlide = section.classList.contains("cover")
          || section.classList.contains("features")
          || section.classList.contains("product")
          || section.classList.contains("why")
          || section.classList.contains("journey")
          || section.classList.contains("brainstorm-sec")
          || section.classList.contains("improvements")
          || section.classList.contains("testing")
          || section.classList.contains("wow-page")
          || section.classList.contains("system-page");
        if (!singleSlide) {
          while (count < children.length) {
            var capacity = 0;
            for (var i = 0; i < count; i += 1) {
              capacity += Math.max(200, metrics.available - (i > 0 ? headerExtra : 0));
            }
            if (capacity >= total) break;
            count += 1;
          }
        }

        var target = (total + (count - 1) * headerExtra) / count;
        var buckets = [];
        for (var b = 0; b < count; b += 1) buckets.push([]);
        var bucket = 0;
        var used = 0;
        children.forEach(function (child, index) {
          var h = heights[index];
          var add = buckets[bucket].length ? metrics.gap + h : h;
          var limit = target - (bucket > 0 ? headerExtra : 0);
          var forceBreak = child.classList && child.classList.contains("versions-panel")
            && bucket < buckets.length - 1;
          if (forceBreak || (buckets[bucket].length && used + add > limit
            && bucket < buckets.length - 1)) {
            bucket += 1;
            used = 0;
            add = h;
          }
          buckets[bucket].push(child);
          used += add;
        });
        buckets = buckets.filter(function (items) { return items.length; });

        buckets.forEach(function (items, index) {
          var group = document.createElement("div");
          group.className = "deck-group";
          var inner = document.createElement("div");
          inner.className = "deck-group__inner";
          if (index > 0 && header) inner.appendChild(cloneHeader(header));
          items.forEach(function (el) { inner.appendChild(el); });
          group.appendChild(inner);
          container.appendChild(group);
          slides.push({ section: section, group: group, inner: inner });
        });
      });
      if (totalLabel) totalLabel.textContent = String(slides.length);
      fitSlides();
    }

    function slideForHash(hash) {
      if (!hash) return -1;
      var raw = String(hash).replace(/^#/, "");
      try { raw = decodeURIComponent(raw); } catch (err) { /* keep raw hash */ }
      var el = document.getElementById(raw);
      if (!el || !el.closest) return -1;
      var section = el.closest("main > section");
      if (!section) return -1;
      for (var i = 0; i < slides.length; i += 1) {
        if (slides[i].section === section) return i;
      }
      return -1;
    }

    function show(index, updateHash) {
      if (!slides.length) return;
      current = Math.max(0, Math.min(slides.length - 1, index));
      var active = slides[current];
      slides.forEach(function (slide, i) {
        slide.section.classList.toggle("is-active", slide.section === active.section);
        if (slide.group) slide.group.classList.toggle("is-slide-active", i === current);
      });
      if (currentLabel) currentLabel.textContent = String(current + 1);
      setActiveNav(active.section.id);
      if (updateHash && active.section.id) {
        try { history.replaceState(null, "", "#" + active.section.id); }
        catch (err) { window.location.hash = active.section.id; }
      }
      window.requestAnimationFrame(fitSlides);
    }

    function next() { show(current + 1, true); }
    function prev() { show(current - 1, true); }

    function rebuild() {
      var activeSection = slides[current] && slides[current].section;
      buildSlides();
      var target = 0;
      if (activeSection) {
        for (var i = 0; i < slides.length; i += 1) {
          if (slides[i].section === activeSection) { target = i; break; }
        }
      }
      show(target, false);
    }

    if (prevButton) prevButton.addEventListener("click", prev);
    if (nextButton) nextButton.addEventListener("click", next);

    navLinks.forEach(function (link) {
      link.addEventListener("click", function (event) {
        var target = slideForHash(link.getAttribute("href") || "");
        if (target < 0) return;
        event.preventDefault();
        if (siteNav) siteNav.classList.remove("is-open");
        if (menuButton) menuButton.setAttribute("aria-expanded", "false");
        show(target, true);
      });
    });

    document.addEventListener("keydown", function (event) {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      var key = event.key;
      if (key === "ArrowRight" || key === "PageDown" || key === " " || key === "Spacebar") {
        event.preventDefault();
        next();
      } else if (key === "ArrowLeft" || key === "PageUp") {
        event.preventDefault();
        prev();
      } else if (key === "Home") {
        event.preventDefault();
        show(0, true);
      } else if (key === "End") {
        event.preventDefault();
        show(slides.length - 1, true);
      }
    });

    var wheelLocked = false;
    window.addEventListener("wheel", function (event) {
      if (wheelLocked) return;
      event.preventDefault();
      wheelLocked = true;
      if (event.deltaY > 0) next(); else prev();
      window.setTimeout(function () { wheelLocked = false; }, 650);
    }, { passive: false });

    var rebuildTimer;
    window.addEventListener("resize", function () {
      window.clearTimeout(rebuildTimer);
      rebuildTimer = window.setTimeout(rebuild, 140);
    });
    window.addEventListener("load", rebuild);

    buildSlides();
    var initial = slideForHash(window.location.hash);
    show(initial >= 0 ? initial : 0, false);
  }

  function setupParallax() {
    if (reduceMotion) return;
    var items = document.querySelectorAll("[data-parallax]");
    if (!items.length) return;

    var prepared = [];
    items.forEach(function (el) {
      var computed = window.getComputedStyle(el).transform;
      prepared.push({
        el: el,
        factor: parseFloat(el.getAttribute("data-parallax") || "0"),
        base: computed && computed !== "none" ? computed : ""
      });
    });

    var ticking = false;
    function update() {
      ticking = false;
      var vh = window.innerHeight;
      prepared.forEach(function (item) {
        var hero = item.el.closest(".hero");
        if (!hero) return;
        var rect = hero.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > vh) return;
        var delta = vh * 0.5 - (rect.top + rect.height * 0.5);
        var offset = Math.max(-36, Math.min(36, delta * item.factor));
        item.el.style.transform = "translate3d(0," + offset.toFixed(1) + "px,0) " + item.base;
      });
    }
    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    update();
  }

  function setupHeroMouseParallax() {
    if (reduceMotion || !window.matchMedia("(hover: hover)").matches) return;
    var cover = document.querySelector(".cover");
    if (!cover) return;
    var items = Array.prototype.slice.call(cover.querySelectorAll("[data-mouse]"));
    if (!items.length) return;

    var prepared = items.map(function (el) {
      return {
        el: el,
        factor: parseFloat(el.getAttribute("data-mouse")) || 0
      };
    });

    var ticking = false;
    var pointerX = 0;
    var pointerY = 0;

    function render() {
      ticking = false;
      var amp = 12;
      prepared.forEach(function (item) {
        var mx = (pointerX * amp * item.factor).toFixed(2);
        var my = (pointerY * amp * item.factor).toFixed(2);
        item.el.style.setProperty("--mx", mx + "px");
        item.el.style.setProperty("--my", my + "px");
      });
    }

    function onMove(event) {
      pointerX = (event.clientX / window.innerWidth - 0.5) * 2;
      pointerY = (event.clientY / window.innerHeight - 0.5) * 2;
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(render);
    }

    function onLeave() {
      pointerX = 0;
      pointerY = 0;
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(render);
    }

    window.addEventListener("mousemove", onMove, { passive: true });
    document.addEventListener("mouseleave", onLeave);
  }

  function setupHashReveal() {
    if (presentationMode || !window.location.hash) return;
    var id = window.location.hash.slice(1);
    try { id = decodeURIComponent(id); } catch (err) { /* keep raw hash */ }
    var target = document.getElementById(id);
    if (!target) return;
    target.classList.add("is-visible");
    target.querySelectorAll("[data-reveal]").forEach(function (item) {
      item.classList.add("is-visible");
    });
    window.setTimeout(function () {
      try { target.scrollIntoView({ block: "start" }); } catch (err) { target.scrollIntoView(); }
    }, 60);
  }

  setupPresentation();
  setupParallax();
  setupHeroMouseParallax();
  setupHashReveal();
  window.addEventListener("scroll", clearActiveAtTop, { passive: true });
  clearActiveAtTop();
})();
