/* ============================================================================
   CONTOUR — behaviour
   ----------------------------------------------------------------------------
   Everything here is progressive enhancement. The page is fully usable with
   JavaScript disabled: tabs fall back to their default panel, disclosures use
   native <details>, and the theme follows the OS.
   ========================================================================= */

(() => {
  "use strict";

  // Idempotent loading: a second <script> tag must not double-bind.
  if (window.Contour && window.Contour.__loaded) return;

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from((root || document).querySelectorAll(sel));

  /* True when the event target is a place where the reader is typing, so a
     single-key shortcut must not steal the character. */
  const isTyping = (el) =>
    !!el &&
    (el.isContentEditable ||
      ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName));

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* Jump to an element and keep the address bar in step, without stacking up
     history entries for a single jump. Hoisted to top level so the public
     API (window.Contour.scrollTo) can reach it. */
  const goTo = (el) => {
    if (!el) return;
    if (el.id && location.hash !== "#" + el.id) {
      history.replaceState(null, "", "#" + el.id);
    }
    el.scrollIntoView({
      behavior: reducedMotion.matches ? "auto" : "smooth",
      block: "start",
    });
  };

  /* ---------------------------------------------------------------------
    1. Colour scheme
     The <meta name="color-scheme"> element is the single source of truth.
     CSS maps it onto `color-scheme`, so the cascade stays authoritative and
     the page still follows the OS when no override has been stored.
     --------------------------------------------------------------------- */
  const schemeMeta = () => $('meta[name="color-scheme"]');
  const storedScheme = () => {
    try {
      return localStorage.getItem("contour-scheme") ?? "light dark";
    } catch {
      return "light dark";
    }
  };

  const applyScheme = (value) => {
    const meta = schemeMeta();
    if (meta) meta.setAttribute("content", value);
    try {
      if (value === "light dark") localStorage.removeItem("contour-scheme");
      else localStorage.setItem("contour-scheme", value);
    } catch {
      /* storage unavailable — the page still renders correctly */
    }
    syncSchemeControls(value);
  };

  const resolvedScheme = () =>
    window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

  function syncSchemeControls(value) {
    const resolved = resolvedScheme();
    // The button shows the scheme you will move TO, not the one you are in.
    const rendered = value === "light dark" ? resolved : value;
    const target = rendered === "dark" ? "light" : "dark";

    $$("[data-scheme-toggle]").forEach((btn) => {
      btn.dataset.schemeNext = target;
      btn.setAttribute(
        "aria-label",
        target === "dark" ? "Switch to dark theme" : "Switch to light theme",
      );
      btn.setAttribute(
        "title",
        value === "light dark"
          ? `Following the system (${resolved}). Activate to switch to ${target}.`
          : `Manual: ${value}. Activate to switch to ${target}.`,
      );
    });

    $$("[data-scheme-option]").forEach((el) => {
      const active = el.dataset.schemeOption === value;
      if (el.type === "radio") {
        el.checked = active;
      } else {
        el.setAttribute("aria-checked", String(active));
        el.tabIndex = active ? 0 : -1;
      }
    });
  }

  /* Header button: two states. It shows the currently rendered scheme and
     switches to the opposite of what is on screen. */
  $$("[data-scheme-toggle]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const current = storedScheme();
      const rendered = current === "light dark" ? resolvedScheme() : current;
      const target = rendered === "dark" ? "light" : "dark";
      const system = resolvedScheme();
      applyScheme(target === system ? "light dark" : target);
    });
  });

  /* Scheme controls use native radios wherever the choice is exclusive, so
     arrow-key navigation and the checked state come from the platform. */
  $$("[data-scheme-option]").forEach((el) => {
    if (el.type === "radio") {
      el.addEventListener("change", () => applyScheme(el.dataset.schemeOption));
      return;
    }
    el.addEventListener("click", () => applyScheme(el.dataset.schemeOption));
    el.addEventListener("keydown", (event) => {
      const options = $$("[data-scheme-option]").filter((o) => o.type !== "radio");
      const index = options.indexOf(el);
      if (event.key === "ArrowRight" || event.key === "ArrowDown") {
        event.preventDefault();
        options[(index + 1) % options.length].focus();
        options[(index + 1) % options.length].click();
      }
      if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
        event.preventDefault();
        const prev = options[(index - 1 + options.length) % options.length];
        prev.focus();
        prev.click();
      }
    });
  });

  window.addEventListener("storage", (event) => {
    if (event.key === "contour-scheme") syncSchemeControls(storedScheme());
  });

  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    syncSchemeControls(storedScheme());
  });

  syncSchemeControls(storedScheme());

  /* ---------------------------------------------------------------------
    2. Tabs
     --------------------------------------------------------------------- */
  $$("[data-tabs]").forEach((group) => {
    const list = $("[role='tablist']", group);
    const tabs = $$("[role='tab']", list);
    if (!tabs.length) return;

    const activate = (tab, focus = true) => {
      tabs.forEach((t) => {
        const selected = t === tab;
        t.setAttribute("aria-selected", String(selected));
        t.tabIndex = selected ? 0 : -1;
        const panel = document.getElementById(t.getAttribute("aria-controls"));
        if (panel) panel.hidden = !selected;
      });
      if (focus) tab.focus();
    };

    tabs.forEach((tab, index) => {
      tab.addEventListener("click", () => activate(tab, false));
      tab.addEventListener("keydown", (event) => {
        const map = {
          ArrowRight: index + 1,
          ArrowLeft: index - 1,
          Home: 0,
          End: tabs.length - 1,
        };
        if (!(event.key in map)) return;
        event.preventDefault();
        const next = tabs[(map[event.key] + tabs.length) % tabs.length];
        activate(next);
      });
    });
    // Initialise: hide non-default panels (progressive enhancement).
    if (tabs[0]) activate(tabs[0], false);
  });

  /* ---------------------------------------------------------------------
    3. Segmented controls (button variant, aria-pressed based)
     --------------------------------------------------------------------- */
  $$("[data-segmented]").forEach((group) => {
    const options = $$("button", group);
    options.forEach((option) => {
      option.addEventListener("click", () => {
        options.forEach((o) => o.setAttribute("aria-pressed", String(o === option)));
        group.dispatchEvent(
          new CustomEvent("contour:change", { detail: { value: option.dataset.value } }),
        );
      });
    });
  });

  /* ---------------------------------------------------------------------
    4. Range sliders — paint the filled portion
     --------------------------------------------------------------------- */
  const paintRange = (input) => {
    const min = Number(input.min || 0);
    const max = Number(input.max || 100);
    const value = Number(input.value);
    const pct = max === min ? 0 : ((value - min) / (max - min)) * 100;
    input.style.setProperty("--fill", `${pct}%`);

    const output = document.getElementById(input.getAttribute("aria-describedby") || "");
    if (output) output.textContent = input.dataset.format ? formatValue(input, value) : value;
  };

  const formatValue = (input, value) => {
    const format = input.dataset.format || "";
    if (format === "deg") return `${value}°`;
    if (format === "ms") return `${value} ms`;
    if (format === "km") return `${value.toFixed(1)} km`;
    if (format === "pct") return `${value}%`;
    return String(value);
  };

  $$('input[type="range"][data-format]').forEach((input) => {
    paintRange(input);
    input.addEventListener("input", () => {
      paintRange(input);
      input.dispatchEvent(new CustomEvent("contour:input", { bubbles: true, detail: { value: Number(input.value) } }));
    });
  });

  /* ---------------------------------------------------------------------
    5. Section spy — highlights the current section in the spec rail
     --------------------------------------------------------------------- */
  const railLinks = $$("[data-spy] a");
  if (railLinks.length) {
    const sections = railLinks
      .map((link) => document.getElementById(link.getAttribute("href")?.slice(1)))
      .filter(Boolean);

    const setActive = (id) => {
      railLinks.forEach((link) => {
        const active = link.getAttribute("href") === `#${id}`;
        link.setAttribute("aria-current", active ? "true" : "false");
      });
    };

    // The first entry is active until the observer takes over.
    if (sections[0]) setActive(sections[0].id);

    if ("IntersectionObserver" in window) {
      const spy = new IntersectionObserver(
        (entries) => {
          const visible = entries
            .filter((e) => e.isIntersecting)
            .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
          if (visible[0]) setActive(visible[0].target.id);
        },
        { rootMargin: "-20% 0px -70% 0px" },
      );
      sections.forEach((section) => spy.observe(section));
    }
  }

  /* ---------------------------------------------------------------------
    6. Copy to clipboard — the icon becomes a check, so the result is
       visible without reading a toast.
     --------------------------------------------------------------------- */
  const copyText = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  };

  document.addEventListener("click", async (event) => {
    const trigger = event.target.closest("[data-copy]");
    if (!trigger) return;

    // A copy button inside a <summary> must not toggle the disclosure.
    if (trigger.closest("summary")) event.preventDefault();

    const selector = trigger.dataset.copy;
    const source = selector ? $(selector) : trigger.previousElementSibling;
    const text = source?.textContent?.trim() ?? "";
    if (!text) return;

    const ok = await copyText(text);
    const icon = trigger.querySelector("use");
    const originalHref = icon?.getAttribute("href");
    const originalLabel = trigger.getAttribute("aria-label") || trigger.title;

    if (ok && icon) icon.setAttribute("href", "#i-check");
    trigger.setAttribute("aria-label", ok ? "Copied" : "Copy failed");
    trigger.dataset.copied = String(ok);

    setTimeout(() => {
      if (icon && originalHref) icon.setAttribute("href", originalHref);
      trigger.setAttribute("aria-label", originalLabel);
      delete trigger.dataset.copied;
    }, 1600);
  });

  /* ---------------------------------------------------------------------
    7. Toast
     --------------------------------------------------------------------- */
  let toastHost = $("#toast-host");
  // The region is created at load and reused, never created around its own
  // message. A live region that is inserted already containing text is the one
  // case assistive tech is documented not to announce: it watches for changes
  // inside a region that already exists, so a toast that builds itself with its
  // message inside arrives as markup, not as news. (C-28, WCAG 4.1.3.)
  //
  // The attributes are set on WHICHEVER host is used, not only on one this
  // function made. A page may ship its own `<div id="toast-host">` — the guide
  // does — and an early `return` on that existing node would skip the fix in
  // exactly the one place it can be seen working, leaving a change that edits
  // bytes and alters nothing.
  const ensureToastHost = () => {
    if (!toastHost || !document.contains(toastHost)) {
      toastHost = document.createElement("div");
      toastHost.id = "toast-host";
      toastHost.className = "c-toast-host";
      document.body.append(toastHost);
    }
    if (!toastHost.getAttribute("role")) toastHost.setAttribute("role", "status");
    if (!toastHost.hasAttribute("aria-live")) toastHost.setAttribute("aria-live", "polite");
    return toastHost;
  };
  ensureToastHost();
  const showToast = (message, variant = "success") => {
    const host = ensureToastHost();
    if (!host) return;
    const toast = document.createElement("div");
    toast.className = `c-toast c-toast--${variant}`;
    // No role here: the host is the region. A `role="status"` on the toast as
    // well nests one live region inside another, which is how a single message
    // gets announced twice.
    toast.innerHTML = `<span class="c-dot c-dot--${variant === "danger" ? "danger" : "success"}"></span><span></span>`;
    toast.querySelector("span:last-child").textContent = message;
    host.append(toast);

    requestAnimationFrame(() => {
      toast.animate(
        [
          { opacity: 0, transform: "translateY(0.75rem) scale(0.98)" },
          { opacity: 1, transform: "none" },
        ],
        { duration: 240, easing: "cubic-bezier(0.16, 1, 0.3, 1)" },
      );
    });

    setTimeout(() => {
      toast.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200 }).onfinish = () =>
        toast.remove();
    }, 3200);
  };

  $$("[data-toast]").forEach((btn) =>
    btn.addEventListener("click", () => showToast(btn.dataset.toast, btn.dataset.toastVariant)),
  );

  /* ---------------------------------------------------------------------
    8. Counters
     --------------------------------------------------------------------- */
  const counters = $$("[data-count]");
  if (counters.length) {
    const run = (el) => {
      const target = Number(el.dataset.count);
      const decimals = Number(el.dataset.countDecimals || 0);
      const suffix = el.dataset.countSuffix || "";
      if (reducedMotion.matches) {
        el.textContent = target.toFixed(decimals) + suffix;
        return;
      }
      const duration = 1100;
      const start = performance.now();
      const tick = (now) => {
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - t, 4);
        el.textContent = (target * eased).toFixed(decimals) + suffix;
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    if ("IntersectionObserver" in window) {
      const obs = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            run(entry.target);
            obs.unobserve(entry.target);
          });
        },
        { threshold: 0.4 },
      );
      counters.forEach((el) => obs.observe(el));
    } else {
      counters.forEach(run);
    }
  }

  /* ---------------------------------------------------------------------
    9. Playground — live token overrides
     --------------------------------------------------------------------- */
  const playground = $("[data-playground]");
  if (playground) {
    const scope = $("[data-playground-scope]", playground) || document.documentElement;
    const outputs = $$("[data-playground-out]", playground);

    const write = (key, value) => {
      scope.style.setProperty(key, value);
      outputs.forEach((out) => {
        if (out.dataset.playgroundOut === key) out.textContent = value;
      });
    };

    $$("[data-playground-input]", playground).forEach((input) => {
      const key = input.dataset.playgroundInput;
      const unit = input.dataset.playgroundUnit || "";
      const divisor = Number(input.dataset.playgroundDivisor || 1);

      const handler = () => {
        const raw = Number(input.value);
        write(key, divisor === 1 ? `${raw}${unit}` : `${raw / divisor}`);
      };

      input.addEventListener("input", handler);
      handler();
    });

    const reset = $("[data-playground-reset]", playground);
    reset?.addEventListener("click", () => {
      $$("[data-playground-input]", playground).forEach((input) => {
        input.value = input.defaultValue;
        input.dispatchEvent(new Event("input", { bubbles: true }));
      });
    });
  }

  /* ---------------------------------------------------------------------
   10. Mobile navigation
     --------------------------------------------------------------------- */
  const navToggle = $("[data-nav-toggle]");
  const nav = $("#primary-nav");
  if (navToggle && nav) {
    navToggle.addEventListener("click", () => {
      const open = navToggle.getAttribute("aria-expanded") === "true";
      navToggle.setAttribute("aria-expanded", String(!open));
      nav.classList.toggle("is-open", !open);
    });
  }

  /* ---------------------------------------------------------------------
   11. Dialog — progressive enhancement over <dialog>
     --------------------------------------------------------------------- */
  $$("[data-dialog-open]").forEach((btn) => {
    const dialog = document.getElementById(btn.dataset.dialogOpen);
    btn.addEventListener("click", () => dialog?.showModal());
  });

  $$("[data-dialog-close]").forEach((btn) => {
    const dialog = btn.closest("dialog");
    btn.addEventListener("click", () => dialog?.close());
  });

  /* ---------------------------------------------------------------------
   11b. Menu / drawer — popover open-close + aria-expanded (T-122)
     --------------------------------------------------------------------- */
  $$("[data-menu-toggle]").forEach((btn) => {
    const menu = document.getElementById(btn.dataset.menuToggle);
    if (!menu) return;
    btn.setAttribute("popovertarget", menu.id);
    menu.addEventListener("toggle", (e) => {
      btn.setAttribute("aria-expanded", String(e.newState === "open"));
    });
  });
  $$("[data-drawer-toggle]").forEach((btn) => {
    const drawer = document.getElementById(btn.dataset.drawerToggle);
    if (!drawer) return;
    btn.setAttribute("popovertarget", drawer.id);
    drawer.addEventListener("toggle", (e) => {
      btn.setAttribute("aria-expanded", String(e.newState === "open"));
    });
  });

  /* ---------------------------------------------------------------------
   12. Alerts — dismiss
     --------------------------------------------------------------------- */
  $$("[data-alert-close]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const alertEl = btn.closest(".c-alert");
      if (!alertEl) return;
      const animation = alertEl.animate(
        [{ opacity: 1 }, { opacity: 0, transform: "translateX(-8px)" }],
        { duration: 180, easing: "ease-in" },
      );
      animation.onfinish = () => alertEl.remove();
    });
  });

  /* ---------------------------------------------------------------------
   13. Tooltips — native popover where available, title fallback otherwise
     --------------------------------------------------------------------- */
  if ("popover" in HTMLElement.prototype) {
    $$("[data-tooltip]").forEach((trigger) => {
      const tip = document.getElementById(trigger.dataset.tooltip);
      if (!tip) return;
      trigger.setAttribute("popovertarget", tip.id);
      trigger.setAttribute("aria-describedby", tip.id);
    });
  } else {
    $$("[data-tooltip]").forEach((trigger) => {
      const tip = document.getElementById(trigger.dataset.tooltip);
      if (!tip) return;
      trigger.setAttribute("title", tip.textContent.trim());
    });
  }

  /* ---------------------------------------------------------------------
   14. Command palette
     The index is built from the page itself, so renaming a section can
     never leave a stale search result behind.
     --------------------------------------------------------------------- */
  const palette = $("[data-command-palette]");

  if (palette) {
    const field = $("[data-command-field]", palette);
    const list = $("[data-command-list]", palette);
    const empty = $("[data-command-empty]", palette);
    const supportsPopover = typeof palette.showPopover === "function";
    let index = [];
    let filtered = [];
    let active = 0;

    /* Subsequence match with a bonus for prefix and substring hits. */
    const fuzzy = (query, text) => {
      if (!query) return { score: 0, hits: [] };
      const q = query.toLowerCase();
      const t = text.toLowerCase();
      const hits = [];
      let ti = 0;
      let score = 0;
      let streak = 0;
      for (const ch of q) {
        if (ch === " ") continue;
        const found = t.indexOf(ch, ti);
        if (found === -1) return null;
        hits.push(found);
        streak = found === ti ? streak + 1 : 0;
        score += 10 + streak * 6 - Math.min(found - ti, 8);
        ti = found + 1;
      }
      if (t.startsWith(q)) score += 40;
      else if (t.includes(q)) score += 25;
      score -= text.length * 0.12;
      return { score, hits };
    };


    const buildIndex = () => {
      const found = [];
      const push = (group, title, hint, icon, run) => {
        if (!title) return;
        found.push({ group, title, hint, icon, run });
      };

      // Navigation: any list marked as a command source.
      $$("[data-command-nav] a[href]").forEach((a) => {
        // The label is the link's own text, without any trailing badge.
        const clone = a.cloneNode(true);
        clone.querySelectorAll(".c-docs-nav__badge, .c-badge, .c-tag, .c-kbd").forEach((n) => n.remove());
        push(
          a.dataset.commandGroup || "Navigate",
          clone.textContent.trim(),
          a.dataset.commandHint || "",
          a.dataset.commandIcon || "i-file",
          () => {
            location.hash = a.getAttribute("href");
          },
        );
      });

      // Sections of the current document, however they are marked up.
      $$("main section[id]").forEach((section) => {
        const heading =
          $(".c-section-head__title", section) ||
          $("h2", section) ||
          $("h3", section);
        push(
          "Sections",
          heading ? heading.textContent.replace(/[\u00b6#]/g, "").trim() : "",
          section.id,
          "i-hash",
          () => goTo(section),
        );
      });

      $$("main h2[id], main h3[id]").forEach((h) => {
        push(
          "Sections",
          h.textContent.replace(/[\u00b6#]/g, "").trim(),
          h.tagName === "H2" ? "Section" : "Subsection",
          "i-hash",
          () => goTo(h),
        );
      });

      $$("[data-command-action]").forEach((b) => {
        push(
          "Actions",
          b.dataset.commandAction,
          b.dataset.commandHint || "",
          b.dataset.commandIcon || "i-zap",
          () => b.click(),
        );
      });

      // Registered commands (T-99): a consumer's declarative shortcuts.
      commandRegistry.forEach((cmd) => {
        push(
          "Commands",
          cmd.label,
          cmd.shortcut || "",
          "i-zap",
          () => cmd.run(),
        );
      });

      return found;
    };

    const escapeHtml = (text) =>
      text.replace(/[&<>"]/g, (c) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
      })[c]);

    const highlight = (text, hits) => {
      if (!hits?.length) return escapeHtml(text);
      const set = new Set(hits);
      let html = "";
      for (let i = 0; i < text.length; i++) {
        html += set.has(i)
          ? '<mark class="c-command__mark">' + escapeHtml(text[i]) + "</mark>"
          : escapeHtml(text[i]);
      }
      return html;
    };

    /* Match the title first: a title hit is what the user is looking for,
       so it outranks a hint or group hit and carries the highlight
       indices with it. */
    const matchCommand = (query, cmd) => {
      const title = fuzzy(query, cmd.title);
      if (title) return { score: title.score + 24, hits: title.hits, hintHits: [] };
      const hint = fuzzy(query, cmd.hint);
      if (hint) return { score: hint.score + 8, hits: [], hintHits: hint.hits };
      const group = fuzzy(query, cmd.group);
      if (group) return { score: group.score, hits: [], hintHits: [] };
      return null;
    };

    const items = () => $$(".c-command__item", list);

    function setActive(position) {
      const all = items();
      if (!all.length) {
        field.removeAttribute("aria-activedescendant");
        return;
      }
      active = (position + all.length) % all.length;
      all.forEach((el, i) => el.setAttribute("aria-selected", String(i === active)));
      const activeEl = all[active];
      if (activeEl && !activeEl.id) activeEl.id = "command-item-" + active;
      if (activeEl) field.setAttribute("aria-activedescendant", activeEl.id);
      all[active].scrollIntoView({ block: "nearest" });
    }

    const render = () => {
      const query = field.value.trim();
      filtered = index
        .map((cmd) => {
          const match = matchCommand(query, cmd);
          return match ? Object.assign({}, cmd, match) : null;
        })
        .filter(Boolean)
        .sort((a, b) => b.score - a.score);

      if (!filtered.length) {
        list.innerHTML = "";
        if (empty) empty.hidden = false;
        return;
      }
      if (empty) empty.hidden = true;

      const groups = new Map();
      filtered.forEach((cmd) => {
        if (!groups.has(cmd.group)) groups.set(cmd.group, []);
        groups.get(cmd.group).push(cmd);
      });

      list.innerHTML = Array.from(groups, ([group, cmds]) => {
        const rows = cmds
          .map((cmd) => {
            const position = filtered.indexOf(cmd);
            const safeGroup = escapeHtml(group);
            const hint = cmd.hint
              ? safeGroup + " \u00b7 " + highlight(cmd.hint, cmd.hintHits)
              : safeGroup;
            return (
              '<button class="c-command__item" role="option" aria-selected="false" tabindex="-1" id="command-item-' +
              position +
              '" data-index="' +
              position +
              '" type="button">' +
              '<span class="c-command__item-icon"><svg aria-hidden="true"><use href="#' +
              escapeHtml(cmd.icon) +
              '"/></svg></span>' +
              '<span class="c-command__item-body">' +
              '<span class="c-command__item-title">' +
              highlight(cmd.title, cmd.hits) +
              "</span>" +
              '<span class="c-command__item-hint">' +
              hint +
              "</span>" +
              "</span>" +
              "</button>"
            );
          })
          .join("");
        return (
          '<div class="c-command__group"><div class="c-command__group-title">' +
          escapeHtml(group) +
          "</div>" +
          rows +
          "</div>"
        );
      }).join("");

      setActive(0);
    };

    const open = () => {
      index = buildIndex();
      field.value = "";
      render();
      field.setAttribute("aria-expanded", "true");
      if (supportsPopover) palette.showPopover();
      else palette.classList.add("is-open");
      requestAnimationFrame(() => field.focus());
    };

    const close = () => {
      field.setAttribute("aria-expanded", "false");
      field.removeAttribute("aria-activedescendant");
      if (supportsPopover) palette.hidePopover();
      else palette.classList.remove("is-open");
    };

    const isOpen = () =>
      supportsPopover
        ? palette.matches(":popover-open")
        : palette.classList.contains("is-open");

    field?.addEventListener("input", render);

    field?.addEventListener("keydown", (event) => {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActive(active + 1);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setActive(active - 1);
      } else if (event.key === "Enter") {
        event.preventDefault();
        const all = items();
        if (all[active]) all[active].click();
      } else if (event.key === "Escape") {
        // Escape clears the query first, and only closes on a second press.
        if (field.value) {
          event.preventDefault();
          field.value = "";
          render();
        } else {
          close();
        }
      }
    });

    list?.addEventListener("click", (event) => {
      const item = event.target.closest(".c-command__item");
      if (!item) return;
      const cmd = filtered[Number(item.dataset.index)];
      if (!cmd) return;
      close();
      cmd.run();
    });

    document.addEventListener("keydown", (event) => {
      if (
        event.key.toLowerCase() === "k" &&
        (event.metaKey || event.ctrlKey) &&
        !isTyping(event.target)
      ) {
        event.preventDefault();
        if (isOpen()) close();
        else open();
        return;
      }

      // "/" opens the palette, the way a search field would — but only when
      // the reader is not already typing somewhere.
      if (
        event.key === "/" &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey &&
        !isTyping(event.target)
      ) {
        event.preventDefault();
        if (!isOpen()) open();
      }

      // Registered command shortcuts (T-99): run a command whose shortcut
      // matches the pressed key combination.
      if (!isTyping(event.target)) {
        const mod = event.metaKey || event.ctrlKey;
        for (const cmd of commandRegistry) {
          if (!cmd.shortcut) continue;
          const parts = String(cmd.shortcut).toLowerCase().split("+").map((p) => p.trim());
          const needsMod = parts.includes("mod") || parts.includes("ctrl") || parts.includes("meta");
          const key = parts.filter((p) => !["mod", "ctrl", "meta", "shift", "alt"].includes(p))[0];
          if (needsMod !== mod) continue;
          if (parts.includes("shift") !== event.shiftKey) continue;
          if (parts.includes("alt") !== event.altKey) continue;
          if (key && event.key.toLowerCase() === key) {
            event.preventDefault();
            cmd.run();
            return;
          }
        }
      }
    });

    $$("[data-command-open]").forEach((btn) =>
      btn.addEventListener("click", (event) => {
        event.preventDefault();
        open();
      }),
    );
  }

  /* ---------------------------------------------------------------------
   15. Sortable tables
     --------------------------------------------------------------------- */
  $$("table[data-sortable]").forEach((table) => {
    const headers = $$("th[aria-sort]", table);
    const tbody = table.tBodies[0];
    if (!tbody) return;

    headers.forEach((th) => {
      th.setAttribute("tabindex", "0");
      th.setAttribute("role", "columnheader");

      const apply = () => {
        const type = th.dataset.sortType || "text";
        const dir = th.getAttribute("aria-sort") === "ascending" ? -1 : 1;
        headers.forEach((h) => {
          if (h !== th) h.setAttribute("aria-sort", "none");
        });
        th.setAttribute("aria-sort", dir === 1 ? "ascending" : "descending");

        const rows = Array.from(tbody.rows);
        rows.sort((a, b) => {
          const av = a.cells[th.cellIndex]?.dataset.value ?? a.cells[th.cellIndex]?.textContent.trim() ?? "";
          const bv = b.cells[th.cellIndex]?.dataset.value ?? b.cells[th.cellIndex]?.textContent.trim() ?? "";
          if (type === "number") return (parseFloat(av) || 0) * dir - (parseFloat(bv) || 0) * dir;
          return av.localeCompare(bv, undefined, { numeric: true }) * dir;
        });
        rows.forEach((row) => tbody.append(row));
      };

      th.addEventListener("click", apply);
      th.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          apply();
        }
      });
    });
  });

  /* ---------------------------------------------------------------------
   16. Density toggle
     --------------------------------------------------------------------- */
  $$("[data-density-toggle]").forEach((group) => {
    const scope = document.querySelector(group.dataset.densityToggle) || document;
    const options = $$("button", group);
    options.forEach((option) => {
      option.addEventListener("click", () => {
        options.forEach((o) => o.setAttribute("aria-pressed", String(o === option)));
        scope.setAttribute("data-density", option.dataset.value);
      });
    });
  });

  /* ---------------------------------------------------------------------
   17. Table of contents scroll-spy
     --------------------------------------------------------------------- */
  const tocLinks = $$("[data-toc] a");
  if (tocLinks.length) {
    const headings = tocLinks
      .map((link) => document.getElementById(link.getAttribute("href")?.slice(1)))
      .filter(Boolean);

    const setCurrent = (id) => {
      tocLinks.forEach((link) => {
        link.setAttribute("aria-current", link.getAttribute("href") === `#${id}` ? "true" : "false");
      });
    };

    if ("IntersectionObserver" in window) {
      const spy = new IntersectionObserver(
        (entries) => {
          const visible = entries
            .filter((e) => e.isIntersecting)
            .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
          if (visible[0]) setCurrent(visible[0].target.id);
        },
        { rootMargin: "-15% 0px -75% 0px" },
      );
      headings.forEach((h) => spy.observe(h));
    }
  }

  /* ---------------------------------------------------------------------
     18. Removable filter pills and tags
     --------------------------------------------------------------------- */
  document.addEventListener("click", (event) => {
    const remove = event.target.closest("[data-remove]");
    if (!remove) return;
    const target = remove.closest("[data-removable]") || remove.parentElement;
    target?.remove();
  });

  /* ---------------------------------------------------------------------
     18b. Chart API (T-54) — a scale, a tick generator, a datum layer.
     No charting library; the frame is Contour's own. The consumer owns the
     geometry; the system owns the vocabulary.
     --------------------------------------------------------------------- */
  function linearScale(domain, range) {
    const [d0, d1] = domain;
    const [r0, r1] = range;
    const span = d1 - d0 || 1;
    return (v) => r0 + ((v - d0) / span) * (r1 - r0);
  }

  function niceTicks(min, max, count) {
    count = count || 5;
    const span = max - min || 1;
    const step = Math.pow(10, Math.floor(Math.log10(span / count)));
    const err = (count * step) / span;
    let niceStep = step;
    if (err <= 0.15) niceStep = 10 * step;
    else if (err <= 0.35) niceStep = 5 * step;
    else if (err <= 0.75) niceStep = 2 * step;
    const niceMin = Math.floor(min / niceStep) * niceStep;
    const niceMax = Math.ceil(max / niceStep) * niceStep;
    const ticks = [];
    for (let v = niceMin; v <= niceMax + niceStep / 2; v += niceStep) {
      ticks.push(Math.round(v * 1e9) / 1e9);
    }
    return ticks;
  }

  function datum(x, y, r) {
    r = r || 3;
    return { cx: x, cy: y, r: r };
  }

  /* ---------------------------------------------------------------------
     18c. Command registry (T-99) — a declarative shortcut format.
     A consumer registers commands; the palette reads them. The guard
     (editable-target) is absolute.
     --------------------------------------------------------------------- */
  const commandRegistry = [];
  function registerCommand(cmd) {
    if (!cmd || !cmd.id) return;
    commandRegistry.push(Object.freeze({
      id: cmd.id,
      label: cmd.label || cmd.id,
      shortcut: cmd.shortcut || null,
      run: typeof cmd.run === "function" ? cmd.run : function () {},
    }));
  }
  function listCommands() { return commandRegistry.slice(); }

  /* ---------------------------------------------------------------------
     19. Public API
     The system's behaviour is progressive enhancement, but a consumer who
     wants a toast, a theme setter, a copy action or a scroll-to-section
     helper should not have to reimplement them. Four functions, one
     namespace, a version.
     --------------------------------------------------------------------- */
  // Colour-vision preview producer (T-134).
  $$("[data-cvd-toggle]").forEach((group) => {
    const scope = document.getElementById("data") || document.documentElement;
    const targets = () => $$(".u-cvd-target, .c-chart, .c-datamark", scope);
    $$("button", group).forEach((btn) => {
      btn.addEventListener("click", () => {
        const value = btn.dataset.cvdValue || "";
        targets().forEach((el) => {
          if (value) el.setAttribute("data-cvd", value);
          else el.removeAttribute("data-cvd");
        });
        $$("button", group).forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
      });
    });
  });

  // Theme-set switcher producer (T-148).
  $$("[data-theme-set]").forEach((group) => {
    $$("button", group).forEach((btn) => {
      btn.addEventListener("click", () => {
        const value = btn.dataset.themeValue || "";
        if (value) document.documentElement.setAttribute("data-theme", value);
        else document.documentElement.removeAttribute("data-theme");
        $$("button", group).forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
      });
    });
  });

  // Interface-profile producer (T-98): toggles [data-profile] on a scope.
  $$("[data-profile-toggle]").forEach((group) => {
    const scope = document.getElementById(group.dataset.profileScope || "data") || document.documentElement;
    $$("button", group).forEach((btn) => {
      btn.addEventListener("click", () => {
        const value = btn.dataset.profileValue || "";
        if (value) scope.setAttribute("data-profile", value);
        else scope.removeAttribute("data-profile");
        $$("button", group).forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
      });
    });
  });

  // Motion-pause producer (C-26) for the [data-motion] mechanism in
  // utilities.css. WCAG 2.2.2 is Level A, and prefers-reduced-motion does not
  // discharge it: that is an operating-system setting, and the criterion asks
  // for a control on the page. So the system ships the mechanism and the author
  // ships the button that drives it.
  // "auto" is the default and is taken off rather than written, which leaves
  // the media query in charge until the reader overrides it.
  $$("[data-motion-toggle]").forEach((group) => {
    const scope =
      (group.dataset.motionScope && document.getElementById(group.dataset.motionScope)) ||
      document.documentElement;
    $$("button", group).forEach((btn) => {
      btn.addEventListener("click", () => {
        const value = btn.dataset.motionValue || "auto";
        if (value === "auto") scope.removeAttribute("data-motion");
        else scope.setAttribute("data-motion", value);
        $$("button", group).forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
      });
    });
  });

  window.Contour = Object.freeze({
    __loaded: true,
    version: "1.0",
    toast: showToast,
    setScheme: applyScheme,
    scrollTo: (id) => {
      const el = typeof id === "string" ? document.getElementById(id) : id;
      if (el) goTo(el);
    },
    copy: async (text) => copyText(text),
    chart: { scale: linearScale, ticks: niceTicks, datum: datum },
    commands: { register: registerCommand, list: listCommands },
  });
})();
