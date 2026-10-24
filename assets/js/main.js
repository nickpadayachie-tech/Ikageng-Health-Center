/* ==========================================================================
   Ikageng Health Centre - site behaviour
   Vanilla JavaScript. No dependencies. All primary content works without JS.
   ========================================================================== */
(function () {
  'use strict';

  var doc = document;
  var root = doc.documentElement;

  /* ------------------------------------------------------------------
     Opening hours (single source of truth for the "open now" indicator)
     Index follows Date#getDay(): 0 = Sunday.
     Public holiday hours (09:00 - 12:00) cannot be detected in the
     browser, so they are published as visible copy only.
     ------------------------------------------------------------------ */
  var HOURS = {
    0: null,
    1: ['08:00', '17:00'],
    2: ['08:00', '17:00'],
    3: ['08:00', '17:00'],
    4: ['08:00', '17:00'],
    5: ['08:00', '17:00'],
    6: ['09:00', '14:00']
  };

  var DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  function toMinutes(hhmm) {
    var parts = hhmm.split(':');
    return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
  }

  function initOpenNow() {
    var nodes = doc.querySelectorAll('[data-open-now]');
    if (!nodes.length) return;

    var now = new Date();
    var day = now.getDay();
    var minutes = now.getHours() * 60 + now.getMinutes();
    var today = HOURS[day];

    var state = 'closed';
    var text = 'Closed today';

    if (today) {
      var opens = toMinutes(today[0]);
      var closes = toMinutes(today[1]);
      if (minutes >= opens && minutes < closes) {
        state = 'open';
        text = 'Open now — until ' + today[1];
      } else if (minutes < opens) {
        state = 'closed';
        text = 'Closed now — opens at ' + today[0];
      } else {
        state = 'closed';
        text = 'Closed now';
      }
    }

    Array.prototype.forEach.call(nodes, function (node) {
      node.setAttribute('data-state', state);
      var label = node.querySelector('[data-open-label]');
      if (label) {
        label.textContent = text;
      } else {
        node.textContent = text;
      }
    });

    // Mark today's row in any hours table
    var rows = doc.querySelectorAll('tr[data-day]');
    var todayName = DAY_NAMES[day].toLowerCase();
    Array.prototype.forEach.call(rows, function (row) {
      var days = (row.getAttribute('data-day') || '')
        .split(',')
        .map(function (value) {
          return value.trim().toLowerCase();
        })
        .filter(Boolean);
      if (days.indexOf(todayName) !== -1) {
        row.setAttribute('data-today', 'true');
      }
    });
  }

  /* ------------------------------------------------------------------
     Mobile navigation
     ------------------------------------------------------------------ */
  function initNav() {
    var toggle = doc.querySelector('[data-nav-toggle]');
    var nav = doc.querySelector('[data-nav]');
    var scrim = doc.querySelector('[data-nav-scrim]');
    if (!toggle || !nav) return;

    var closeBtn = nav.querySelector('[data-nav-close]');
    var lastFocused = null;

    function isOpen() {
      return nav.classList.contains('is-open');
    }

    function openMenu() {
      lastFocused = doc.activeElement;
      nav.classList.add('is-open');
      if (scrim) scrim.classList.add('is-open');
      toggle.setAttribute('aria-expanded', 'true');
      toggle.setAttribute('aria-hidden', 'true');
      doc.body.style.overflow = 'hidden';
      if (closeBtn) closeBtn.focus();
    }

    function closeMenu(returnFocus) {
      if (!isOpen()) return;
      nav.classList.remove('is-open');
      if (scrim) scrim.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.removeAttribute('aria-hidden');
      doc.body.style.overflow = '';
      if (returnFocus !== false && lastFocused && lastFocused.focus) {
        lastFocused.focus();
      }
    }

    toggle.addEventListener('click', function () {
      if (isOpen()) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    if (closeBtn) {
      closeBtn.addEventListener('click', function () {
        closeMenu();
      });
    }

    if (scrim) {
      scrim.addEventListener('click', function () {
        closeMenu();
      });
    }

    // Dismiss when a nav link is chosen
    Array.prototype.forEach.call(nav.querySelectorAll('a'), function (link) {
      link.addEventListener('click', function () {
        closeMenu(false);
      });
    });

    doc.addEventListener('keydown', function (event) {
      if (!isOpen()) return;

      if (event.key === 'Escape') {
        event.preventDefault();
        closeMenu();
        return;
      }

      if (event.key !== 'Tab') return;

      // Keep focus inside the drawer while it is open
      var focusable = nav.querySelectorAll(
        'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable.length) return;

      var first = focusable[0];
      var last = focusable[focusable.length - 1];

      if (event.shiftKey && doc.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && doc.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });

    // Reset state if the viewport grows to the desktop layout
    var desktop = window.matchMedia('(min-width: 960px)');
    var onChange = function (event) {
      if (event.matches) closeMenu(false);
    };
    if (desktop.addEventListener) {
      desktop.addEventListener('change', onChange);
    } else if (desktop.addListener) {
      desktop.addListener(onChange);
    }
  }

  /* ------------------------------------------------------------------
     Sticky header elevation
     ------------------------------------------------------------------ */
  function initStickyHeader() {
    var header = doc.querySelector('[data-header]');
    if (!header) return;

    var ticking = false;

    function update() {
      if (window.scrollY > 8) {
        header.classList.add('is-stuck');
      } else {
        header.classList.remove('is-stuck');
      }
      ticking = false;
    }

    window.addEventListener(
      'scroll',
      function () {
        if (!ticking) {
          ticking = true;
          window.requestAnimationFrame(update);
        }
      },
      { passive: true }
    );

    update();
  }

  /* ------------------------------------------------------------------
     Scroll reveal
     ------------------------------------------------------------------ */
  function initReveal() {
    var items = doc.querySelectorAll('.reveal');
    if (!items.length) return;

    if (!('IntersectionObserver' in window)) {
      Array.prototype.forEach.call(items, function (item) {
        item.classList.add('is-visible');
      });
      return;
    }

    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      Array.prototype.forEach.call(items, function (item) {
        item.classList.add('is-visible');
      });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.06 }
    );

    Array.prototype.forEach.call(items, function (item) {
      observer.observe(item);
    });
  }

  /* ------------------------------------------------------------------
     Contact form: accessible validation + email hand-off
     ------------------------------------------------------------------ */
  function initForm() {
    var form = doc.querySelector('[data-contact-form]');
    if (!form) return;

    var status = form.querySelector('[data-form-status]');
    var summary = form.querySelector('[data-form-errors]');
    var recipient = form.getAttribute('data-mailto') || '';
    var subjectPrefix = form.getAttribute('data-subject-prefix') || 'Website enquiry';

    var RULES = {
      name: {
        required: true,
        test: function (v) {
          return v.trim().length >= 2;
        },
        message: 'Please enter your name (at least 2 characters).'
      },
      email: {
        required: true,
        test: function (v) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
        },
        message: 'Please enter a valid email address, for example name@example.co.za.'
      },
      phone: {
        required: false,
        test: function (v) {
          if (!v.trim()) return true;
          return (v.replace(/[^\d]/g, '').length >= 7);
        },
        message: 'Please enter a valid contact number, or leave this field blank.'
      },
      category: {
        required: true,
        test: function (v) {
          return v.trim() !== '';
        },
        message: 'Please choose the area your enquiry relates to.'
      },
      message: {
        required: true,
        test: function (v) {
          return v.trim().length >= 10;
        },
        message: 'Please tell us a little more so we can help (at least 10 characters).'
      },
      consent: {
        required: true,
        test: function (v, field) {
          return field.checked === true;
        },
        message: 'Please confirm that we may use your details to reply to this enquiry.'
      }
    };

    function fieldWrap(input) {
      return input.closest('.field') || input.closest('.checkbox') || input.parentNode;
    }

    function errorNode(input) {
      var wrap = fieldWrap(input);
      return wrap ? wrap.querySelector('[data-error]') : null;
    }

    function setError(input, message) {
      var wrap = fieldWrap(input);
      var node = errorNode(input);
      if (wrap) wrap.classList.toggle('field--error', !!message);
      if (input.type === 'checkbox') {
        input.setAttribute('aria-invalid', message ? 'true' : 'false');
      } else {
        input.setAttribute('aria-invalid', message ? 'true' : 'false');
      }
      if (node) {
        node.textContent = message || '';
        var id = input.id + '-error';
        node.id = id;
        if (message) {
          input.setAttribute('aria-describedby', id);
        } else {
          input.removeAttribute('aria-describedby');
        }
      }
    }

    function validateField(input) {
      var rule = RULES[input.name];
      if (!rule) return true;
      var value = input.type === 'checkbox' ? '' : input.value;
      var ok = rule.test(value, input);
      setError(input, ok ? '' : rule.message);
      return ok;
    }

    var inputs = Array.prototype.slice.call(form.querySelectorAll('input, select, textarea'));

    // Preselect the enquiry category when the page was linked with ?topic=
    try {
      var topic = new URLSearchParams(window.location.search).get('topic');
      if (topic) {
        var select = form.querySelector('select[name="category"]');
        if (select) {
          var wanted = String(topic).trim().toLowerCase();
          var match = Array.prototype.find.call(select.options, function (option) {
            var value = String(option.value).trim().toLowerCase();
            var label = String(option.textContent || '').trim().toLowerCase();
            return value === wanted || label === wanted;
          });
          if (match) select.value = match.value;
        }
      }
    } catch (error) {
      /* Older browsers simply do not preselect. */
    }

    inputs.forEach(function (input) {
      input.addEventListener('blur', function () {
        validateField(input);
      });
      input.addEventListener('input', function () {
        var wrap = fieldWrap(input);
        if (wrap && wrap.classList.contains('field--error')) validateField(input);
      });
      input.addEventListener('change', function () {
        var wrap = fieldWrap(input);
        if (wrap && wrap.classList.contains('field--error')) validateField(input);
      });
    });

    function clearStatus() {
      if (status) {
        status.textContent = '';
        status.className = 'form-status';
      }
      if (summary) {
        summary.innerHTML = '';
        summary.hidden = true;
      }
    }

    function showSummary(errors) {
      if (!summary) return;
      var html = '<p><strong>Please correct the following before sending:</strong></p><ul>';
      errors.forEach(function (item) {
        html += '<li><a href="#' + item.input.id + '">' + item.message + '</a></li>';
      });
      html += '</ul>';
      summary.innerHTML = html;
      summary.hidden = false;
      summary.focus();
    }

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      clearStatus();

      var errors = [];
      inputs.forEach(function (input) {
        var ok = validateField(input);
        if (!ok) {
          var rule = RULES[input.name];
          errors.push({ input: input, message: rule.message });
        }
      });

      if (errors.length) {
        if (status) {
          status.textContent = 'Your enquiry could not be prepared. Please check the highlighted fields.';
          status.className = 'form-status form-status--error';
        }
        showSummary(errors);
        return;
      }

      var data = {};
      inputs.forEach(function (input) {
        if (!input.name) return;
        data[input.name] = input.type === 'checkbox' ? (input.checked ? 'Yes' : 'No') : input.value.trim();
      });

      var body = [
        'Name: ' + data.name,
        'Email: ' + data.email,
        'Phone: ' + (data.phone || 'Not provided'),
        'Enquiry category: ' + data.category,
        '',
        'Message:',
        data.message
      ].join('\n');

      var subject = subjectPrefix + ' - ' + data.category + ' - ' + data.name;

      if (!recipient) {
        if (status) {
          status.textContent = 'This form is not yet connected to an email service. Please use the phone number or the email address shown on this page.';
          status.className = 'form-status form-status--error';
        }
        return;
      }

      var href =
        'mailto:' +
        encodeURIComponent(recipient) +
        '?subject=' +
        encodeURIComponent(subject) +
        '&body=' +
        encodeURIComponent(body);

      window.location.href = href;

      if (status) {
        status.innerHTML =
          '<strong>Your email app should now be open with this enquiry ready to send.</strong> ' +
          'Nothing has been sent automatically - please press send in your email app to deliver it. ' +
          'If no email app opened, email us directly at <a href="mailto:' +
          recipient +
          '">' +
          recipient +
          '</a>, call <a href="tel:+27675752528">067 575 2528</a> or landline <a href="tel:+27182950174">018 295 0174</a>.';
        status.className = 'form-status form-status--info';
      }

      form.reset();
    });
  }

  /* ------------------------------------------------------------------
     Dynamic copyright year
     ------------------------------------------------------------------ */
  function initYear() {
    var nodes = doc.querySelectorAll('[data-year]');
    var year = String(new Date().getFullYear());
    Array.prototype.forEach.call(nodes, function (node) {
      node.textContent = year;
    });
  }

  /* ------------------------------------------------------------------
     Boot
     ------------------------------------------------------------------ */
  function init() {
    initOpenNow();
    initNav();
    initStickyHeader();
    initReveal();
    initForm();
    initYear();
  }

  if (doc.readyState === 'loading') {
    doc.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose a tiny namespace for debugging without polluting globals
  root.Ikageng = { hours: HOURS, dayNames: DAY_NAMES };
})();
