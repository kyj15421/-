/* 하위 페이지 공통 동작: 헤더, 전체 메뉴, 탭, 영상, 알림 */
(() => {
  const hd = document.getElementById("hd");

  /* 헤더: 메뉴 영역에 올리면 하위 메뉴 패널, 스크롤하면 흰 배경 */
  const gnb = document.querySelector(".gnb");
  // 펼침 패널 높이 = 가장 긴 하위 메뉴 높이 (메뉴가 패널 밖으로 삐져나오지 않게)
  const setDrop = () => hd.style.setProperty("--drop", Math.max(...[...gnb.querySelectorAll(".gnb__sub")].map((u) => u.offsetHeight)) + "px");
  setDrop(); addEventListener("resize", setDrop);
  gnb.addEventListener("mouseenter", () => hd.classList.add("is-open"));
  hd.addEventListener("mouseleave", () => hd.classList.remove("is-open"));
  gnb.addEventListener("focusin", () => hd.classList.add("is-open"));
  gnb.addEventListener("focusout", (e) => { if (!gnb.contains(e.relatedTarget)) hd.classList.remove("is-open"); });
  const onScroll = () => hd.classList.toggle("is-solid", scrollY > 40);
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* 전체 메뉴 */
  const sitemap = document.getElementById("sitemap");
  const menuBtn = document.querySelector(".hd__menu");
  const open = () => { sitemap.hidden = false; menuBtn.setAttribute("aria-expanded", "true"); document.body.style.overflow = "hidden"; sitemap.querySelector("a").focus(); };
  const close = () => { sitemap.hidden = true; menuBtn.setAttribute("aria-expanded", "false"); document.body.style.overflow = ""; menuBtn.focus(); };
  menuBtn.addEventListener("click", open);
  sitemap.querySelector(".sitemap__close").addEventListener("click", close);
  document.addEventListener("keydown", (e) => {
    if (sitemap.hidden) return;
    if (e.key === "Escape") close();
    if (e.key === "Tab") {
      const f = [...sitemap.querySelectorAll("a, button")];
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    }
  });

  /* 패밀리 사이트 */
  const famBtn = document.querySelector(".family__bt");
  const famList = document.getElementById("family-list");
  if (famBtn) {
    famBtn.addEventListener("click", () => { famList.hidden = !famList.hidden; famBtn.setAttribute("aria-expanded", String(!famList.hidden)); });
    document.addEventListener("click", (e) => { if (!e.target.closest(".family")) { famList.hidden = true; famBtn.setAttribute("aria-expanded", "false"); } });
  }

  /* 영상: 썸네일 → 재생 (파일로 직접 연 상태에서는 유튜브 새 창) */
  function mountVideo(box) {
    const id = box.dataset.yt, title = box.dataset.title;
    box.innerHTML = `<button class="pr__poster" type="button"><img src="https://i.ytimg.com/vi/${id}/maxresdefault.jpg" alt="" onerror="this.onerror=null;this.src='https://i.ytimg.com/vi/${id}/hqdefault.jpg'"><span class="pr__play" aria-hidden="true"></span><span class="sr-only">${title} 재생</span></button>`;
    box.firstChild.addEventListener("click", () => {
      if (location.protocol === "file:") { window.open(`https://www.youtube.com/watch?v=${id}`, "_blank", "noopener"); return; }
      box.innerHTML = `<iframe src="https://www.youtube.com/embed/${id}?autoplay=1&rel=0&playsinline=1" title="${title}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>`;
    });
  }
  document.querySelectorAll(".vd").forEach(mountVideo);

  /* 탭 (방향키로 이동 가능) */
  document.querySelectorAll(".tabs").forEach((t) => {
    const list = t.querySelector(":scope > .tabs__list");
    const btns = [...list.children];
    const panels = [...t.querySelectorAll(":scope > .tabs__panel")];
    function select(i, focus) {
      btns.forEach((b, k) => { b.setAttribute("aria-selected", String(k === i)); b.tabIndex = k === i ? 0 : -1; });
      panels.forEach((p, k) => {
        if (k !== i && !p.hidden) p.querySelectorAll(".vd iframe").forEach((f) => mountVideo(f.parentElement)); // 숨기는 탭의 영상 정지
        p.hidden = k !== i;
      });
      if (focus) btns[i].focus();
    }
    btns.forEach((b, i) => b.addEventListener("click", () => select(i)));
    list.addEventListener("keydown", (e) => {
      const i = btns.indexOf(document.activeElement);
      if (i < 0) return;
      if (e.key === "ArrowRight") { e.preventDefault(); select((i + 1) % btns.length, true); }
      if (e.key === "ArrowLeft") { e.preventDefault(); select((i - 1 + btns.length) % btns.length, true); }
    });
  });

  /* 사업개요: 블록 카드에 커서를 올리거나 누르면 아래 이미지 전환 */
  document.querySelectorAll(".bsel").forEach((box) => {
    const bts = [...box.querySelectorAll(".blocks__bt")];
    const layers = [...box.querySelectorAll(".bview__layer")];
    const show = (i) => {
      bts.forEach((b, k) => { b.classList.toggle("is-active", k === i); b.setAttribute("aria-pressed", String(k === i)); });
      layers.forEach((l, k) => l.classList.toggle("is-active", k === i));
    };
    bts.forEach((b, i) => ["mouseenter", "focus", "click"].forEach((ev) => b.addEventListener(ev, () => show(i))));
  });
  /* 단지 배치도 크게보기 (전체화면) */
  document.querySelectorAll(".bsel").forEach((box) => {
    const btn = box.querySelector(".bzoom");
    if (!btn) return;
    const names = [...box.querySelectorAll(".blocks__bl")].map((e) => e.textContent);
    const srcs = [...box.querySelectorAll(".bview__layer img")].map((i) => i.getAttribute("src"));
    if (!srcs.length) { btn.hidden = true; return; }
    const lb = document.createElement("div");
    lb.className = "lb"; lb.hidden = true;
    lb.setAttribute("role", "dialog"); lb.setAttribute("aria-modal", "true"); lb.setAttribute("aria-label", "단지 배치도 크게보기");
    lb.innerHTML = `<div class="lb__head"><div class="lb__tabs">${names.map((n, i) => `<button type="button" data-i="${i}">${n}</button>`).join("")}</div><button type="button" class="lb__close"><span class="sr-only">닫기</span></button></div><div class="lb__body"><img class="lb__img" alt=""></div><p class="lb__hint">이미지를 누르면 원본 크기로 볼 수 있습니다 · ESC 닫기</p>`;
    document.body.append(lb);
    const im = lb.querySelector(".lb__img");
    const tabs = [...lb.querySelectorAll(".lb__tabs button")];
    const set = (i) => {
      im.src = srcs[i]; im.alt = `${names[i]} 단지 배치도`;
      im.style.animation = "none"; void im.offsetWidth; im.style.animation = "";
      tabs.forEach((t, k) => t.setAttribute("aria-pressed", String(k === i)));
      lb.classList.remove("is-full");
    };
    const close = () => { lb.hidden = true; document.body.style.overflow = ""; btn.focus(); };
    btn.addEventListener("click", () => {
      const cur = [...box.querySelectorAll(".blocks__bt")].findIndex((b) => b.classList.contains("is-active"));
      set(Math.max(0, cur)); lb.hidden = false; document.body.style.overflow = "hidden"; lb.querySelector(".lb__close").focus();
    });
    tabs.forEach((t, i) => t.addEventListener("click", () => set(i)));
    im.addEventListener("click", () => lb.classList.toggle("is-full"));
    lb.querySelector(".lb__close").addEventListener("click", close);
    lb.addEventListener("click", (e) => { if (e.target === lb.querySelector(".lb__body")) close(); });
    lb.addEventListener("keydown", (e) => {
      if (e.key === "Escape") close();
      if (e.key === "Tab") { const f = [...lb.querySelectorAll("button")]; const k = f.indexOf(document.activeElement);
        e.preventDefault(); f[(k + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus(); }
    });
  });
  /* 이미지 한 장 크게보기: data-zoom 이 있는 요소를 누르면 전체화면 */
  document.querySelectorAll("[data-zoom]").forEach((el) => {
    let lb = null, im;
    const close = () => { lb.hidden = true; document.body.style.overflow = ""; el.focus(); };
    const open = () => {
      if (!lb) {
        lb = document.createElement("div");
        lb.className = "lb lb--single"; lb.hidden = true;
        lb.setAttribute("role", "dialog"); lb.setAttribute("aria-modal", "true"); lb.setAttribute("aria-label", el.getAttribute("aria-label") || "이미지 크게보기");
        lb.innerHTML = `<div class="lb__head"><button type="button" class="lb__close"><span class="sr-only">닫기</span></button></div><div class="lb__body"><img class="lb__img" alt=""></div><p class="lb__hint">이미지를 누르면 원본 크기로 볼 수 있습니다 · ESC 닫기</p>`;
        document.body.append(lb);
        im = lb.querySelector(".lb__img");
        im.alt = el.querySelector("img") ? el.querySelector("img").alt : "";
        im.addEventListener("load", () => lb.style.setProperty("--nw", im.naturalWidth + "px"));
        im.src = el.dataset.zoom;
        im.addEventListener("click", () => lb.classList.toggle("is-full"));
        lb.querySelector(".lb__close").addEventListener("click", close);
        lb.addEventListener("click", (e) => { if (e.target === lb.querySelector(".lb__body")) close(); });
        lb.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); if (e.key === "Tab") e.preventDefault(); });
      }
      lb.classList.remove("is-full");
      lb.hidden = false; document.body.style.overflow = "hidden"; lb.querySelector(".lb__close").focus();
    };
    el.addEventListener("click", open);
    el.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } });
  });
  /* 숲 지도 정원 핫스팟 → 해당 정원 이미지 전체화면 */
  const spots = [...document.querySelectorAll("[data-spot]")];
  if (spots.length) {
    const lb = document.createElement("div");
    lb.className = "lb lb--single"; lb.hidden = true;
    lb.setAttribute("role", "dialog"); lb.setAttribute("aria-modal", "true");
    lb.innerHTML = `<p class="lb__cap"></p><div class="lb__head"><button type="button" class="lb__close"><span class="sr-only">닫기</span></button></div><div class="lb__body"><img class="lb__img" alt=""></div><p class="lb__hint">ESC 또는 바깥을 누르면 닫힙니다</p>`;
    document.body.append(lb);
    const im = lb.querySelector(".lb__img"), cap = lb.querySelector(".lb__cap");
    let opener = null;
    im.addEventListener("load", () => lb.style.setProperty("--nw", im.naturalWidth + "px"));
    const close = () => { lb.hidden = true; document.body.style.overflow = ""; if (opener) opener.focus(); };
    spots.forEach((b) => b.addEventListener("click", () => {
      opener = b;
      im.src = b.dataset.spot; im.alt = b.dataset.title; cap.textContent = b.dataset.title;
      lb.setAttribute("aria-label", b.dataset.title);
      im.style.animation = "none"; void im.offsetWidth; im.style.animation = "";
      lb.hidden = false; document.body.style.overflow = "hidden"; lb.querySelector(".lb__close").focus();
    }));
    lb.querySelector(".lb__close").addEventListener("click", close);
    lb.addEventListener("click", (e) => { if (e.target === lb.querySelector(".lb__body")) close(); });
    lb.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); if (e.key === "Tab") e.preventDefault(); });
  }
  /* 아직 파일이 없는 PDF·크게보기 버튼 */
  const toast = document.getElementById("toast");
  let tt;
  document.addEventListener("click", (e) => {
    if (!e.target.closest("[data-pdf]")) return;
    e.preventDefault();
    toast.textContent = "파일이 아직 등록되지 않았습니다. 분양 문의 1668-4480";
    toast.hidden = false;
    clearTimeout(tt);
    tt = setTimeout(() => { toast.hidden = true; }, 3000);
  });
})();
