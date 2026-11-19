(function () {
  const header = document.querySelector(".header");
  const nav = document.querySelector(".nav");
  const navToggle = document.querySelector(".nav-toggle");
  const yearEl = document.getElementById("year");
  const form = document.querySelector(".contact-form");

  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }

  function onScroll() {
    if (header) {
      header.classList.toggle("is-scrolled", window.scrollY > 24);
    }
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  if (navToggle && nav) {
    navToggle.addEventListener("click", () => {
      const open = navToggle.getAttribute("aria-expanded") === "true";
      navToggle.setAttribute("aria-expanded", String(!open));
      nav.classList.toggle("is-open", !open);
    });
    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        navToggle.setAttribute("aria-expanded", "false");
        nav.classList.remove("is-open");
      });
    });
  }

  const revealEls = document.querySelectorAll(".reveal");
  if (revealEls.length && "IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 }
    );
    revealEls.forEach((el) => observer.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  }

  const siteAddress = document.querySelector("[data-site-address]");
  const siteHoursWk = document.querySelector("[data-site-hours-weekdays]");
  const siteHoursWe = document.querySelector("[data-site-hours-weekend]");
  const sitePhone = document.querySelector("[data-site-phone]");
  const formHint = document.querySelector(".form-hint");
  const submitBtn = form?.querySelector('button[type="submit"]');

  async function loadSite() {
    try {
      const res = await fetch("/api/site");
      if (!res.ok) return;
      const site = await res.json();
      if (siteAddress && site.address) siteAddress.textContent = site.address;
      if (siteHoursWk && site.hoursWeekdays) siteHoursWk.textContent = site.hoursWeekdays;
      if (siteHoursWe && site.hoursWeekend) siteHoursWe.textContent = site.hoursWeekend;
      if (sitePhone && site.phoneDisplay) {
        sitePhone.textContent = site.phoneDisplay;
        if (site.phone) sitePhone.href = `tel:${site.phone.replace(/\s/g, "")}`;
      }
    } catch {
      /* офлайн / статика */
    }
  }

  loadSite();

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const data = new FormData(form);
      const name = String(data.get("name") || "").trim();
      const phone = String(data.get("phone") || "").trim();
      const interest = String(data.get("interest") || "standard");
      if (!name) {
        alert("Укажите имя.");
        return;
      }
      if (submitBtn) submitBtn.disabled = true;
      try {
        const res = await fetch("/api/leads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, phone, interest }),
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body.error || "Не удалось отправить");
        alert(`Спасибо, ${name}! Заявку получили — администратор свяжется с вами.`);
        form.reset();
        if (formHint) formHint.textContent = "Заявка отправлена.";
      } catch (err) {
        alert(err.message || "Ошибка сети. Попробуйте позже или позвоните в клуб.");
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }
    });
  }
})();