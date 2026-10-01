(function () {
  "use strict";

  var root = document.documentElement;
  var body = document.body;
  root.classList.add("js");

  /* ---------- Hero load reveal ---------- */
  function reveal() {
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { body.classList.add("is-loaded"); });
    });
  }

  if (document.fonts && document.fonts.ready) {
    // Wait for fonts (so the headline doesn't reflow mid-animation), capped so the page never hangs.
    Promise.race([
      document.fonts.ready,
      new Promise(function (r) { setTimeout(r, 900); })
    ]).then(reveal);
  } else {
    reveal();
  }

  /* ---------- Header scroll state ---------- */
  var header = document.querySelector("[data-header]");
  var ticking = false;

  function updateHeader() {
    header.classList.toggle("is-scrolled", window.scrollY > 8);
    ticking = false;
  }
  window.addEventListener("scroll", function () {
    if (!ticking) {
      requestAnimationFrame(updateHeader);
      ticking = true;
    }
  }, { passive: true });
  updateHeader();

  /* ---------- Mobile menu ---------- */
  var toggle = document.querySelector("[data-menu-toggle]");
  var menu = document.querySelector("[data-menu]");
  var desktop = window.matchMedia("(min-width: 1100px)");

  function setMenu(open) {
    menu.classList.toggle("is-open", open);
    body.classList.toggle("menu-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    if (open) {
      menu.removeAttribute("inert");
      var first = menu.querySelector("a");
      if (first) first.focus({ preventScroll: true });
    } else {
      menu.setAttribute("inert", "");
    }
  }

  toggle.addEventListener("click", function () {
    setMenu(toggle.getAttribute("aria-expanded") !== "true");
  });

  menu.addEventListener("click", function (e) {
    if (e.target.closest("a")) setMenu(false);
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && menu.classList.contains("is-open")) {
      setMenu(false);
      toggle.focus();
    }
  });

  desktop.addEventListener("change", function (e) {
    if (e.matches) setMenu(false);
  });

  /* ---------- Scroll reveal ---------- */
  var revealEls = document.querySelectorAll("[data-reveal]");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -10% 0px", threshold: 0.1 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  }
  /* ---------- Footer year ---------- */
  var yearEl = document.querySelector("[data-year]");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ---------- Quote form (Web3Forms) ---------- */
  var form = document.querySelector("[data-quote-form]");
  if (form) {
    var status = form.querySelector("[data-form-status]");
    var submitBtn = form.querySelector('button[type="submit"]');
    var FALLBACK = "Something went wrong. Please call us at (678) 382-9799 or email buildwellcreationsgroup@gmail.com.";

    function setStatus(msg, type) {
      status.textContent = msg;
      status.classList.toggle("is-success", type === "success");
      status.classList.toggle("is-error", type === "error");
    }

    function validate() {
      var firstInvalid = null;
      form.querySelectorAll("[required]").forEach(function (el) {
        var field = el.closest(".field");
        var ok = el.type === "radio"
          ? !!form.querySelector('input[name="' + el.name + '"]:checked')
          : el.checkValidity() && el.value.trim() !== "";
        if (el.type === "radio") {
          field.classList.toggle("is-invalid", !ok);
        } else {
          el.classList.toggle("is-invalid", !ok);
          el.setAttribute("aria-invalid", String(!ok));
        }
        if (!ok && !firstInvalid) firstInvalid = el;
      });
      return firstInvalid;
    }

    /* Commercial / Residential buttons open the form with that property type selected */
    document.querySelectorAll("[data-property]").forEach(function (link) {
      link.addEventListener("click", function () {
        var radio = form.querySelector('input[name="property_type"][value="' + link.getAttribute("data-property") + '"]');
        if (radio) {
          radio.checked = true;
          radio.closest(".field").classList.remove("is-invalid");
        }
      });
    });

    form.addEventListener("input", function (e) {
      if (e.target.classList.contains("is-invalid") && e.target.checkValidity()) {
        e.target.classList.remove("is-invalid");
        e.target.setAttribute("aria-invalid", "false");
      }
      if (e.target.type === "radio") e.target.closest(".field").classList.remove("is-invalid");
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      var firstInvalid = validate();
      if (firstInvalid) {
        setStatus("Please complete the highlighted fields.", "error");
        firstInvalid.focus();
        return;
      }

      var key = form.querySelector('input[name="access_key"]').value;
      if (!key || key.indexOf("YOUR_") === 0) {
        setStatus("The quote form is not connected yet. " + FALLBACK.replace("Something went wrong. ", ""), "error");
        return;
      }

      submitBtn.disabled = true;
      setStatus("Sending your request...", "");

      fetch(form.action, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(Object.fromEntries(new FormData(form)))
      })
        .then(function (res) { return res.json(); })
        .then(function (data) {
          if (data && data.success) {
            form.reset();
            setStatus("Thank you. Your request has been sent and we will be in touch soon.", "success");
          } else {
            setStatus(FALLBACK, "error");
          }
        })
        .catch(function () { setStatus(FALLBACK, "error"); })
        .then(function () { submitBtn.disabled = false; });
    });
  }
})();
