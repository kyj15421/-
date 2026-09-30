/* 주택형 안내: 책장 넘김 + 평면 전체화면 보기 (이전 버전 v2에서 가져옴) */
/* 주택형 책자 — 쪽 순서대로. 이미지를 바꾸려면 images/unit/ 파일만 교체하세요
   types: 그 쪽에 실린 타입과 세로 위치(쪽 높이 대비 비율 top~bottom) — 누르면 상세 보기
   상세 이미지는 images/unit/types/<타입>.jpg */
const PAGES = [
  { src: "images/unit/page-1.jpg", types: [["84A", .04, .3545], ["84B", .3545, .6624], ["102", .6624, .9725]] },
  { src: "images/unit/page-2.jpg", types: [["114", .04, .3545], ["119A", .3545, .6624], ["119B", .6624, .9725]] },
  { src: "images/unit/page-3.jpg", types: [["121", .03, .3478], ["135A", .3478, .6601], ["135B", .6601, .973]] },
  { src: "images/unit/page-4.jpg", types: [["139A", .03, .3478], ["139B-1", .3478, .6601], ["139B-2", .6601, .973]] },
  { src: "images/unit/page-5.jpg", types: [["139C", .03, .3483], ["139D", .3483, .6607], ["166", .6607, .9742]] },
  { src: "images/unit/page-6.jpg", types: [["211P", .03, .5051], ["233P", .5051, .9742]] },
];
const TYPES = PAGES.flatMap((p, i) => p.types.map(([name]) => ({ name, page: i + 1 })));
// 상세 이미지를 교체하면 숫자를 올려 브라우저에 남은 예전 이미지 대신 새 이미지를 불러오게 함
const PLAN_VER = 2;
const planSrc = (name) => `images/unit/types/${name}.jpg?v=${PLAN_VER}`;

(() => {
  if (!document.getElementById("book")) return;
  const body = document.body;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let locked = false;
  const book = (() => {
    const el = document.getElementById("book");
    const label = document.getElementById("book-page");
    const prevBtn = document.getElementById("book-prev");
    const nextBtn = document.getElementById("book-next");
    const singleMQ = matchMedia("(max-width: 767px)");
    const TURN = reduce ? 0 : 1100;
    const LAST = PAGES.length + 1;
    const mark = `<img class="endpaper__emblem" src="images/logo-emblem-gold.png" alt="">`;
    const cover = `<div class="cover"><img class="cover__brand" src="images/logo-full-light.png" alt="롯데캐슬"><p class="cover__en">UNIT PLAN</p><p class="cover__ko">중앙공원 롯데캐슬 주택형 안내</p><p class="cover__num">${TYPES.length} TYPES</p></div>`;
    const end = `<div class="endpage"><p class="endpage__en">VISIT</p><p class="endpage__t">다양한 주거환경을<br>방문 후 직접 확인하세요</p><p class="endpage__d">예약 방문 시 대기 없이 유니트를 안내해 드립니다.</p><a class="endpage__btn" href="guest.html">방문 예약하기</a></div>`;
    // 쪽 이미지 + 타입별 누름 영역
    const page = (i) => {
      const p = PAGES[i];
      const names = p.types.map((t) => t[0]);
      const hots = p.types.map(([name, a, b]) =>
        `<button type="button" class="hot" data-type="${name}" style="top:${(a * 100).toFixed(2)}%;height:${((b - a) * 100).toFixed(2)}%" aria-label="${name} 평면 크게 보기"><span>${name} 크게 보기</span></button>`).join("");
      return `<img src="${p.src}" alt="주택형 ${names.join(", ")} 평면도 (${i + 1}쪽)" draggable="false">${hots}`;
    };

    let leaves = [], state = 0, opened = false;
    const single = () => singleMQ.matches;
    const maxState = () => (single() ? leaves.length - 1 : leaves.length);
    // 넘긴 장 수(state) ↔ 쪽 위치(pos: 0 표지, 1~6 본문, 7 마지막 안내)
    const toPos = (s) => (single() ? s : s === 0 ? 0 : s >= leaves.length ? LAST : 2 * s - 1);
    const toState = (p) => (single() ? p : p === 0 ? 0 : p >= LAST ? PAGES.length / 2 + 1 : Math.ceil(p / 2));

    function build(pos = 0) {
      const f = single()
        ? [cover, ...PAGES.map((_, i) => page(i)), end].map((x) => [x, ""])
        : [[cover, page(0)], ...Array.from({ length: PAGES.length / 2 - 1 }, (_, k) => [page(2 * k + 1), page(2 * k + 2)]), [page(PAGES.length - 1), end]];
      el.classList.toggle("is-single", single());
      el.innerHTML = `<div class="book__stage"><div class="book__base book__base--l"></div><div class="book__base book__base--r"><div class="endpaper">${mark}</div></div></div>`;
      const stage = el.firstChild;
      leaves = f.map(([front, back]) => {
        const leaf = document.createElement("div");
        leaf.className = "leaf";
        leaf.innerHTML = `<div class="face face--front">${front}</div><div class="face face--back">${back}</div>`;
        stage.append(leaf);
        return leaf;
      });
      state = Math.min(toState(pos), maxState());
      leaves.forEach((l, i) => { l.style.transition = "none"; l.classList.toggle("is-flipped", i < state); stack(l, i); });
      requestAnimationFrame(() => requestAnimationFrame(() => leaves.forEach((l) => (l.style.transition = ""))));
      settle();
      update();
    }
    // 겹침 순서: 넘긴 장은 나중 것이 위, 안 넘긴 장은 앞 것이 위
    function stack(l, i) { l.style.zIndex = l.classList.contains("is-flipped") ? i + 1 : leaves.length - i; }

    function flip(i, forward, order) {
      const l = leaves[i];
      clearTimeout(l._t);
      l.classList.add("is-turning");
      l.classList.toggle("is-back", !forward);
      l.style.zIndex = 100 + order;
      l.classList.toggle("is-flipped", forward);
      l._t = setTimeout(() => { l.classList.remove("is-turning", "is-back"); stack(l, i); }, TURN);
    }
    // 넘김이 끝나면 위 장에 완전히 가려진 아래 장들은 숨김 (가장자리 잔상·겹침 방지)
    let settleT = null;
    function settle() {
      leaves.forEach((l, i) => { l.style.visibility = i < state - 1 || i > state ? "hidden" : ""; });
    }
    function go(target) {
      target = Math.max(0, Math.min(maxState(), target));
      if (target === state) return;
      const forward = target > state;
      const list = [];
      if (forward) for (let i = state; i < target; i++) list.push(i);
      else for (let i = state - 1; i >= target; i--) list.push(i);
      clearTimeout(settleT);
      leaves.forEach((l) => { l.style.visibility = ""; });
      list.forEach((leaf, k) => setTimeout(() => flip(leaf, forward, k), reduce ? 0 : k * 170));
      state = target;
      opened = true;
      settleT = setTimeout(settle, (reduce ? 0 : TURN + (list.length - 1) * 170) + 50);
      update();
    }
    function update() {
      const pos = toPos(state);
      el.classList.toggle("is-closed", !single() && state === 0);
      label.textContent = pos === 0 ? "표지" : pos >= LAST ? "마지막 쪽"
        : single() ? `${pos} / ${PAGES.length}` : `${pos}–${pos + 1} / ${PAGES.length}`;
      prevBtn.disabled = state === 0;
      nextBtn.disabled = state >= maxState();
    }

    // 책장은 휠과 양옆 화살표로만 넘김. 책 안의 평면을 누르면 상세 보기
    prevBtn.addEventListener("click", () => go(state - 1));
    nextBtn.addEventListener("click", () => go(state + 1));
    el.addEventListener("click", (e) => {
      const h = e.target.closest(".hot");
      if (h) viewer.open(h.dataset.type, h);
    });
    singleMQ.addEventListener("change", () => build(toPos(state)));

    let preloaded = false;
    build();
    return {
      canMove: (dir) => (dir > 0 ? state < maxState() : state > 0),
      step: (dir) => go(state + dir),
      // 섹션에 처음 도착하면 표지를 한 번 넘겨 펼쳐 보여주고, 상세 이미지를 미리 불러둠
      arrive() {
        if (!opened && state === 0) setTimeout(() => { if (!opened) go(1); }, reduce ? 0 : 900);
        if (!preloaded) { preloaded = true; TYPES.forEach((t) => { new Image().src = planSrc(t.name); }); }
      },
      // 상세 보기에서 타입을 넘기면 뒤쪽 책도 그 쪽으로 넘어가 있도록
      showType(name) { const t = TYPES.find((x) => x.name === name); if (t) go(toState(t.page)); },
      // 지금 화면에 실제로 보이는 누름 영역
      visibleHot(name) {
        return [...el.querySelectorAll(`.hot[data-type="${name}"]`).values()].find((h) => {
          const r = h.getBoundingClientRect();
          if (!r.width) return false;
          const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
          return hit && h.contains(hit);
        }) || null;
      },
    };
  })();

  /* ── 주택형 상세 보기: 누른 평면이 그 자리에서 화면 전체로 커짐 ── */
  const viewer = (() => {
    const pv = document.getElementById("pv");
    // 본문 안(애니메이션 요소 안)에 있으면 헤더 아래로 깔려 닫기 버튼이 가려지므로 body 바로 아래로 옮김
    document.body.append(pv);
    const bg = pv.querySelector(".pv__bg");
    const stageEl = document.getElementById("pv-stage");
    const img = document.getElementById("pv-img");
    const title = document.getElementById("pv-title");
    const no = document.getElementById("pv-no");
    const closeBtn = document.getElementById("pv-close");
    // 상세 평면 원본 크기(1536×1024). 원본보다 크게 늘려 흐려지지 않도록 최대 폭 제한
    const AR = 1536 / 1024;
    const MAXW = 1536;
    const EASE = "cubic-bezier(.22, 1, .36, 1)";
    let cur = 0, opener = null, animating = false;
    document.getElementById("pv-total").textContent = String(TYPES.length).padStart(2, "0");
    // 애니메이션 종료 신호가 오지 않아도(탭 비활성 등) 정해진 시간 뒤에는 반드시 다음 단계로
    function play(el, frames, opts) {
      return new Promise((resolve) => {
        const a = el.animate(frames, opts);
        let settled = false;
        const finish = () => { if (settled) return; settled = true; resolve(a); };
        a.onfinish = finish;
        setTimeout(finish, opts.duration + 60);
      });
    }

    function fit() {
      const r = stageEl.getBoundingClientRect();
      let w = Math.min(r.width, MAXW), h = w / AR;
      if (h > r.height) { h = r.height; w = h * AR; }
      return { left: r.left + (r.width - w) / 2, top: r.top + (r.height - h) / 2, width: w, height: h };
    }
    function place(r) { Object.assign(img.style, { left: r.left + "px", top: r.top + "px", width: r.width + "px", height: r.height + "px" }); }
    // 최종 위치 기준으로 누른 영역(from)에 겹쳐 보이게 하는 transform
    function fromTransform(from, to) {
      const s = Math.min(from.width / to.width, from.height / to.height);
      const tx = from.left + (from.width - to.width * s) / 2 - to.left;
      const ty = from.top + (from.height - to.height * s) / 2 - to.top;
      return `translate(${tx}px, ${ty}px) scale(${s})`;
    }
    function setType(i) {
      cur = (i + TYPES.length) % TYPES.length;
      const t = TYPES[cur];
      img.src = planSrc(t.name);
      img.alt = `${t.name} 타입 평면도`;
      title.textContent = t.name;
      no.textContent = String(cur + 1).padStart(2, "0");
    }

    function open(name, hotEl) {
      if (animating) return;
      opener = hotEl;
      setType(TYPES.findIndex((t) => t.name === name));
      pv.hidden = false;
      pv.classList.add("is-entering");
      body.classList.add("is-detail");
      locked = true;
      const to = fit();
      place(to);
      closeBtn.focus({ preventScroll: true });
      if (reduce) { pv.classList.remove("is-entering"); return; }
      animating = true;
      const from = hotEl.getBoundingClientRect();
      play(bg, [{ opacity: 0 }, { opacity: 1 }], { duration: 500, easing: "ease-out" });
      play(img, [
        { transform: fromTransform(from, to), opacity: 0.25 },
        { opacity: 1, offset: 0.3 },
        { transform: "none", opacity: 1 },
      ], { duration: 800, easing: EASE }).then(() => { animating = false; });
      setTimeout(() => pv.classList.remove("is-entering"), 420);
    }

    function close() {
      if (animating) return;
      const done = () => {
        pv.hidden = true;
        pv.classList.remove("is-leaving");
        body.classList.remove("is-detail");
        locked = false;
        animating = false;
        const back = book.visibleHot(TYPES[cur].name) || opener;
        if (back) back.focus({ preventScroll: true });
      };
      if (reduce) { done(); return; }
      animating = true;
      pv.classList.add("is-leaving");
      // 책의 해당 평면 자리로 다시 줄어들어 돌아감 (보이지 않으면 제자리에서 사라짐)
      pv.style.pointerEvents = "none";
      const hot = book.visibleHot(TYPES[cur].name);
      pv.style.pointerEvents = "";
      const to = fit();
      const endFrame = hot
        ? { transform: fromTransform(hot.getBoundingClientRect(), to), opacity: 0 }
        : { transform: "scale(.92)", opacity: 0 };
      play(bg, [{ opacity: 1 }, { opacity: 0 }], { duration: 550, easing: "ease-in", fill: "forwards" });
      play(img, [{ transform: "none", opacity: 1 }, { opacity: 1, offset: 0.7 }, endFrame], { duration: 600, easing: "cubic-bezier(.55, 0, .45, 1)", fill: "forwards" }).then(() => {
        done();
        bg.getAnimations().forEach((a) => a.cancel());
        img.getAnimations().forEach((a) => a.cancel());
      });
    }

    function nav(dir) {
      if (animating) return;
      const next = cur + dir;
      book.showType(TYPES[(next + TYPES.length) % TYPES.length].name);
      if (reduce) { setType(next); return; }
      animating = true;
      play(img, [{ transform: "none", opacity: 1 }, { transform: `translateX(${-dir * 6}%)`, opacity: 0 }], { duration: 220, easing: "ease-in", fill: "forwards" }).then((a) => {
        setType(next);
        a.cancel();
        return play(img, [{ transform: `translateX(${dir * 6}%)`, opacity: 0 }, { transform: "none", opacity: 1 }], { duration: 420, easing: EASE });
      }).then(() => { animating = false; });
    }

    closeBtn.addEventListener("click", close);
    // ESC는 어디에 포커스가 있든 닫기
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !pv.hidden) { e.preventDefault(); close(); } });
    // 확대 화면에서 휠을 굴리면 이전/다음 평형으로 넘김 (한 번 굴릴 때 한 장)
    let wheelAt = 0;
    pv.addEventListener("wheel", (e) => {
      e.preventDefault();
      if (Math.abs(e.deltaY) < 8 && Math.abs(e.deltaX) < 8) return;
      const now = performance.now();
      if (now - wheelAt < 700) { wheelAt = now; return; }
      wheelAt = now;
      nav((Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX) > 0 ? 1 : -1);
    }, { passive: false });
    // 휴대폰: 위아래·좌우로 밀어서 넘김
    let ty = null, tx = null;
    pv.addEventListener("touchstart", (e) => { ty = e.touches[0].clientY; tx = e.touches[0].clientX; }, { passive: true });
    pv.addEventListener("touchend", (e) => {
      if (ty === null) return;
      const dy = ty - e.changedTouches[0].clientY, dx = tx - e.changedTouches[0].clientX; ty = null;
      const d = Math.abs(dx) > Math.abs(dy) ? dx : dy;
      if (Math.abs(d) > 50) nav(d > 0 ? 1 : -1);
    });
    document.getElementById("pv-prev").addEventListener("click", () => nav(-1));
    document.getElementById("pv-next").addEventListener("click", () => nav(1));
    pv.addEventListener("keydown", (e) => {
      if (e.key === "Escape") { e.preventDefault(); close(); return; }
      if (e.key === "ArrowRight") { e.preventDefault(); nav(1); }
      if (e.key === "ArrowLeft") { e.preventDefault(); nav(-1); }
      if (e.key === "Tab") {
        const f = [...pv.querySelectorAll("button")];
        const i = f.indexOf(document.activeElement);
        e.preventDefault();
        f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
      }
    });
    addEventListener("resize", () => { if (!pv.hidden) place(fit()); });
    return { open };
  })();


  // 화면에 보이면 표지를 한 번 넘겨 펼침
  /* ── 전체화면 책 모드: 페이지에 들어오면 책이 화면 전체로 펼쳐지며 커짐 ── */
  const ub = document.querySelector(".ubook");
  const bookEl = document.getElementById("book");
  const exitBtn = document.createElement("button");
  exitBtn.type = "button"; exitBtn.className = "ub-exit";
  exitBtn.innerHTML = '<span class="ub-exit__x" aria-hidden="true"></span>나가기';
  const openBtn = document.createElement("button");
  openBtn.type = "button"; openBtn.className = "ub-open";
  openBtn.textContent = "책 크게 펼쳐보기";
  ub.append(exitBtn);
  ub.querySelector(".book-cap").append(openBtn);
  const placeholder = document.createElement("div");
  placeholder.className = "ub-ph";
  let full = false, anim = false;

  // 바뀌기 전 위치·크기에서 출발해 새 위치로 커지거나 줄어드는 애니메이션
  function morph(from, to, done) {
    if (reduce) { if (done) done(); return; }
    const s = from.width / to.width;
    const tx = from.left - to.left, ty = from.top - to.top;
    anim = true;
    const a = bookEl.animate([
      { transform: `translate(${tx}px, ${ty}px) scale(${s})`, transformOrigin: "0 0" },
      { transform: "none", transformOrigin: "0 0" },
    ], { duration: 1000, easing: "cubic-bezier(.65, 0, .25, 1)" });
    let ok = false;
    const fin = () => { if (ok) return; ok = true; anim = false; if (done) done(); };
    a.onfinish = fin; setTimeout(fin, 1080);
  }
  function enter() {
    if (full || anim) return;
    const from = bookEl.getBoundingClientRect();
    placeholder.style.height = ub.offsetHeight + "px";
    ub.before(placeholder);
    document.body.append(ub); // 본문 층 밖으로 꺼내야 헤더보다 위에 뜸
    ub.classList.add("is-full");
    document.body.style.overflow = "hidden";
    full = true;
    const to = bookEl.getBoundingClientRect();
    if (!reduce) ub.animate([{ backgroundColor: "rgba(246, 242, 236, 0)" }, { backgroundColor: "rgba(246, 242, 236, 1)" }], { duration: 700, easing: "ease-out" });
    morph(from, to, () => book.arrive());
    exitBtn.focus({ preventScroll: true });
  }
  function exit() {
    if (!full || anim) return;
    const from = bookEl.getBoundingClientRect();
    ub.classList.remove("is-full");
    placeholder.replaceWith(ub); // 원래 자리로 되돌림
    document.body.style.overflow = "";
    full = false;
    const to = bookEl.getBoundingClientRect();
    morph(from, to);
    openBtn.focus({ preventScroll: true });
  }
  exitBtn.addEventListener("click", exit);
  openBtn.addEventListener("click", enter);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && full && document.getElementById("pv").hidden) { e.preventDefault(); exit(); }
  });
  // 페이지에 들어오면 잠시 후 자동으로 펼침 (이미 아래로 내려와 있으면 펼치지 않음)
  setTimeout(() => { if (scrollY < 200) enter(); else book.arrive(); }, 500);
})();
