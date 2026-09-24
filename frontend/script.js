(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  // Year
  $("#year").textContent = new Date().getFullYear();

  // Sticky nav background
  const nav = $(".nav");
  const onScroll = () => nav.classList.toggle("scrolled", window.scrollY > 20);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Mobile menu
  const burger = $("#burger");
  const links = $("#navLinks");
  burger.addEventListener("click", () => {
    burger.classList.toggle("open");
    links.classList.toggle("open");
  });
  $$("#navLinks a").forEach((a) =>
    a.addEventListener("click", () => {
      burger.classList.remove("open");
      links.classList.remove("open");
    })
  );

  // Product cards: active state + arrows
  const cards = $$(".product-card");
  let active = 0;
  const setActive = (i) => {
    active = (i + cards.length) % cards.length;
    cards.forEach((c, idx) => c.classList.toggle("active", idx === active));
  };
  cards.forEach((c, i) => c.addEventListener("mouseenter", () => setActive(i)));
  cards.forEach((c, i) => c.addEventListener("click", () => setActive(i)));
  $$("[data-prod]").forEach((b) =>
    b.addEventListener("click", () => {
      setActive(active + Number(b.dataset.prod));
      if (window.innerWidth < 1080) cards[active].scrollIntoView({ behavior: "smooth", block: "nearest" });
    })
  );

  // Footer product links: scroll to products and highlight the matching card
  $$("[data-product]").forEach((a) =>
    a.addEventListener("click", () => setActive(Number(a.dataset.product)))
  );

  // Placeholder links (no page yet) shouldn't jump to the top
  $$('a[href="#"]:not(.logo)').forEach((a) => a.addEventListener("click", (e) => e.preventDefault()));

  // Testimonials slider
  const track = $("#testiTrack");
  $$("[data-testi]").forEach((b) =>
    b.addEventListener("click", () => {
      const card = track.firstElementChild;
      const step = card.getBoundingClientRect().width + 14;
      const dir = Number(b.dataset.testi);
      const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
      if (dir > 0 && atEnd) track.scrollTo({ left: 0 });
      else if (dir < 0 && track.scrollLeft <= 0) track.scrollTo({ left: track.scrollWidth });
      else track.scrollBy({ left: step * dir });
    })
  );

  // Count-up numbers
  const fmt = (n) => n.toLocaleString("en-US");
  const countUp = (el) => {
    const target = Number(el.dataset.count);
    const prefix = el.dataset.prefix || "";
    const start = performance.now();
    const dur = 1400;
    const tick = (t) => {
      const p = Math.min((t - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = prefix + fmt(Math.round(target * eased));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  // Reveal on scroll
  const revealEls = $$(".section-head, .product-card, .insights-copy, .insights-panel, .why-grid > *, .testi, .cta, .footer-grid");
  revealEls.forEach((el) => el.classList.add("reveal"));
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add("in-view");
        $$("[data-count]", e.target).forEach(countUp);
        io.unobserve(e.target);
      });
    },
    { threshold: 0.15 }
  );
  revealEls.forEach((el) => io.observe(el));
  $$(".hero [data-count]").forEach(countUp);

  // Watch demo (placeholder)
  $("#watchDemo").addEventListener("click", (e) => {
    e.preventDefault();
    $("#products").scrollIntoView({ behavior: "smooth" });
  });

  // Contact modal
  const modal = $("#contactModal");
  const form = $("#contactForm");
  const status = $("#formStatus");
  const openModal = (e) => {
    e?.preventDefault();
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    setTimeout(() => form.name.focus(), 200);
  };
  const closeModal = () => {
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  };
  $$("[data-open-contact]").forEach((b) => b.addEventListener("click", openModal));
  $$("[data-close]", modal).forEach((b) => b.addEventListener("click", closeModal));
  document.addEventListener("keydown", (e) => e.key === "Escape" && closeModal());

  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    let ok = true;
    [["name", data.name.trim().length > 1], ["email", emailRe.test(data.email)], ["message", data.message.trim().length > 4]].forEach(
      ([k, valid]) => {
        form[k].classList.toggle("invalid", !valid);
        if (!valid) ok = false;
      }
    );
    if (!ok) {
      status.className = "form-status err";
      status.textContent = "Please fill in your name, a valid email and a message.";
      return;
    }

    const btn = form.querySelector("button[type=submit]");
    btn.disabled = true;
    status.className = "form-status";
    status.textContent = "Sending...";
    try {
      const res = await fetch(`${window.API_URL}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Something went wrong.");
      status.className = "form-status ok";
      status.textContent = "Thanks! We’ll get back to you shortly.";
      form.reset();
      setTimeout(closeModal, 2200);
    } catch (err) {
      status.className = "form-status err";
      status.textContent = err.message === "Failed to fetch" ? "Could not reach the server. Please try again later." : err.message;
    } finally {
      btn.disabled = false;
    }
  });
})();
