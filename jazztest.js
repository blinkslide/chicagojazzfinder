(function() {
// --- Dynamic venue pill generation ---
  var canonicalizeVenueName = window.canonicalizeVenueName || function(name) {
    var normalized = String(name || '').trim().replace(/\u2019/g, "'");
    var lower = normalized.toLowerCase();
    if (!normalized) return '';
    if (lower === 'misc.' || lower === 'misc') return 'Venue TBA';
    if (lower.indexOf('garcia') !== -1) return "Garcia's Chicago";
    if (lower.indexOf('fitzgerald') !== -1) return "Fitzgerald's Nightclub";
    if (lower.indexOf('gale street') !== -1) return "Gale Street Inn";
    if (lower.indexOf('dorian') !== -1 || lower.indexOf('through the record shop') !== -1) return "Dorian's";
    if (lower.indexOf('scp jazz') !== -1 || lower.indexOf('symphony center presents') !== -1 || lower === 'symphony center' || lower.indexOf('chicago symphony center') !== -1) {
      return "Symphony Center";
    }
    if (lower.indexOf('jazz at logan') !== -1 || lower.indexOf('uchicago presents') !== -1 || lower.indexOf('logan center') !== -1) {
      return "Jazz at Logan";
    }
    if (lower === 'space' || lower.indexOf('space evanston') !== -1 || lower.indexOf('evanston space') !== -1) {
      return "SPACE Evanston";
    }
    return normalized;
  };
  window.canonicalizeVenueName = canonicalizeVenueName;
  var PREFERRED_VENUE_ORDER = [
    "Andy's Jazz Club",
    "Jazz Showcase",
    "Green Mill",
    "Winter's Jazz Club",
    "Constellation",
    "Elastic Arts",
    "The Whistler",
    "Hungry Brain",
    "Le Piano",
    "Lemon",
    "Fulton Street Collective",
    "Clara Chicago",
    "Garcia's Chicago",
    "Fitzgerald's Nightclub",
    "SPACE Evanston",
    "Gale Street Inn",
    "Dorian's",
    "Symphony Center",
    "Jazz at Logan"
  ];

  var VENUE_LABELS = {
    "Andy's Jazz Club": "Andy's",
    "Green Mill": "Green Mill",
    "Jazz Showcase": "Jazz Showcase",
    "Winter's Jazz Club": "Winter's",
    "Constellation": "Constellation",
    "Elastic Arts": "Elastic Arts",
    "The Whistler": "Whistler",
    "Hungry Brain": "Hungry Brain",
    "Lemon": "Lemon",
    "Le Piano": "Le Piano",
    "Fulton Street Collective": "Fulton St.",
    "Clara Chicago": "Clara",
    "Garcia's Chicago": "Garcia's",
    "Fitzgerald's Nightclub": "Fitzgerald's",
    "SPACE Evanston": "SPACE",
    "Gale Street Inn": "Gale Street",
    "Dorian's": "Dorian's",
    "Symphony Center": "Symphony Center",
    "Jazz at Logan": "Jazz at Logan"
  };
  var SHARED_VENUE_COLORS = window.JAZZ_VENUE_COLORS || (window.JAZZ_VENUE_COLORS = {
    "Andy's Jazz Club": "#b45309",
    "Green Mill": "#00a651",
    "Jazz Showcase": "#8b1a1a",
    "Winter's Jazz Club": "#c2410c",
    "Constellation": "#6d28d9",
    "Elastic Arts": "#065f46",
    "The Whistler": "#be185d",
    "Hungry Brain": "#9f1239",
    "Lemon": "#c8a200",
    "Le Piano": "#1e3a5f",
    "Fulton Street Collective": "#374151",
    "Clara Chicago": "#0e7490",
    "Garcia's Chicago": "#7c3aed",
    "Fitzgerald's Nightclub": "#d65d36",
    "SPACE Evanston": "#0f8f8c",
    "Gale Street Inn": "#4f6fd3",
    "Dorian's": "#b68a35",
    "Symphony Center": "#1a365d",
    "Jazz at Logan": "#a54b1a",
    "Venue TBA": "#5a4e3a"
  });
  var GENERATED_VENUE_PALETTE = [
    "#7a4334",
    "#355c8a",
    "#6b4f8d",
    "#2f6a4f",
    "#8a3b5d",
    "#6a5b2d",
    "#7b3f86",
    "#2f6b6f",
    "#8c4f1f",
    "#50623a",
    "#7a2644",
    "#4d5f8f"
  ];
  var KNOWN_VENUE_SET = new Set(Object.keys(SHARED_VENUE_COLORS));
  var OTHER_VENUE_FILTER_KEY = '__other__';
  var OTHER_VENUE_FILTER_LABEL = 'Other';
  var OTHER_VENUE_COLOR = '#4f5d75';
  var ALWAYS_SHOW_FILTER_VENUES = [
    "The Whistler",
    "Garcia's Chicago",
    "Fitzgerald's Nightclub",
    "SPACE Evanston",
    "Gale Street Inn",
    "Dorian's"
  ];
  function hashVenueName(name) {
    var value = String(name || '');
    var hash = 0;
    for (var i = 0; i < value.length; i += 1) {
      hash = ((hash * 31) + value.charCodeAt(i)) >>> 0;
    }
    return hash;
  }

  function getOrCreateVenueColor(name, fallbackColor) {
    var normalized = canonicalizeVenueName(name) || String(name || '').trim();
    if (!normalized) return fallbackColor || SHARED_VENUE_COLORS["Venue TBA"] || "#5a4e3a";
    if (!SHARED_VENUE_COLORS[normalized]) {
      var paletteIndex = hashVenueName(normalized) % GENERATED_VENUE_PALETTE.length;
      SHARED_VENUE_COLORS[normalized] = GENERATED_VENUE_PALETTE[paletteIndex];
    }
    return SHARED_VENUE_COLORS[normalized] || fallbackColor || "#5a4e3a";
  }
  window.getOrCreateVenueColor = getOrCreateVenueColor;

  var venueColors = {};
  var venueCounts = {};
  var otherVenueNames = [];
  var ALL_VENUES = [];
  var activeVenues = new Set();
  var bank = document.getElementById('venue-word-bank');
  var allnoneBtn = document.getElementById('allnone-btn');
  var venueFilterToggle = document.getElementById('venue-filter-toggle');

  document.querySelectorAll('.day-block .event').forEach(function(ev) {
    var venueTag = ev.querySelector('.venue-tag');
    var rawVenue = ev.dataset.venue || (venueTag ? venueTag.textContent : '');
    var canonicalVenue = canonicalizeVenueName(rawVenue);
    if (!canonicalVenue) return;
    var canonicalColor = getOrCreateVenueColor(canonicalVenue);
    ev.dataset.venue = canonicalVenue;
    if (venueTag) venueTag.textContent = canonicalVenue;
    if (canonicalColor && venueTag) venueTag.style.background = canonicalColor;
  });

  function sortVenueNames(a, b) {
    if (a === OTHER_VENUE_FILTER_KEY || b === OTHER_VENUE_FILTER_KEY) {
      if (a === b) return 0;
      return a === OTHER_VENUE_FILTER_KEY ? 1 : -1;
    }
    var ai = PREFERRED_VENUE_ORDER.indexOf(a);
    var bi = PREFERRED_VENUE_ORDER.indexOf(b);
    if (ai !== -1 || bi !== -1) {
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    }
    var countDiff = (venueCounts[b] || 0) - (venueCounts[a] || 0);
    if (countDiff) return countDiff;
    return a.localeCompare(b);
  }

  function isOtherVenueName(name) {
    var normalized = canonicalizeVenueName(name) || String(name || '').trim();
    return !!(normalized && !KNOWN_VENUE_SET.has(normalized));
  }

  function getVenueFilterKey(name) {
    var normalized = canonicalizeVenueName(name) || String(name || '').trim();
    if (!normalized) return '';
    return isOtherVenueName(normalized) ? OTHER_VENUE_FILTER_KEY : normalized;
  }

  function getEventVenueName(ev) {
    if (!ev) return '';
    var venueTag = ev.querySelector('.venue-tag');
    return canonicalizeVenueName(ev.dataset.venue || (venueTag ? venueTag.textContent : '')) || '';
  }

  function isCatchallEvent(ev) {
    return !!(ev && ev.dataset && ev.dataset.catchall === 'true');
  }

  function getEventFilterKey(ev) {
    var venueName = getEventVenueName(ev);
    if (!venueName) return '';
    if (isCatchallEvent(ev)) return OTHER_VENUE_FILTER_KEY;
    return getVenueFilterKey(venueName);
  }

  function collectVenueMetadata() {
    venueColors = {};
    venueCounts = {};
    otherVenueNames = [];
    var seenOtherVenues = {};
    document.querySelectorAll('.event').forEach(function(ev) {
      var v = getEventVenueName(ev);
      if (!v) return;
      var filterKey = getEventFilterKey(ev);
      if (filterKey === OTHER_VENUE_FILTER_KEY) {
        venueCounts[OTHER_VENUE_FILTER_KEY] = (venueCounts[OTHER_VENUE_FILTER_KEY] || 0) + 1;
        if (!seenOtherVenues[v]) {
          seenOtherVenues[v] = true;
          otherVenueNames.push(v);
        }
        return;
      }
      venueCounts[v] = (venueCounts[v] || 0) + 1;
      if (!venueColors[v]) {
        var m = (ev.getAttribute('style') || '').match(/border-left-color:\s*([^;]+)/);
        venueColors[v] = getOrCreateVenueColor(v, m ? m[1].trim() : '#5a4e3a');
      }
    });
    ALWAYS_SHOW_FILTER_VENUES.forEach(function(v) {
      if (!venueColors[v] && SHARED_VENUE_COLORS[v]) venueColors[v] = SHARED_VENUE_COLORS[v];
      if (!venueCounts[v]) venueCounts[v] = 0;
    });
    if (otherVenueNames.length) {
      otherVenueNames.sort(function(a, b) { return a.localeCompare(b); });
      venueColors[OTHER_VENUE_FILTER_KEY] = OTHER_VENUE_COLOR;
    }
  }

  function renderVenuePill(v) {
    var label = v === OTHER_VENUE_FILTER_KEY
      ? OTHER_VENUE_FILTER_LABEL
      : (VENUE_LABELS[v] || (v.length > 14 ? v.slice(0, 12) + '\u2026' : v));
    var btn = document.createElement('button');
    btn.className = 'vf-btn' + (activeVenues.has(v) ? ' active' : '');
    btn.dataset.venue = v;
    btn.setAttribute('style', '--vc:' + getOrCreateVenueColor(v, venueColors[v] || '#5a4e3a'));
    if (v === OTHER_VENUE_FILTER_KEY && otherVenueNames.length) {
      btn.title = otherVenueNames.join(', ');
    }
    btn.textContent = label;
    btn.addEventListener('click', function() {
      if (activeVenues.has(v)) { activeVenues.delete(v); btn.classList.remove('active'); }
      else                     { activeVenues.add(v);    btn.classList.add('active');    }
      updateAllNone();
      applyFilters();
    });
    bank.appendChild(btn);
  }

  function refreshVenueFilters(preserveActive) {
    var previousAll = ALL_VENUES.slice();
    var previousActive = new Set(activeVenues);
    var hadAllSelected = previousAll.length > 0 && previousActive.size === previousAll.length;

    collectVenueMetadata();
    ALL_VENUES = Object.keys(venueColors).filter(function(v) { return !!v; }).sort(sortVenueNames);

    if (!preserveActive || !previousAll.length || hadAllSelected) {
      activeVenues = new Set(ALL_VENUES);
    } else {
      activeVenues = new Set(ALL_VENUES.filter(function(v) {
        return previousActive.has(v);
      }));
      if (!activeVenues.size) activeVenues = new Set(ALL_VENUES);
    }

    if (bank) {
      bank.innerHTML = '';
      ALL_VENUES.forEach(renderVenuePill);
    }
    updateAllNone();
    syncVenueBankVisibility();
  }

  function syncVenueBankVisibility() {
    var venueFiltersVisible = !venueFilterToggle || venueFilterToggle.checked;
    if (bank && venueFilterToggle) {
      bank.classList.toggle('is-collapsed', !venueFiltersVisible);
      bank.hidden = !venueFiltersVisible;
    }
    if (allnoneBtn && venueFilterToggle) {
      allnoneBtn.hidden = !venueFiltersVisible;
    }
    // Update --filterbar-h synchronously now that the bank visibility has changed,
    // so sticky day headers reposition immediately without waiting for a rAF.
    var _fb = document.getElementById('filter-bar');
    if (_fb) {
      document.documentElement.style.setProperty('--filterbar-h', Math.ceil(_fb.getBoundingClientRect().height) + 'px');
    }
    if (typeof window.updateFilterBarHeight === 'function') {
      requestAnimationFrame(window.updateFilterBarHeight);
    }
    if (typeof window.updateFloatingDayHeader === 'function') {
      requestAnimationFrame(window.updateFloatingDayHeader);
    }
  }

  refreshVenueFilters(false);
  window.refreshVenueFilters = refreshVenueFilters;
  var freeOnly = false;
  var pastVisible = false;
  var searchQuery = '';
  var searchShell = document.querySelector('.calendar-search-shell');
  var searchInput = document.getElementById('calendar-search');

  function syncSearchPrompt() {
    if (!searchShell || !searchInput) return;
    var hasText = !!String(searchInput.value || '').trim();
    var isFocused = document.activeElement === searchInput;
    searchShell.classList.toggle('is-active', hasText || isFocused);
  }

  function buildEventSearchText(ev) {
    return String((ev && ev.textContent) || '').toLowerCase().replace(/\s+/g, ' ').trim();
  }

  function refreshSearchIndex() {
    document.querySelectorAll('.event').forEach(function(ev) {
      ev.dataset.searchText = buildEventSearchText(ev);
    });
  }

  function applyFilters() {
    var anyDayVisible = false;
    document.querySelectorAll('.day-block').forEach(function(block) {
      var isPast = block.classList.contains('past-day');
      if (isPast && !pastVisible) { block.style.display = 'none'; return; }
      var anyEventVisible = false;
      block.querySelectorAll('.event').forEach(function(ev) {
        var venueFilterKey = getEventFilterKey(ev);
        var venueMatch = !venueFilterKey || activeVenues.has(venueFilterKey);
        var suppressed = ev.dataset.supabaseSuppressed === 'true';
        var haystack = (ev.dataset.searchText || ev.textContent || '').toLowerCase();
        var searchMatch = !searchQuery || haystack.indexOf(searchQuery) !== -1;
        var show = !suppressed && venueMatch && searchMatch && (!freeOnly || ev.dataset.free === 'true');
        ev.style.display = show ? '' : 'none';
        if (show) anyEventVisible = true;
      });
      block.style.display = anyEventVisible ? '' : 'none';
      if (anyEventVisible) anyDayVisible = true;
    });
    document.getElementById('no-results').style.display = anyDayVisible ? 'none' : 'block';
    if (typeof window.updateFloatingDayHeader === 'function') {
      requestAnimationFrame(window.updateFloatingDayHeader);
    }
  }

  function updateAllNone() {
    if (!allnoneBtn) return;
    allnoneBtn.textContent = (activeVenues.size === ALL_VENUES.length) ? 'Select none' : 'Select all';
  }

  if (allnoneBtn) {
    allnoneBtn.addEventListener('click', function() {
      if (activeVenues.size === ALL_VENUES.length) {
        activeVenues = new Set();
        document.querySelectorAll('.vf-btn').forEach(function(b) { b.classList.remove('active'); });
      } else {
        activeVenues = new Set(ALL_VENUES);
        document.querySelectorAll('.vf-btn').forEach(function(b) { b.classList.add('active'); });
      }
      updateAllNone();
      applyFilters();
    });
  }
  if (venueFilterToggle) {
    if (window.matchMedia && window.matchMedia('(max-width: 600px)').matches) {
      venueFilterToggle.checked = false;
    }
    syncVenueBankVisibility();
    venueFilterToggle.addEventListener('change', function() {
      syncVenueBankVisibility();
    });
  }

  document.getElementById('free-toggle').addEventListener('click', function() {
    freeOnly = !freeOnly;
    this.classList.toggle('active', freeOnly);
    applyFilters();
  });

  document.getElementById('reset-btn').addEventListener('click', function() {
    activeVenues = new Set(ALL_VENUES);
    freeOnly = false;
    searchQuery = '';
    document.querySelectorAll('.vf-btn').forEach(function(b) { b.classList.add('active'); });
    document.getElementById('free-toggle').classList.remove('active');
    if (searchInput) searchInput.value = '';
    updateAllNone();
    applyFilters();
  });
  if (searchInput) {
    refreshSearchIndex();
    searchInput.addEventListener('input', function() {
      searchQuery = String(this.value || '').trim().toLowerCase();
      syncSearchPrompt();
      applyFilters();
    });
    searchInput.addEventListener('focus', syncSearchPrompt);
    searchInput.addEventListener('blur', syncSearchPrompt);
    syncSearchPrompt();
  }
  if (searchShell && searchInput) {
    searchShell.addEventListener('click', function() {
      searchInput.focus();
    });
  }
  window.applyJazzFilters = applyFilters;

  function openModal(id) {
    var modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeModal(id) {
    var modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    if (!document.querySelector('.modal-backdrop.open')) {
      document.body.style.overflow = '';
    }
  }

  var donateBtn = document.getElementById('donate-btn');
  var submitEventBtn = document.getElementById('submit-event-btn');
  if (donateBtn) donateBtn.addEventListener('click', function() { openModal('donation-modal'); });
  if (submitEventBtn) submitEventBtn.addEventListener('click', function() { openModal('submission-modal'); });

  document.querySelectorAll('[data-close-modal]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      closeModal(btn.getAttribute('data-close-modal'));
    });
  });

  document.querySelectorAll('.modal-backdrop').forEach(function(modal) {
    modal.addEventListener('click', function(e) {
      if (e.target === modal) closeModal(modal.id);
    });
  });

  document.addEventListener('keydown', function(e) {
    if (e.key !== 'Escape') return;
    document.querySelectorAll('.modal-backdrop.open').forEach(function(modal) {
      closeModal(modal.id);
    });
  });

  var visibleVenueInput = document.getElementById('sub-venue-visible');
  var visibleTimeInput = document.getElementById('sub-time-visible');
  var visibleAmpmInput = document.getElementById('sub-ampm-visible');
  var hiddenHourSelect = document.getElementById('sub-hour');
  var hiddenMinuteSelect = document.getElementById('sub-min');
  var hiddenAmpmSelect = document.getElementById('sub-ampm');
  var DEFAULT_SUBMISSION_COLOR = '#4f5d75';
  var MISC_SUBMISSION_COLOR = '#f5f1e8';

  function populateHiddenMinuteOptions() {
    if (!hiddenMinuteSelect) return;
    var existing = String(hiddenMinuteSelect.innerHTML || '');
    if (existing.indexOf('<option>59</option>') !== -1) return;
    hiddenMinuteSelect.innerHTML = '<option value="">Minute</option>';
    for (var minute = 0; minute < 60; minute += 1) {
      var option = document.createElement('option');
      var value = String(minute).padStart(2, '0');
      option.value = value;
      option.textContent = value;
      hiddenMinuteSelect.appendChild(option);
    }
  }
  populateHiddenMinuteOptions();

  function isPristineSample(el) {
    return !!(el && el.dataset && el.dataset.pristine === 'true');
  }
  window.isPristineSample = isPristineSample;

  function applyDigitMask(rawValue, maskPattern) {
    var digits = String(rawValue || '').replace(/[^0-9]/g, '');
    var digitIndex = 0;
    var output = '';
    for (var i = 0; i < maskPattern.length; i += 1) {
      var token = maskPattern.charAt(i);
      if (/[a-z-]/i.test(token)) {
        output += digitIndex < digits.length ? digits.charAt(digitIndex) : token;
        digitIndex += 1;
      } else {
        output += token;
      }
    }
    return output;
  }

  function getMaskSlotPositions(maskPattern) {
    var positions = [];
    for (var i = 0; i < maskPattern.length; i += 1) {
      if (/[a-z-]/i.test(maskPattern.charAt(i))) positions.push(i);
    }
    return positions;
  }

  function getMaskIndexFromCaret(maskPattern, caretPosition) {
    var slots = getMaskSlotPositions(maskPattern);
    for (var i = 0; i < slots.length; i += 1) {
      if (slots[i] >= caretPosition) return i;
    }
    return slots.length;
  }

  function placeCaretAtMaskIndex(input, maskPattern, digitIndex) {
    if (!input || typeof input.setSelectionRange !== 'function') return;
    var slots = getMaskSlotPositions(maskPattern);
    var clamped = Math.max(0, Math.min(digitIndex, slots.length));
    var caret = clamped >= slots.length ? input.value.length : slots[clamped];
    input.setSelectionRange(caret, caret);
  }

  function bindMaskedTemplateInput(input, maskPattern) {
    if (!input) return;
    var slots = getMaskSlotPositions(maskPattern);
    var maxDigits = slots.length;

    function readDigits() {
      return String(input.dataset.maskDigits || '').replace(/[^0-9]/g, '').slice(0, maxDigits);
    }

    function writeDigits(digits) {
      var nextDigits = String(digits || '').replace(/[^0-9]/g, '').slice(0, maxDigits);
      input.dataset.maskDigits = nextDigits;
      input.value = applyDigitMask(nextDigits, maskPattern);
    }

    function syncFromCurrentValue() {
      writeDigits(String(input.value || '').replace(/[^0-9]/g, ''));
    }

    function getSelectionSlotRange() {
      var start = typeof input.selectionStart === 'number' ? input.selectionStart : 0;
      var end = typeof input.selectionEnd === 'number' ? input.selectionEnd : start;
      var startIndex = getMaskIndexFromCaret(maskPattern, start);
      var endIndex = getMaskIndexFromCaret(maskPattern, end);
      if (end > start && endIndex < maxDigits && slots[endIndex] < end) endIndex += 1;
      return {
        start: Math.max(0, Math.min(startIndex, maxDigits)),
        end: Math.max(0, Math.min(endIndex, maxDigits))
      };
    }

    function normalizeCaret() {
      var digits = readDigits();
      var currentPos = typeof input.selectionStart === 'number' ? input.selectionStart : 0;
      var slotIndex = getMaskIndexFromCaret(maskPattern, currentPos);
      if (slotIndex > digits.length) slotIndex = digits.length;
      placeCaretAtMaskIndex(input, maskPattern, slotIndex);
    }

    writeDigits(readDigits());

    input.addEventListener('focus', function() {
      syncFromCurrentValue();
      normalizeCaret();
    });

    input.addEventListener('click', function() {
      normalizeCaret();
    });

    input.addEventListener('keydown', function(event) {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.key === 'Tab' || event.key === 'Shift' || event.key === 'Enter') return;
      if (event.key.indexOf('Arrow') === 0 || event.key === 'Home' || event.key === 'End') return;

      var digits = readDigits();
      var range = getSelectionSlotRange();
      var digitIndex = range.start;
      var endIndex = range.end;

      if (/^\d$/.test(event.key)) {
        event.preventDefault();
        if (digitIndex > digits.length) digitIndex = digits.length;
        if (endIndex > digitIndex) digits = digits.slice(0, digitIndex) + digits.slice(endIndex);
        var chars = digits.split('');
        if (digitIndex < chars.length) chars[digitIndex] = event.key;
        else chars.push(event.key);
        writeDigits(chars.join(''));
        placeCaretAtMaskIndex(input, maskPattern, Math.min(digitIndex + 1, maxDigits));
        return;
      }

      if (event.key === 'Backspace') {
        event.preventDefault();
        if (endIndex > digitIndex) {
          digits = digits.slice(0, digitIndex) + digits.slice(endIndex);
          writeDigits(digits);
          placeCaretAtMaskIndex(input, maskPattern, digitIndex);
          return;
        }
        if (!digits.length || digitIndex <= 0) {
          writeDigits('');
          placeCaretAtMaskIndex(input, maskPattern, 0);
          return;
        }
        var removeIndex = Math.min(digitIndex - 1, digits.length - 1);
        digits = digits.slice(0, removeIndex) + digits.slice(removeIndex + 1);
        writeDigits(digits);
        placeCaretAtMaskIndex(input, maskPattern, removeIndex);
        return;
      }

      if (event.key === 'Delete') {
        event.preventDefault();
        if (endIndex > digitIndex) {
          digits = digits.slice(0, digitIndex) + digits.slice(endIndex);
          writeDigits(digits);
          placeCaretAtMaskIndex(input, maskPattern, digitIndex);
          return;
        }
        if (digitIndex >= digits.length) return;
        digits = digits.slice(0, digitIndex) + digits.slice(digitIndex + 1);
        writeDigits(digits);
        placeCaretAtMaskIndex(input, maskPattern, digitIndex);
        return;
      }

      if (event.key.length === 1) event.preventDefault();
    });

    input.addEventListener('paste', function(event) {
      event.preventDefault();
      var pasted = '';
      if (event.clipboardData && typeof event.clipboardData.getData === 'function') {
        pasted = event.clipboardData.getData('text');
      }
      writeDigits(pasted);
      placeCaretAtMaskIndex(input, maskPattern, readDigits().length);
    });

    input.addEventListener('input', function() {
      syncFromCurrentValue();
      normalizeCaret();
    });
  }

  function getEditableValue(el) {
    if (!el) return '';
    return isPristineSample(el) ? '' : String(el.value || '').trim();
  }
  window.getEditableValue = getEditableValue;

  function autosizeTileTextarea(el, minHeightEm) {
    if (!el || String(el.tagName || '').toLowerCase() !== 'textarea') return;
    el.style.height = 'auto';
    var fallback = Math.round((minHeightEm || 2) * 16);
    el.style.height = Math.max(el.scrollHeight, fallback) + 'px';
  }

  function autosizeInlineInput(el, minChars) {
    if (!el) return;
    if (String(el.tagName || '').toLowerCase() === 'select') return;
    var value = String(el.value || el.dataset.sample || '');
    var widthChars = Math.max(minChars || 4, value.length + 1);
    el.style.width = widthChars + 'ch';
  }

  function markSampleState(el, isSample) {
    if (!el || !el.dataset) return;
    el.dataset.pristine = isSample ? 'true' : 'false';
    el.classList.toggle('submission-sample', isSample);
    if (el.id === 'sub-time-visible' || el.id === 'sub-price') {
      autosizeInlineInput(el, el.id === 'sub-price' ? 10 : 6);
    }
    if (el.id === 'sub-title') autosizeTileTextarea(el, 2.4);
    if (el.id === 'event-description-input') autosizeTileTextarea(el, 2.7);
  }

  function setupSampleField(el) {
    if (!el || !el.dataset || !el.dataset.sample) return;

    function clearSampleIfNeeded() {
      if (!isPristineSample(el)) return;
      el.value = '';
      markSampleState(el, false);
    }

    markSampleState(el, true);
    el.addEventListener('focus', function() {
      clearSampleIfNeeded();
    });
    el.addEventListener('pointerdown', function() {
      clearSampleIfNeeded();
    });
    el.addEventListener('blur', function() {
      if (!String(el.value || '').trim()) {
        el.value = el.dataset.sample;
        markSampleState(el, true);
      }
    });
    el.addEventListener('input', function() {
      if (isPristineSample(el) && String(el.value || '').trim() !== el.dataset.sample) {
        markSampleState(el, false);
      }
      if (el.id === 'sub-time-visible' || el.id === 'sub-price') {
        autosizeInlineInput(el, el.id === 'sub-price' ? 10 : 6);
      }
      if (el.id === 'sub-title') autosizeTileTextarea(el, 2.4);
      if (el.id === 'event-description-input') autosizeTileTextarea(el, 2.7);
    });
    autosizeInlineInput(el, el.id === 'sub-price' ? 10 : 6);
    if (el.id === 'sub-title') autosizeTileTextarea(el, 2.4);
    if (el.id === 'event-description-input') autosizeTileTextarea(el, 2.7);
  }

  ['sub-price', 'sub-title', 'event-description-input', 'sub-contact-instagram'].forEach(function(id) {
    setupSampleField(document.getElementById(id));
  });

  function syncVenueBridge() {
    var value = ((visibleVenueInput && visibleVenueInput.value) || '').trim();
    var isCustom = value === '__not_listed';
    var matched = SUBMISSION_LISTED_VENUES.indexOf(value) !== -1;
    if (venueNotListedToggle) venueNotListedToggle.checked = isCustom;
    if (venueNotListedBlock) venueNotListedBlock.style.display = isCustom ? '' : 'none';
    if (venueCustomMapBlock) venueCustomMapBlock.style.display = isCustom ? '' : 'none';
    if (listedVenueSelect) listedVenueSelect.value = matched ? value : '';
    if (visibleVenueInput) {
      if (!value) {
        visibleVenueInput.style.background = DEFAULT_SUBMISSION_COLOR;
        visibleVenueInput.style.color = '#ffffff';
      } else if (isCustom) {
        visibleVenueInput.style.background = MISC_SUBMISSION_COLOR;
        visibleVenueInput.style.color = '#111111';
      } else if (matched) {
        visibleVenueInput.style.background = getSubmissionVenueColor(value);
        visibleVenueInput.style.color = '#ffffff';
      }
    }
    if (typeof syncCustomVenueOptionLabel === 'function') syncCustomVenueOptionLabel();
    if (typeof syncVenueMode === 'function') syncVenueMode();
  }

  function parseVisibleTimeValue(rawValue) {
    var normalized = String(rawValue || '').trim();
    var formattedMatch = normalized.match(/^(\d{2}):(\d{2})$/);
    if (formattedMatch) {
      var formattedHour = parseInt(formattedMatch[1], 10);
      var formattedMinute = parseInt(formattedMatch[2], 10);
      if (!isNaN(formattedHour) && formattedHour >= 1 && formattedHour <= 12 && !isNaN(formattedMinute) && formattedMinute >= 0 && formattedMinute <= 59) {
        return {
          hour: String(formattedHour),
          minute: formattedMatch[2]
        };
      }
    }

    var digits = normalized.replace(/[^0-9]/g, '');
    var digitMatch = digits.match(/^(\d{2})(\d{2})$/);
    if (!digitMatch) return null;
    var hour = parseInt(digitMatch[1], 10);
    var minute = parseInt(digitMatch[2], 10);
    if (isNaN(hour) || hour < 1 || hour > 12 || isNaN(minute) || minute < 0 || minute > 59) return null;
    return {
      hour: String(hour),
      minute: digitMatch[2]
    };
  }
  window.parseVisibleTimeValue = parseVisibleTimeValue;

  function syncTimeBridgeFromVisible() {
    if (!visibleTimeInput || !hiddenHourSelect || !hiddenMinuteSelect || !hiddenAmpmSelect) return;
    var parsed = parseVisibleTimeValue(visibleTimeInput.value);
    if (!parsed) {
      hiddenHourSelect.value = '';
      hiddenMinuteSelect.value = '';
      hiddenAmpmSelect.value = (visibleAmpmInput && visibleAmpmInput.value) || 'PM';
      return;
    }
    hiddenHourSelect.value = parsed.hour;
    hiddenMinuteSelect.value = parsed.minute;
    hiddenAmpmSelect.value = (visibleAmpmInput && visibleAmpmInput.value) || hiddenAmpmSelect.value || 'PM';
  }

  function syncVisibleTimeFromBridge() {
    if (!visibleTimeInput || !hiddenHourSelect || !hiddenMinuteSelect || !hiddenAmpmSelect) return;
    var hour = hiddenHourSelect.value || '';
    var minute = hiddenMinuteSelect.value || '';
    var ampm = (hiddenAmpmSelect.value || 'PM').toUpperCase();
    if (visibleAmpmInput) visibleAmpmInput.value = ampm;
    if (!hour) {
      visibleTimeInput.value = '--:--';
      return;
    }
    visibleTimeInput.value = hour ? (String(hour).padStart(2, '0') + ':' + (minute || '00')) : '';
  }

  if (visibleVenueInput) {
    visibleVenueInput.addEventListener('change', syncVenueBridge);
  }
  if (visibleTimeInput) {
    visibleTimeInput.addEventListener('input', syncTimeBridgeFromVisible);
    visibleTimeInput.addEventListener('change', syncTimeBridgeFromVisible);
  }
  if (visibleAmpmInput) {
    visibleAmpmInput.addEventListener('change', function() {
      if (hiddenAmpmSelect) hiddenAmpmSelect.value = visibleAmpmInput.value || 'PM';
    });
  }

  var venueNotListedToggle = document.getElementById('venue-not-listed-toggle');
  var venueNotListedBlock = document.getElementById('venue-not-listed-block');
  var venueCustomMapBlock = document.getElementById('venue-custom-map-block');
  var listedVenueSelect = document.getElementById('sub-venue');
  var subEditTile = document.getElementById('sub-edit-tile');
  var customVenueInput = document.getElementById('sub-custom-venue');
  if (visibleVenueInput && venueNotListedBlock) {
    visibleVenueInput.addEventListener('change', function() {
      var isNotListed = visibleVenueInput.value === '__not_listed';
      venueNotListedBlock.style.display = isNotListed ? '' : 'none';
      if (venueCustomMapBlock) venueCustomMapBlock.style.display = isNotListed ? '' : 'none';
    });
    venueNotListedBlock.style.display = (visibleVenueInput.value === '__not_listed') ? '' : 'none';
  }

  var SUBMISSION_LISTED_VENUES = ["Andy's Jazz Club", "Green Mill", "Jazz Showcase", "Winter's Jazz Club", "Constellation", "Elastic Arts", "The Whistler", "Hungry Brain", "Lemon", "Le Piano", "Fulton Street Collective", "Clara Chicago", "Garcia's Chicago", "Fitzgerald's Nightclub", "SPACE Evanston", "Gale Street Inn", "Dorian's", "Symphony Center", "Jazz at Logan"];
  var submissionVenueColors = {
    "Andy's Jazz Club": "#b45309",
    "Green Mill": "#00a651",
    "Jazz Showcase": "#8b1a1a",
    "Winter's Jazz Club": "#c2410c",
    "Constellation": "#6d28d9",
    "Elastic Arts": "#065f46",
    "The Whistler": "#be185d",
    "Hungry Brain": "#9f1239",
    "Lemon": "#c8a200",
    "Le Piano": "#1e3a5f",
    "Fulton Street Collective": "#374151",
    "Clara Chicago": "#0e7490",
    "Garcia's Chicago": "#7c3aed",
    "Fitzgerald's Nightclub": "#d65d36",
    "SPACE Evanston": "#0f8f8c",
    "Gale Street Inn": "#4f6fd3",
    "Dorian's": "#b68a35",
    "Symphony Center": "#1a365d",
    "Jazz at Logan": "#a54b1a"
  };
  function getSubmissionVenueColor(name) {
    return submissionVenueColors[String(name || '').trim()] || DEFAULT_SUBMISSION_COLOR;
  }

  function findListedVenueMatch(name) {
    var normalized = String(name || '').trim().toLowerCase();
    if (!normalized) return '';
    for (var i = 0; i < SUBMISSION_LISTED_VENUES.length; i += 1) {
      if (SUBMISSION_LISTED_VENUES[i].toLowerCase() === normalized) return SUBMISSION_LISTED_VENUES[i];
    }
    return '';
  }
  window.findListedVenueMatch = findListedVenueMatch;
  function syncCustomVenueOptionLabel() {
    if (!visibleVenueInput) return;
    var customOption = visibleVenueInput.querySelector('option[value="__not_listed"]');
    if (!customOption) return;
    var customName = ((customVenueInput && customVenueInput.value) || '').trim();
    customOption.textContent = customName || '(Not Listed)';
  }
  if (venueNotListedToggle && venueNotListedBlock) {
    function syncVenueMode() {
      venueNotListedBlock.style.display = venueNotListedToggle.checked ? '' : 'none';
      if (venueCustomMapBlock) venueCustomMapBlock.style.display = venueNotListedToggle.checked ? '' : 'none';
      if (subEditTile) {
        var venueValue = ((visibleVenueInput && visibleVenueInput.value) || (listedVenueSelect && listedVenueSelect.value) || '').trim();
        subEditTile.style.borderLeftColor = venueNotListedToggle.checked ? MISC_SUBMISSION_COLOR : (venueValue ? getSubmissionVenueColor(venueValue) : DEFAULT_SUBMISSION_COLOR);
      }
      refreshSubmissionFocusFlow();
    }
    venueNotListedToggle.addEventListener('change', syncVenueMode);
    if (customVenueInput) {
      customVenueInput.addEventListener('input', function() {
        syncCustomVenueOptionLabel();
        var match = (typeof findListedVenueMatch === 'function') ? findListedVenueMatch(customVenueInput.value) : '';
        if (match && visibleVenueInput) {
          visibleVenueInput.value = match;
          if (typeof syncVenueBridge === 'function') syncVenueBridge();
        }
      });
    }
    syncCustomVenueOptionLabel();
    syncVenueMode();
  }

  var notesToggle = document.getElementById('notes-toggle');
  var notesBlock = document.getElementById('notes-block') || document.getElementById('sub-notes');
  if (notesToggle && notesBlock) {
    notesToggle.addEventListener('change', function() {
      notesBlock.style.display = notesToggle.checked ? '' : 'none';
      refreshSubmissionFocusFlow();
    });
    notesBlock.style.display = notesToggle.checked ? '' : 'none';
  }

  if (typeof syncVisibleTimeFromBridge === 'function') syncVisibleTimeFromBridge();
  if (typeof syncVenueBridge === 'function') syncVenueBridge();
  var contactPhoneInput = document.getElementById('sub-contact-phone');
  var contactInstagramInput = document.getElementById('sub-contact-instagram');
  if (contactPhoneInput) {
    contactPhoneInput.addEventListener('input', function() {
      var digits = contactPhoneInput.value.replace(/[^0-9]/g, '').slice(0, 10);
      var parts = [];
      if (digits.length > 0) parts.push(digits.slice(0, 3));
      if (digits.length > 3) parts.push(digits.slice(3, 6));
      if (digits.length > 6) parts.push(digits.slice(6, 10));
      contactPhoneInput.value = parts.join('-');
    });
  }
  if (contactInstagramInput) {
    function normalizeInstagramHandle() {
      if (isPristineSample(contactInstagramInput)) return;
      var raw = String(contactInstagramInput.value || '');
      var cleaned = raw.replace(/\s+/g, '').replace(/^@+/, '');
      contactInstagramInput.value = '@' + cleaned.slice(0, 30);
      if (contactInstagramInput.value === '@') {
        contactInstagramInput.setSelectionRange(1, 1);
      }
    }
    contactInstagramInput.addEventListener('focus', function() {
      if (isPristineSample(contactInstagramInput)) {
        contactInstagramInput.value = '@';
        markSampleState(contactInstagramInput, false);
      } else if (!contactInstagramInput.value) {
        contactInstagramInput.value = '@';
      }
      if (contactInstagramInput.value.charAt(0) !== '@') {
        normalizeInstagramHandle();
      }
      contactInstagramInput.setSelectionRange(contactInstagramInput.value.length, contactInstagramInput.value.length);
    });
    contactInstagramInput.addEventListener('input', function() {
      normalizeInstagramHandle();
    });
    contactInstagramInput.addEventListener('blur', function() {
      if (!String(contactInstagramInput.value || '').trim() || contactInstagramInput.value === '@') {
        contactInstagramInput.value = contactInstagramInput.dataset && contactInstagramInput.dataset.sample ? contactInstagramInput.dataset.sample : '@social';
        markSampleState(contactInstagramInput, true);
      } else {
        normalizeInstagramHandle();
      }
    });
  }

  var dateInput = document.getElementById('sub-date');
  if (dateInput) {
    bindMaskedTemplateInput(dateInput, 'mm/dd/yy');
  }

  if (visibleTimeInput) {
    bindMaskedTemplateInput(visibleTimeInput, '--:--');
    visibleTimeInput.addEventListener('input', function() {
      syncTimeBridgeFromVisible();
    });
  }

  var priceInput = document.getElementById('sub-price');
  if (priceInput) {
    priceInput.addEventListener('input', function() {
      autosizeInlineInput(priceInput, 10);
    });
    autosizeInlineInput(priceInput, 10);
  }

  var eventDescriptionInput = document.getElementById('event-description-input');
  var eventDescriptionCount = document.getElementById('event-description-count');
  if (eventDescriptionInput && eventDescriptionCount) {
    function syncEventDescriptionCount() {
      eventDescriptionCount.textContent = eventDescriptionInput.value.length;
    }
    eventDescriptionInput.addEventListener('input', syncEventDescriptionCount);
    syncEventDescriptionCount();
  }

  document.querySelectorAll('.time-split .field-select').forEach(function(select) {
    function syncPlaceholderState() {
      select.classList.toggle('is-placeholder', !select.value);
    }
    select.addEventListener('change', syncPlaceholderState);
    syncPlaceholderState();
  });
  document.querySelectorAll('.venue-picker').forEach(function(select) {
    function syncVenuePlaceholderState() {
      select.classList.toggle('is-placeholder', !select.value);
    }
    select.addEventListener('change', syncVenuePlaceholderState);
    syncVenuePlaceholderState();
  });

  function getSubmissionFieldSequence() {
    var ids = [
      'sub-date',
      'sub-venue-visible',
      'sub-time-visible',
      'sub-ampm-visible',
      'sub-price',
      'sub-title',
      'event-description-input',
      'sub-custom-venue',
      'sub-custom-address',
      'sub-custom-address-2',
      'sub-custom-map-link',
      'sub-link',
      'sub-contact-first',
      'sub-contact-last',
      'sub-contact-phone',
      'sub-contact-email',
      'sub-contact-instagram',
      'notes-toggle',
      'sub-notes',
      'sub-submit-final-btn'
    ];
    return ids.map(function(id) {
      return document.getElementById(id);
    }).filter(function(el) {
      return !!(el && !el.disabled && el.offsetParent !== null);
    });
  }

  function refreshSubmissionFocusFlow() {
    var fields = getSubmissionFieldSequence();
    fields.forEach(function(el, index) {
      el.removeAttribute('tabindex');
      if ('enterKeyHint' in el) {
        el.enterKeyHint = index === fields.length - 1 ? 'done' : 'next';
      }
    });
  }

  function focusNextSubmissionField(current) {
    var fields = getSubmissionFieldSequence();
    var currentIndex = fields.indexOf(current);
    if (currentIndex === -1 || currentIndex >= fields.length - 1) return;
    var next = fields[currentIndex + 1];
    next.focus();
    if (typeof next.select === 'function' && next.tagName !== 'SELECT' && next.type !== 'checkbox') {
      next.select();
    }
  }

  var submissionFormPanel = document.getElementById('sub-form-panel');
  if (submissionFormPanel) {
    submissionFormPanel.addEventListener('keydown', function(event) {
      var target = event.target;
      var mobileLike = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
      if (!mobileLike || event.key !== 'Enter' || event.shiftKey || event.ctrlKey || event.altKey || event.metaKey) return;
      if (!target || !target.matches('input, select, textarea')) return;
      if (target.id === 'sub-preview-btn') return;
      event.preventDefault();
      if (target.type === 'checkbox') {
        target.click();
        setTimeout(function() {
          focusNextSubmissionField(target);
        }, 0);
        return;
      }
      focusNextSubmissionField(target);
    });
  }

  refreshSubmissionFocusFlow();

  var mapToggleBtn = document.getElementById('map-toggle-btn');
  var mapPanel = document.getElementById('map-panel');
  var mapEl = document.getElementById('venue-map');
  var mapVisible = false;
  var mapInitialised = false;
  if (mapToggleBtn) {
    mapToggleBtn.addEventListener('click', function() {
      mapVisible = !mapVisible;
      if (mapPanel) mapPanel.hidden = !mapVisible;
      mapToggleBtn.classList.toggle('active', mapVisible);
      window.scrollTo({top: 0, behavior: 'smooth'});
      if (mapVisible) {
        if (!mapInitialised) {
          mapInitialised = true;
          setTimeout(function() {
            initVenueMap();
          }, 80);
        } else {
          setTimeout(function() {
            window._venueMap.invalidateSize();
            window._venueMap.fitBounds(window._venueBounds);
          }, 100);
        }
      }
    });
  }

  var pastWrapper = document.getElementById('past-wrapper');
  var pastToggleBtn = document.getElementById('past-toggle');

  function normalizeMapVenueKey(name) {
    return String(name || '').trim().toLowerCase();
  }
  window.normalizeMapVenueKey = normalizeMapVenueKey;

  function escapeMapLabel(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function getMapNameLabelOffset(direction) {
    switch (String(direction || 'top')) {
      case 'left': return [-10, 0];
      case 'right': return [10, 0];
      case 'bottom': return [0, 10];
      default: return [0, -10];
    }
  }

  window._activeMapLabels = window._activeMapLabels || {};
  window._venueMapMarkers = window._venueMapMarkers || {};
  window._selectedMapVenueKey = window._selectedMapVenueKey || '';
  var MAP_SELECT_DEFAULT_LABEL = 'Select a venue';
  var MAP_SELECT_ALL_VALUE = '__all__';
  var MAP_SELECT_ALL_LABEL = 'Select all venues';

  function updateMapKeyState() {
    var select = document.getElementById('map-venue-select');
    var zoomBtn = document.getElementById('map-zoom-btn');
    var selectedKey = window._selectedMapVenueKey || '';
    var selectedEntry = selectedKey && selectedKey !== MAP_SELECT_ALL_VALUE ? (window._venueMapMarkers || {})[selectedKey] : null;
    if (select) {
      select.value = selectedKey || '';
      select.classList.toggle('is-active', !!selectedKey);
    }
    if (zoomBtn) {
      zoomBtn.disabled = !selectedEntry;
      zoomBtn.textContent = selectedEntry ? ('Zoom to ' + selectedEntry.name) : 'Zoom to venue';
    }
  }

  function syncVenueMapLabels() {
    var markerMap = window._venueMapMarkers || {};
    Object.keys(markerMap).forEach(function(venueKey) {
      var entry = markerMap[venueKey];
      if (!entry || !entry.marker) return;
      var isActive = !!window._activeMapLabels[venueKey];
      if (typeof entry.marker.setRadius === 'function') {
        entry.marker.setRadius(isActive ? 10 : 8);
      }
      if (typeof entry.marker.setStyle === 'function') {
        entry.marker.setStyle({
          color: isActive ? '#f8efdf' : '#fff',
          weight: isActive ? 3 : 2,
          fillOpacity: isActive ? 1 : 0.9
        });
      }
      if (isActive) {
        entry.marker.bindTooltip('<span class="map-pin-label">' + escapeMapLabel(entry.name) + '</span>', {
          permanent: true,
          direction: entry.labelDir || 'top',
          offset: getMapNameLabelOffset(entry.labelDir),
          className: 'venue-map-label map-name-label'
        });
        entry.marker.openTooltip();
        setTimeout(function() {
          var tooltip = entry.marker.getTooltip && entry.marker.getTooltip();
          var tooltipEl = tooltip && tooltip.getElement ? tooltip.getElement() : null;
          if (tooltipEl) {
            tooltipEl.style.setProperty('--map-label-color', entry.color || '#b98a49');
          }
        }, 0);
      } else if (entry.marker.getTooltip()) {
        entry.marker.unbindTooltip();
      }
    });
    updateMapKeyState();
  }
  window.syncVenueMapLabels = syncVenueMapLabels;

  function toggleVenueMapLabel(name) {
    var venueKey = normalizeMapVenueKey(name);
    if (!venueKey) return;
    if (window._activeMapLabels[venueKey]) delete window._activeMapLabels[venueKey];
    else window._activeMapLabels[venueKey] = true;
    syncVenueMapLabels();
  }

  function selectAllVenueMapLabels() {
    window._selectedMapVenueKey = MAP_SELECT_ALL_VALUE;
    window._activeMapLabels = {};
    Object.keys(window._venueMapMarkers || {}).forEach(function(venueKey) {
      window._activeMapLabels[venueKey] = true;
    });
    syncVenueMapLabels();
    if (window._venueMap && window._venueBounds) {
      window._venueMap.fitBounds(window._venueBounds);
    }
  }
  window.clearVenueMapLabels = selectAllVenueMapLabels;

  function buildVenueMapKey() {
    var select = document.getElementById('map-venue-select');
    if (!select) return;
    var venues = Array.isArray(window.VENUE_MAP_DATA) ? window.VENUE_MAP_DATA.slice() : [];
    venues.sort(function(a, b) { return String(a.name || '').localeCompare(String(b.name || '')); });
    select.innerHTML = '<option value="">' + MAP_SELECT_DEFAULT_LABEL + '</option>';
    var allOption = document.createElement('option');
    allOption.value = MAP_SELECT_ALL_VALUE;
    allOption.textContent = MAP_SELECT_ALL_LABEL;
    select.appendChild(allOption);
    venues.forEach(function(v) {
      var option = document.createElement('option');
      option.value = normalizeMapVenueKey(v.name);
      option.textContent = v.name;
      select.appendChild(option);
    });
    if (window._selectedMapVenueKey && window._selectedMapVenueKey !== MAP_SELECT_ALL_VALUE && !window._venueMapMarkers[window._selectedMapVenueKey]) {
      window._selectedMapVenueKey = '';
    }
    updateMapKeyState();
  }
  window.buildVenueMapKey = buildVenueMapKey;

  function focusVenueOnMap(venueKey) {
    var entry = (window._venueMapMarkers || {})[venueKey];
    if (!entry || !entry.marker) return;
    window._selectedMapVenueKey = venueKey;
    window._activeMapLabels = {};
    window._activeMapLabels[venueKey] = true;
    syncVenueMapLabels();
  }

  function zoomVenueOnMap(venueKey) {
    var entry = (window._venueMapMarkers || {})[venueKey];
    if (!entry || !entry.marker) return;
    focusVenueOnMap(venueKey);
    if (window._venueMap && typeof entry.marker.getLatLng === 'function') {
      window._venueMap.flyTo(entry.marker.getLatLng(), 14, {
        animate: true,
        duration: 1
      });
    }
  }

  var mapVenueSelect = document.getElementById('map-venue-select');
  if (mapVenueSelect) {
    mapVenueSelect.addEventListener('change', function() {
      var venueKey = this.value || '';
      if (!venueKey) return;
      if (venueKey === MAP_SELECT_ALL_VALUE) {
        selectAllVenueMapLabels();
        return;
      }
      focusVenueOnMap(venueKey);
    });
  }

  var mapZoomBtn = document.getElementById('map-zoom-btn');
  if (mapZoomBtn) {
    mapZoomBtn.addEventListener('click', function() {
      if (!window._selectedMapVenueKey) return;
      zoomVenueOnMap(window._selectedMapVenueKey);
    });
  }
  var pastToggleTop = document.getElementById('past-toggle-top');
  var pastVisible = false;

  function getTodayStr() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
  }

  function classifyDays() {
    var today = getTodayStr();
    var pastBlocks = [];
    document.querySelectorAll('.day-block').forEach(function(block) {
      var date = block.dataset.date;
      if (date && date < today) {
        block.classList.add('past-day');
        pastBlocks.push(block);
        if (!pastWrapper.contains(block)) pastWrapper.appendChild(block);
      } else {
        block.classList.remove('past-day');
      }
    });
    var count = pastBlocks.length;
    if (count === 0) {
      if (pastToggleBtn) pastToggleBtn.style.display = 'none';
      if (pastToggleTop) pastToggleTop.style.display = 'none';
    } else {
      var monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      function fmtShort(ds) { var p = ds.split('-'); return monthNames[parseInt(p[1])-1] + ' ' + parseInt(p[2]); }
      pastBlocks.sort(function(a,b){ return a.dataset.date < b.dataset.date ? -1 : 1; });
      var rangeStr = count === 1 ? fmtShort(pastBlocks[0].dataset.date) : fmtShort(pastBlocks[0].dataset.date) + '\u2013' + fmtShort(pastBlocks[pastBlocks.length-1].dataset.date);
      var label = count + ' past day' + (count===1?'':'s') + ' (' + rangeStr + ')';
      if (pastToggleBtn) { pastToggleBtn.style.display = ''; pastToggleBtn.innerHTML = pastVisible ? '&#x25B2;&nbsp;Hide past events' : '&#x25BC;&nbsp;' + label; }
      if (pastToggleTop) { pastToggleTop.style.display = ''; pastToggleTop.innerHTML = pastVisible ? '&#x25B2;&nbsp;Hide past events' : '&#x25BC;&nbsp;' + label; }
    }
  }

  function togglePast() {
    pastVisible = !pastVisible;
    pastWrapper.style.display = pastVisible ? '' : 'none';
    classifyDays();
    applyFilters();
  }
  if (pastToggleBtn) pastToggleBtn.addEventListener('click', togglePast);
  if (pastToggleTop) pastToggleTop.addEventListener('click', togglePast);

  classifyDays();
  pastWrapper.style.display = 'none';
  applyFilters();

  // Populate date-jump dropdown
  (function() {
    var sel = document.getElementById('date-jump');
    var today = getTodayStr();
    var monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    var dayAbbr = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    var blocks = Array.from(document.querySelectorAll('.day-block'));
    blocks.sort(function(a, b) { return a.dataset.date < b.dataset.date ? -1 : 1; });
    var upcomingDates = [];
    var pastDates = [];
    function appendOption(date) {
      var d = new Date(date + 'T12:00:00');
      var label = dayAbbr[d.getDay()] + ' ' + monthNames[d.getMonth()] + ' ' + d.getDate();
      if (date === today) label += ' \u2605';
      var opt = document.createElement('option');
      opt.value = date;
      opt.textContent = label;
      sel.appendChild(opt);
    }
    blocks.forEach(function(block) {
      var date = block.dataset.date;
      if (!date) return;
      if (date < today) pastDates.push(date);
      else upcomingDates.push(date);
    });
    upcomingDates.forEach(appendOption);
    if (pastDates.length) {
      var divider = document.createElement('option');
      divider.value = '';
      divider.textContent = '──────── Past dates';
      divider.disabled = true;
      sel.appendChild(divider);
      pastDates.sort(function(a, b) { return a > b ? -1 : 1; }).forEach(appendOption);
    }
    if (sel.querySelector('option[value="' + today + '"]')) {
      sel.value = today;
    } else {
      var defaultDate = upcomingDates[0] || pastDates[0];
      if (defaultDate && sel.querySelector('option[value="' + defaultDate + '"]')) {
        sel.value = defaultDate;
      } else if (sel.options.length > 1) {
        sel.selectedIndex = 1;
      }
    }
    sel.addEventListener('change', function() {
      var val = this.value;
      if (!val) return;
      var block = document.querySelector('.day-block[data-date="' + val + '"]');
      if (block) block.scrollIntoView({behavior: 'smooth', block: 'start'});
    });
  })();

  function scheduleMidnight() {
    var now = new Date();
    var msUntilMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()+1, 0, 0, 1) - now;
    setTimeout(function() { classifyDays(); applyFilters(); scheduleMidnight(); }, msUntilMidnight);
  }
  scheduleMidnight();
})();

(function() {
  // Keep new venue map pins in one shared list so both map code paths stay aligned.
  window.VENUE_MAP_DATA = window.VENUE_MAP_DATA || [
    {"name": "Andy's Jazz Club", "initials": "A", "addr": "11 E. Hubbard St, River North", "lat": 41.8916, "lng": -87.628, "color": "#b45309", "maps_url": "https://maps.google.com/?q=11+E+Hubbard+St+Chicago+IL", "label_dir": "left", "label_offset": [-12, 0]},
    {"name": "Green Mill", "initials": "GM", "addr": "4802 N Broadway, Uptown", "lat": 41.9659, "lng": -87.6579, "color": "#00a651", "maps_url": "https://maps.google.com/?q=4802+N+Broadway+Chicago+IL", "label_dir": "right", "label_offset": [12, 0]},
    {"name": "Jazz Showcase", "initials": "JS", "addr": "806 S. Plymouth Ct, South Loop", "lat": 41.8697, "lng": -87.6284, "color": "#8b1a1a", "maps_url": "https://maps.google.com/?q=806+S+Plymouth+Ct+Chicago+IL", "label_dir": "bottom", "label_offset": [0, 12]},
    {"name": "Winter's Jazz Club", "initials": "WJ", "addr": "465 N McClurg Ct, Streeterville", "lat": 41.8928, "lng": -87.6179, "color": "#c2410c", "maps_url": "https://maps.google.com/?q=465+N+McClurg+Ct+Chicago+IL", "label_dir": "right", "label_offset": [14, -2]},
    {"name": "Constellation", "initials": "Con", "addr": "3111 N Western Ave, Logan Square", "lat": 41.9343, "lng": -87.6892, "color": "#6d28d9", "maps_url": "https://maps.google.com/?q=3111+N+Western+Ave+Chicago+IL", "label_dir": "left", "label_offset": [-14, -2]},
    {"name": "Elastic Arts", "initials": "EA", "addr": "2830 N Milwaukee Ave, Logan Square", "lat": 41.9309, "lng": -87.7002, "color": "#065f46", "maps_url": "https://maps.google.com/?q=2830+N+Milwaukee+Ave+Chicago+IL", "label_dir": "left", "label_offset": [-14, 0]},
    {"name": "The Whistler", "initials": "W", "addr": "2421 N Milwaukee Ave, Logan Square", "lat": 41.9224, "lng": -87.6999, "color": "#be185d", "maps_url": "https://maps.google.com/?q=2421+N+Milwaukee+Ave+Chicago+IL", "label_dir": "right", "label_offset": [14, -6]},
    {"name": "Hungry Brain", "initials": "HB", "addr": "2319 W Belmont Ave, Chicago, IL 60618", "lat": 41.9212, "lng": -87.6997, "color": "#9f1239", "maps_url": "https://maps.google.com/?q=2319+W+Belmont+Ave+Chicago+IL", "label_dir": "left", "label_offset": [-16, 8]},
    {"name": "Lemon", "initials": "Lem", "addr": "1600 W Grand Ave, West Town", "lat": 41.8909, "lng": -87.6694, "color": "#c8a200", "maps_url": "https://maps.google.com/?q=1600+W+Grand+Ave+Chicago+IL", "label_dir": "top", "label_offset": [0, -14]},
    {"name": "Le Piano", "initials": "LP", "addr": "6970 N Glenwood Ave, Rogers Park", "lat": 42.0079, "lng": -87.6604, "color": "#1e3a5f", "maps_url": "https://maps.google.com/?q=6970+N+Glenwood+Ave+Chicago+IL", "label_dir": "top", "label_offset": [0, -14]},
    {"name": "Fulton Street Collective", "initials": "FSC", "addr": "1821 W Hubbard St, #307, West Town", "lat": 41.89, "lng": -87.6748, "color": "#374151", "maps_url": "https://maps.google.com/?q=1821+W+Hubbard+St+Chicago+IL", "label_dir": "bottom", "label_offset": [0, 12]},
    {"name": "Clara Chicago", "initials": "Cla", "addr": "2027 W North Ave, Wicker Park", "lat": 41.9103, "lng": -87.6845, "color": "#0e7490", "maps_url": "https://maps.google.com/?q=2027+W+North+Ave+Chicago+IL", "label_dir": "right", "label_offset": [16, 2]},
    {"name": "Garcia's Chicago", "initials": "Gar", "addr": "1001 W Washington Blvd, Chicago, IL 60607", "lat": 41.8832, "lng": -87.6535, "color": "#7c3aed", "maps_url": "https://maps.google.com/?q=1001+W+Washington+Blvd+Chicago+IL", "label_dir": "right", "label_offset": [14, -2]},
    {"name": "Fitzgerald's Nightclub", "initials": "Fitz", "addr": "6615 Roosevelt Rd, Berwyn, IL 60402", "lat": 41.8652, "lng": -87.7882, "color": "#d65d36", "maps_url": "https://maps.google.com/?q=6615+Roosevelt+Rd+Berwyn+IL", "label_dir": "left", "label_offset": [-18, 0]},
    {"name": "SPACE Evanston", "initials": "Spc", "addr": "1245 Chicago Avenue, Evanston, IL 60202", "lat": 42.040884, "lng": -87.680254, "color": "#0f8f8c", "maps_url": "https://maps.google.com/?q=1245+Chicago+Avenue+Evanston+IL", "label_dir": "right", "label_offset": [14, -2]},
    {"name": "Gale Street Inn", "initials": "GSI", "addr": "4914 N Milwaukee Ave, Chicago, IL 60630", "lat": 41.9703, "lng": -87.7643, "color": "#4f6fd3", "maps_url": "https://maps.google.com/?q=4914+N+Milwaukee+Ave+Chicago+IL", "label_dir": "right", "label_offset": [14, 4]},
    {"name": "Dorian's", "initials": "Dor", "addr": "1939 W North Ave, Chicago, IL 60622", "lat": 41.9103, "lng": -87.6772, "color": "#b68a35", "maps_url": "https://maps.google.com/?q=1939+W+North+Ave+Chicago+IL", "label_dir": "left", "label_offset": [-18, -4]},
    {"name": "Symphony Center", "initials": "SC", "addr": "220 S Michigan Ave, Chicago, IL 60604", "lat": 41.8794, "lng": -87.6247, "color": "#1a365d", "maps_url": "https://maps.google.com/?q=220+S+Michigan+Ave+Chicago+IL", "label_dir": "right", "label_offset": [14, -8]},
    {"name": "Jazz at Logan", "initials": "JL", "addr": "915 E 60th St, Chicago, IL 60637", "lat": 41.7857, "lng": -87.6035, "color": "#a54b1a", "maps_url": "https://maps.google.com/?q=915+E+60th+St+Chicago+IL", "label_dir": "left", "label_offset": [-18, 0]}
  ];
  window.initVenueMap = function() {
  var venues = window.VENUE_MAP_DATA || [];
  var map = L.map('venue-map', {scrollWheelZoom: false, zoomControl: false});
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors — <a href="https://carto.com/">CARTO</a>',
    subdomains: 'abcd', maxZoom: 19
  }).addTo(map);
  L.control.zoom({ position: 'bottomright' }).addTo(map);

  var venueMarkers = [];
  window._venueMapMarkers = {};
  venues.forEach(function(v) {
    var m = L.circleMarker([v.lat, v.lng], {
      radius: 8, fillColor: v.color, color: '#fff', weight: 2, opacity: 1, fillOpacity: 0.9
    }).addTo(map);
    m.on('click', function() {
      var a = document.createElement('a');
      a.href = v.maps_url; a.target = '_blank'; a.rel = 'noopener';
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
    });
        window._venueMapMarkers[normalizeMapVenueKey(v.name)] = {
          marker: m,
          name: v.name,
          color: v.color,
          labelDir: v.label_dir,
          labelOffset: v.label_offset
        };
    venueMarkers.push({ marker: m });
  });

  var lats = venues.map(function(v) { return v.lat; });
  var lngs = venues.map(function(v) { return v.lng; });
  window._venueBounds = [
    [Math.min.apply(null,lats) - 0.01, Math.min.apply(null,lngs) - 0.02],
    [Math.max.apply(null,lats) + 0.01, Math.max.apply(null,lngs) + 0.02]
  ];
  map.setView([41.93, -87.645], 12);
  window._venueMap = map;
  setTimeout(function() {
    window._venueMap.invalidateSize();
    window._venueMap.fitBounds(window._venueBounds);
    buildVenueMapKey();
    syncVenueMapLabels();
  }, 150);
  }; // end initVenueMap
})();

(function() {
  function parseTime(str) {
    var m = str.match(/(\d+):(\d+)\s*(am|pm)/i);
    if (!m) return null;
    var h = parseInt(m[1]), min = parseInt(m[2]), ap = m[3].toLowerCase();
    if (ap === 'pm' && h !== 12) h += 12;
    if (ap === 'am' && h === 12) h = 0;
    return {h: h, m: min};
  }
  function gcalDate(date, h, m) {
    return date.replace(/-/g,'') + 'T' + String(h).padStart(2,'0') + String(m).padStart(2,'0') + '00';
  }
  var calIcon = '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="vertical-align:-1px"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>';
  document.querySelectorAll('.day-block').forEach(function(block) {
    var dateStr = block.dataset.date;
    if (!dateStr) return;
    block.querySelectorAll('.event').forEach(function(ev) {
      var timeEl = ev.querySelector('.event-time');
      var actEl  = ev.querySelector('.event-act a') || ev.querySelector('.event-act');
      var venueEl = ev.querySelector('.venue-tag');
      var blurbEl = ev.querySelector('.event-blurb');
      var metaEl  = ev.querySelector('.event-meta');
      if (!timeEl || !actEl || !metaEl) return;
      var t = parseTime(timeEl.textContent.trim());
      if (!t) return;
      var endH = t.h + 1, endM = t.m + 30;
      if (endM >= 60) { endH++; endM -= 60; }
      var title    = actEl.textContent.trim() + (venueEl ? ' @ ' + venueEl.textContent.trim() : '');
      var details  = blurbEl ? blurbEl.textContent.trim() : '';
      var location = venueEl ? venueEl.textContent.trim() + ', Chicago, IL' : 'Chicago, IL';
      var url = 'https://calendar.google.com/calendar/render?action=TEMPLATE'
        + '&text='     + encodeURIComponent(title)
        + '&dates='    + gcalDate(dateStr, t.h, t.m) + '%2F' + gcalDate(dateStr, endH, endM)
        + '&details='  + encodeURIComponent(details)
        + '&location=' + encodeURIComponent(location);
      var btn = document.createElement('a');
      btn.href = url; btn.target = '_blank'; btn.rel = 'noopener';
      btn.className = 'gcal-btn';
      btn.innerHTML = calIcon + '+GCAL';
      metaEl.appendChild(btn);
    });
  });
})();

// -- Submission Preview ----------------------------------
(function() {
  var VENUE_COLORS = window.JAZZ_VENUE_COLORS || {};
  var DEFAULT_COLOR = "#5a4e3a";
  var getEditableValue = window.getEditableValue || function(el) {
    return el ? String(el.value || '').trim() : '';
  };
  var markSampleState = window.markSampleState || function() {};
  var syncVisibleTimeFromBridge = window.syncVisibleTimeFromBridge;
  var syncVenueBridge = window.syncVenueBridge;

  function getVenueColor(name) {
    if (!name) return DEFAULT_COLOR;
    var normalized = canonicalizeVenueName(name);
    var colorResolver = window.getOrCreateVenueColor;
    return typeof colorResolver === 'function'
      ? colorResolver(normalized || name, DEFAULT_COLOR)
      : (VENUE_COLORS[normalized || name] || DEFAULT_COLOR);
  }

  function buildTimeString() {
    var h = (document.getElementById('sub-hour') || {}).value || '';
    var m = (document.getElementById('sub-min') || {}).value || '';
    var ap = (document.getElementById('sub-ampm') || {}).value || 'PM';
    if (!h) return '';
    var time = h;
    if (m && m !== '00') time += ':' + m;
    time += ap.toLowerCase();
    return time;
  }

  function clearPreviewError() {
    var err = document.getElementById('sub-preview-error');
    if (err) err.textContent = '';
  }

  function clearInvalidFields() {
    document.querySelectorAll('#sub-form-panel .invalid').forEach(function(el) {
      el.classList.remove('invalid');
    });
    document.querySelectorAll('#sub-form-panel .field-error').forEach(function(el) {
      el.classList.remove('show');
      if (el.dataset.defaultText) {
        el.textContent = el.dataset.defaultText;
      }
    });
  }

  function markInvalid(el, message) {
    if (!el) return;
    el.classList.add('invalid');
    var container = el.closest('.field-cell') || el.closest('.field-block');
    if (container) {
      container.classList.add('invalid');
      var err = container.querySelector('.field-error');
      if (err) {
        if (!err.dataset.defaultText) {
          err.dataset.defaultText = err.textContent;
        }
        err.textContent = message || err.dataset.defaultText;
        err.classList.add('show');
      }
    }
  }

  function normalizePriceInput() {
    var priceEl = document.getElementById('sub-price');
    if (!priceEl) return;
    priceEl.value = String(priceEl.value || '').slice(0, 32);
  }

  function getSubmissionDateValidation() {
    var dateEl = document.getElementById('sub-date');
    if (!dateEl) return { date: null, reason: 'missing' };

    var digits = String(dateEl.value || '').replace(/[^0-9]/g, '');
    if (!digits) return { date: null, reason: 'missing' };
    if (digits.length < 6) return { date: null, reason: 'invalid' };
    var value = digits.slice(0, 2) + '/' + digits.slice(2, 4) + '/' + digits.slice(4, 6);

    var parts = value.split('/');
    var month = parseInt(parts[0], 10);
    var day = parseInt(parts[1], 10);
    var year = 2000 + parseInt(parts[2], 10);

    if (isNaN(month) || isNaN(day) || isNaN(year)) return { date: null, reason: 'invalid' };
    if (month < 1 || month > 12 || year > 2037) return { date: null, reason: 'invalid' };

    var dt = new Date(year, month - 1, day);
    if (dt.getFullYear() !== year || dt.getMonth() !== month - 1 || dt.getDate() !== day) {
      return { date: null, reason: 'invalid' };
    }

    var today = new Date();
    today.setHours(0, 0, 0, 0);
    if (dt < today) return { date: null, reason: 'past' };

    return { date: dt, reason: '' };
  }

  function getSelectedEventDate() {
    return getSubmissionDateValidation().date;
  }

  function getPriceTextValue() {
    return getEditableValue(document.getElementById('sub-price'));
  }

  function derivePriceSuggested(priceText, suggestedChecked) {
    if (suggestedChecked) return true;
    return /\b(suggested|donation|sliding|pay what you can|pwyc)\b/i.test(String(priceText || ''));
  }

  function getPriceDisplay(priceText, suggested) {
    var display = String(priceText || '').trim();
    if (!display) return '';
    if (suggested && /^\$?\d+(?:\.\d{1,2})?$/.test(display) && !/\bsuggested\b/i.test(display)) {
      return display + ' (suggested)';
    }
    return display;
  }

  function validateSubmissionForm() {
    clearInvalidFields();
    clearPreviewError();

    var hasErrors = false;
    var titleEl = document.getElementById('sub-title');
    var listedVenueEl = document.getElementById('sub-venue');
    var venueToggleEl = document.getElementById('venue-not-listed-toggle');
    var customVenueEl = document.getElementById('sub-custom-venue');
    var customAddressEl = document.getElementById('sub-custom-address');
    var customAddress2El = document.getElementById('sub-custom-address-2');
    var customMapLinkEl = document.getElementById('sub-custom-map-link');
    var visibleVenueEl = document.getElementById('sub-venue-visible');
    var visibleTimeEl = document.getElementById('sub-time-visible');
    var dateEl = document.getElementById('sub-date');
    var hourEl = document.getElementById('sub-hour');
    var minuteEl = document.getElementById('sub-min');
    var priceEl = document.getElementById('sub-price');
    var descEl = document.getElementById('event-description-input');
    var contactFirstEl = document.getElementById('sub-contact-first');
    var contactLastEl = document.getElementById('sub-contact-last');
    var contactPhoneEl = document.getElementById('sub-contact-phone');
    var contactEmailEl = document.getElementById('sub-contact-email');
    var contactInstagramEl = document.getElementById('sub-contact-instagram');

    var title = getEditableValue(titleEl);
    var listedVenue = (listedVenueEl.value || '').trim();
    var customVenue = (customVenueEl.value || '').trim();
    var customAddress = (customAddressEl.value || '').trim();
    var customAddress2 = (customAddress2El.value || '').trim();
    var useCustomVenue = !!venueToggleEl.checked;
    var price = getPriceTextValue();
    var desc = getEditableValue(descEl);
    var contactFirst = (contactFirstEl.value || '').trim();
    var contactLast = (contactLastEl.value || '').trim();
    var contactPhone = (contactPhoneEl.value || '').trim();
    var contactEmail = (contactEmailEl.value || '').trim();
    var contactInstagram = (contactInstagramEl.value || '').trim();
    if (contactInstagram === '@' || contactInstagram === '@social') contactInstagram = '';
    var phoneDigits = contactPhone.replace(/[^0-9]/g, '');
    var dateValidation = getSubmissionDateValidation();
    var formErrorMessage = '';

    if (!title) {
      hasErrors = true;
      markInvalid(titleEl);
    }

    if (useCustomVenue) {
      if (!customVenue) {
        hasErrors = true;
        markInvalid(customVenueEl);
      } else {
        var listedVenueMatcher = (typeof findListedVenueMatch === 'function' ? findListedVenueMatch : window.findListedVenueMatch);
        var listedVenueMatch = listedVenueMatcher ? listedVenueMatcher(customVenue) : '';
        if (listedVenueMatch) {
          hasErrors = true;
          markInvalid(customVenueEl, 'choose listed venue');
          formErrorMessage = formErrorMessage || 'That venue is already listed. Please choose it from the venue menu.';
        }
      }
      if (!customAddress) {
        hasErrors = true;
        markInvalid(customAddressEl);
      }
    } else {
      if (!listedVenue) {
        hasErrors = true;
        markInvalid(visibleVenueEl || listedVenueEl);
      }
    }

    if (!dateValidation.date) {
      hasErrors = true;
      if (dateValidation.reason === 'past') {
        markInvalid(dateEl, 'future date only');
      } else if (dateValidation.reason === 'invalid') {
        markInvalid(dateEl, 'date invalid');
      } else {
        markInvalid(dateEl);
      }
      if (dateValidation.reason === 'past') {
        formErrorMessage = 'Please enter a future date.';
      } else if (dateValidation.reason === 'invalid') {
        formErrorMessage = 'Please enter a valid date as mm/dd/yy.';
      }
    }
    var timeParser = (typeof parseVisibleTimeValue === 'function' ? parseVisibleTimeValue : window.parseVisibleTimeValue);
    var parsedVisibleTime = timeParser ? timeParser(visibleTimeEl.value) : null;
    if (parsedVisibleTime) {
      hourEl.value = parsedVisibleTime.hour;
      minuteEl.value = parsedVisibleTime.minute;
    } else {
      hourEl.value = '';
      minuteEl.value = '';
    }
    if (!parsedVisibleTime || !hourEl.value || !minuteEl.value) {
      hasErrors = true;
      markInvalid(visibleTimeEl || hourEl);
      formErrorMessage = formErrorMessage || 'Please enter a valid time.';
    }

    if (!price) {
      hasErrors = true;
      markInvalid(priceEl);
      formErrorMessage = formErrorMessage || 'Please enter a price.';
    }

    if (!desc) {
      hasErrors = true;
      markInvalid(descEl);
    }

    if (!contactFirst) {
      hasErrors = true;
      markInvalid(contactFirstEl);
      formErrorMessage = formErrorMessage || 'Please enter your name.';
    }

    if (!contactLast) {
      hasErrors = true;
      markInvalid(contactLastEl);
      formErrorMessage = formErrorMessage || 'Please enter your name.';
    }

    if (!contactPhone && !contactEmail && !contactInstagram) {
      hasErrors = true;
      [contactPhoneEl, contactEmailEl, contactInstagramEl].forEach(function(el) {
        markInvalid(el);
      });
      formErrorMessage = formErrorMessage || 'Please provide at least one way to contact you.';
    }

    if (contactPhone && phoneDigits.length !== 10) {
      hasErrors = true;
      markInvalid(contactPhoneEl);
      formErrorMessage = formErrorMessage || 'Please check the phone number.';
    }

    if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
      hasErrors = true;
      markInvalid(contactEmailEl);
      formErrorMessage = formErrorMessage || 'Please check the email address.';
    }

    if (contactInstagram && !/^@?[A-Za-z0-9._]{1,30}$/.test(contactInstagram)) {
      hasErrors = true;
      markInvalid(contactInstagramEl);
      formErrorMessage = formErrorMessage || 'Please check the Instagram handle.';
    }

    if (hasErrors) {
      var err = document.getElementById('sub-preview-error');
      if (err) err.textContent = formErrorMessage || "We need a little more info from you!";
      var firstInvalid = document.querySelector('#sub-form-panel .invalid');
      if (firstInvalid && typeof firstInvalid.focus === 'function') {
        firstInvalid.focus();
      }
      return false;
    }
    return true;
  }

  function formatPreviewDateLabel() {
    var monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    var dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    var validation = getSubmissionDateValidation();
    var raw = ((document.getElementById('sub-date') || {}).value || '').trim();
    if (validation.date) {
      return dayNames[validation.date.getDay()] + ' ' + monthNames[validation.date.getMonth()] + ' ' + validation.date.getDate();
    }
    return raw || 'Date *';
  }

  function getSubmissionPreviewState() {
    var title = (((document.getElementById('sub-title') || {}).value) || '').trim();
    var listedVenue = (((document.getElementById('sub-venue') || {}).value) || '').trim();
    var customVenue = (((document.getElementById('sub-custom-venue') || {}).value) || '').trim();
    var customMapLink = (((document.getElementById('sub-custom-map-link') || {}).value) || '').trim();
    var venueNotListed = !!((document.getElementById('venue-not-listed-toggle') || {}).checked);
    var venue = venueNotListed ? customVenue : listedVenue;
    var priceRaw = getPriceTextValue();
    var priceSuggested = derivePriceSuggested(priceRaw, false);
    var desc = (((document.getElementById('event-description-input') || {}).value) || '').trim();
    var link = (((document.getElementById('sub-link') || {}).value) || '').trim();
    var time = buildTimeString();
    var dateValidation = getSubmissionDateValidation();

    return {
      title: getEditableValue(document.getElementById('sub-title')),
      venue: venue,
      venueNotListed: venueNotListed,
      link: link || customMapLink,
      desc: getEditableValue(document.getElementById('event-description-input')),
      time: time,
      color: venueNotListed ? '#f5f1e8' : getVenueColor(venue),
      venueTagClass: venueNotListed ? 'venue-tag misc-preview' : 'venue-tag',
      price: getPriceDisplay(priceRaw, priceSuggested),
      dateLabel: formatPreviewDateLabel(),
      hasValidDate: !!dateValidation.date
    };
  }

  function buildPreviewBadge(className, text, isPlaceholder, background) {
    var classes = className + (isPlaceholder ? ' is-placeholder' : '');
    var style = background ? ' style="background:' + background + '"' : '';
    return '<span class="' + classes + '"' + style + '>' + escHtml(text) + '</span>';
  }

  function renderSubmissionTile(tileId, dateChipId) {
    var state = getSubmissionPreviewState();
    var tile = document.getElementById(tileId);
    var dateChip = dateChipId ? document.getElementById(dateChipId) : null;
    if (!tile) return;

    tile.style.borderLeftColor = state.color;

    var metaHtml =
      '<div class="event-meta">' +
      buildPreviewBadge(state.venueTagClass, state.venue || 'Venue *', !state.venue, state.venue ? state.color : '') +
      buildPreviewBadge('event-time', state.time || 'Time *', !state.time) +
      buildPreviewBadge('event-price', state.price || 'Price *', !state.price) +
      '</div>';

    var titleClass = 'event-act' + (state.title ? '' : ' is-placeholder');
    var titleHtml = '<div class="' + titleClass + '">';
    if (state.link && state.title) {
      titleHtml += '<a href="' + escAttr(state.link) + '" target="_blank" rel="noopener">' + escHtml(state.title) + '</a>';
    } else {
      titleHtml += escHtml(state.title || 'Event title *');
    }
    titleHtml += '</div>';

    var blurbHtml = '<div class="event-blurb' + (state.desc ? '' : ' is-placeholder') + '">' +
      escHtml(state.desc || 'Short blurb for the calendar *') +
      '</div>';

    tile.innerHTML = metaHtml + titleHtml + blurbHtml;

    if (dateChip) {
      dateChip.textContent = state.dateLabel;
      dateChip.classList.toggle('is-placeholder', !state.hasValidDate);
    }
  }

  function renderLiveSubmissionPreview() {
    renderSubmissionTile('sub-live-preview-tile', 'sub-live-preview-date');
  }

  function showPreview() {
    try {
      if (!validateSubmissionForm()) return;
      renderSubmissionTile('sub-preview-tile', 'sub-preview-date-chip');
      document.getElementById('sub-form-panel').style.display = 'none';
      document.getElementById('sub-preview-panel').style.display = '';

      var modal = document.getElementById('submission-modal');
      if (modal) modal.querySelector('.modal-card').scrollTop = 0;
    } catch (error) {
      var err = document.getElementById('sub-preview-error');
      if (err) err.textContent = 'We need a little more info from you!';
      console.error(error);
    }
  }

  function showForm() {
    clearPreviewError();
    clearInvalidFields();
    document.getElementById('sub-preview-panel').style.display = 'none';
    document.getElementById('sub-form-panel').style.display = '';
    var statusLine = document.getElementById('submission-status-line');
    var previewStatusLine = document.getElementById('submission-status-line-preview');
    if (statusLine) statusLine.textContent = '';
    if (previewStatusLine) previewStatusLine.textContent = '';
    renderLiveSubmissionPreview();
  }

  function escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
  function escAttr(str) {
    return String(str).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function bindMobileSafePress(button, handler) {
    if (!button) return;
    var lastTouchAt = 0;
    button.addEventListener('touchend', function(event) {
      event.preventDefault();
      lastTouchAt = Date.now();
      handler(event);
    }, { passive: false });
    button.addEventListener('click', function(event) {
      if (Date.now() - lastTouchAt < 700) {
        event.preventDefault();
        return;
      }
      handler(event);
    });
  }

  var previewBtn = document.getElementById('sub-preview-btn');
  var reviseBtn  = document.getElementById('sub-revise-btn') || document.getElementById('sub-revise-btn-hidden');
  bindMobileSafePress(previewBtn, function(event) {
    if (event) event.preventDefault();
    showPreview();
  });
  bindMobileSafePress(reviseBtn, function(event) {
    if (event) event.preventDefault();
    showForm();
  });

  var subFormPanel = document.getElementById('sub-form-panel');
  if (subFormPanel) {
    subFormPanel.addEventListener('input', function() {
      clearPreviewError();
      clearInvalidFields();
      renderLiveSubmissionPreview();
    });
    subFormPanel.addEventListener('change', function() {
      clearPreviewError();
      clearInvalidFields();
      renderLiveSubmissionPreview();
    });
  }

  window.CJFRenderSubmissionPreview = renderLiveSubmissionPreview;
  window.CJFValidateSubmissionForm = validateSubmissionForm;
  window.CJFClearInvalidFields = clearInvalidFields;
  window.CJFMarkInvalid = markInvalid;
  window.CJFGetEditableValue = getEditableValue;
  window.CJFMarkSampleState = markSampleState;
  window.CJFSyncVisibleTimeFromBridge = syncVisibleTimeFromBridge;
  window.CJFSyncVenueBridge = syncVenueBridge;
  window.clearInvalidFields = clearInvalidFields;
  window.markInvalid = markInvalid;
  window.getSubmissionDateValidation = getSubmissionDateValidation;
  window.validateSubmissionForm = validateSubmissionForm;
  window.getPriceTextValue = function() {
    return getEditableValue(document.getElementById('sub-price'));
  };
  renderLiveSubmissionPreview();

  // Reset preview panel when modal closes
  var subModal = document.getElementById('submission-modal');
  if (subModal) {
    var observer = new MutationObserver(function() {
      if (!subModal.classList.contains('open')) {
        showForm();
      }
    });
    observer.observe(subModal, { attributes: true, attributeFilter: ['class'] });
  }
})();
// -- End Submission Preview -------------------------------

  // Set sticky day-header offset to filter bar height
  (function() {
    function setFilterBarH() {
      var fb = document.getElementById('filter-bar');
      if (!fb) return;
      document.documentElement.style.setProperty('--filterbar-h', Math.ceil(fb.getBoundingClientRect().height) + 'px');
      if (typeof window.updateFloatingDayHeader === 'function') {
        requestAnimationFrame(window.updateFloatingDayHeader);
      }
    }
    window.updateFilterBarHeight = setFilterBarH;
    setFilterBarH();
    window.addEventListener('resize', setFilterBarH);
    window.addEventListener('load', setFilterBarH);
    var filterBar = document.getElementById('filter-bar');
    if (filterBar && typeof ResizeObserver !== 'undefined') {
      var filterBarObserver = new ResizeObserver(function() {
        requestAnimationFrame(setFilterBarH);
      });
      filterBarObserver.observe(filterBar);
    }
  })();

  (function() {
    var stickyShell = document.createElement('div');
    stickyShell.id = 'floating-day-header';
    stickyShell.innerHTML = '<div class="floating-day-inner"></div>';
    document.body.appendChild(stickyShell);
    var stickyInner = stickyShell.firstElementChild;
    var lastKey = '';
    var ticking = false;

    function getVisibleDayBlocks() {
      return Array.prototype.filter.call(document.querySelectorAll('.day-block'), function(block) {
        return !!(block && block.offsetParent !== null);
      });
    }

    function getHeader(block) {
      return block ? block.querySelector('.day-header') : null;
    }

    function renderStickyHeader(header) {
      var key = header ? (header.textContent || '').trim() : '';
      if (!key) {
        stickyShell.classList.remove('visible');
        stickyShell.style.transform = '';
        stickyInner.innerHTML = '';
        lastKey = '';
        return null;
      }
      if (key !== lastKey) {
        stickyInner.innerHTML = '';
        stickyInner.appendChild(header.cloneNode(true));
        lastKey = key;
      }
      stickyShell.classList.add('visible');
      return stickyInner.firstElementChild;
    }

    function updateStickyDayHeader() {
      ticking = false;
      var filterBar = document.getElementById('filter-bar');
      if (!filterBar) return;
      var filterBottom = filterBar.getBoundingClientRect().bottom;
      stickyShell.style.top = Math.round(filterBottom) + 'px';
      var blocks = getVisibleDayBlocks();
      if (!blocks.length) {
        renderStickyHeader(null);
        return;
      }

      var currentIndex = -1;
      for (var i = 0; i < blocks.length; i += 1) {
        var rect = blocks[i].getBoundingClientRect();
        if (rect.bottom > filterBottom + 1) {
          currentIndex = i;
          break;
        }
      }
      if (currentIndex === -1) {
        renderStickyHeader(null);
        return;
      }

      var currentHeader = getHeader(blocks[currentIndex]);
      if (!currentHeader) {
        renderStickyHeader(null);
        return;
      }

      var currentTop = currentHeader.getBoundingClientRect().top;
      if (currentTop > filterBottom) {
        renderStickyHeader(null);
        return;
      }

      var stickyHeader = renderStickyHeader(currentHeader);
      if (!stickyHeader) return;

      var stickyHeight = stickyHeader.getBoundingClientRect().height;
      var translateY = 0;
      for (var j = currentIndex + 1; j < blocks.length; j += 1) {
        var nextHeader = getHeader(blocks[j]);
        if (!nextHeader) continue;
        var nextTop = nextHeader.getBoundingClientRect().top - filterBottom;
        if (nextTop < stickyHeight) {
          translateY = nextTop - stickyHeight;
        }
        break;
      }
      stickyShell.style.transform = translateY < 0 ? ('translateY(' + Math.round(translateY) + 'px)') : 'translateY(0)';
    }

    function requestStickyUpdate() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(updateStickyDayHeader);
    }

    window.updateFloatingDayHeader = requestStickyUpdate;
    window.addEventListener('scroll', requestStickyUpdate, { passive: true });
    window.addEventListener('resize', requestStickyUpdate);
    window.addEventListener('load', requestStickyUpdate);
    requestStickyUpdate();
  })();

(function() {
  var actionRow = document.getElementById('action-toggle-row');
  var pastWrapper = document.getElementById('past-wrapper');
  var pastToggleBtn = document.getElementById('past-toggle');
  var pastToggleTop = document.getElementById('past-toggle-top');
  if (!pastWrapper) return;

  if (!actionRow) {
    actionRow = document.createElement('div');
    actionRow.className = 'past-toggle-row';
    actionRow.id = 'action-toggle-row';
    actionRow.style.marginTop = '16px';
    actionRow.innerHTML =
      '<div class="past-toggle-shell">' +
        '<div class="past-toggle-actions left">' +
          '<div class="action-stack">' +
            '<div class="action-note">Add your gig</div>' +
            '<button type="button" id="submit-event-btn" class="action-btn submit">Submit</button>' +
          '</div>' +
        '</div>' +
        '<div class="past-toggle-actions center">' +
          '<div class="action-stack">' +
            '<div class="action-note">Questions? Comments? Suggestions?</div>' +
            '<a href="mailto:chicagojazzfinder@gmail.com" id="contact-btn" class="action-btn contact">Contact</a>' +
          '</div>' +
        '</div>' +
        '<div class="past-toggle-actions right">' +
          '<div class="action-stack">' +
            '<div class="action-note">Keep this calendar fresh</div>' +
            '<a href="https://ko-fi.com/chicagojazzfinder" target="_blank" rel="noopener" class="action-btn support">Donate</a>' +
          '</div>' +
        '</div>' +
      '</div>';
    pastWrapper.parentNode.insertBefore(actionRow, pastWrapper);
  }
  actionRow.style.display = '';
  actionRow.style.visibility = 'visible';

  function getTodayStr() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function fmtShort(ds) {
    var monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    var p = ds.split('-');
    return monthNames[parseInt(p[1], 10) - 1] + ' ' + parseInt(p[2], 10);
  }

  var topRow = pastWrapper.querySelector('.past-toggle-row');
  var pastBlocks = Array.from(document.querySelectorAll('.day-block')).filter(function(block) {
    return block.dataset.date && block.dataset.date < getTodayStr();
  });

  pastBlocks.forEach(function(block) {
    block.classList.add('past-day');
    if (!pastWrapper.contains(block)) {
      pastWrapper.appendChild(block);
    }
  });

  var pastVisible = false;

  function syncPastState() {
    var count = pastBlocks.length;
    if (!count) {
      if (pastToggleBtn) pastToggleBtn.style.display = 'none';
      if (pastToggleTop) pastToggleTop.style.display = 'none';
      pastWrapper.style.display = 'none';
      return;
    }

    pastBlocks.sort(function(a, b) {
      return a.dataset.date < b.dataset.date ? -1 : 1;
    });
    var rangeStr = count === 1
      ? fmtShort(pastBlocks[0].dataset.date)
      : fmtShort(pastBlocks[0].dataset.date) + '\u2013' + fmtShort(pastBlocks[count - 1].dataset.date);
    var label = count + ' past day' + (count === 1 ? '' : 's') + ' (' + rangeStr + ')';
    var buttonHtml = pastVisible ? '&#x25B2;&nbsp;Hide past events' : '&#x25BC;&nbsp;' + label;

    if (pastToggleBtn) {
      pastToggleBtn.style.display = '';
      pastToggleBtn.innerHTML = buttonHtml;
    }
    if (pastToggleTop) {
      pastToggleTop.style.display = pastVisible ? '' : 'none';
      pastToggleTop.innerHTML = buttonHtml;
    }

    pastWrapper.style.display = pastVisible ? '' : 'none';
    if (topRow) {
      topRow.style.display = pastVisible ? '' : 'none';
    }
    pastBlocks.forEach(function(block) {
      block.style.display = pastVisible ? '' : 'none';
    });
  }

  function togglePast(e) {
    if (e) e.preventDefault();
    pastVisible = !pastVisible;
    syncPastState();
  }

  if (pastToggleBtn) pastToggleBtn.onclick = togglePast;
  if (pastToggleTop) pastToggleTop.onclick = togglePast;

  var donateBtn = document.getElementById('donate-btn');
  var submitEventBtn = document.getElementById('submit-event-btn');
  if (donateBtn) donateBtn.onclick = function() {
    var modal = document.getElementById('donation-modal');
    if (modal) {
      modal.classList.add('open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }
  };
  if (submitEventBtn) submitEventBtn.onclick = function() {
    var modal = document.getElementById('submission-modal');
    if (modal) {
      modal.classList.add('open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }
  };

  syncPastState();
})();

(function() {
  var dateJump = document.getElementById('date-jump');
  var mapBtn = document.getElementById('map-toggle-btn');
  var mapPanel = document.getElementById('map-panel');
  var mapEl = document.getElementById('venue-map');
  var DEFAULT_VENUE_MAP_DATA = [
    {"name": "Andy's Jazz Club", "initials": "A", "addr": "11 E. Hubbard St, River North", "lat": 41.8916, "lng": -87.628, "color": "#b45309", "maps_url": "https://maps.google.com/?q=11+E+Hubbard+St+Chicago+IL", "label_dir": "left", "label_offset": [-12, 0]},
    {"name": "Green Mill", "initials": "GM", "addr": "4802 N Broadway, Uptown", "lat": 41.9659, "lng": -87.6579, "color": "#00a651", "maps_url": "https://maps.google.com/?q=4802+N+Broadway+Chicago+IL", "label_dir": "right", "label_offset": [12, 0]},
    {"name": "Jazz Showcase", "initials": "JS", "addr": "806 S. Plymouth Ct, South Loop", "lat": 41.8697, "lng": -87.6284, "color": "#8b1a1a", "maps_url": "https://maps.google.com/?q=806+S+Plymouth+Ct+Chicago+IL", "label_dir": "bottom", "label_offset": [0, 12]},
    {"name": "Winter's Jazz Club", "initials": "WJ", "addr": "465 N McClurg Ct, Streeterville", "lat": 41.8928, "lng": -87.6179, "color": "#c2410c", "maps_url": "https://maps.google.com/?q=465+N+McClurg+Ct+Chicago+IL", "label_dir": "right", "label_offset": [14, -2]},
    {"name": "Constellation", "initials": "Con", "addr": "3111 N Western Ave, Logan Square", "lat": 41.9343, "lng": -87.6892, "color": "#6d28d9", "maps_url": "https://maps.google.com/?q=3111+N+Western+Ave+Chicago+IL", "label_dir": "left", "label_offset": [-14, -2]},
    {"name": "Elastic Arts", "initials": "EA", "addr": "2830 N Milwaukee Ave, Logan Square", "lat": 41.9309, "lng": -87.7002, "color": "#065f46", "maps_url": "https://maps.google.com/?q=2830+N+Milwaukee+Ave+Chicago+IL", "label_dir": "left", "label_offset": [-14, 0]},
    {"name": "The Whistler", "initials": "W", "addr": "2421 N Milwaukee Ave, Logan Square", "lat": 41.9224, "lng": -87.6999, "color": "#be185d", "maps_url": "https://maps.google.com/?q=2421+N+Milwaukee+Ave+Chicago+IL", "label_dir": "right", "label_offset": [14, -6]},
    {"name": "Hungry Brain", "initials": "HB", "addr": "2319 W Belmont Ave, Chicago, IL 60618", "lat": 41.9212, "lng": -87.6997, "color": "#9f1239", "maps_url": "https://maps.google.com/?q=2319+W+Belmont+Ave+Chicago+IL", "label_dir": "left", "label_offset": [-16, 8]},
    {"name": "Lemon", "initials": "Lem", "addr": "1600 W Grand Ave, West Town", "lat": 41.8909, "lng": -87.6694, "color": "#c8a200", "maps_url": "https://maps.google.com/?q=1600+W+Grand+Ave+Chicago+IL", "label_dir": "top", "label_offset": [0, -14]},
    {"name": "Le Piano", "initials": "LP", "addr": "6970 N Glenwood Ave, Rogers Park", "lat": 42.0079, "lng": -87.6604, "color": "#1e3a5f", "maps_url": "https://maps.google.com/?q=6970+N+Glenwood+Ave+Chicago+IL", "label_dir": "top", "label_offset": [0, -14]},
    {"name": "Fulton Street Collective", "initials": "FSC", "addr": "1821 W Hubbard St, #307, West Town", "lat": 41.89, "lng": -87.6748, "color": "#374151", "maps_url": "https://maps.google.com/?q=1821+W+Hubbard+St+Chicago+IL", "label_dir": "bottom", "label_offset": [0, 12]},
    {"name": "Clara Chicago", "initials": "Cla", "addr": "2027 W North Ave, Wicker Park", "lat": 41.9103, "lng": -87.6845, "color": "#0e7490", "maps_url": "https://maps.google.com/?q=2027+W+North+Ave+Chicago+IL", "label_dir": "right", "label_offset": [16, 2]},
    {"name": "Garcia's Chicago", "initials": "Gar", "addr": "1001 W Washington Blvd, Chicago, IL 60607", "lat": 41.8832, "lng": -87.6535, "color": "#7c3aed", "maps_url": "https://maps.google.com/?q=1001+W+Washington+Blvd+Chicago+IL", "label_dir": "right", "label_offset": [14, -2]},
    {"name": "Fitzgerald's Nightclub", "initials": "Fitz", "addr": "6615 Roosevelt Rd, Berwyn, IL 60402", "lat": 41.8652, "lng": -87.7882, "color": "#d65d36", "maps_url": "https://maps.google.com/?q=6615+Roosevelt+Rd+Berwyn+IL", "label_dir": "left", "label_offset": [-18, 0]},
    {"name": "SPACE Evanston", "initials": "Spc", "addr": "1245 Chicago Avenue, Evanston, IL 60202", "lat": 42.040884, "lng": -87.680254, "color": "#0f8f8c", "maps_url": "https://maps.google.com/?q=1245+Chicago+Avenue+Evanston+IL", "label_dir": "right", "label_offset": [14, -2]},
    {"name": "Gale Street Inn", "initials": "GSI", "addr": "4914 N Milwaukee Ave, Chicago, IL 60630", "lat": 41.9703, "lng": -87.7643, "color": "#4f6fd3", "maps_url": "https://maps.google.com/?q=4914+N+Milwaukee+Ave+Chicago+IL", "label_dir": "right", "label_offset": [14, 4]},
    {"name": "Symphony Center", "initials": "SC", "addr": "220 S Michigan Ave, Chicago, IL 60604", "lat": 41.8794, "lng": -87.6247, "color": "#1a365d", "maps_url": "https://maps.google.com/?q=220+S+Michigan+Ave+Chicago+IL", "label_dir": "right", "label_offset": [14, -8]},
    {"name": "Jazz at Logan", "initials": "JL", "addr": "915 E 60th St, Chicago, IL 60637", "lat": 41.7857, "lng": -87.6035, "color": "#a54b1a", "maps_url": "https://maps.google.com/?q=915+E+60th+St+Chicago+IL", "label_dir": "left", "label_offset": [-18, 0]}
  ];

  function ensureVenueMapBootstrap() {
    if (!Array.isArray(window.VENUE_MAP_DATA) || !window.VENUE_MAP_DATA.length) {
      window.VENUE_MAP_DATA = DEFAULT_VENUE_MAP_DATA.slice();
    }
    if (typeof window.initVenueMap === 'function') return;
    window.initVenueMap = function() {
      if (typeof window.L === 'undefined') return;
      var venues = Array.isArray(window.VENUE_MAP_DATA) && window.VENUE_MAP_DATA.length ? window.VENUE_MAP_DATA : DEFAULT_VENUE_MAP_DATA;
      var map = L.map('venue-map', { scrollWheelZoom: false, zoomControl: false });
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19
      }).addTo(map);
      L.control.zoom({ position: 'bottomright' }).addTo(map);
      window._venueMapMarkers = {};
      venues.forEach(function(v) {
        var marker = L.circleMarker([v.lat, v.lng], {
          radius: 8,
          fillColor: v.color,
          color: '#fff',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.9
        }).addTo(map);
        marker.on('click', function() {
          if (v.maps_url) window.open(v.maps_url, '_blank', 'noopener');
        });
        window._venueMapMarkers[window.normalizeMapVenueKey(v.name)] = {
          marker: marker,
          name: v.name,
          color: v.color,
          labelDir: v.label_dir,
          labelOffset: v.label_offset
        };
      });
      var lats = venues.map(function(v) { return v.lat; });
      var lngs = venues.map(function(v) { return v.lng; });
      window._venueBounds = [
        [Math.min.apply(null, lats) - 0.01, Math.min.apply(null, lngs) - 0.02],
        [Math.max.apply(null, lats) + 0.01, Math.max.apply(null, lngs) + 0.02]
      ];
      map.setView([41.93, -87.645], 12);
      window._venueMap = map;
      setTimeout(function() {
        window._venueMap.invalidateSize();
        window._venueMap.fitBounds(window._venueBounds);
        window.buildVenueMapKey();
        window.syncVenueMapLabels();
      }, 150);
    };
  }

  if (dateJump) {
    dateJump.innerHTML = '<option value="">↓ Date</option>';
    var today = new Date();
    var todayStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
    var monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    var dayAbbr = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    var blocks = Array.from(document.querySelectorAll('.day-block'));
    blocks.sort(function(a, b) {
      return a.dataset.date < b.dataset.date ? -1 : 1;
    });
    var upcomingDates = [];
    var pastDates = [];
    function appendJumpOption(date) {
      var d = new Date(date + 'T12:00:00');
      var label = dayAbbr[d.getDay()] + ' ' + monthNames[d.getMonth()] + ' ' + d.getDate();
      if (date === todayStr) label += ' ★';
      var opt = document.createElement('option');
      opt.value = date;
      opt.textContent = label;
      dateJump.appendChild(opt);
    }
    blocks.forEach(function(block) {
      var date = block.dataset.date;
      if (!date) return;
      if (date < todayStr) pastDates.push(date);
      else upcomingDates.push(date);
    });
    upcomingDates.forEach(appendJumpOption);
    if (pastDates.length) {
      var divider = document.createElement('option');
      divider.value = '';
      divider.textContent = '──────── Past dates';
      divider.disabled = true;
      dateJump.appendChild(divider);
      pastDates.sort(function(a, b) { return a > b ? -1 : 1; }).forEach(appendJumpOption);
    }
    if (dateJump.querySelector('option[value="' + todayStr + '"]')) {
      dateJump.value = todayStr;
    } else {
      var defaultDate = upcomingDates[0] || pastDates[0];
      if (defaultDate && dateJump.querySelector('option[value="' + defaultDate + '"]')) {
        dateJump.value = defaultDate;
      } else if (dateJump.options.length > 1) {
        dateJump.selectedIndex = 1;
      }
    }
    dateJump.onchange = function() {
      var val = this.value;
      if (!val) return;
      var block = document.querySelector('.day-block[data-date="' + val + '"]');
      if (block) block.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
  }

  if (mapBtn && mapEl) {
    var cleanMapBtn = mapBtn.cloneNode(true);
    mapBtn.parentNode.replaceChild(cleanMapBtn, mapBtn);
    mapBtn = cleanMapBtn;

    mapBtn.addEventListener('click', function(event) {
      event.preventDefault();
      ensureVenueMapBootstrap();
      var isOpening = !mapPanel || mapPanel.hidden;
      if (mapPanel) mapPanel.hidden = !isOpening;
      mapBtn.classList.toggle('active', isOpening);
      if (isOpening) {
        var venueToggle = document.getElementById('venue-filter-toggle');
        if (venueToggle && venueToggle.checked) {
          venueToggle.checked = false;
          venueToggle.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });

      if (!isOpening) return;

      var needsFreshMap = !window._venueMap || !mapEl.querySelector('.leaflet-pane');
      if (needsFreshMap && typeof window.initVenueMap === 'function') {
        try {
          if (window._venueMap && typeof window._venueMap.remove === 'function') {
            window._venueMap.remove();
          }
          window._venueMap = null;
          window._venueBounds = null;
          mapEl.innerHTML = '';
          if (mapEl._leaflet_id) {
            delete mapEl._leaflet_id;
          }
          setTimeout(function() {
            window.initVenueMap();
          }, 80);
        } catch (error) {
          console.warn('Map initialisation failed', error);
        }
        return;
      }

      window.buildVenueMapKey();
      window.syncVenueMapLabels();
      if (window._venueMap && typeof window._venueMap.invalidateSize === 'function') {
        setTimeout(function() {
          window._venueMap.invalidateSize();
          if (window._venueBounds) {
            window._venueMap.fitBounds(window._venueBounds);
          }
        }, 120);
      }
    });
  }

  })();

(function() {
  function resetBoundButton(button) {
    if (!button || !button.parentNode) return button;
    var cleanButton = button.cloneNode(true);
    button.parentNode.replaceChild(cleanButton, button);
    return cleanButton;
  }

  var submitButtons = [
    resetBoundButton(document.getElementById('sub-submit-final-btn')),
    resetBoundButton(document.getElementById('sub-submit-final-btn-hidden'))
  ].filter(function(button) {
    return !!button;
  });
  var submitButtonStates = submitButtons.map(function(button) {
    return {
      button: button,
      originalLabel: button.textContent
    };
  });
  var statusLine = document.getElementById('submission-status-line');
  var previewStatusLine = document.getElementById('submission-status-line-preview');
  var modal = document.getElementById('submission-modal');
  var previewPanel = document.getElementById('sub-preview-panel');
  var formPanel = document.getElementById('sub-form-panel');
  var validateSubmissionForm = window.CJFValidateSubmissionForm;
  var clearInvalidFields = window.CJFClearInvalidFields;
  var markInvalid = window.CJFMarkInvalid;
  function safeGetEditableValue(el) {
    if (!el) return '';
    if (el.dataset && el.dataset.pristine === 'true') return '';
    return String(el.value || '').trim();
  }
  var markSampleState = window.CJFMarkSampleState || function() {};
  var syncVisibleTimeFromBridge = window.CJFSyncVisibleTimeFromBridge;
  var syncVenueBridge = window.CJFSyncVenueBridge;
  var spamTrapEl = document.getElementById('sub-website');
  var submissionGuardState = {
    openedAt: 0
  };
  var SUBMISSION_GUARD_STORAGE_KEY = 'cjf_submission_attempts_v1';
  var SUBMISSION_GUARD_WINDOW_MS = 60 * 60 * 1000;
  var SUBMISSION_GUARD_MAX_SUBMISSIONS = 10;
  var SUBMISSION_MIN_FILL_MS = 8000;
  if (!submitButtons.length || !statusLine) return;

  function setStatus(message, isError) {
    statusLine.textContent = message;
    statusLine.style.color = isError ? '#f0a0a8' : '#b7d9e6';
    if (previewStatusLine) {
      previewStatusLine.textContent = message;
      previewStatusLine.style.color = isError ? '#f0a0a8' : '#b7d9e6';
    }
  }

  function setInlineSubmitError(message) {
    var err = document.getElementById('sub-preview-error');
    if (err) err.textContent = message || '';
  }

  function setSubmitButtonsDisabled(disabled) {
    submitButtonStates.forEach(function(entry) {
      entry.button.disabled = disabled;
    });
  }

  function setSubmitButtonsLabel(label) {
    submitButtonStates.forEach(function(entry) {
      entry.button.textContent = label;
    });
  }

  function restoreSubmitButtonLabels() {
    submitButtonStates.forEach(function(entry) {
      entry.button.textContent = entry.originalLabel;
    });
  }

  function nowMs() {
    return Date.now();
  }

  function resetSubmissionGuardState() {
    submissionGuardState.openedAt = nowMs();
    if (spamTrapEl) spamTrapEl.value = '';
  }

  function noteSubmissionInteraction() {
    if (!submissionGuardState.openedAt) {
      submissionGuardState.openedAt = nowMs();
    }
  }

  function hasLocalStorageAccess() {
    try {
      return !!window.localStorage;
    } catch (error) {
      return false;
    }
  }

  function readSubmissionAttemptHistory() {
    if (!hasLocalStorageAccess()) return [];
    try {
      var parsed = JSON.parse(window.localStorage.getItem(SUBMISSION_GUARD_STORAGE_KEY) || '[]');
      return Array.isArray(parsed) ? parsed.filter(function(value) {
        return typeof value === 'number' && isFinite(value);
      }) : [];
    } catch (error) {
      return [];
    }
  }

  function writeSubmissionAttemptHistory(entries) {
    if (!hasLocalStorageAccess()) return;
    try {
      window.localStorage.setItem(SUBMISSION_GUARD_STORAGE_KEY, JSON.stringify(entries));
    } catch (error) {
      // Ignore storage failures and fall back to the in-memory cooldowns.
    }
  }

  function getRecentSubmissionAttemptHistory() {
    var cutoff = nowMs() - SUBMISSION_GUARD_WINDOW_MS;
    var recentEntries = readSubmissionAttemptHistory().filter(function(value) {
      return value >= cutoff;
    });
    writeSubmissionAttemptHistory(recentEntries);
    return recentEntries;
  }

  function recordSubmissionAttempt() {
    var recentEntries = getRecentSubmissionAttemptHistory();
    recentEntries.push(nowMs());
    writeSubmissionAttemptHistory(recentEntries);
  }

  function getSubmissionGuardError() {
    if (spamTrapEl && String(spamTrapEl.value || '').trim()) {
      return 'Submission blocked. Please refresh and try again.';
    }
    if (!submissionGuardState.openedAt) {
      resetSubmissionGuardState();
    }
    if (nowMs() - submissionGuardState.openedAt < SUBMISSION_MIN_FILL_MS) {
      return 'Please take a moment to review your details before submitting.';
    }
    if (getRecentSubmissionAttemptHistory().length >= SUBMISSION_GUARD_MAX_SUBMISSIONS) {
      return 'This browser has reached the submission limit for now. Please try again in about an hour.';
    }
    return '';
  }

  function getFriendlySubmissionError(error) {
    var message = String((error && error.message) || '').trim();
    var details = String((error && error.details) || '').trim();
    var hint = String((error && error.hint) || '').trim();
    var combined = [message, details, hint].join(' ');
    if ((error && error.code) === '23505' || /duplicate key value/i.test(combined) || /submissions_public_form_dedupe_idx/i.test(combined)) {
      return 'That event looks like it was already submitted.';
    }
    if ((error && error.code) === '42501' || /row-level security/i.test(combined)) {
      return 'That submission was blocked by the anti-spam filter. Please wait a bit and try again.';
    }
    return message || 'Could not save the submission.';
  }

  function getSubmissionDateValidation() {
    var dateEl = document.getElementById('sub-date');
    if (!dateEl) return { date: null, reason: 'missing' };

    var digits = String(dateEl.value || '').replace(/[^0-9]/g, '');
    if (!digits) return { date: null, reason: 'missing' };
    if (digits.length < 6) return { date: null, reason: 'invalid' };
    var value = digits.slice(0, 2) + '/' + digits.slice(2, 4) + '/' + digits.slice(4, 6);

    var parts = value.split('/');
    var month = parseInt(parts[0], 10);
    var day = parseInt(parts[1], 10);
    var year = 2000 + parseInt(parts[2], 10);

    if (isNaN(month) || isNaN(day) || isNaN(year)) return { date: null, reason: 'invalid' };
    if (month < 1 || month > 12 || year > 2037) return { date: null, reason: 'invalid' };

    var dt = new Date(year, month - 1, day);
    if (dt.getFullYear() !== year || dt.getMonth() !== month - 1 || dt.getDate() !== day) {
      return { date: null, reason: 'invalid' };
    }

    var today = new Date();
    today.setHours(0, 0, 0, 0);
    if (dt < today) return { date: null, reason: 'past' };

    return { date: dt, reason: '' };
  }

  function getSelectedEventDate() {
    return getSubmissionDateValidation().date;
  }

  function bindMobileSafePress(button, handler) {
    if (!button) return;
    var lastTouchAt = 0;
    button.addEventListener('touchend', function(event) {
      event.preventDefault();
      lastTouchAt = Date.now();
      handler(event);
    }, { passive: false });
    button.addEventListener('click', function(event) {
      if (Date.now() - lastTouchAt < 700) {
        event.preventDefault();
        return;
      }
      handler(event);
    });
  }

  function getDateIso() {
    var selectedDate = getSelectedEventDate();
    if (!selectedDate) return '';
    return selectedDate.getFullYear() + '-' +
      String(selectedDate.getMonth() + 1).padStart(2, '0') + '-' +
      String(selectedDate.getDate()).padStart(2, '0');
  }

  function getPriceTextValue() {
    return safeGetEditableValue(document.getElementById('sub-price'));
  }

  function derivePriceSuggested(priceText, suggestedChecked) {
    if (suggestedChecked) return true;
    return /\b(suggested|donation|sliding|pay what you can|pwyc)\b/i.test(String(priceText || ''));
  }

  function derivePriceAmount(priceText) {
    var raw = String(priceText || '').trim();
    if (!raw) return null;
    if (/\b(free|gratis|no cover)\b/i.test(raw)) return 0;
    var match = raw.match(/\d+/);
    if (match) return parseInt(match[0], 10);
    return -1;
  }

  function getPriceDisplay(priceText, suggested) {
    var display = String(priceText || '').trim();
    if (!display) return '';
    if (suggested && /^\$?\d+(?:\.\d{1,2})?$/.test(display) && !/\bsuggested\b/i.test(display)) {
      return display + ' (suggested)';
    }
    return display;
  }

  function buildPayload() {
    var venueIsCustom = !!((document.getElementById('venue-not-listed-toggle') || {}).checked);
    var listedVenue = ((document.getElementById('sub-venue') || {}).value || '').trim();
    var customVenue = ((document.getElementById('sub-custom-venue') || {}).value || '').trim();
    var customAddressLine1 = ((document.getElementById('sub-custom-address') || {}).value || '').trim();
    var customAddressLine2 = ((document.getElementById('sub-custom-address-2') || {}).value || '').trim();
    var priceText = getPriceTextValue();
    var priceSuggested = derivePriceSuggested(priceText, false);
    var priceAmount = derivePriceAmount(priceText);
    var notesToggle = !!((document.getElementById('notes-toggle') || {}).checked);
    var contactFirst = (((document.getElementById('sub-contact-first') || {}).value || '').trim()) || null;
    var contactLast = (((document.getElementById('sub-contact-last') || {}).value || '').trim()) || null;
    var contactPhone = (((document.getElementById('sub-contact-phone') || {}).value || '').trim()) || null;
    var contactEmail = (((document.getElementById('sub-contact-email') || {}).value || '').trim()) || null;
    var contactInstagram = (((document.getElementById('sub-contact-instagram') || {}).value || '').trim()) || null;
    if (contactInstagram === '@' || contactInstagram === '@social') contactInstagram = null;
    var noteValue = ((((document.getElementById('sub-notes') || {}).value || '').trim()) || null);
    var adminFacingContact = [contactPhone, contactInstagram ? ('IG ' + contactInstagram) : null].filter(Boolean).join(' | ') || null;
    var noteParts = [];
    if (contactInstagram && !contactPhone) noteParts.push('Instagram: ' + contactInstagram);
    if (noteValue) noteParts.push(noteValue);

    return {
      event_title: safeGetEditableValue(document.getElementById('sub-title')),
      venue_name: venueIsCustom ? customVenue : listedVenue,
      venue_address: venueIsCustom ? ([customAddressLine1, customAddressLine2].filter(Boolean).join(', ') || null) : null,
      map_link: venueIsCustom ? (((document.getElementById('sub-custom-map-link') || {}).value || '').trim() || null) : null,
      venue_is_custom: venueIsCustom,
      event_date: getDateIso(),
      start_hour: ((document.getElementById('sub-hour') || {}).value || '').trim(),
      start_minute: ((document.getElementById('sub-min') || {}).value || '').trim(),
      start_ampm: ((document.getElementById('sub-ampm') || {}).value || 'PM').trim(),
      doors_enabled: false,
      doors_hour: null,
      doors_minute: null,
      doors_ampm: null,
      price_amount: priceAmount,
      price_suggested: priceSuggested,
      price_display: getPriceDisplay(priceText, priceSuggested),
      event_link: (((document.getElementById('sub-link') || {}).value || '').trim()) || null,
      description: safeGetEditableValue(document.getElementById('event-description-input')),
      notes: (notesToggle || noteParts.length) ? (noteParts.join('\n') || null) : null,
      contact_name: [contactFirst, contactLast].filter(Boolean).join(' ') || null,
      submitter_email: contactEmail,
      submitter_phone: adminFacingContact,
      status: 'new',
      source: 'public_form'
    };
  }

  function resetSubmissionForm() {
    var form = formPanel ? formPanel.querySelector('form') : null;
    if (form) form.reset();
    ['sub-title', 'sub-venue-visible', 'sub-time-visible', 'sub-custom-venue', 'sub-custom-address', 'sub-custom-address-2', 'sub-custom-map-link', 'sub-link', 'event-description-input', 'sub-notes', 'sub-price', 'sub-contact-first', 'sub-contact-last', 'sub-contact-phone', 'sub-contact-email'].forEach(function(id) {
      var el = document.getElementById(id);
      if (el) el.value = el.dataset && el.dataset.sample ? el.dataset.sample : '';
    });
    var instagramEl = document.getElementById('sub-contact-instagram');
    if (instagramEl) instagramEl.value = '@';
    ['sub-venue', 'sub-hour', 'sub-min', 'sub-ampm'].forEach(function(id) {
      var el = document.getElementById(id);
      if (el && el.options && el.options.length) el.selectedIndex = 0;
    });
    var dateEl = document.getElementById('sub-date');
    if (dateEl) {
      dateEl.value = 'mm/dd/yy';
    }
    var visibleAmpmInput = document.getElementById('sub-ampm-visible');
    if (visibleAmpmInput) visibleAmpmInput.value = 'PM';
    var hiddenAmpmEl = document.getElementById('sub-ampm');
    if (hiddenAmpmEl) hiddenAmpmEl.value = 'PM';
    ['venue-not-listed-toggle', 'notes-toggle'].forEach(function(id) {
      var el = document.getElementById(id);
      if (el) {
        el.checked = false;
        if (typeof el.dispatchEvent === 'function') {
          el.dispatchEvent(new Event('change'));
        }
      }
    });
    if (previewPanel) previewPanel.style.display = 'none';
    if (formPanel) formPanel.style.display = '';
    var venueSelectEl = document.getElementById('sub-venue');
    if (venueSelectEl && typeof venueSelectEl.dispatchEvent === 'function') {
      venueSelectEl.dispatchEvent(new Event('change'));
    }
    var priceEl = document.getElementById('sub-price');
    if (priceEl) {
      priceEl.value = priceEl.dataset && priceEl.dataset.sample ? priceEl.dataset.sample : '$';
    }
    var timeInputEl = document.getElementById('sub-time-visible');
    if (timeInputEl) timeInputEl.value = '--:--';
    ['sub-venue-visible', 'sub-price', 'sub-title', 'event-description-input'].forEach(function(id) {
      var el = document.getElementById(id);
      if (el && el.dataset && el.dataset.sample) {
        markSampleState(el, true);
      }
    });
    if (typeof syncVisibleTimeFromBridge === 'function') syncVisibleTimeFromBridge();
    if (typeof syncVenueBridge === 'function') syncVenueBridge();
    if (window.CJFRenderSubmissionPreview) {
      window.CJFRenderSubmissionPreview();
    }
    resetSubmissionGuardState();
  }

  async function submitToSupabase() {
    var supabaseTools = window.CJFSupabase;
    if (!supabaseTools) {
      setInlineSubmitError('Submission service is unavailable right now.');
      setStatus('Submission service is unavailable right now.', true);
      return;
    }

    var client = supabaseTools.getClient();
    if (!client) {
      console.error(supabaseTools.getConfigError());
      setInlineSubmitError('Submission service is unavailable right now.');
      setStatus('Submission service is unavailable right now.', true);
      return;
    }

    var submissionDateCheck = getSubmissionDateValidation();
    if (!submissionDateCheck.date) {
      clearInvalidFields();
      if (submissionDateCheck.reason === 'past') {
        markInvalid(document.getElementById('sub-date'), 'future date only');
      } else if (submissionDateCheck.reason === 'invalid') {
        markInvalid(document.getElementById('sub-date'), 'date invalid');
      } else {
        markInvalid(document.getElementById('sub-date'));
      }
      previewPanel.style.display = 'none';
      formPanel.style.display = '';
      setInlineSubmitError(submissionDateCheck.reason === 'past' ? 'Please enter a future date.' : 'Please enter a valid date as mm/dd/yy.');
      setStatus(submissionDateCheck.reason === 'past' ? 'Please enter a future date.' : 'Please enter a valid date as mm/dd/yy.', true);
      return;
    }

    var submissionGuardError = getSubmissionGuardError();
    if (submissionGuardError) {
      setInlineSubmitError(submissionGuardError);
      setStatus(submissionGuardError, true);
      return;
    }

    var payload = buildPayload();
    setInlineSubmitError('');
    setSubmitButtonsDisabled(true);
    setSubmitButtonsLabel('Submitting...');
    setStatus('Submitting your event...', false);
    recordSubmissionAttempt();

    try {
      var response = await client
        .from(supabaseTools.getSubmissionsTable())
        .insert([payload]);

      if (response.error) {
        throw response.error;
      }

      setStatus('Submission saved. Thank you.', false);
      resetSubmissionForm();
      if (modal) {
        setTimeout(function() {
          modal.classList.remove('open');
          modal.setAttribute('aria-hidden', 'true');
          document.body.style.overflow = '';
        }, 500);
      }
    } catch (error) {
      setInlineSubmitError(getFriendlySubmissionError(error));
      setStatus(getFriendlySubmissionError(error), true);
    } finally {
      setSubmitButtonsDisabled(false);
      restoreSubmitButtonLabels();
    }
  }

  function handleSubmitPress(e) {
    if (e) e.preventDefault();
    try {
      if (typeof validateSubmissionForm !== 'function') {
        throw new Error('Submission form validation did not load.');
      }
      if (!validateSubmissionForm()) return;
      submitToSupabase();
    } catch (error) {
      console.error(error);
      setInlineSubmitError(error.message || 'Something blocked the submission form.');
      setStatus('Something blocked the submission form.', true);
    }
  }

  window.CJFHandleSubmitPress = handleSubmitPress;
  submitButtons.forEach(function(button) {
    button.dataset.jsBound = 'true';
    bindMobileSafePress(button, handleSubmitPress);
  });
  if (formPanel) {
    formPanel.addEventListener('input', noteSubmissionInteraction);
    formPanel.addEventListener('change', noteSubmissionInteraction);
  }
  if (modal) {
    var modalWasOpen = modal.classList.contains('open');
    if (modalWasOpen) {
      resetSubmissionGuardState();
    }
    var guardObserver = new MutationObserver(function() {
      var modalIsOpen = modal.classList.contains('open');
      if (modalIsOpen && !modalWasOpen) {
        resetSubmissionGuardState();
      }
      modalWasOpen = modalIsOpen;
    });
    guardObserver.observe(modal, { attributes: true, attributeFilter: ['class'] });
  }
})();

(function() {
  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function escapeAttr(value) {
    return escapeHtml(value);
  }

  function pad2(value) {
    return String(value).padStart(2, '0');
  }

  function parseIsoDateParts(isoDate) {
    var match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(isoDate || ''));
    if (!match) return null;
    return {
      year: parseInt(match[1], 10),
      month: parseInt(match[2], 10),
      day: parseInt(match[3], 10)
    };
  }

  function formatDayName(isoDate) {
    var parts = parseIsoDateParts(isoDate);
    if (!parts) return '';
    var dt = new Date(parts.year, parts.month - 1, parts.day);
    return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dt.getDay()];
  }

  function formatDayLabel(isoDate) {
    var parts = parseIsoDateParts(isoDate);
    if (!parts) return '';
    var dt = new Date(parts.year, parts.month - 1, parts.day);
    return dt.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  }

  function formatJumpLabel(isoDate) {
    var parts = parseIsoDateParts(isoDate);
    if (!parts) return isoDate;
    var dt = new Date(parts.year, parts.month - 1, parts.day);
    return dt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }

  function normalizeVenueName(name) {
    return canonicalizeVenueName(name);
  }

  function getDynamicVenueColor(name, isCustom) {
    var normalized = normalizeVenueName(name) || String(name || '').trim();
    var sharedColors = window.JAZZ_VENUE_COLORS || {};
    var colorResolver = window.getOrCreateVenueColor;
    if (sharedColors[normalized]) return sharedColors[normalized];
    if (isCustom && typeof colorResolver === 'function') return colorResolver(normalized || name, '#5a4e3a');
    if (typeof getVenueColor === 'function') {
      return getVenueColor(name);
    }
    if (typeof colorResolver === 'function') return colorResolver(normalized || name, '#5a4e3a');
    return '#5a4e3a';
  }

  function formatTime(row, prefix) {
    var hour = String(row[prefix + '_hour'] || '').trim();
    var minute = String(row[prefix + '_minute'] || '').trim();
    var ampm = String(row[prefix + '_ampm'] || 'PM').trim().toLowerCase();
    if (!hour || !minute) return '';
    return hour + ':' + minute + ampm;
  }

  function isRelaxAttackStaticRow(row) {
    return !!row &&
      row.source === 'jazztest_static' &&
      /^Relax Attack Jazz Series:/i.test(String(row.event_title || '').trim());
  }

  function isWhistlerStaticRow(row) {
    return !!row &&
      row.source === 'jazztest_static' &&
      normalizeVenueName(row.venue_name) === 'The Whistler';
  }

  function normalizeDisplayRow(row) {
    if (!isRelaxAttackStaticRow(row) && !isWhistlerStaticRow(row)) return row;
    var next = Object.assign({}, row);
    next.start_hour = '9';
    next.start_minute = '00';
    next.start_ampm = 'PM';
    next.price_amount = 0;
    next.price_display = 'Free';
    next.doors_enabled = false;
    next.doors_hour = null;
    next.doors_minute = null;
    next.doors_ampm = null;
    return next;
  }

  function formatPrice(row) {
    row = normalizeDisplayRow(row);
    var amount = row.price_amount;
    var display = String(row.price_display || '').trim();
    var base = display || (amount === 0 ? '$0' : (amount ? ('$' + amount) : ''));
    var doorsTime = row.doors_enabled ? formatTime(row, 'doors') : '';
    if (doorsTime) {
      return base ? (base + ' | Doors ' + doorsTime) : ('Doors ' + doorsTime);
    }
    return base;
  }

  function eventSortValue(row) {
    row = normalizeDisplayRow(row);
    var hour = parseInt(row.start_hour || '0', 10);
    var minute = parseInt(row.start_minute || '0', 10);
    var ampm = String(row.start_ampm || 'PM').toUpperCase();
    if (ampm === 'PM' && hour < 12) hour += 12;
    if (ampm === 'AM' && hour === 12) hour = 0;
    return (hour * 60) + minute;
  }

  function createDayBlock(isoDate) {
    var block = document.createElement('div');
    block.className = 'day-block';
    block.dataset.date = isoDate;
    block.dataset.dow = formatDayName(isoDate);
    block.innerHTML = '<div class="day-header"><span class="day-name">' +
      escapeHtml(formatDayName(isoDate)) +
      '</span><span class="day-date">' +
      escapeHtml(formatDayLabel(isoDate)) +
      '</span></div>';
    return block;
  }

  function insertDayBlockSorted(block) {
    var footer = document.querySelector('.footer');
    var allBlocks = Array.from(document.querySelectorAll('.day-block'));
    var inserted = false;
    for (var i = 0; i < allBlocks.length; i += 1) {
      if ((allBlocks[i].dataset.date || '') > block.dataset.date) {
        allBlocks[i].parentNode.insertBefore(block, allBlocks[i]);
        inserted = true;
        break;
      }
    }
    if (!inserted && footer && footer.parentNode) {
      footer.parentNode.insertBefore(block, footer);
      inserted = true;
    }
    if (!inserted) {
      document.body.appendChild(block);
    }
  }

  function ensureDayBlock(isoDate) {
    var existing = document.querySelector('.day-block[data-date="' + isoDate + '"]');
    if (existing) return existing;
    var created = createDayBlock(isoDate);
    insertDayBlockSorted(created);
    return created;
  }

  function normalizeEventKeyText(value) {
    return String(value || '')
      .replace(/\s+/g, ' ')
      .replace(/[\u2013\u2014]/g, '-')
      .trim()
      .toLowerCase();
  }

  function buildEventKey(eventDate, venue, title, time) {
    return [
      normalizeEventKeyText(eventDate),
      normalizeEventKeyText(venue),
      normalizeEventKeyText(title),
      normalizeEventKeyText(time)
    ].join('||');
  }

  function buildEventSlotKey(eventDate, venue, time) {
    return [
      normalizeEventKeyText(eventDate),
      normalizeEventKeyText(venue),
      normalizeEventKeyText(time)
    ].join('||');
  }

  function buildEventTitleKey(eventDate, venue, title) {
    return [
      normalizeEventKeyText(eventDate),
      normalizeEventKeyText(venue),
      normalizeEventKeyText(title)
    ].join('||');
  }

  function extractStaticSlotKey(row) {
    var notes = String(row.notes || '');
    var match = notes.match(/\[slot-key:([^\]]+)\]/i);
    return match ? match[1] : '';
  }

  function buildRowEventKey(row) {
    row = normalizeDisplayRow(row);
    return buildEventKey(
      row.event_date,
      normalizeVenueName(row.venue_name) || String(row.venue_name || '').trim(),
      String(row.event_title || '').trim(),
      formatTime(row, 'start')
    );
  }

  function buildRowSlotKey(row) {
    row = normalizeDisplayRow(row);
    return buildEventSlotKey(
      row.event_date,
      normalizeVenueName(row.venue_name) || String(row.venue_name || '').trim(),
      formatTime(row, 'start')
    );
  }

  function buildRowTitleKey(row) {
    row = normalizeDisplayRow(row);
    return buildEventTitleKey(
      row.event_date,
      normalizeVenueName(row.venue_name) || String(row.venue_name || '').trim(),
      String(row.event_title || '').trim()
    );
  }

  function getManagedRowStamp(row) {
    return String(row.reviewed_at || row.updated_at || row.created_at || row.id || '');
  }

  function captureStaticEventEntries() {
    return Array.from(document.querySelectorAll('.day-block .event:not([data-dynamic-approved="true"])')).map(function(node) {
      var block = node.closest('.day-block');
      var eventDate = block ? (block.dataset.date || '') : '';
      var venue = canonicalizeVenueName((node.querySelector('.venue-tag') || {}).textContent || node.dataset.venue || '');
      var titleNode = node.querySelector('.event-act a') || node.querySelector('.event-act');
      var title = titleNode ? titleNode.textContent : '';
      var time = (node.querySelector('.event-time') || {}).textContent || '';
      return {
        key: buildEventKey(eventDate, venue, title, time),
        titleKey: buildEventTitleKey(eventDate, venue, title),
        slotKey: buildEventSlotKey(eventDate, venue, time),
        node: node,
        originalHtml: node.innerHTML,
        originalBorderLeftColor: node.style.borderLeftColor,
        originalClassName: node.className,
        originalDataset: {
          venue: node.dataset.venue || '',
          dow: node.dataset.dow || '',
          free: node.dataset.free || '',
          catchall: node.dataset.catchall || ''
        }
      };
    });
  }

  var staticEventEntries = captureStaticEventEntries();
  var staticEntryByKey = {};
  var staticEntriesByTitleKey = {};
  var staticEntriesBySlotKey = {};
  staticEventEntries.forEach(function(entry) {
    staticEntryByKey[entry.key] = entry;
    if (!staticEntriesByTitleKey[entry.titleKey]) staticEntriesByTitleKey[entry.titleKey] = [];
    staticEntriesByTitleKey[entry.titleKey].push(entry);
    if (!staticEntriesBySlotKey[entry.slotKey]) staticEntriesBySlotKey[entry.slotKey] = [];
    staticEntriesBySlotKey[entry.slotKey].push(entry);
  });

  function restoreStaticEventEntries() {
    staticEventEntries.forEach(function(entry) {
      if (!entry.node) return;
      entry.node.className = entry.originalClassName;
      entry.node.innerHTML = entry.originalHtml;
      entry.node.style.borderLeftColor = entry.originalBorderLeftColor;
      entry.node.style.display = '';
      entry.node.dataset.venue = entry.originalDataset.venue;
      entry.node.dataset.dow = entry.originalDataset.dow;
      entry.node.dataset.free = entry.originalDataset.free;
      entry.node.dataset.catchall = entry.originalDataset.catchall;
      delete entry.node.dataset.submissionId;
      delete entry.node.dataset.supabaseSuppressed;
      delete entry.node.dataset.supabaseManaged;
      var block = entry.node.closest('.day-block');
      applyEditorialBlurbToNode(entry.node, block ? (block.dataset.date || '') : '');
    });
  }

  var EDITORIAL_BLURB_OVERRIDES = {
    "2026-03-26||elastic arts||improvised music series: bill harris, al kolot (becky grajeda), brian mcfarlane": "Improvised-music bill spanning percussion, electronics, and performance art.",
    "2026-03-26||jazz showcase||steve turre quintet": "Legendary trombonist and shell player leading a hard-swinging quintet.",
    "2026-03-26||le piano||ben paterson organ trio (feat. bobby broom)": "Soul-jazz organ trio with guitarist Bobby Broom.",
    "2026-03-27||constellation||tom skinner w/ ben lamar gay, joshua abrams & mike reed": "Improvised quartet with Tom Skinner, Ben LaMar Gay, Joshua Abrams, and Mike Reed.",
    "2026-03-27||elastic arts||airmw presents: takashi shallow 'recent projects' + ren langyi": "Experimental set from Takashi Shallow with Ren Langyi.",
    "2026-03-27||le piano||chris white quartet": "Resident jazz quartet led by pianist Chris White.",
    "2026-03-27||lemon||superfloss": "Disco, funk, and pop covers with a big-band feel.",
    "2026-03-28||elastic arts||aacm + dal niente": "AACM and Ensemble Dal Niente join forces for a large-ensemble program.",
    "2026-03-28||le piano||petra van nuis & dennis luxion": "Intimate vocal-piano set from Petra van Nuis and Dennis Luxion.",
    "2026-03-28||lemon||javier red quartet": "Original modern jazz rooted in post-bop and West African rhythm.",
    "2026-03-28||lemon||maxx mcgathey orchestra": "Late-night big band blending jazz, contemporary classical, and cinematic writing.",
    "2026-03-29||constellation||shabaka w/ joy guidry": "Exploratory duo set from Shabaka and Joy Guidry.",
    "2026-03-30||constellation||roscoe mitchell": "Rare Chicago appearance by AACM co-founder Roscoe Mitchell.",
    "2026-03-31||elastic arts||line of sight: a trans day of visibility poetry cabaret": "Poetry cabaret marking Trans Day of Visibility.",
    "2026-03-31||the whistler||relax attack jazz series: juliette gardiner quintet": "Jazz quintet in The Whistler's weekly series.",
    "2026-04-01||constellation||rich(ard) dawson w/ wendy eisenberg": "Word-rich folk experimentalism from Richard Dawson, with Wendy Eisenberg.",
    "2026-04-01||elastic arts||fugue state: phase 3 - film screening program 1": "Experimental film and expanded-cinema program.",
    "2026-04-01||le piano||liz mandeville's bourbon & blues review": "Chicago blues and roots set led by Liz Mandeville.",
    "2026-04-02||elastic arts||improvised music series: whisker + carol genetti + keefe jackson / jim baker / julian kirshner": "Three-act improvised-music bill featuring Whisker, Carol Genetti, and a Keefe Jackson trio.",
    "2026-04-03||constellation||rosenau & sanborn": "Improvised guitar-and-electronics duo from Chris Rosenau and Nick Sanborn.",
    "2026-04-03||elastic arts||'too tender headed' visual gallery opening": "Gallery opening for Harlem West's Too Tender Headed exhibition.",
    "2026-04-03||fulton street collective||jazz: america's music - art opening": "Jazz-inspired group art show spanning icons from Armstrong to Sun Ra.",
    "2026-04-03||lemon||the rind": "Arabic-funk collective with jazz-minded improvisers.",
    "2026-04-04||elastic arts||dark matter series: kwami winfield, d. jean-baptiste, femi shonuga-fleming, naturalblkinvention + ilovecomputergirl (dj)": "BLK Noise night of experimental electronics and sound art.",
    "2026-04-04||le piano||sam robinson - album release party": "Album-release set from Chicago saxophonist Sam Robinson.",
    "2026-04-04||lemon||the squeeze": "Chicago-rooted house-music night.",
    "2026-04-05||constellation||kelly moran": "Experimental piano set from composer Kelly Moran.",
    "2026-04-05||elastic arts||elastro: apologist + itsï ramirez + erψn temp3st": "Electronic and experimental bill with apologist, Itsï Ramirez, and erψn temp3st.",
    "2026-04-06||elastic arts||homeroom residency: tim daisy - chrome yellow (new scores + conductions)": "Percussion-led new-music set from Tim Daisy's Monday residency.",
    "2026-04-08||elastic arts||fugue state: phase 3 - film screening program 2": "Second night of Fugue State's experimental film program.",
    "2026-04-08||fulton street collective||the cogstet + katja ji trio": "Experimental-jazz double bill led by Matthew Coglianese and Katja Ji.",
    "2026-04-08||jazz showcase||wdcb 90.9fm presents: orbert davis quintet": "Chicago trumpet leader Orbert Davis brings a big-hearted straight-ahead set.",
    "2026-04-09||elastic arts||improvised music series: alana detonators + julian pujol qualls / elijah bradford / marcos morales": "Two exploratory sets from Alana Detonators and a Julian Pujol Qualls trio.",
    "2026-04-10||constellation||emily rach beisel's 'sumptuous branching' w/ mute duo": "Album-release set of bass clarinet, electronics, and voice, with Mute Duo opening.",
    "2026-04-10||green mill||tribute to george freeman feat. bernard 'pretty' purdie": "Tribute to Chicago guitar legend George Freeman, featuring Bernard Purdie.",
    "2026-04-11||constellation||em spel (record release) with edith judith": "Record-release show of flute-led experimental pop with Edith Judith.",
    "2026-04-12||winter's jazz club||tierney sutton & tamir hendelman - debut!": "Intimate duo set from vocalist Tierney Sutton and pianist Tamir Hendelman.",
    "2026-04-15||constellation||mandala makers festival: jugalbandhi + v.v.s. murari, ashwani shankar & sai giridar": "Indian classical improvisers in a cross-tradition jugalbandhi.",
    "2026-04-16||constellation||shi-an costello's alloy prepared piano project": "Prepared-piano showcase spanning experimental and eclectic repertoire.",
    "2026-04-16||elastic arts||imminence festival - night one: vandermark/locks/corsano + jason roebke quartet": "Festival opener featuring Vandermark, Locks, Corsano, and the Jason Roebke Quartet.",
    "2026-04-17||constellation||korean music fridays (kpac)": "Traditional and contemporary Korean music presented by KPAC.",
    "2026-04-18||elastic arts||imminence festival - night three: bill mackay & katinka kleijn + rempis 4tet + jim baker (solo)": "Festival finale with Bill MacKay, Katinka Kleijn, Rempis 4tet, and Jim Baker.",
    "2026-04-18||hungry brain||maurice louca quartet": "Maurice Louca's quartet blends jazz, Arabic traditions, and free improvisation.",
    "2026-04-19||constellation||frequency series: duo aequalis (shannon lotti, flute / stephen eckert, piano)": "Contemporary flute-and-piano program from Duo Aequalis.",
    "2026-04-21||fulton street collective||jamie demeny's 4-player game - album release": "Album-release set from Jamie Demeny's 4-Player Game.",
    "2026-04-21||lemon||latin jam": "Monthly Latin jam rooted in Afro-Caribbean and Central American traditions.",
    "2026-04-22||constellation||stephan crump's slow water": "Earth Day set from bassist-composer Stephan Crump's Slow Water.",
    "2026-04-22||winter's jazz club||spotlight on: maud hixson": "Conversation and cabaret with vocalist Maud Hixson.",
    "2026-04-23||elastic arts||improvised music series: violet booleans + jackson/maunu/dammann/little cloud fawcett": "Experimental double bill with Violet Booleans and a first-time improvised quartet.",
    "2026-04-23||jazz showcase||winard harper & jeli posse": "Jazz set drawing on West African griot traditions.",
    "2026-04-24||constellation||gabriel kahane x roomful of teeth": "Composer Gabriel Kahane teams up with Roomful of Teeth.",
    "2026-04-24||elastic arts||mrs. hands (nicole alonso) album release w/ hedra rowan & jeff goulet": "Album-release set of electroacoustic sound from Mrs. Hands, with two openers.",
    "2026-05-01||symphony center||mike reed's chicago inspirations": "Mike Reed leads a Chicago all-star ensemble celebrating local jazz lineages.",
    "2026-05-01||jazz at logan||isaiah collier: in tribute to the classics of john coltrane": "Isaiah Collier and The Chosen Few pay tribute to John Coltrane."
  };

  function normalizeBlurbKeyPart(value) {
    return String(value || '')
      .replace(/[–—]/g, '-')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }

  function buildEditorialBlurbKey(eventDate, venue, title) {
    return [
      normalizeBlurbKeyPart(eventDate),
      normalizeBlurbKeyPart(venue),
      normalizeBlurbKeyPart(title)
    ].join('||');
  }

  function sanitizeEditorialBlurb(desc) {
    var text = String(desc || '').replace(/\s+/g, ' ').trim();
    if (!text) return '';
    var parts = text.split(/\s*(?:[;•]|\.(?:\s+|$))\s*/).map(function(part) {
      return String(part || '').trim();
    }).filter(Boolean);
    if (!parts.length) return text;
    var filtered = parts.filter(function(part) {
      return !(
        /\b(?:doors?|reservations?|tickets?|admission|cover|suggested|donation|pwyc|pay what you can)\b/i.test(part) ||
        /\$\s*\d/.test(part) ||
        /\bfree\b/i.test(part) ||
        /\b\d{1,2}(?::\d{2})?\s*(?:am|pm)\b/i.test(part)
      );
    });
    var cleaned = (filtered.length ? filtered : parts).join('. ').trim();
    if (cleaned && !/[.!?]$/.test(cleaned)) cleaned += '.';
    return cleaned;
  }

  function getEditorialBlurb(eventDate, venue, title, desc) {
    var key = buildEditorialBlurbKey(eventDate, venue, title);
    if (EDITORIAL_BLURB_OVERRIDES[key]) return EDITORIAL_BLURB_OVERRIDES[key];
    return sanitizeEditorialBlurb(desc);
  }

  function applyEditorialBlurbToNode(node, eventDate) {
    if (!node) return;
    var venueNode = node.querySelector('.venue-tag');
    var titleNode = node.querySelector('.event-act a') || node.querySelector('.event-act');
    var blurbNode = node.querySelector('.event-blurb');
    if (!titleNode || !blurbNode) return;
    var venue = normalizeVenueName((venueNode ? venueNode.textContent : '') || node.dataset.venue || '');
    var title = titleNode.textContent || '';
    var override = getEditorialBlurb(eventDate, venue, title, blurbNode.textContent || '');
    if (override && override !== blurbNode.textContent.trim()) {
      blurbNode.textContent = override;
    }
  }

  staticEventEntries.forEach(function(entry) {
    var block = entry.node ? entry.node.closest('.day-block') : null;
    var eventDate = block ? (block.dataset.date || '') : '';
    applyEditorialBlurbToNode(entry.node, eventDate);
  });

  function parseGcalTime(str) {
    var match = /(\d{1,2}):(\d{2})\s*(am|pm)/i.exec(String(str || '').trim());
    if (!match) return null;
    var hour = parseInt(match[1], 10);
    var minute = parseInt(match[2], 10);
    var ampm = match[3].toLowerCase();
    if (ampm === 'pm' && hour !== 12) hour += 12;
    if (ampm === 'am' && hour === 12) hour = 0;
    return { h: hour, m: minute };
  }

  function gcalDateStamp(date, hour, minute) {
    return String(date || '').replace(/-/g, '') + 'T' + String(hour).padStart(2, '0') + String(minute).padStart(2, '0') + '00';
  }

  function buildGcalButtonHtml(row, venue, title, time, desc) {
    var parsed = parseGcalTime(time);
    var date = String(row && row.event_date || '').trim();
    if (!parsed || !date) return '';
    var endHour = parsed.h + 1;
    var endMinute = parsed.m + 30;
    if (endMinute >= 60) {
      endHour += 1;
      endMinute -= 60;
    }
    var location = (venue ? venue + ', Chicago, IL' : 'Chicago, IL');
    var gcalTitle = title + (venue ? ' @ ' + venue : '');
    var url = 'https://calendar.google.com/calendar/render?action=TEMPLATE'
      + '&text=' + encodeURIComponent(gcalTitle)
      + '&dates=' + gcalDateStamp(date, parsed.h, parsed.m) + '%2F' + gcalDateStamp(date, endHour, endMinute)
      + '&details=' + encodeURIComponent(desc || '')
      + '&location=' + encodeURIComponent(location);
    var calIcon = '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="vertical-align:-1px"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>';
    return '<a href="' + escapeAttr(url) + '" target="_blank" rel="noopener" class="gcal-btn">' + calIcon + '+GCAL</a>';
  }

  function buildEventInnerHtml(row) {
    row = normalizeDisplayRow(row);
    var venue = normalizeVenueName(row.venue_name) || String(row.venue_name || '').trim() || 'Venue TBA';
    var title = String(row.event_title || '').trim();
    var desc = getEditorialBlurb(row.event_date, venue, title, row.description || '');
    var link = String(row.event_link || row.map_link || '').trim();
    var color = getDynamicVenueColor(venue, row.venue_is_custom);
    var time = formatTime(row, 'start');
    var price = formatPrice(row);
    var venueTagClass = 'venue-tag';
    var gcalHtml = buildGcalButtonHtml(row, venue, title || '(untitled)', time, desc);

    var metaHtml = '<div class="event-meta">' +
      '<span class="' + venueTagClass + '" style="background:' + escapeAttr(color) + '">' + escapeHtml(venue) + '</span>' +
      (time ? '<span class="event-time">' + escapeHtml(time) + '</span>' : '') +
      (price ? '<span class="event-price">' + escapeHtml(price) + '</span>' : '') +
      gcalHtml +
      '</div>';

    var actHtml = '<div class="event-act">';
    if (link) {
      actHtml += '<a href="' + escapeAttr(link) + '" target="_blank" rel="noopener">' + escapeHtml(title || '(untitled)') + '</a>';
    } else {
      actHtml += escapeHtml(title || '(untitled)');
    }
    actHtml += '</div>';

    return {
      innerHtml: metaHtml + actHtml + (desc ? '<div class="event-blurb">' + escapeHtml(desc) + '</div>' : ''),
      venue: venue,
      color: color,
      time: time
    };
  }

  function applyRowToStaticEvent(entry, row) {
    var rendered = buildEventInnerHtml(row);
    var dow = formatDayName(row.event_date);
    var free = String(row.price_amount) === '0';
    entry.node.className = 'event';
    entry.node.dataset.venue = rendered.venue;
    entry.node.dataset.dow = dow;
    entry.node.dataset.free = free ? 'true' : 'false';
    entry.node.dataset.catchall = 'false';
    entry.node.dataset.submissionId = row.id;
    entry.node.dataset.supabaseManaged = 'true';
    delete entry.node.dataset.supabaseSuppressed;
    entry.node.innerHTML = rendered.innerHtml;
  }

  function findAvailableStaticEntryForRow(row) {
    var directEntry = staticEntryByKey[buildRowEventKey(row)];
    if (directEntry && directEntry.node.dataset.supabaseManaged !== 'true' && directEntry.node.dataset.supabaseSuppressed !== 'true') {
      return directEntry;
    }

    var slotKey = extractStaticSlotKey(row) || buildRowSlotKey(row);
    var slotEntries = staticEntriesBySlotKey[slotKey] || [];
    for (var i = 0; i < slotEntries.length; i += 1) {
      if (slotEntries[i].node.dataset.supabaseManaged === 'true' || slotEntries[i].node.dataset.supabaseSuppressed === 'true') continue;
      return slotEntries[i];
    }

    var titleKey = buildRowTitleKey(row);
    var titleEntries = staticEntriesByTitleKey[titleKey] || [];
    for (var j = 0; j < titleEntries.length; j += 1) {
      if (titleEntries[j].node.dataset.supabaseManaged === 'true' || titleEntries[j].node.dataset.supabaseSuppressed === 'true') continue;
      return titleEntries[j];
    }

    return null;
  }

  function buildApprovedEventNode(row) {
    var rendered = buildEventInnerHtml(row);
    var venue = rendered.venue;
    var color = rendered.color;
    var dow = formatDayName(row.event_date);
    var free = String(row.price_amount) === '0';
    var node = document.createElement('div');
    node.className = 'event';
    node.dataset.venue = venue;
    node.dataset.dow = dow;
    node.dataset.free = free ? 'true' : 'false';
    node.dataset.catchall = 'false';
    node.dataset.submissionId = row.id;
    node.dataset.dynamicApproved = 'true';
    node.innerHTML = rendered.innerHtml;
    return node;
  }

  function getNormalizedPublicStatus(rowOrStatus) {
    var value = rowOrStatus && typeof rowOrStatus === 'object'
      ? rowOrStatus.status
      : rowOrStatus;
    return String(value || '').trim().toLowerCase();
  }

  function isPublicCalendarStatus(rowOrStatus) {
    var normalized = getNormalizedPublicStatus(rowOrStatus);
    return normalized === 'approved' || normalized === 'published';
  }

  function insertEventSorted(block, eventNode, row) {
    var events = Array.from(block.querySelectorAll('.event'));
    var rowSort = eventSortValue(row);
    var inserted = false;
    for (var i = 0; i < events.length; i += 1) {
      var existing = events[i];
      var existingTime = (existing.querySelector('.event-time') || {}).textContent || '';
      var match = /^(\d{1,2}):(\d{2})(am|pm)$/i.exec(existingTime.trim());
      if (!match) continue;
      var hour = parseInt(match[1], 10);
      var minute = parseInt(match[2], 10);
      var ampm = match[3].toUpperCase();
      if (ampm === 'PM' && hour < 12) hour += 12;
      if (ampm === 'AM' && hour === 12) hour = 0;
      var existingSort = (hour * 60) + minute;
      if (rowSort < existingSort) {
        block.insertBefore(eventNode, existing);
        inserted = true;
        break;
      }
    }
    if (!inserted) {
      block.appendChild(eventNode);
    }
  }

  function refreshDateJump() {
    var dateJump = document.getElementById('date-jump');
    if (!dateJump) return;
    var currentValue = dateJump.value;
    var todayStr = getTodayStr();
    dateJump.innerHTML = '<option value="">? Date</option>';
    var sortedBlocks = Array.from(document.querySelectorAll('.day-block'))
      .sort(function(a, b) {
        return (a.dataset.date || '') < (b.dataset.date || '') ? -1 : 1;
      });
    var upcomingDates = [];
    var pastDates = [];
    sortedBlocks.forEach(function(block) {
      var date = block.dataset.date;
      if (!date) return;
      if (date < todayStr) pastDates.push(date);
      else upcomingDates.push(date);
    });
    upcomingDates.forEach(function(date) {
      var option = document.createElement('option');
      option.value = date;
      option.textContent = formatJumpLabel(date);
      dateJump.appendChild(option);
    });
    if (pastDates.length) {
      var divider = document.createElement('option');
      divider.value = '';
      divider.textContent = '──────── Past dates';
      divider.disabled = true;
      dateJump.appendChild(divider);
      pastDates.sort(function(a, b) { return a > b ? -1 : 1; }).forEach(function(date) {
        var option = document.createElement('option');
        option.value = date;
        option.textContent = formatJumpLabel(date);
        dateJump.appendChild(option);
      });
    }
    if (currentValue && dateJump.querySelector('option[value="' + currentValue + '"]')) {
      dateJump.value = currentValue;
    } else {
      var defaultDate = upcomingDates[0] || pastDates[0];
      if (defaultDate && dateJump.querySelector('option[value="' + defaultDate + '"]')) {
        dateJump.value = defaultDate;
      }
    }
  }

  async function renderApprovedSubmissions() {
    var supabaseTools = window.CJFSupabase;
    if (!supabaseTools) return;
    var client = supabaseTools.getClient();
    if (!client) return;

    var result = await client
      .from(supabaseTools.getSubmissionsTable())
      .select('id,event_title,venue_name,venue_address,map_link,venue_is_custom,event_date,start_hour,start_minute,start_ampm,doors_enabled,doors_hour,doors_minute,doors_ampm,price_amount,price_display,event_link,description,notes,status,source,updated_at,reviewed_at')
      .order('event_date', { ascending: true });

    if (result.error || !Array.isArray(result.data)) {
      console.warn('Could not load approved submissions for jazztest', result.error || result);
      return;
    }

    var intakeSources = { mixed_intake_test: true, mixed_intake_test_mock: true };
    var latestIntakeByKey = {};
    var latestStaticManagedByTitleKey = {};
    var latestManagedOverrideByTitleKey = {};
    var rowsToRender = [];
    var fallbackStaticRows = [];
    var rowsToSuppress = [];

    result.data.forEach(function(row) {
      if (row.source === 'jazztest_static') {
        var staticRow = normalizeDisplayRow(row);
        var staticTitleKey = buildRowTitleKey(staticRow);
        var currentStatic = latestStaticManagedByTitleKey[staticTitleKey];
        var rowStaticStamp = getManagedRowStamp(staticRow);
        var currentStaticStamp = currentStatic ? getManagedRowStamp(currentStatic) : '';
        if (!currentStatic || rowStaticStamp > currentStaticStamp) {
          latestStaticManagedByTitleKey[staticTitleKey] = staticRow;
        }
        return;
      }

      var source = String(row.source || '').trim();
      var isIntake = intakeSources[source];
      if (!isIntake && source && source !== 'public_form') {
        var overrideTitleKey = buildRowTitleKey(row);
        var currentOverride = latestManagedOverrideByTitleKey[overrideTitleKey];
        var rowOverrideStamp = getManagedRowStamp(row);
        var currentOverrideStamp = currentOverride ? getManagedRowStamp(currentOverride) : '';
        if (!currentOverride || rowOverrideStamp > currentOverrideStamp) {
          latestManagedOverrideByTitleKey[overrideTitleKey] = row;
        }
        return;
      }

      if (!isIntake) {
        if (isPublicCalendarStatus(row)) {
          rowsToRender.push(row);
        }
        return;
      }
      var key = [row.event_title || '', row.venue_name || '', row.event_date || ''].join('||');
      var current = latestIntakeByKey[key];
      var rowStamp = getManagedRowStamp(row);
      var currentStamp = current ? getManagedRowStamp(current) : '';
      var preferRow = !current ||
        rowStamp > currentStamp ||
        (rowStamp === currentStamp && row.source === 'mixed_intake_test_mock' && current.source !== 'mixed_intake_test_mock');
      if (preferRow) {
        latestIntakeByKey[key] = row;
      }
    });

    Object.keys(latestIntakeByKey).forEach(function(key) {
      var row = latestIntakeByKey[key];
      if (isPublicCalendarStatus(row)) {
        rowsToRender.push(row);
      }
    });

    Object.keys(latestManagedOverrideByTitleKey).forEach(function(key) {
      var row = latestManagedOverrideByTitleKey[key];
      if (isPublicCalendarStatus(row)) {
        rowsToRender.push(row);
      } else {
        rowsToSuppress.push(row);
      }
    });

    document.querySelectorAll('.event[data-dynamic-approved="true"]').forEach(function(node) {
      node.remove();
    });
    restoreStaticEventEntries();

    Object.keys(latestStaticManagedByTitleKey).forEach(function(key) {
      var row = latestStaticManagedByTitleKey[key];
      var entry = findAvailableStaticEntryForRow(row);
      if (!entry) {
        if (isPublicCalendarStatus(row)) {
          fallbackStaticRows.push(row);
        } else {
          console.warn('Could not match jazztest_static row to a hardcoded slot', row);
        }
        return;
      }
      if (isPublicCalendarStatus(row)) {
        applyRowToStaticEvent(entry, row);
      } else {
        entry.node.dataset.supabaseSuppressed = 'true';
      }
    });

    rowsToSuppress.forEach(function(row) {
      var entry = findAvailableStaticEntryForRow(row);
      if (!entry) return;
      entry.node.dataset.supabaseSuppressed = 'true';
    });

    fallbackStaticRows.forEach(function(row) {
      rowsToRender.push(row);
    });

    rowsToRender.forEach(function(row) {
      if (!row || !row.event_date) return;
      if (document.querySelector('.event[data-submission-id="' + row.id + '"]')) return;
      var matchedEntry = findAvailableStaticEntryForRow(row);
      if (matchedEntry) {
        applyRowToStaticEvent(matchedEntry, row);
        return;
      }
      var block = ensureDayBlock(row.event_date);
      var eventNode = buildApprovedEventNode(row);
      insertEventSorted(block, eventNode, row);
    });

    refreshDateJump();
    if (typeof window.refreshVenueFilters === 'function') {
      window.refreshVenueFilters(true);
    }
    if (typeof window.applyJazzFilters === 'function') {
      window.applyJazzFilters();
    }
  }

  renderApprovedSubmissions();
})();
