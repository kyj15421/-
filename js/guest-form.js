/* ─────────────────────────────────────────────
   관심고객등록 폼
   신청 내용을 이메일로 받으려면 https://formspree.io 에서 폼을 만들고
   발급된 폼 ID를 아래에 입력하세요. 비어 있으면 완료 화면만 보여주는 데모로 동작합니다.
   ───────────────────────────────────────────── */
const GUEST_FORMSPREE_ID = "xdekbjpe";

(() => {
  const form = document.getElementById("guest-form");
  if (!form) return;
  const $ = (s) => form.querySelector(s);
  const summary = document.getElementById("g-summary");
  const done = document.getElementById("g-done");
  // 일정변경: 새 등록과 구분되도록 메일 제목을 [일정변경]으로 바꾸고 이전 일정을 함께 보냄
  const subject = $('[name="_subject"]');
  const prevField = Object.assign(document.createElement("input"), { type: "hidden", name: "이전 방문일정", disabled: true });
  form.prepend(prevField);
  let changing = false, booked = "";
  const submitLabel = () => changing ? "일정 변경하기" : "등록하기";

  /* 주소: 광주 구 → 동 */
  const DONG = {
    "동구": ["충장동", "동명동", "계림1동", "계림2동", "산수1동", "산수2동", "지산1동", "지산2동", "서남동", "학동", "학운동", "지원1동", "지원2동"],
    "서구": ["양동", "양3동", "농성1동", "농성2동", "광천동", "유덕동", "치평동", "상무1동", "상무2동", "화정1동", "화정2동", "화정3동", "화정4동", "서창동", "금호1동", "금호2동", "풍암동", "동천동"],
    "남구": ["양림동", "방림1동", "방림2동", "봉선1동", "봉선2동", "사직동", "월산동", "월산4동", "월산5동", "백운1동", "백운2동", "주월1동", "주월2동", "효덕동", "송암동", "대촌동"],
    "북구": ["중흥1동", "중흥2동", "중흥3동", "중앙동", "임동", "신안동", "용봉동", "운암1동", "운암2동", "운암3동", "동림동", "우산동", "풍향동", "문화동", "문흥1동", "문흥2동", "두암1동", "두암2동", "두암3동", "삼각동", "일곡동", "매곡동", "오치1동", "오치2동", "석곡동", "건국동", "양산동", "신용동"],
    "광산구": ["송정1동", "송정2동", "도산동", "신흥동", "어룡동", "우산동", "월곡1동", "월곡2동", "비아동", "첨단1동", "첨단2동", "신가동", "운남동", "수완동", "하남동", "임곡동", "동곡동", "평동", "삼도동", "본량동", "신창동"],
  };
  const city = $("#g-city"), gu = $("#g-gu"), dong = $("#g-dong"), etc = $("#g-etc");
  const fill = (sel, list, ph) => { sel.innerHTML = `<option value="">${ph}</option>` + list.map((x) => `<option>${x}</option>`).join(""); };
  fill(gu, Object.keys(DONG), "구 선택");
  fill(dong, [], "동 선택");
  gu.addEventListener("change", () => fill(dong, DONG[gu.value] || [], "동 선택"));
  city.addEventListener("change", () => {
    const gj = city.value === "광주";
    gu.hidden = dong.hidden = !gj;
    etc.hidden = gj;
  });

  /* 방문 날짜: 내일부터 60일 이내 */
  const toISO = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  const d1 = new Date(); d1.setDate(d1.getDate() + 1);
  const d2 = new Date(); d2.setDate(d2.getDate() + 60);
  $("#g-date").min = toISO(d1); $("#g-date").max = toISO(d2);
  // 날짜를 고르기 전에는 "일정 선택" 안내를 보여줌 (휴대폰은 빈 칸으로 보이기 때문)
  const dateWrap = $("#g-date").parentElement;
  const syncDate = () => dateWrap.classList.toggle("has-value", !!$("#g-date").value);
  $("#g-date").addEventListener("input", syncDate); $("#g-date").addEventListener("change", syncDate); form.addEventListener("reset", () => setTimeout(syncDate)); syncDate();
  // 달력 아이콘뿐 아니라 "연도.월.일." 글자 부분을 눌러도 달력이 열리도록
  $("#g-date").addEventListener("click", (e) => { try { e.currentTarget.showPicker(); } catch (err) { /* 지원하지 않는 브라우저는 기본 동작 */ } });

  /* 휴대전화 뒷자리: 숫자만, 4자리 채우면 다음 칸으로 */
  const p2 = $("#g-p2"), p3 = $("#g-p3");
  [p2, p3].forEach((el) => el.addEventListener("input", () => {
    el.value = el.value.replace(/\D/g, "").slice(0, 4);
    if (el === p2 && el.value.length === 4) p3.focus();
  }));

  const rules = [
    ["g-name", () => $("#g-name").value.trim().length >= 2, "이름을 2자 이상 입력해 주세요."],
    ["g-p2", () => /^\d{3,4}$/.test(p2.value) && /^\d{4}$/.test(p3.value), "휴대전화 번호를 정확히 입력해 주세요."],
    ["g-city", () => city.value === "광주" ? !!(gu.value && dong.value) : etc.value.trim().length > 1, "주소를 선택해 주세요."],
    ["g-date", () => { const d = $("#g-date").value, tm = $("#g-time").value; if (!d && !tm) return true; return !!(d && tm) && d >= $("#g-date").min && d <= $("#g-date").max; }, "방문 날짜와 시간을 함께 선택해 주세요. (내일부터 60일 이내)"],
    ["g-agree1", () => form.agree1.value === "Y", "개인정보 수집 및 이용에 동의해 주세요."],
    ["g-agree2", () => form.agree2.value === "Y", "마케팅 활용에 동의해 주세요."],
  ];

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const errs = rules.filter(([, ok]) => !ok());
    if (errs.length) {
      summary.innerHTML = `입력 내용을 확인해 주세요.<ul>${errs.map(([id, , m]) => `<li><a href="#${id}" data-f="${id}">${m}</a></li>`).join("")}</ul>`;
      summary.hidden = false;
      summary.focus();
      return;
    }
    summary.hidden = true;
    const btn = $(".gf__submit-wrap .g-submit");
    btn.disabled = true; btn.textContent = "등록 중…";
    try {
      if (GUEST_FORMSPREE_ID) {
        const res = await fetch(`https://formspree.io/f/${GUEST_FORMSPREE_ID}`, { method: "POST", body: new FormData(form), headers: { Accept: "application/json" } });
        if (!res.ok) throw new Error(res.status);
      } else {
        await new Promise((r) => setTimeout(r, 500));
      }
      document.getElementById("g-done-name").textContent = $("#g-name").value.trim();
      const vd = $("#g-date").value, vt = $("#g-time").value;
      booked = vd ? `${Number(vd.slice(5, 7))}월 ${Number(vd.slice(8))}일 ${vt}` : "";
      document.getElementById("g-done-title").textContent = changing ? "방문 일정이 변경 접수되었습니다" : "관심고객으로 등록되었습니다";
      document.getElementById("g-done-visit").textContent = vd ? `방문 예약: ${booked} · 담당자가 전화로 확정해 드립니다.` : "";
      form.hidden = true; done.hidden = false; done.focus();
      done.scrollIntoView({ block: "center" });
    } catch (err) {
      summary.textContent = "등록하지 못했습니다. 인터넷 연결을 확인하고 다시 시도하거나 1668-4480으로 문의해 주세요.";
      summary.hidden = false; summary.focus();
    } finally {
      btn.disabled = false; btn.textContent = submitLabel();
    }
  });
  // 일정변경하기: 입력 내용은 그대로 두고 방문일정만 다시 고르게 함
  document.getElementById("g-change").addEventListener("click", () => {
    changing = true;
    subject.value = subject.value.replace("[관심고객등록]", "[일정변경]");
    prevField.disabled = false; prevField.value = booked || "없음";
    $(".gf__submit-wrap .g-submit").textContent = submitLabel();
    done.hidden = true; form.hidden = false;
    $("#g-date").scrollIntoView({ block: "center" }); $("#g-date").focus({ preventScroll: true });
  });
  summary.addEventListener("click", (e) => {
    const a = e.target.closest("[data-f]");
    if (!a) return;
    e.preventDefault();
    const el = document.getElementById(a.dataset.f);
    (el.hidden ? etc : el).focus();
  });
})();
