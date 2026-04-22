const { parseHtml } = require('../src/htmlParser');

describe('parseHtml – basic extraction', () => {
  test('extracts page name from <title>', () => {
    const html = '<html><head><title>Login Page</title></head><body></body></html>';
    const result = parseHtml(html);
    expect(result.pageName).toBe('Login Page');
  });

  test('falls back to <h1> when there is no <title>', () => {
    const html = '<html><body><h1>Dashboard</h1></body></html>';
    const result = parseHtml(html);
    expect(result.pageName).toBe('Dashboard');
  });

  test('returns "Unnamed Page" when neither <title> nor <h1> is present', () => {
    const html = '<html><body></body></html>';
    const result = parseHtml(html);
    expect(result.pageName).toBe('Unnamed Page');
  });
});

describe('parseHtml – fields', () => {
  test('extracts text and password inputs with required flag', () => {
    const html = `
      <html><body>
        <form>
          <label for="u">Username</label>
          <input id="u" type="text" required />
          <label for="p">Password</label>
          <input id="p" type="password" required />
        </form>
      </body></html>`;
    const { fields } = parseHtml(html);
    expect(fields).toHaveLength(2);
    expect(fields[0]).toMatchObject({ name: 'Username', type: 'text', required: true });
    expect(fields[1]).toMatchObject({ name: 'Password', type: 'password', required: true });
  });

  test('uses placeholder as label when no <label> is present', () => {
    const html = `<html><body><input type="email" placeholder="Email Address" /></body></html>`;
    const { fields } = parseHtml(html);
    expect(fields[0].name).toBe('Email Address');
    expect(fields[0].type).toBe('email');
  });

  test('uses name attribute as label fallback', () => {
    const html = `<html><body><input type="text" name="search_query" /></body></html>`;
    const { fields } = parseHtml(html);
    expect(fields[0].name).toBe('search_query');
  });

  test('does NOT set required when attribute is absent', () => {
    const html = `<html><body><input type="text" name="opt" /></body></html>`;
    const { fields } = parseHtml(html);
    expect(fields[0].required).toBeUndefined();
  });

  test('extracts <select> fields', () => {
    const html = `<html><body><select name="country" required><option>US</option></select></body></html>`;
    const { fields } = parseHtml(html);
    expect(fields).toHaveLength(1);
    expect(fields[0]).toMatchObject({ name: 'country', type: 'select', required: true });
  });

  test('extracts <textarea> fields', () => {
    const html = `<html><body><textarea name="comments"></textarea></body></html>`;
    const { fields } = parseHtml(html);
    expect(fields).toHaveLength(1);
    expect(fields[0]).toMatchObject({ name: 'comments', type: 'textarea' });
  });

  test('ignores inputs without a discernible label', () => {
    const html = `<html><body><input type="text" /></body></html>`;
    const { fields } = parseHtml(html);
    expect(fields).toHaveLength(0);
  });
});

describe('parseHtml – buttons', () => {
  test('extracts <button> elements', () => {
    const html = `<html><body><button type="submit">Login</button></body></html>`;
    const { buttons } = parseHtml(html);
    expect(buttons).toHaveLength(1);
    expect(buttons[0]).toMatchObject({ name: 'Login', type: 'submit' });
  });

  test('extracts <input type="submit"> as button', () => {
    const html = `<html><body><input type="submit" value="Register" /></body></html>`;
    const { buttons } = parseHtml(html);
    expect(buttons).toHaveLength(1);
    expect(buttons[0]).toMatchObject({ name: 'Register', type: 'submit' });
  });

  test('defaults button type to submit when not specified', () => {
    const html = `<html><body><button>Send</button></body></html>`;
    const { buttons } = parseHtml(html);
    expect(buttons[0].type).toBe('submit');
  });
});

describe('parseHtml – links', () => {
  test('extracts anchor links with text', () => {
    const html = `<html><body><a href="/forgot">Forgot Password</a></body></html>`;
    const { links } = parseHtml(html);
    expect(links).toHaveLength(1);
    expect(links[0]).toMatchObject({ name: 'Forgot Password', href: '/forgot' });
  });

  test('ignores anchors without a label', () => {
    const html = `<html><body><a href="/icon"><img src="x.png" /></a></body></html>`;
    const { links } = parseHtml(html);
    expect(links).toHaveLength(0);
  });
});

describe('parseHtml – full login page', () => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head><title>Login Page</title></head>
    <body>
      <h1>Sign In</h1>
      <form>
        <label for="username">Username</label>
        <input id="username" type="text" required />

        <label for="password">Password</label>
        <input id="password" type="password" required />

        <button type="submit">Login</button>
      </form>
      <a href="/forgot">Forgot Password</a>
    </body>
    </html>`;

  test('returns expected structured JSON', () => {
    const result = parseHtml(html);
    expect(result).toMatchObject({
      pageName: 'Login Page',
      fields: [
        { name: 'Username', type: 'text', required: true },
        { name: 'Password', type: 'password', required: true },
      ],
      buttons: [{ name: 'Login', type: 'submit' }],
      links: [{ name: 'Forgot Password', href: '/forgot' }],
    });
  });
});
