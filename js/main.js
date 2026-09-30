(() => {
  const body = document.body;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const desktop = matchMedia("(min-width: 1024px)");
  const isFP = () => desktop.matches;
  const PAGE = reduce ? 0 : 1080;

  const fp = document.getElementById("fp");
  const track = document.getElementById("track");
  const sections = [...document.querySelectorAll(".sec")];
  const hd = document.getElementById("hd");
  let index = 0, busy = false, locked = false;

  /* ── 헤더 ── */
  function applyTheme(sec) {
    // 푸터가 보일 때 화면 위쪽은 바로 앞 섹션이므로 헤더 색은 그 섹션 기준
    const top = sec.id === "footer" && isFP() ? sections[sections.indexOf(sec) - 1] : sec;
    // 메인 비주얼은 지금 보이는 장면이 어두운 사진이면 흰 헤더
    const dark = top.id === "main" ? !!top.querySelector(".mv.is-active.mv--dark") : top.dataset.hd === "dark";
    hd.classList.toggle("is-w", dark);
    hd.classList.toggle("is-foot", sec.id === "footer" && isFP());
    // 왼쪽 바로가기: 지금 보고 있는 섹션 표시
    const cur = sections.indexOf(top);
    document.querySelectorAll(".qnav [data-go]").forEach((q) => q.setAttribute("aria-current", String(Number(q.dataset.go) === cur)));
  }
  const gnb = document.querySelector(".gnb");
  // 펼침 패널 높이 = 가장 긴 하위 메뉴 높이 (메뉴가 패널 밖으로 삐져나오지 않게)
  const setDrop = () => hd.style.setProperty("--drop", Math.max(...[...gnb.querySelectorAll(".gnb__sub")].map((u) => u.offsetHeight)) + "px");
  setDrop(); addEventListener("resize", setDrop);
  gnb.addEventListener("mouseenter", () => hd.classList.add("is-open"));
  hd.addEventListener("mouseleave", () => hd.classList.remove("is-open"));
  gnb.addEventListener("focusin", () => hd.classList.add("is-open"));
  gnb.addEventListener("focusout", (e) => { if (!gnb.contains(e.relatedTarget)) hd.classList.remove("is-open"); });

  /* ── 페이드 슬라이더 (메인 비주얼, LIFE) ── */
  function Fade(root) {
    const slides = [...root.querySelectorAll(".fade__slide")];
    const dotsEl = root.querySelector(".ctrl__dots");
    const label = root.querySelector(".ctrl__label");
    const playBtn = root.querySelector(".ctrl__play");
    // 휴대폰에서는 data-mobile-delay 값이 있으면 그 시간으로 전환
    const mobileMQ = matchMedia("(max-width: 1023px)");
    const getDelay = () => Number((mobileMQ.matches && root.dataset.mobileDelay) || root.dataset.delay) || 3500;
    let delay = getDelay();
    root.style.setProperty("--delay", delay + "ms");
    let cur = 0, timer = null, active = false, paused = reduce;
    const dots = slides.map((s, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.setAttribute("aria-label", `${i + 1}번 슬라이드: ${s.dataset.label}`);
      b.addEventListener("click", () => { show(i); });
      dotsEl.append(b);
      return b;
    });
    function show(n) {
      n = (n + slides.length) % slides.length;
      slides.forEach((s, i) => s.classList.toggle("is-active", i === n));
      dots.forEach((d, i) => d.setAttribute("aria-current", String(i === n)));
      label.textContent = slides[n].dataset.label;
      cur = n;
      root.dispatchEvent(new Event("slidechange"));
      schedule();
    }
    function schedule() {
      clearTimeout(timer);
      root.classList.remove("is-run");
      if (!active || paused) return;
      delay = getDelay();
      root.style.setProperty("--delay", delay + "ms");
      void root.offsetWidth;                // 진행 바 다시 시작
      root.classList.add("is-run");
      timer = setTimeout(() => show(cur + 1), delay);
    }
    playBtn.addEventListener("click", () => {
      paused = !paused;
      playBtn.classList.toggle("is-paused", paused);
      playBtn.setAttribute("aria-label", paused ? "자동 재생 시작" : "자동 재생 일시정지");
      schedule();
    });
    playBtn.classList.toggle("is-paused", paused);
    let sx = null;
    root.addEventListener("touchstart", (e) => { sx = e.touches[0].clientX; }, { passive: true });
    root.addEventListener("touchend", (e) => {
      if (sx === null) return;
      const dx = sx - e.changedTouches[0].clientX; sx = null;
      if (Math.abs(dx) > 50) show(cur + (dx > 0 ? 1 : -1));
    });
    show(0);
    return {
      // 섹션에 도착할 때마다 첫 장면부터 다시 시작 (레퍼런스와 동일)
      start() { active = true; show(cur); },
      stop() { active = false; schedule(); },
    };
  }
  // 메인 장면이 바뀔 때 헤더 색도 장면에 맞춤
  document.getElementById("mv").addEventListener("slidechange", () => {
    const main = sections[0];
    const onMain = isFP() ? index === 0 : main.getBoundingClientRect().bottom > hd.offsetHeight / 2;
    if (onMain && !hd.classList.contains("is-solid")) applyTheme(main);
  });
  const sliders = { main: Fade(document.getElementById("mv")), life: Fade(document.getElementById("lf")) };

  /* ── HIGH END LIFE 카드 캐러셀 (무한 반복, 3.5초 자동) ── */
  const premium = (() => {
    const track = document.getElementById("premium-track");
    const cards = [...track.children];
    const total = cards.length;
    const cur = document.querySelector(".premium__cur");
    document.querySelector(".premium__total").textContent = String(total).padStart(2, "0");
    let idx = 0, timer = null, active = false, moving = false, hover = false, pending = null;
    // 넘어가는 중에 누른 버튼은 끝난 뒤 이어서 실행
    const done = () => { moving = false; if (pending) { const f = pending; pending = null; f(); } };
    const step = () => cards[0].getBoundingClientRect().width + parseFloat(getComputedStyle(track).gap);
    const setNum = () => { cur.textContent = String(idx + 1).padStart(2, "0"); };
    function next() {
      if (moving) { pending = next; return; }
      moving = true;
      track.style.transition = reduce ? "none" : "transform 1.5s cubic-bezier(.65,0,.35,1)";
      track.style.transform = `translateX(${-step()}px)`;
      idx = (idx + 1) % total; setNum();
      setTimeout(() => {
        track.style.transition = "none";
        track.append(track.firstElementChild);
        track.style.transform = "none";
        done();
      }, reduce ? 0 : 1500);
    }
    function prev() {
      if (moving) { pending = prev; return; }
      moving = true;
      track.style.transition = "none";
      track.prepend(track.lastElementChild);
      track.style.transform = `translateX(${-step()}px)`;
      void track.offsetWidth;
      track.style.transition = reduce ? "none" : "transform 1.5s cubic-bezier(.65,0,.35,1)";
      track.style.transform = "none";
      idx = (idx - 1 + total) % total; setNum();
      setTimeout(done, reduce ? 0 : 1500);
    }
    // 도착 직후 첫 카드는 3초 뒤, 그다음부터는 7초마다 넘어감
    function schedule(wait = 7000) {
      clearTimeout(timer);
      if (!active || hover || reduce) return;
      timer = setTimeout(() => { if (!moving) next(); schedule(); }, wait);
    }
    document.querySelector(".premium__next").addEventListener("click", () => { next(); schedule(); });
    document.querySelector(".premium__prev").addEventListener("click", () => { prev(); schedule(); });
    const vp = track.parentElement;
    // 마우스를 실제로 올렸을 때만 멈춤 (터치는 '올림' 상태가 풀리지 않아 자동 넘김이 멈추므로 제외)
    vp.addEventListener("pointerenter", (e) => { if (e.pointerType !== "mouse") return; hover = true; schedule(); });
    vp.addEventListener("pointerleave", (e) => { if (e.pointerType !== "mouse") return; hover = false; schedule(); });
    let sx = null;
    vp.addEventListener("touchstart", (e) => { sx = e.touches[0].clientX; }, { passive: true });
    vp.addEventListener("touchend", (e) => {
      if (sx === null) return;
      const dx = sx - e.changedTouches[0].clientX; sx = null;
      if (Math.abs(dx) > 40) { dx > 0 ? next() : prev(); schedule(); }
    });
    return {
      // 화면이 넘어오는 동안 커서가 카드 자리에 놓여 있던 것은 '올림'으로 치지 않음
      start() { if (active) return; active = true; hover = false; schedule(3000); },
      stop() { active = false; schedule(); },
    };
  })();

  /* ── 홍보영상 ── */
  const video = (() => {
    const player = document.getElementById("pr-player");
    const items = [...document.querySelectorAll(".pr__item")];
    let id = items[0].dataset.yt;
    const watch = (v) => `https://www.youtube.com/watch?v=${v}`;
    function poster(v, title) {
      player.innerHTML = `<button class="pr__poster" type="button"><img src="https://i.ytimg.com/vi/${v}/maxresdefault.jpg" alt="" onerror="this.onerror=null;this.src='https://i.ytimg.com/vi/${v}/hqdefault.jpg'"><span class="pr__play" aria-hidden="true"></span><span class="sr-only">${title} 재생</span></button>`;
      player.firstChild.addEventListener("click", () => play(v));
    }
    function play(v) {
      // 파일을 직접 연 상태(file://)에서는 유튜브가 퍼가기를 막으므로 유튜브에서 재생
      if (location.protocol === "file:") { window.open(watch(v), "_blank", "noopener"); return; }
      player.innerHTML = `<iframe src="https://www.youtube.com/embed/${v}?autoplay=1&mute=1&rel=0&playsinline=1" title="홍보영상" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>`;
    }
    items.forEach((it) => it.addEventListener("click", () => {
      items.forEach((x) => x.classList.toggle("is-active", x === it));
      id = it.dataset.yt;
      const title = it.querySelector("b").textContent;
      if (player.querySelector("iframe")) play(id); else poster(id, title);
    }));
    poster(id, items[0].querySelector("b").textContent);
    return { stop() { if (player.querySelector("iframe")) { const a = items.find((x) => x.classList.contains("is-active")); poster(id, a.querySelector("b").textContent); } } };
  })();

  /* ── 섹션 도착·떠남 ── */
  function arrive(sec) {
    sec.classList.add("is-in");
    if (sec.id === "footer") sections[sections.indexOf(sec) - 1].classList.add("is-in");
    if (sec.id === "main") sliders.main.start();
    if (sec.id === "life") sliders.life.start();
    if (sec.id === "premium") premium.start();
  }
  function leave(sec) {
    if (sec.id === "main") sliders.main.stop();
    if (sec.id === "life") sliders.life.stop();
    if (sec.id === "premium") premium.stop();
    if (sec.id === "pr") video.stop();
  }

  /* ── 풀페이지 이동 ── */
  const offsetFor = (i) => Math.min(sections[i].offsetTop, Math.max(0, track.scrollHeight - innerHeight));
  function goTo(i, instant = false) {
    i = Math.max(0, Math.min(sections.length - 1, i));
    if (!isFP()) { sections[i].scrollIntoView({ behavior: reduce ? "auto" : "smooth" }); return; }
    if ((busy || i === index) && !instant) return;
    const prev = sections[index];
    index = i; busy = true;
    const keep = sections[i].id === "footer" ? sections[i - 1] : null;
    sections.forEach((s) => { if (s !== keep) s.classList.remove("is-in"); });
    if (prev !== sections[i] && prev !== keep) leave(prev);
    applyTheme(sections[i]);
    hd.classList.remove("is-open");
    track.style.transition = instant ? "none" : "";
    track.style.transform = `translate3d(0, ${-offsetFor(i)}px, 0)`;
    setTimeout(() => { busy = false; arrive(sections[i]); }, instant ? 0 : PAGE);
  }

  let lastWheel = 0, gestureUsed = false;
  addEventListener("wheel", (e) => {
    if (!isFP() || locked) return;
    e.preventDefault();
    const now = performance.now();
    if (now - lastWheel > 220) gestureUsed = false;
    lastWheel = now;
    if (busy || gestureUsed || Math.abs(e.deltaY) < 6) return;
    gestureUsed = true;
    goTo(index + (e.deltaY > 0 ? 1 : -1));
  }, { passive: false });

  addEventListener("keydown", (e) => {
    // 키 입력 대상이 요소가 아닐 수도 있음(문서 자체 등) → 안전하게 확인
    const el = e.target instanceof Element ? e.target : document.body;
    if (!isFP() || locked || el.closest("input, select, textarea")) return;
    const onControl = el.closest("button, a");
    let n = null;
    if (e.key === "ArrowDown" || e.key === "PageDown" || (e.key === " " && !onControl)) n = index + 1;
    if (e.key === "ArrowUp" || e.key === "PageUp") n = index - 1;
    if (e.key === "Home" && !onControl) n = 0;
    if (e.key === "End" && !onControl) n = sections.length - 1;
    if (n === null) return;
    e.preventDefault(); goTo(n);
  });

  let touchY = null;
  fp.addEventListener("touchstart", (e) => { touchY = e.touches[0].clientY; }, { passive: true });
  fp.addEventListener("touchend", (e) => {
    if (!isFP() || locked || touchY === null) return;
    const dy = touchY - e.changedTouches[0].clientY; touchY = null;
    if (Math.abs(dy) > 50) goTo(index + (dy > 0 ? 1 : -1));
  });
  fp.addEventListener("scroll", () => { if (isFP()) fp.scrollTop = 0; });
  document.addEventListener("focusin", (e) => {
    if (!isFP() || locked) return;
    const i = sections.indexOf(e.target.closest(".sec"));
    if (i > -1 && i !== index) { busy = false; goTo(i); }
  });

  document.addEventListener("click", (e) => {
    const a = e.target.closest("[data-go]");
    if (!a) return;
    e.preventDefault();
    if (!sitemap.hidden) closeSitemap(false);
    goTo(Number(a.dataset.go));
  });

  /* ── 태블릿·모바일: 일반 스크롤 ── */
  const io = new IntersectionObserver((entries) => entries.forEach((en) => {
    if (en.isIntersecting) arrive(en.target);
    else if (!isFP()) leave(en.target);
  }), { threshold: 0.25 });
  let ticking = false;
  function mobileHeader() {
    ticking = false;
    const probe = hd.offsetHeight / 2;
    const sec = sections.find((s) => { const r = s.getBoundingClientRect(); return r.top <= probe && r.bottom > probe; }) || sections[0];
    applyTheme(sec);
    hd.classList.toggle("is-solid", scrollY > innerHeight * 0.6);
  }
  addEventListener("scroll", () => { if (isFP() || ticking) return; ticking = true; requestAnimationFrame(mobileHeader); }, { passive: true });

  function setupMode() {
    if (isFP()) {
      io.disconnect();
      hd.classList.remove("is-solid");
      track.style.transition = "none";
      track.style.transform = `translate3d(0, ${-offsetFor(index)}px, 0)`;
      sections.forEach((s, i) => { if (i !== index) { s.classList.remove("is-in"); leave(s); } });
      applyTheme(sections[index]);
      arrive(sections[index]);
    } else {
      track.style.transform = "";
      sections.forEach((s) => io.observe(s));
      mobileHeader();
    }
  }
  desktop.addEventListener("change", setupMode);
  addEventListener("resize", () => {
    if (!isFP()) return;
    track.style.transition = "none";
    track.style.transform = `translate3d(0, ${-offsetFor(index)}px, 0)`;
  });

  /* ── 전체 메뉴 ── */
  const sitemap = document.getElementById("sitemap");
  const menuBtn = document.querySelector(".hd__menu");
  function openSitemap() { sitemap.hidden = false; locked = true; menuBtn.setAttribute("aria-expanded", "true"); sitemap.querySelector("a").focus(); }
  function closeSitemap(back = true) { sitemap.hidden = true; locked = false; menuBtn.setAttribute("aria-expanded", "false"); if (back) menuBtn.focus(); }
  menuBtn.addEventListener("click", openSitemap);
  sitemap.querySelector(".sitemap__close").addEventListener("click", () => closeSitemap());

  /* ── 패밀리 사이트 ── */
  const famBtn = document.querySelector(".family__bt");
  const famList = document.getElementById("family-list");
  famBtn.addEventListener("click", () => { famList.hidden = !famList.hidden; famBtn.setAttribute("aria-expanded", String(!famList.hidden)); });
  document.addEventListener("click", (e) => { if (!e.target.closest(".family")) { famList.hidden = true; famBtn.setAttribute("aria-expanded", "false"); } });

  /* ── 방문 예약 모달 ── */
  const rsv = document.getElementById("rsv");
  let rsvOpener = null;
  function openRsv(opener, privacyOnly = false) {
    rsvOpener = opener;
    if (!sitemap.hidden) closeSitemap(false);
    rsv.hidden = false; locked = true;
    (privacyOnly ? rsv.querySelector(".privacy") : document.getElementById("name")).scrollIntoView({ block: "center" });
    document.getElementById("name").focus({ preventScroll: privacyOnly });
  }
  function closeRsv() { rsv.hidden = true; locked = false; if (rsvOpener) rsvOpener.focus(); }
  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-reserve]");
    if (t) { e.preventDefault(); openRsv(t); }
  });
  rsv.querySelectorAll("[data-close]").forEach((b) => b.addEventListener("click", closeRsv));

  // 열린 창에서 Esc로 닫기, Tab은 창 안에서만 순환
  document.addEventListener("keydown", (e) => {
    const dlg = !rsv.hidden ? rsv : !sitemap.hidden ? sitemap : null;
    if (!dlg) return;
    if (e.key === "Escape") { dlg === rsv ? closeRsv() : closeSitemap(); return; }
    if (e.key !== "Tab") return;
    const f = [...dlg.querySelectorAll("a, button, input, select")].filter((x) => x.offsetParent !== null && !x.disabled);
    if (!f.length) return;
    if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
    else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
  });

  /* ── 시작 ── */
  setupMode();
})();
