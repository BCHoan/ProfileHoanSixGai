(() => {
    const $ = (sel, root = document) => root.querySelector(sel);
    const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

    // ---------- Theme ----------
    const html = document.documentElement;
    const themeBtn = $("#themeBtn");

    function getSavedTheme() {
        const t = localStorage.getItem("theme");
        if (t === "light" || t === "dark") return t;
        // fallback: prefers-color-scheme
        return window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
    }

    function applyTheme(theme) {
        html.classList.toggle("theme-light", theme === "light");
        html.classList.toggle("theme-dark", theme === "dark");
        localStorage.setItem("theme", theme);
    }

    applyTheme(getSavedTheme());

    themeBtn?.addEventListener("click", () => {
        const isLight = html.classList.contains("theme-light");
        applyTheme(isLight ? "dark" : "light");
        toast(`Đã chuyển sang ${isLight ? "Dark" : "Light"} mode`);
    });

    // ---------- Mobile drawer ----------
    const drawer = $("#drawer");
    const burgerBtn = $("#burgerBtn");
    const closeDrawerBtn = $("#closeDrawerBtn");
    const drawerBackdrop = $("#drawerBackdrop");

    function openDrawer() {
        drawer.classList.add("is-open");
        drawer.setAttribute("aria-hidden", "false");
        document.body.style.overflow = "hidden";
    }
    function closeDrawer() {
        drawer.classList.remove("is-open");
        drawer.setAttribute("aria-hidden", "true");
        document.body.style.overflow = "";
    }

    burgerBtn?.addEventListener("click", openDrawer);
    closeDrawerBtn?.addEventListener("click", closeDrawer);
    drawerBackdrop?.addEventListener("click", closeDrawer);

    // close drawer when click a link
    $$(".drawer__link").forEach(a => a.addEventListener("click", closeDrawer));

    // ---------- Smooth anchor ----------
    $$('a[href^="#"]').forEach(a => {
        a.addEventListener("click", (e) => {
            const id = a.getAttribute("href");
            if (!id || id.length < 2) return;
            const target = document.getElementById(id.slice(1));
            if (!target) return;

            e.preventDefault();
            target.scrollIntoView({ behavior: "smooth", block: "start" });
            history.pushState(null, "", id);
        });
    });

    // ---------- Clock ----------
    const clockEl = $("#clock");
    function tick() {
        const now = new Date();
        const hh = String(now.getHours()).padStart(2, "0");
        const mm = String(now.getMinutes()).padStart(2, "0");
        const ss = String(now.getSeconds()).padStart(2, "0");
        if (clockEl) clockEl.textContent = `${hh}:${mm}:${ss}`;
    }
    tick();
    setInterval(tick, 1000);

    // ---------- Year ----------
    const yearEl = $("#year");
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    // ---------- Quote (local list, không lệ thuộc API) ----------
    const quoteEl = $("#quoteText");
    const quotes = [
        "Build things. Break things. Fix them.",
        "Flow rõ ràng thì bug tự lộ mặt.",
        "Log tốt là nửa đường debug.",
        "Tối ưu chỗ “đau” trước, đẹp sau."
    ];
    function setQuote() {
        const q = quotes[Math.floor(Math.random() * quotes.length)];
        if (quoteEl) quoteEl.textContent = q;
    }
    setQuote();
    setInterval(setQuote, 7000);

    // ---------- Skills animate when visible ----------
    const skills = $$(".skill");
    const io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;

            const el = entry.target;
            const value = Math.max(0, Math.min(100, Number(el.dataset.value || 0)));
            const fill = $(".bar__fill", el);
            const num = $(".skill__num", el);

            // animate number
            let cur = 0;
            const step = Math.max(1, Math.floor(value / 40));
            const timer = setInterval(() => {
                cur += step;
                if (cur >= value) { cur = value; clearInterval(timer); }
                if (num) num.textContent = String(cur);
            }, 18);

            if (fill) fill.style.width = `${value}%`;
            io.unobserve(el);
        });
    }, { threshold: 0.35 });

    skills.forEach(s => io.observe(s));

    // ---------- Copy helpers ----------
    function copyText(text) {
        if (!text) return Promise.reject("Empty");
        if (navigator.clipboard) return navigator.clipboard.writeText(text);
        // fallback
        const ta = document.createElement("textarea");
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        ta.remove();
        return Promise.resolve();
    }

    // Copy helper:
    // - data-copy="#id" / ".class" / "[attr]"  => copy textContent of target
    // - data-copy="raw text"                     => copy raw
    $$('[data-copy]').forEach(btn => {
        btn.addEventListener('click', async () => {
            const key = (btn.getAttribute('data-copy') || '').trim();
            let text = '';

            if (!key) {
                text = (btn.textContent || '').trim();
            } else if (/^[#.[]/.test(key)) {
                const el = $(key);
                text = (el?.textContent || '').trim();
            } else {
                text = key;
            }

            try {
                await copyText(text);
                toast('Đã sao chép!');
            } catch {
                toast('Sao chép thất bại');
            }
        });
    });

    // Copy email button (hero)
    const copyEmailBtn = $("#copyEmailBtn");
    copyEmailBtn?.addEventListener("click", async () => {
        const email = $("#emailText")?.textContent?.trim() || "";
        try { await copyText(email); toast("Đã copy email!"); }
        catch { toast("Copy thất bại"); }
    });

    // Copy Zalo (demo)
    const copyZaloBtn = $("#copyZaloBtn");
    copyZaloBtn?.addEventListener("click", async () => {
        const zalo = "ZALO_BOX_LINK_OR_ID_HERE";
        try { await copyText(zalo); toast("Đã copy link/ID box!"); }
        catch { toast("Copy thất bại"); }
    });

    // ---------- Contact form (generate message then copy) ----------
    const contactForm = $("#contactForm");
    contactForm?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const fd = new FormData(contactForm);
        const name = (fd.get("name") || "").toString().trim();
        const service = (fd.get("service") || "").toString().trim();
        const message = (fd.get("message") || "").toString().trim();

        const payload =
            `[CONGHOAN CONTACT]
Tên: ${name || "(chưa nhập)"}
Dịch vụ: ${service || "(chưa chọn)"}
Nội dung: ${message || "(chưa nhập)"}`;

        try {
            await copyText(payload);
            toast("Đã tạo nội dung và copy. Dán vào Zalo/Mail để gửi.");
        } catch {
            toast("Không copy được nội dung.");
        }
    });

    // ---------- Toast ----------
    const toastEl = $("#toast");
    let toastTimer = null;
    function toast(msg) {
        if (!toastEl) return;
        toastEl.textContent = msg;
        toastEl.classList.add("show");
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toastEl.classList.remove("show"), 2200);
    }
})();
