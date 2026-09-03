/* ============ Parki Valet — Interactions ============ */

(function () {
  "use strict";

  const nav = document.getElementById("nav");
  const burger = document.getElementById("burger");
  const mobileMenu = document.getElementById("mobileMenu");
  const fab = document.querySelector(".fab");
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Preloader ---------- */
  // Show a branded loader until the page (including images) has loaded, with a
  // brief minimum so it never just flashes. Then fade it out and free scrolling.
  const preloader = document.getElementById("preloader");
  if (preloader) {
    document.body.classList.add("preloading");
    const start = performance.now();
    const MIN_MS = 900;
    const dismiss = () => {
      const wait = Math.max(0, MIN_MS - (performance.now() - start));
      setTimeout(() => {
        preloader.classList.add("done");
        document.body.classList.remove("preloading");
      }, wait);
    };
    if (document.readyState === "complete") dismiss();
    else window.addEventListener("load", dismiss);
    // Safety net: never trap the page if a resource hangs.
    setTimeout(() => {
      if (!preloader.classList.contains("done")) {
        preloader.classList.add("done");
        document.body.classList.remove("preloading");
      }
    }, 6000);
  }

  /* ---------- Mobile menu ---------- */
  if (burger && mobileMenu) {
    burger.addEventListener("click", () => mobileMenu.classList.toggle("open"));
    mobileMenu.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => mobileMenu.classList.remove("open"))
    );
  }

  /* ---------- Nav state + FAB ---------- */
  const hero = document.querySelector(".hero");
  function onScroll() {
    const y = window.scrollY;
    // Switch the nav to its light state once the dark hero card has scrolled past.
    const trigger = hero ? hero.offsetHeight - 90 : 40;
    nav.classList.toggle("scrolled", y > trigger);
    fab.classList.toggle("show", y > 400);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Hero transition: hotel -> car park ---------- */
  // The page opens on the car at the hotel entrance. As you scroll, the hotel
  // darkens and the car-park shot fades in over it — the car sits in the same
  // spot in both photos, so it reads as the car travelling into the car park.
  // At the end only the car park remains and "Parked safely." + CTA appear.
  const heroPin = document.getElementById("heroPin");
  const heroHotel = document.getElementById("heroHotel");
  const heroPark = document.getElementById("heroPark");
  const heroIntro = document.getElementById("heroIntro");
  const heroOutro = document.getElementById("heroOutro");

  if (heroPin && heroHotel && heroPark) {
    const clamp01 = (v) => Math.min(1, Math.max(0, v));

    if (prefersReduced) {
      heroPark.style.opacity = "1";
      heroHotel.style.filter = "brightness(0.4)";
      heroIntro.style.opacity = "0";
      heroOutro.classList.add("visible");
    } else {
      let lastP = -1;
      const step = () => {
        const total = heroPin.offsetHeight - window.innerHeight;
        const p = total > 0 ? clamp01(-heroPin.getBoundingClientRect().top / total) : 1;
        if (p !== lastP) {
          lastP = p;
          // Hotel dims as you scroll
          heroHotel.style.filter = `brightness(${(1 - p * 0.72).toFixed(3)})`;
          // Car park fades in over it
          heroPark.style.opacity = clamp01((p - 0.28) / 0.44).toFixed(3);
          // Opening headline drifts out early
          const introOut = clamp01(1 - p / 0.2);
          heroIntro.style.opacity = introOut.toFixed(3);
          heroIntro.style.transform = `translateY(${(-p * 60).toFixed(1)}px)`;
          heroIntro.style.pointerEvents = introOut === 0 ? "none" : "";
          // Closing copy appears once the car park has taken over
          heroOutro.classList.toggle("visible", p > 0.8);
        }
        requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }
  }

  /* ---------- Reveal on scroll (staggered) ---------- */
  const revealEls = document.querySelectorAll(".reveal");
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
  );

  const groups = new Map();
  revealEls.forEach((el) => {
    const parent = el.parentElement;
    if (!groups.has(parent)) groups.set(parent, []);
    groups.get(parent).push(el);
  });
  groups.forEach((els) => {
    els.forEach((el, i) => {
      // Cards and service tiles enter one by one with a longer stagger.
      const staggered = el.classList.contains("card") || el.classList.contains("svc");
      const step = staggered ? 0.15 : 0.1;
      const cap = staggered ? 0.95 : 0.5;
      el.style.setProperty("--d", `${Math.min(i * step, cap)}s`);
    });
  });
  revealEls.forEach((el) => io.observe(el));

  /* ---------- Parallax on the coverage image ---------- */
  const parallaxEl = document.querySelector("[data-parallax]");
  if (parallaxEl && !prefersReduced) {
    const step = () => {
      const rect = parallaxEl.parentElement.getBoundingClientRect();
      const vh = window.innerHeight;
      if (rect.bottom > 0 && rect.top < vh) {
        const p = (rect.top + rect.height / 2 - vh / 2) / (vh / 2 + rect.height / 2);
        parallaxEl.style.transform = `translateY(${p * -5}%)`;
      }
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  /* ---------- Newsletter ---------- */
  const newsForm = document.getElementById("newsletterForm");
  if (newsForm) {
    newsForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = document.getElementById("newsletterEmail");
      const consent = newsForm.querySelector('input[type="checkbox"]');
      if (!email.value || !email.checkValidity()) { email.focus(); return; }
      if (!consent.checked) { consent.focus(); return; }
      newsForm.querySelector(".newsletter__row").style.display = "none";
      newsForm.querySelector(".newsletter__consent").style.display = "none";
      newsForm.querySelector(".newsletter__done").hidden = false;
    });
  }

  /* ---------- Contact form -> WhatsApp ---------- */
  const contactForm = document.getElementById("contactForm");
  if (contactForm) {
    contactForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const val = (id) => (document.getElementById(id)?.value || "").trim();
      const name = val("cfName");
      const pickup = val("cfPickup");
      const dest = val("cfDest");
      const when = val("cfWhen");
      const notes = val("cfNotes");
      let msg = "Hi Parki Valet! I'd like to book a valet.";
      if (name) msg += `\nName: ${name}`;
      if (pickup) msg += `\nPickup: ${pickup}`;
      if (dest) msg += `\nDestination: ${dest}`;
      if (when) msg += `\nWhen: ${when}`;
      if (notes) msg += `\nNotes: ${notes}`;
      window.open(`https://wa.me/6589567796?text=${encodeURIComponent(msg)}`, "_blank", "noopener");
    });
  }
})();
