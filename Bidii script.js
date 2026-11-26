/* ==========================================================
   Bidii Creek Conservancy – shared script
   Works on every page; each feature runs only if its markup exists.
   ========================================================== */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var mobileQuery = window.matchMedia("(max-width: 1080px)");   // keep in step with Bidii-style.css

  /* Path back to the site root, so the logo and links work from index.html and from Pages/.
     It is taken from this script's own address: "Bidii-script.js" gives "",
     "../Bidii-script.js" gives "../". Works whatever the file name's capitals,
     and even with "?v=2" added to the end of it. */
  var me = document.currentScript ||
           document.querySelector('script[src*="idii-script"]');
  var src = me ? (me.getAttribute("src") || "") : "";
  var root = src.slice(0, src.lastIndexOf("/") + 1);

  /* ---------- Cart (shared by every page) ---------- */
  var CART_KEY = "bidiiCartItems";
  function readCart() { try { return JSON.parse(localStorage.getItem(CART_KEY)) || {}; } catch (e) { return {}; } }
  function writeCart(c) {
    try { localStorage.setItem(CART_KEY, JSON.stringify(c)); } catch (e) {}
    updateCartBadge();
    document.dispatchEvent(new Event("bidii:cart"));
  }
  function cartCount() {
    var c = readCart();
    return Object.keys(c).reduce(function (n, k) { return n + c[k]; }, 0);
  }
  function updateCartBadge() {
    var badge = document.querySelector(".cart-count");
    if (!badge) return;
    var n = cartCount();
    badge.textContent = n > 99 ? "99+" : n;
    badge.hidden = n === 0;
  }
  window.BidiiCart = {
    items: readCart,
    count: cartCount,
    add: function (id, qty) { var c = readCart(); c[id] = Math.min((c[id] || 0) + (qty || 1), 99); writeCart(c); },
    set: function (id, qty) { var c = readCart(); if (qty <= 0) delete c[id]; else c[id] = Math.min(qty, 99); writeCart(c); },
    remove: function (id) { var c = readCart(); delete c[id]; writeCart(c); },
    clear: function () { writeCart({}); }
  };
  window.addEventListener("storage", updateCartBadge);

  /* ---------- Shared header (edit menu items here, it updates every page) ---------- */
  var MENU = [
    { label: "ABOUT US", href: "Pages/history.html", sub: [
      ["Our History", "Pages/history.html"],
      ["Leadership and Team", "Pages/team.html"],
      ["Our Partners", "Pages/partners.html"]
    ]},
    { label: "OUR WORK", href: "Pages/our-work.html", sub: [
      ["Projects and Impacts", "Pages/our-work.html#projects"],
      ["Community Education", "Pages/our-work.html#education"],
      ["Biodiversity Conservation", "Pages/our-work.html#biodiversity"],
      ["Research and Monitoring", "Pages/our-work.html#research"]
    ]},
    { label: "NEWS &amp; EVENTS", href: "Pages/news.html", sub: [
      ["News", "Pages/news.html"],
      ["Events", "Pages/events.html"],
      ["Photo and Video Gallery", "Pages/gallery.html"]
    ]},
    { label: "GET INVOLVED", href: "Pages/volunteer.html", sub: [
      ["Volunteer", "Pages/volunteer.html"],
      ["Donate", "Pages/donate.html"],
      ["Partner with us", "Pages/partner.html"]
    ]},
    { label: "VISIT US", href: "Pages/visit.html" },
    { label: "CONTACT US", href: "Pages/contact.html" }
  ];
  var LOGO = "Images/Logo.jpeg";

  function initHeaderMarkup() {
    var items = MENU.map(function (m) {
      var sub = "";
      if (m.sub) {
        sub = '<ul class="dropdown-menu">' + m.sub.map(function (s) {
          return '<li><a class="link" href="' + root + s[1] + '">' + s[0] + "</a></li>";
        }).join("") + "</ul>";
      }
      return '<li' + (m.sub ? ' class="dropdown"' : "") + '><a class="link" href="' + root + m.href + '">' + m.label + "</a>" + sub + "</li>";
    }).join("");

    var html =
      '<div class="nav">' +
        '<a class="brand" href="' + root + 'index.html"><div class="logo-circle"><img src="' + root + LOGO + '" alt="" class="brand-icon"></div><span class="sr-only">Bidii Creek Conservancy, home</span></a>' +
        '<button class="nav-toggle" id="navToggle" aria-label="Toggle menu" aria-expanded="false" aria-controls="navMenuContainer"><span></span><span></span><span></span></button>' +
        '<nav class="nav-menu" id="navMenuContainer" aria-label="Main menu"><ul id="navMenu">' + items + "</ul></nav>" +
        '<div class="nav-actions">' +
          '<a class="cart-btn" href="' + root + 'Pages/shop.html#cart" aria-label="View cart">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>' +
            '<span class="cart-count" hidden>0</span>' +
          '</a>' +
          '<a class="donate-btn" href="' + root + 'Pages/donate.html">Donate</a>' +
        '</div>' +
      "</div>";

    var header = document.querySelector("header.site");
    if (!header) {
      header = document.createElement("header");
      header.className = "site";
      document.body.insertBefore(header, document.body.firstChild);
    }
    header.innerHTML = html;

    // Skip link for keyboard users (added if the page doesn't have one)
    if (!document.querySelector(".skip-link") && document.getElementById("main")) {
      var skip = document.createElement("a");
      skip.className = "skip-link";
      skip.href = "#main";
      skip.textContent = "Skip to content";
      document.body.insertBefore(skip, document.body.firstChild);
    }
  }

  /* ---------- Mobile menu & dropdowns ---------- */
  function initNav() {
    var toggle = document.getElementById("navToggle");
    var menu = document.getElementById("navMenuContainer");
    if (!toggle || !menu) return;

    function setMenu(open) {
      menu.classList.toggle("open", open);
      toggle.setAttribute("aria-expanded", String(open));
    }

    toggle.addEventListener("click", function () {
      setMenu(!menu.classList.contains("open"));
    });

    // On mobile, first tap on a parent link opens its submenu; second tap follows the link
    menu.querySelectorAll("#navMenu > li").forEach(function (li) {
      var sub = li.querySelector(":scope > .dropdown-menu");
      var link = li.querySelector(":scope > a");
      if (!sub || !link) return;
      link.setAttribute("aria-haspopup", "true");
      link.addEventListener("click", function (e) {
        if (mobileQuery.matches && !li.classList.contains("open")) {
          e.preventDefault();
          li.parentElement.querySelectorAll(":scope > li.open").forEach(function (o) { o.classList.remove("open"); });
          li.classList.add("open");
        }
      });
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        setMenu(false);
        menu.querySelectorAll("li.open").forEach(function (li) { li.classList.remove("open"); });
      }
    });

    document.addEventListener("click", function (e) {
      if (!e.target.closest("header.site")) {
        setMenu(false);
        menu.querySelectorAll("li.open").forEach(function (li) { li.classList.remove("open"); });
      }
    });

    mobileQuery.addEventListener("change", function () { setMenu(false); });
  }

  /* ---------- Cart icon ----------
     From any other page it opens the shop at the cart.
     On the shop page itself it just scrolls down to the cart,
     so clicking it (once or many times) never reloads the page. */
  function initCartLink() {
    var btn = document.querySelector(".cart-btn");
    var cartSection = document.getElementById("cart");
    if (!btn || !cartSection) return;          // not on the shop page: normal link

    btn.addEventListener("click", function (e) {
      e.preventDefault();
      var menu = document.getElementById("navMenuContainer");
      var toggle = document.getElementById("navToggle");
      if (menu) menu.classList.remove("open");
      if (toggle) toggle.setAttribute("aria-expanded", "false");
      cartSection.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
      if (history.replaceState) history.replaceState(null, "", "#cart");
    });
  }

  /* ---------- Header shadow on scroll ---------- */
  function initHeader() {
    var header = document.querySelector("header.site");
    if (!header) return;
    function onScroll() { header.classList.toggle("scrolled", window.scrollY > 8); }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ---------- Highlight current page in the menu ---------- */
  function initActiveLink() {
    var here = location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll("#navMenu a.link").forEach(function (a) {
      var target = (a.getAttribute("href") || "").split("/").pop();
      if (target && target === here) a.classList.add("active");
    });
  }

  /* ---------- Slideshow ---------- */
  function initSlider() {
    var slider = document.getElementById("slider");
    if (!slider) return;
    var slides = Array.prototype.slice.call(slider.querySelectorAll(".slide"));
    var dots = Array.prototype.slice.call(slider.querySelectorAll(".sl-dots button"));
    var prev = slider.querySelector(".sl-prev");
    var next = slider.querySelector(".sl-next");
    if (slides.length < 2) return;

    var index = 0, timer = null, DELAY = 6000;

    function show(i) {
      index = (i + slides.length) % slides.length;
      slides.forEach(function (s, n) {
        var active = n === index;
        s.classList.toggle("is-active", active);
        s.setAttribute("aria-hidden", String(!active));
        s.querySelectorAll("a").forEach(function (a) { a.tabIndex = active ? 0 : -1; });
      });
      dots.forEach(function (d, n) {
        d.classList.toggle("is-active", n === index);
        d.setAttribute("aria-current", n === index ? "true" : "false");
      });
    }
    function start() { if (!reduceMotion) { stop(); timer = setInterval(function () { show(index + 1); }, DELAY); } }
    function stop() { if (timer) { clearInterval(timer); timer = null; } }

    if (prev) prev.addEventListener("click", function () { show(index - 1); start(); });
    if (next) next.addEventListener("click", function () { show(index + 1); start(); });
    dots.forEach(function (d, n) { d.addEventListener("click", function () { show(n); start(); }); });

    // Pause while hovering or focused
    slider.addEventListener("mouseenter", stop);
    slider.addEventListener("mouseleave", start);
    slider.addEventListener("focusin", stop);
    slider.addEventListener("focusout", start);

    // Arrow keys when slider has focus
    slider.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") { show(index - 1); }
      if (e.key === "ArrowRight") { show(index + 1); }
    });

    // Swipe on touch screens
    var startX = null;
    slider.addEventListener("touchstart", function (e) { startX = e.touches[0].clientX; stop(); }, { passive: true });
    slider.addEventListener("touchend", function (e) {
      if (startX !== null) {
        var dx = e.changedTouches[0].clientX - startX;
        if (Math.abs(dx) > 40) show(dx < 0 ? index + 1 : index - 1);
        startX = null;
      }
      start();
    }, { passive: true });

    // Pause when tab is hidden
    document.addEventListener("visibilitychange", function () { document.hidden ? stop() : start(); });

    show(0);
    start();
  }


  /* ---------- Count-up for the statistics (any .stat-value with data-target) ----------
     data-target can be a whole number ("30000"), a decimal ("5.6")
     and can end with a sign such as "+" ("5.6+"): it is kept as it is. */
  function initCounter() {
    var els = document.querySelectorAll(".stat-value[data-target]");
    if (!els.length || reduceMotion || !("IntersectionObserver" in window)) return;

    function run(el) {
      var parts = String(el.getAttribute("data-target")).trim().match(/^([\d,]*\.?\d+)(.*)$/);
      if (!parts) return;
      var target = parseFloat(parts[1].replace(/,/g, ""));
      var decimals = (parts[1].split(".")[1] || "").length;     // "5.6" -> 1 decimal place
      var suffix = parts[2];                                     // "+" in "5.6+"
      var t0 = performance.now(), dur = 1800;
      (function tick(now) {
        var p = Math.min((now - t0) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = (target * eased).toLocaleString("en-US",
          { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + suffix;
        if (p < 1) requestAnimationFrame(tick);
      })(t0);
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        io.unobserve(entry.target);
        run(entry.target);
      });
    }, { threshold: 0.6 });

    els.forEach(function (el) { el.textContent = "0"; io.observe(el); });
  }

  /* ---------- Simple form validation for future forms (add data-validate to a <form>) ---------- */
  function initForms() {
    document.querySelectorAll("form[data-validate]").forEach(function (form) {
      form.setAttribute("novalidate", "");
      form.addEventListener("submit", function (e) {
        var ok = true;
        form.querySelectorAll("[required]").forEach(function (input) {
          var field = input.closest(".field") || input.parentElement;
          var old = field.querySelector(".msg");
          if (old) old.remove();
          field.classList.remove("error");
          var bad = !input.value.trim() || (input.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value));
          if (bad) {
            ok = false;
            field.classList.add("error");
            var m = document.createElement("div");
            m.className = "msg";
            m.textContent = input.type === "email" ? "Enter a valid email address." : "This field is required.";
            field.appendChild(m);
          }
        });
        if (!ok) {
          e.preventDefault();
          var first = form.querySelector(".field.error input, .field.error textarea, .field.error select");
          if (first) first.focus();
        }
      });
    });
  }

  /* ---------- Shared footer (edit details here, it updates every page) ---------- */
  var FOOTER = {
    brand: "Bidii Creek Conservancy",
    tagline: "Conservation &middot; Restoration &middot; Protection",
    name: "Bidii Creek Conservancy. All rights reserved",
    address: "Jomvu Kuu, Mombasa, Kenya",
    postal: "P.O. Box 93837-80100",
    email: "bidiicreekconservancy001@gmail.com",
    phone: ["+254 720322662", "+254 724162643"],
    social: {
      "Facebook": "https://www.facebook.com/share/1G1g6UHspr/",
      "Instagram": "https://www.instagram.com/bidii_creek_conservancy",
      "X": "https://x.com/BidiiCreek",
      "YouTube": "https://youtube.com/@bidiicreek"
    },
    quick: [
      ["About Us", "Pages/about.html"],
      ["Our Work", "Pages/our-work.html"],
      ["News", "Pages/news.html"],
      ["Events", "Pages/events.html"],
      ["Visit Us", "Pages/visit.html"],
      ["Contact Us", "Pages/contact.html"]
    ],
    resources: [
      ["Volunteer", "Pages/volunteer.html"],
      ["Partner with us", "Pages/partner.html"],
      ["Shop", "Pages/shop.html"]
    ]
  };

  function svg(inner, extra) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"' + (extra || "") + ">" + inner + "</svg>";
  }
  var FI = {
    pin: '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
    box: '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
    mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/>',
    phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
    Facebook: '<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>',
    Instagram: '<rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><path d="M17.5 6.5h.01"/>',
    X: '<path fill="currentColor" stroke="none" d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/>',
    YouTube: '<path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/><path d="m9.75 15.02 5.75-3.27-5.75-3.27z"/>',
    up: '<path d="M12 19V5M5 12l7-7 7 7"/>'
  };

  function initFooter() {
    if (document.getElementById("siteFooter")) return;

    function list(items) {
      return items.map(function (i) { return '<li><a href="' + root + i[1] + '">' + i[0] + "</a></li>"; }).join("");
    }
    var social = Object.keys(FOOTER.social).map(function (n) {
      return '<a href="' + FOOTER.social[n] + '" aria-label="' + n + '" target="_blank" rel="noopener">' + svg(FI[n]) + "</a>";
    }).join("");

    var f = document.createElement("footer");
    f.id = "siteFooter";
    f.className = "site-footer";
    f.innerHTML =
      '<div class="footer-grid">' +
        '<section class="footer-brand" aria-label="' + FOOTER.brand + '">' +
          '<a href="' + root + 'index.html"><img src="' + root + LOGO + '" alt="' + FOOTER.brand + ' logo"></a>' +
          '<p class="footer-name">' + FOOTER.brand + '</p>' +
          '<p class="footer-tagline">' + FOOTER.tagline + '</p>' +
        '</section>' +
        '<section aria-labelledby="ft-contacts"><h3 id="ft-contacts">Contacts</h3>' +
          '<ul class="footer-list footer-contact">' +
            "<li>" + svg(FI.pin) + "<span>" + FOOTER.address + "</span></li>" +
            "<li>" + svg(FI.box) + "<span>" + FOOTER.postal + "</span></li>" +
            "<li>" + svg(FI.mail) + '<a href="mailto:' + FOOTER.email + '">' + FOOTER.email + "</a></li>" +
            FOOTER.phone.map(function (p) {
              return "<li>" + svg(FI.phone) + '<a href="tel:' + p.replace(/\s/g, "") + '">' + p + "</a></li>";
            }).join("") +
          "</ul>" +
          '<div class="footer-social">' + social + "</div>" +
        "</section>" +
        '<nav aria-labelledby="ft-quick"><h3 id="ft-quick">Explore</h3><ul class="footer-list">' + list(FOOTER.quick) + "</ul></nav>" +
        '<nav aria-labelledby="ft-res"><h3 id="ft-res">Get Involved</h3><ul class="footer-list">' + list(FOOTER.resources) + "</ul>" +
          '<div class="footer-donate"><a class="btn" href="' + root + 'Pages/donate.html">Donate Now</a><small>Every donation helps nature thrive.</small></div>' +
        "</nav>" +
      "</div>" +
      '<div class="footer-bottom"><div class="footer-bottom-inner">' +
        "<p>&copy; " + new Date().getFullYear() + " " + FOOTER.name + ".</p>" +
      "</div></div>";
    document.body.appendChild(f);

    // Back to top
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "back-to-top";
    btn.setAttribute("aria-label", "Back to top");
    btn.innerHTML = svg(FI.up);
    btn.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    });
    document.body.appendChild(btn);
    function onScroll() { btn.classList.toggle("show", window.scrollY > 500); }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  document.addEventListener("DOMContentLoaded", function () {
    initHeaderMarkup();
    updateCartBadge();
    initNav();
    initCartLink();
    initHeader();
    initActiveLink();
    initSlider();
    initCounter();
    initForms();
    initFooter();
  });
})();