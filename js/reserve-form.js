/* ─────────────────────────────────────────────
   설정: 방문 예약 신청을 이메일로 받으려면
   1) https://formspree.io 가입 → New Form 생성 (받을 이메일 입력)
   2) 발급된 폼 ID(예: "xyzabcd")를 아래에 입력
   ID가 비어 있으면 실제 전송 없이 완료 화면만 보여주는 데모로 동작합니다.
   ───────────────────────────────────────────── */
const FORMSPREE_ID = "xdekbjpe";


/* ── 방문 예약 폼 ── */
(() => {
  const form = document.getElementById("reserve-form");
  const summary = document.getElementById("form-summary");
  const done = document.getElementById("reserve-done");
  const nameInput = document.getElementById("name");
  const phoneInput = document.getElementById("phone");
  const dateInput = document.getElementById("date");

  const toISO = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  const limit = new Date(); limit.setDate(limit.getDate() + 60);
  dateInput.min = toISO(tomorrow);
  dateInput.max = toISO(limit);
  dateInput.addEventListener("click", () => { try { dateInput.showPicker(); } catch (err) { /* 기본 동작 */ } });

  phoneInput.addEventListener("input", () => {
    const n = phoneInput.value.replace(/\D/g, "").slice(0, 11);
    phoneInput.value = n.length < 4 ? n : n.length < 8 ? `${n.slice(0, 3)}-${n.slice(3)}` : `${n.slice(0, 3)}-${n.slice(3, n.length - 4)}-${n.slice(-4)}`;
  });

  const rules = {
    name: () => nameInput.value.trim().length >= 2 ? "" : "이름을 2자 이상 입력해 주세요.",
    phone: () => /^01[016789]-\d{3,4}-\d{4}$/.test(phoneInput.value) ? "" : "휴대폰 번호를 010-1234-5678 형식으로 입력해 주세요.",
    date: () => {
      const v = dateInput.value;
      if (!v) return "방문 날짜를 선택해 주세요.";
      if (v < dateInput.min || v > dateInput.max) return "방문 날짜는 내일부터 60일 이내로 선택해 주세요.";
      return "";
    },
    time: () => form.time.value ? "" : "방문 시간을 선택해 주세요.",
    agree: () => form.agree.checked ? "" : "예약을 위해 개인정보 수집·이용에 동의해 주세요.",
  };
  const target = { name: () => nameInput, phone: () => phoneInput, date: () => dateInput, time: () => form.querySelector('input[name="time"]'), agree: () => form.agree };
  function showError(key, msg) {
    document.getElementById(`${key}-error`).textContent = msg;
    if (key !== "time") target[key]().setAttribute("aria-invalid", msg ? "true" : "false");
  }
  ["name", "phone", "date"].forEach((key) => {
    const el = target[key]();
    el.addEventListener("blur", () => { if (el.value) showError(key, rules[key]()); });
    el.addEventListener("input", () => { if (el.getAttribute("aria-invalid") === "true") showError(key, rules[key]()); });
  });
  form.addEventListener("change", (e) => {
    if (e.target.name === "time") showError("time", "");
    if (e.target.name === "agree" && e.target.checked) showError("agree", "");
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const errors = Object.keys(rules).map((key) => ({ key, msg: rules[key]() })).filter((x) => { showError(x.key, x.msg); return x.msg; });
    if (errors.length) {
      summary.innerHTML = `입력 내용을 확인해 주세요.<ul>${errors.map((x) => `<li><a href="#" data-key="${x.key}">${x.msg}</a></li>`).join("")}</ul>`;
      summary.hidden = false; summary.focus();
      return;
    }
    summary.hidden = true;
    const button = form.querySelector(".form__submit");
    button.disabled = true; button.textContent = "예약 접수 중…";
    try {
      if (FORMSPREE_ID) {
        const res = await fetch(`https://formspree.io/f/${FORMSPREE_ID}`, { method: "POST", body: new FormData(form), headers: { Accept: "application/json" } });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
      } else {
        console.warn("FORMSPREE_ID가 설정되지 않아 데모로 동작합니다. 신청 내용은 전송되지 않았습니다.");
        await new Promise((r) => setTimeout(r, 600));
      }
      const [, m, d] = dateInput.value.split("-");
      document.getElementById("done-text").textContent = `${nameInput.value.trim()}님, ${Number(m)}월 ${Number(d)}일 ${form.time.value} 방문으로 신청하셨습니다.`;
      form.hidden = true; done.hidden = false; done.focus();
    } catch (err) {
      summary.textContent = "예약을 접수하지 못했습니다. 인터넷 연결을 확인하고 다시 시도하거나, 1668-4480로 전화 주세요.";
      summary.hidden = false; summary.focus();
    } finally {
      button.disabled = false; button.textContent = "방문 예약하기";
    }
  });
  summary.addEventListener("click", (e) => {
    const a = e.target.closest("a[data-key]");
    if (!a) return;
    e.preventDefault(); e.stopPropagation();
    target[a.dataset.key]().focus();
  });
  document.getElementById("reserve-again").addEventListener("click", () => { form.reset(); done.hidden = true; form.hidden = false; nameInput.focus(); });
})();
