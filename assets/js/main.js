(function () {
  "use strict";
  const $ = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- header state ---------- */
  const header = $(".site-header");
  const overDark = header && header.classList.contains("over-dark");
  function onScroll() {
    if (!header) return;
    const y = window.scrollY;
    if (y > 40) header.classList.add("solid");
    else header.classList.remove("solid");
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- mobile menu ---------- */
  const burger = $(".burger");
  const mnav = $(".mobile-nav");
  if (burger && mnav) {
    const toggle = (open) => {
      burger.classList.toggle("open", open);
      mnav.classList.toggle("open", open);
      document.body.style.overflow = open ? "hidden" : "";
      burger.setAttribute("aria-expanded", open ? "true" : "false");
    };
    burger.addEventListener("click", () => toggle(!mnav.classList.contains("open")));
    $$(".m-link", mnav).forEach((a) => a.addEventListener("click", () => toggle(false)));
  }

  /* ---------- stagger groups ---------- */
  $$("[data-stagger]").forEach((group) => {
    const base = parseFloat(group.dataset.stagger) || 0.07;
    $$("[data-reveal]", group).forEach((el, i) => {
      if (!el.hasAttribute("data-d")) el.style.setProperty("--rd", (i * base).toFixed(2) + "s");
    });
  });

  /* ---------- reveal on scroll ---------- */
  const reveals = $$("[data-reveal]");
  if (reveals.length && "IntersectionObserver" in window && !reduce) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("in"));
  }

  /* ---------- count up ---------- */
  const counters = $$("[data-count]");
  if (counters.length && "IntersectionObserver" in window && !reduce) {
    const cio = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          const el = e.target;
          const target = parseFloat(el.dataset.count);
          const suffix = el.dataset.suffix || "";
          const dur = 1400;
          const start = performance.now();
          const step = (now) => {
            const p = Math.min((now - start) / dur, 1);
            const eased = 1 - Math.pow(1 - p, 3);
            el.textContent = Math.round(target * eased) + suffix;
            if (p < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
          cio.unobserve(el);
        });
      },
      { threshold: 0.6 }
    );
    counters.forEach((el) => cio.observe(el));
  }

  /* ---------- magnetic buttons ---------- */
  if (!reduce && window.matchMedia("(pointer:fine)").matches) {
    $$("[data-magnetic]").forEach((el) => {
      const strength = 0.22; // насколько сильно тянется к курсору
      const ease = 0.15;     // плавность догона (меньше = мягче)
      const lift = 2;        // лёгкий подъём при наведении, px
      let tx = 0, ty = 0;    // целевые
      let cx = 0, cy = 0;    // текущие
      let raf = null, active = false;

      const loop = () => {
        cx += (tx - cx) * ease;
        cy += (ty - cy) * ease;
        const done = Math.abs(tx - cx) < 0.1 && Math.abs(ty - cy) < 0.1;
        if (done) { cx = tx; cy = ty; }
        if (!active && done) {
          el.style.transform = "";   // вернулись в исходную точку
          el.style.transition = "";  // отдаём управление обратно CSS
          raf = null;
          return;
        }
        const liftY = active ? cy - lift : cy;
        el.style.transform = `translate3d(${cx.toFixed(2)}px, ${liftY.toFixed(2)}px, 0)`;
        raf = requestAnimationFrame(loop);
      };
      const start = () => { if (!raf) raf = requestAnimationFrame(loop); };

      el.addEventListener("mouseenter", () => {
        active = true;
        el.style.transition = "none"; // движение целиком ведёт rAF
        start();
      });
      el.addEventListener("mousemove", (ev) => {
        const r = el.getBoundingClientRect();
        tx = (ev.clientX - r.left - r.width / 2) * strength;
        ty = (ev.clientY - r.top - r.height / 2) * strength;
      });
      el.addEventListener("mouseleave", () => {
        active = false;
        tx = 0; ty = 0;
        start();
      });
    });
  }

  /* ---------- parallax layers (scroll comes alive) ---------- */
  const plx = $$("[data-parallax-speed]");
  if (plx.length && !reduce) {
    let ticking = false;
    const apply = () => {
      const vh = window.innerHeight;
      plx.forEach((el) => {
        const r = el.getBoundingClientRect();
        const mid = r.top + r.height / 2;
        const prog = (mid - vh / 2) / vh; // -1..1 across viewport
        const speed = parseFloat(el.dataset.parallaxSpeed) || 0;
        el.style.transform = `translate3d(0, ${(prog * speed).toFixed(1)}px, 0)`;
      });
      ticking = false;
    };
    const onPlx = () => { if (!ticking) { ticking = true; requestAnimationFrame(apply); } };
    window.addEventListener("scroll", onPlx, { passive: true });
    window.addEventListener("resize", onPlx, { passive: true });
    apply();
  }

  /* ---------- timeline scroll-fill ---------- */
  const tl = $("[data-timeline]");
  if (tl && !reduce) {
    let tick = false;
    const fill = () => {
      const r = tl.getBoundingClientRect();
      const vh = window.innerHeight;
      const start = vh * 0.78, end = vh * 0.34;
      const p = (start - r.top) / (start - end + r.height);
      tl.style.setProperty("--fill", Math.max(0, Math.min(1, p)).toFixed(3));
      tick = false;
    };
    const onTl = () => { if (!tick) { tick = true; requestAnimationFrame(fill); } };
    window.addEventListener("scroll", onTl, { passive: true });
    window.addEventListener("resize", onTl, { passive: true });
    fill();
  }

  /* ---------- hero fit: size hero to one screen ---------- */
  const heroEl = $(".hero");
  const setHeroH = () => {
    if (!heroEl) return;
    const top = heroEl.getBoundingClientRect().top + window.scrollY;
    document.documentElement.style.setProperty("--hero-h", Math.max(540, window.innerHeight - top) + "px");
  };
  setHeroH();
  window.addEventListener("resize", setHeroH, { passive: true });
  window.addEventListener("orientationchange", setHeroH);

  /* ---------- scroll progress ---------- */
  const sp = $(".scroll-progress i");
  if (sp) {
    const upd = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      sp.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + "%";
    };
    window.addEventListener("scroll", upd, { passive: true });
    upd();
  }

  /* ---------- IČO stamp press-in ---------- */
  const stamp = $(".stamp");
  if (stamp && !reduce && typeof stamp.animate === "function") {
    stamp.animate(
      [
        { opacity: 0, transform: "rotate(-36deg) scale(1.7)", filter: "blur(2px)" },
        { opacity: 0.95, transform: "rotate(-7deg) scale(.9)", filter: "blur(0)", offset: 0.55 },
        { transform: "rotate(-13deg) scale(1.05)", offset: 0.72 },
        { opacity: 0.9, transform: "rotate(-11deg) scale(1)", filter: "blur(0)" }
      ],
      { duration: 1050, easing: "cubic-bezier(.16,1,.3,1)", fill: "none" }
    );
  }

  /* ---------- process active step ---------- */
  const steps = $$(".step");
  if (steps.length && "IntersectionObserver" in window && !reduce) {
    const sio = new IntersectionObserver(
      (es) => es.forEach((e) => { if (e.isIntersecting) e.target.classList.add("active"); }),
      { threshold: 0.45, rootMargin: "0px 0px -25% 0px" }
    );
    steps.forEach((s) => sio.observe(s));
  } else {
    steps.forEach((s) => s.classList.add("active"));
  }

  /* ---------- video lightbox ---------- */
  const lb = $("#lightbox");
  if (lb) {
    const frame = $(".lb-frame", lb);
    const closeBtn = $(".lb-close", lb);
    const open = (id) => {
      frame.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1" title="Видео-гайд" allow="autoplay; encrypted-media; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>`;
      lb.classList.add("open"); lb.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
    };
    const close = () => {
      lb.classList.remove("open"); lb.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
      setTimeout(() => { frame.innerHTML = ""; }, 420);
    };
    $$("[data-yt]").forEach((el) => {
      el.addEventListener("click", (e) => { e.preventDefault(); open(el.getAttribute("data-yt")); });
      if (el.getAttribute("role") === "button") {
        el.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(el.getAttribute("data-yt")); }
        });
      }
    });
    closeBtn.addEventListener("click", close);
    lb.addEventListener("click", (e) => { if (e.target === lb) close(); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && lb.classList.contains("open")) close(); });
  }

  /* ---------- services index hover preview ---------- */
  const svcIndex = $("[data-svc-index]");
  if (svcIndex && !reduce && window.matchMedia("(hover:hover) and (min-width:861px)").matches) {
    const preview = $(".svc-preview", svcIndex);
    const pimg = preview && $("img", preview);
    let raf = null, tx = 0, ty = 0, cx = 0, cy = 0, started = false;
    const lerp = (a, b, n) => a + (b - a) * n;
    function loop() {
      cx = lerp(cx, tx, 0.13);
      cy = lerp(cy, ty, 0.13);
      if (preview) preview.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%) scale(1)`;
      raf = requestAnimationFrame(loop);
    }
    svcIndex.addEventListener("mousemove", (e) => {
      const r = svcIndex.getBoundingClientRect();
      tx = e.clientX - r.left;
      ty = e.clientY - r.top;
      if (!started) { started = true; cx = tx; cy = ty; loop(); }
    });
    $$(".svc-row", svcIndex).forEach((row) => {
      row.addEventListener("mouseenter", () => {
        const src = row.getAttribute("data-img");
        if (pimg && src && !pimg.src.endsWith(src)) pimg.src = src;
        svcIndex.classList.add("preview-on");
      });
    });
    svcIndex.addEventListener("mouseleave", () => svcIndex.classList.remove("preview-on"));
  }

  /* ---------- FAQ accordion ---------- */
  $$(".faq-item").forEach((item) => {
    const q = $(".faq-q", item);
    const a = $(".faq-a", item);
    if (!q || !a) return;
    q.addEventListener("click", () => {
      const open = item.classList.contains("open");
      if (open) {
        item.classList.remove("open");
        a.style.maxHeight = null;
        q.setAttribute("aria-expanded", "false");
      } else {
        item.classList.add("open");
        a.style.maxHeight = a.scrollHeight + "px";
        q.setAttribute("aria-expanded", "true");
      }
    });
  });

  /* ---------- journal filters ---------- */
  const chips = $$(".chip");
  if (chips.length) {
    chips.forEach((chip) => {
      chip.addEventListener("click", () => {
        chips.forEach((c) => c.classList.remove("on"));
        chip.classList.add("on");
        const cat = chip.dataset.cat;
        $$(".pcard").forEach((card) => {
          const show = cat === "all" || card.dataset.cat === cat;
          card.style.display = show ? "" : "none";
        });
      });
    });
  }

  /* ---------- journal sidebar categories ---------- */
  const catLinks = $$(".cat-nav .cat-link");
  if (catLinks.length) {
    const cards = $$(".jcard");
    catLinks.forEach((link) => {
      link.addEventListener("click", () => {
        catLinks.forEach((l) => l.classList.remove("on"));
        link.classList.add("on");
        const cat = link.dataset.cat;
        cards.forEach((card) => {
          card.hidden = !(cat === "all" || card.dataset.cat === cat);
        });
      });
    });
  }

  /* ---------- segmented (messenger choice) ---------- */
  $$(".seg").forEach((seg) => {
    const buttons = $$("button", seg);
    const input = $("input[type=hidden]", seg.parentElement) || $(".seg-value", seg.parentElement);
    buttons.forEach((b) =>
      b.addEventListener("click", () => {
        buttons.forEach((x) => x.classList.remove("on"));
        b.classList.add("on");
        if (input) input.value = b.dataset.val;
      })
    );
  });

  /* ---------- contact form ---------- */
  const form = $("#leadForm");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      let ok = true;
      $$(".field[data-required]", form).forEach((f) => {
        const inp = $("input, textarea", f);
        const valid = inp && inp.value.trim().length > 1;
        f.classList.toggle("invalid", !valid);
        if (!valid) ok = false;
      });
      if (!ok) {
        const first = $(".field.invalid input, .field.invalid textarea", form);
        if (first) first.focus();
        return;
      }
      form.style.display = "none";
      const success = $("#formSuccess");
      if (success) success.classList.add("on");
    });
    $$(".field input, .field textarea", form).forEach((inp) =>
      inp.addEventListener("input", () => inp.closest(".field").classList.remove("invalid"))
    );
  }

  /* ---------- reviews wall expand/collapse ---------- */
  const rvWall = $("#rvWall");
  const rvToggle = $("#rvToggle");
  if (rvWall && rvToggle) {
    const txt = $(".rv-more-txt", rvToggle);
    rvToggle.addEventListener("click", () => {
      const collapsed = rvWall.classList.toggle("is-collapsed");
      rvToggle.setAttribute("aria-expanded", collapsed ? "false" : "true");
      if (txt) txt.textContent = collapsed ? "Показать все 209 отзывов" : "Свернуть отзывы";
      if (collapsed) {
        const top = $("#reviews");
        if (top) window.scrollTo({ top: top.offsetTop - 80, behavior: reduce ? "auto" : "smooth" });
      }
    });
  }

  /* ---------- star rating input ---------- */
  const rvRate = $("#rvRate");
  if (rvRate) {
    const starsBtn = $$(".rv-rate-st", rvRate);
    const hidden = $("#rvRating");
    const paint = (n, cls) => starsBtn.forEach((b, i) => b.classList.toggle(cls, i < n));
    const setVal = (n) => {
      paint(n, "on");
      starsBtn.forEach((b, i) => b.setAttribute("aria-checked", i + 1 === n ? "true" : "false"));
      if (hidden) hidden.value = String(n);
      const f = rvRate.closest(".field");
      if (f) f.classList.remove("invalid");
    };
    starsBtn.forEach((b) => {
      const v = parseInt(b.dataset.v, 10);
      b.addEventListener("mouseenter", () => paint(v, "hot"));
      b.addEventListener("click", () => setVal(v));
      b.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setVal(v); } });
    });
    rvRate.addEventListener("mouseleave", () => paint(0, "hot"));
  }

  /* ---------- review submit ---------- */
  const rvForm = $("#reviewForm");
  if (rvForm) {
    const palette = ["#1a73e8", "#d93025", "#188038", "#e37400", "#9334e6", "#12805c", "#c5221f", "#00639b", "#b06000"];
    const validate = () => {
      let ok = true;
      $$(".field[data-required]", rvForm).forEach((f) => {
        const inp = $("input, textarea", f);
        const valid = inp && inp.value.trim().length > 1;
        f.classList.toggle("invalid", !valid);
        if (!valid) ok = false;
      });
      const rf = $(".field[data-required-rating]", rvForm);
      if (rf) {
        const r = $("#rvRating").value;
        const valid = r && parseInt(r, 10) > 0;
        rf.classList.toggle("invalid", !valid);
        if (!valid) ok = false;
      }
      return ok;
    };
    rvForm.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!validate()) {
        const first = $(".field.invalid input, .field.invalid textarea", rvForm);
        if (first) first.focus();
        return;
      }
      const name = $("#rvName").value.trim();
      const from = ($("#rvFrom") ? $("#rvFrom").value.trim() : "");
      const text = $("#rvText").value.trim();
      const rating = parseInt($("#rvRating").value, 10) || 5;
      const cols = $(".rv-columns");
      if (cols) {
        const card = document.createElement("article");
        card.className = "gr-card";
        const init = name.charAt(0).toUpperCase();
        const color = palette[(name.length + init.charCodeAt(0)) % palette.length];
        let stars = "";
        for (let i = 1; i <= 5; i++) stars += '<i class="' + (i <= rating ? "on" : "") + '">★</i>';
        const sub = from ? escapeHtml(from) + " · только что" : "только что";
        card.innerHTML =
          '<div class="gr-top"><span class="gr-av" style="background:' + color + '">' + init + "</span>" +
          '<span class="gr-meta"><span class="gr-name">' + escapeHtml(name) + '</span><span class="gr-sub">' + sub + '</span></span>' +
          '<span class="gr-src" aria-hidden="true"></span></div>' +
          '<div class="gr-stars" role="img" aria-label="Оценка ' + rating + ' из 5">' + stars + "</div>" +
          '<p class="gr-text">' + escapeHtml(text) + "</p>";
        card.style.animation = "fadeUp .5s var(--ease) both";
        cols.insertBefore(card, cols.firstChild);
        if (rvWall && rvWall.classList.contains("is-collapsed")) {
          rvWall.classList.remove("is-collapsed");
          if (rvToggle) {
            rvToggle.setAttribute("aria-expanded", "true");
            const t = $(".rv-more-txt", rvToggle);
            if (t) t.textContent = "Свернуть отзывы";
          }
        }
      }
      rvForm.style.display = "none";
      const done = $("#rvFormDone");
      if (done) done.classList.add("on");
    });
    $$(".field input, .field textarea", rvForm).forEach((inp) =>
      inp.addEventListener("input", () => inp.closest(".field").classList.remove("invalid"))
    );
  }

  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  /* ---------- newsletter ---------- */
  const nl = $("#nlForm");
  if (nl) {
    nl.addEventListener("submit", (e) => {
      e.preventDefault();
      const inp = $("input", nl);
      if (inp && inp.value.includes("@")) {
        nl.innerHTML = '<p style="color:#d8bd86;font-weight:600;">Готово! Спасибо за подписку - первое письмо придёт в ближайшую рассылку.</p>';
      } else if (inp) {
        inp.focus();
      }
    });
  }

  /* ---------- footer year ---------- */
  $$("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));

  /* ---------- made-by link: point non-RU versions to the global site ---------- */
  if (document.documentElement.lang !== "ru") {
    $$(".madeby").forEach((a) => (a.href = "https://buildbyalex.com/"));
  }

  /* ---------- quiz ---------- */
  initQuiz();
  function initQuiz() {
    const quiz = $("#quiz");
    if (!quiz) return;
    const steps = $$(".quiz-step", quiz);
    const resultBox = $(".quiz-result", quiz);
    const bar = $(".quiz-progress .bar i", quiz);
    const counter = $(".quiz-progress .q-count", quiz);
    const total = steps.length;
    let current = 0;
    const answers = {};

    const results = {
      relocate: {
        tag: "Рекомендуем",
        title: "ВНЖ и ПМЖ в Словакии",
        text: "Под вашу ситуацию подойдёт оформление вида на жительство с перспективой ПМЖ. Подберём основание, соберём документы и проведём до карты резидента.",
        href: "services/vnz-pmz.html",
      },
      business: {
        tag: "Рекомендуем",
        title: "Открытие бизнеса и ВНЖ предпринимателя",
        text: "Зарегистрируем s.r.o. или živnosť, откроем счёт и поставим бухгалтерию. На базе бизнеса оформим вид на жительство.",
        href: "services/vnz-pmz.html",
      },
      accounting: {
        tag: "Рекомендуем",
        title: "Бухгалтерия и налоги",
        text: "Возьмём учёт, отчётность и взносы на себя - без штрафов и просрочек. Подскажем выгодную форму налогообложения.",
        href: "services/vnz-pmz.html",
      },
      study: {
        tag: "Рекомендуем",
        title: "Обучение в Словакии",
        text: "Поможем с поступлением в вуз, школу или детский сад и оформим сопутствующий вид на жительство для учёбы.",
        href: "services/vnz-pmz.html",
      },
      realty: {
        tag: "Рекомендуем",
        title: "Недвижимость в Словакии",
        text: "Подберём аренду или объект под покупку - для жизни или под инвестиции, с проверкой документов и сопровождением сделки.",
        href: "services/vnz-pmz.html",
      },
      visa: {
        tag: "Рекомендуем",
        title: "Визы и гражданство",
        text: "Поможем с визами в США, Канаду, Великобританию и Австралию, а также с программами гражданства за инвестиции.",
        href: "services/vnz-pmz.html",
      },
    };

    function show(i) {
      steps.forEach((s, idx) => s.classList.toggle("on", idx === i));
      resultBox.classList.remove("on");
      if (bar) bar.style.width = ((i) / total) * 100 + "%";
      if (counter) counter.textContent = i + 1;
    }
    function finish() {
      steps.forEach((s) => s.classList.remove("on"));
      const key = answers.goal || "relocate";
      const r = results[key] || results.relocate;
      resultBox.querySelector(".qr-tag").textContent = r.tag;
      resultBox.querySelector("h3").textContent = r.title;
      resultBox.querySelector("p").textContent = r.text;
      const link = resultBox.querySelector("[data-result-link]");
      if (link) link.setAttribute("href", r.href);
      resultBox.classList.add("on");
      if (bar) bar.style.width = "100%";
    }

    $$(".quiz-opt", quiz).forEach((opt) => {
      opt.addEventListener("click", () => {
        const key = opt.dataset.key;
        const val = opt.dataset.val;
        if (key) answers[key] = val;
        if (current < total - 1) {
          current++;
          show(current);
        } else {
          finish();
        }
      });
    });
    $$(".quiz-back:not([data-quiz-restart])", quiz).forEach((b) =>
      b.addEventListener("click", (e) => {
        e.preventDefault();
        if (current > 0) {
          current--;
          show(current);
        }
      })
    );
    const restart = $("[data-quiz-restart]", quiz);
    if (restart)
      restart.addEventListener("click", (e) => {
        e.preventDefault();
        current = 0;
        show(0);
      });
    show(0);
  }
})();
