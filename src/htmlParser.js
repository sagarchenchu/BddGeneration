const cheerio = require('cheerio');

/**
 * Derives a human-readable label for a form field.
 * Priority: <label> text → placeholder → name attribute → id attribute.
 */
function resolveFieldLabel($, el) {
  const id = $(el).attr('id');
  if (id) {
    const labelText = $(`label[for="${id}"]`).first().text().trim();
    if (labelText) return labelText;
  }
  return (
    $(el).attr('placeholder') ||
    $(el).attr('name') ||
    $(el).attr('id') ||
    ''
  );
}

/**
 * Derives a human-readable label for a button element.
 */
function resolveButtonLabel($, el) {
  return (
    $(el).text().trim() ||
    $(el).attr('value') ||
    $(el).attr('name') ||
    $(el).attr('id') ||
    ''
  );
}

/**
 * Derives a human-readable label for an anchor element.
 * Only visible text or a title attribute are considered a valid label –
 * the href is deliberately excluded so icon-only links are skipped.
 */
function resolveLinkLabel($, el) {
  return $(el).text().trim() || $(el).attr('title') || '';
}

/**
 * Derives the page name from <title>, the first <h1>, or falls back to
 * the document <body>'s id/class before returning "Unnamed Page".
 */
function resolvePageName($) {
  const title = $('title').first().text().trim();
  if (title) return title;

  const h1 = $('h1').first().text().trim();
  if (h1) return h1;

  return 'Unnamed Page';
}

/**
 * Parses an HTML string and returns a structured JSON object describing
 * the page's interactive elements.
 *
 * @param {string} html - Raw HTML content.
 * @returns {{pageName: string, fields: Array, buttons: Array, links: Array}}
 */
function parseHtml(html) {
  const $ = cheerio.load(html);

  // ── Fields ──────────────────────────────────────────────────────────────
  const FIELD_INPUT_TYPES = new Set([
    'text', 'password', 'email', 'number', 'tel', 'url',
    'search', 'date', 'time', 'datetime-local', 'month', 'week',
    'color', 'range', 'file', 'hidden',
  ]);

  const BUTTON_INPUT_TYPES = new Set(['submit', 'button', 'reset', 'image']);

  const fields = [];
  const buttons = [];

  $('input').each((_, el) => {
    const type = ($(el).attr('type') || 'text').toLowerCase();

    if (BUTTON_INPUT_TYPES.has(type)) {
      const label = resolveButtonLabel($, el);
      if (label) {
        buttons.push({ name: label, type });
      }
      return;
    }

    if (FIELD_INPUT_TYPES.has(type)) {
      const name = resolveFieldLabel($, el);
      const required = $(el).attr('required') !== undefined;
      const field = { name, type };
      if (required) field.required = true;
      if (name) fields.push(field);
    }
  });

  // <select> and <textarea> are also form fields
  $('select').each((_, el) => {
    const name = resolveFieldLabel($, el);
    const required = $(el).attr('required') !== undefined;
    const field = { name, type: 'select' };
    if (required) field.required = true;
    if (name) fields.push(field);
  });

  $('textarea').each((_, el) => {
    const name = resolveFieldLabel($, el);
    const required = $(el).attr('required') !== undefined;
    const field = { name, type: 'textarea' };
    if (required) field.required = true;
    if (name) fields.push(field);
  });

  // ── Buttons ──────────────────────────────────────────────────────────────
  $('button').each((_, el) => {
    const label = resolveButtonLabel($, el);
    const type = ($(el).attr('type') || 'submit').toLowerCase();
    if (label) buttons.push({ name: label, type });
  });

  // ── Links ────────────────────────────────────────────────────────────────
  const links = [];
  $('a').each((_, el) => {
    const label = resolveLinkLabel($, el);
    const href = $(el).attr('href');
    if (label) {
      const link = { name: label };
      if (href) link.href = href;
      links.push(link);
    }
  });

  return {
    pageName: resolvePageName($),
    fields,
    buttons,
    links,
  };
}

module.exports = { parseHtml };
