const request = require('supertest');
const app = require('../server');
const path = require('path');
const fs = require('fs');

const LOGIN_HTML = `
<!DOCTYPE html>
<html>
<head><title>Login Page</title></head>
<body>
  <form>
    <label for="u">Username</label>
    <input id="u" type="text" required />
    <label for="p">Password</label>
    <input id="p" type="password" required />
    <button type="submit">Login</button>
  </form>
  <a href="/forgot">Forgot Password</a>
</body>
</html>`;

const SAMPLE_PATH = path.join(__dirname, '_sample_login.html');

beforeAll(() => fs.writeFileSync(SAMPLE_PATH, LOGIN_HTML, 'utf-8'));
afterAll(() => fs.unlinkSync(SAMPLE_PATH));

describe('POST /api/parse', () => {
  test('returns structured JSON for a valid HTML upload', async () => {
    const res = await request(app)
      .post('/api/parse')
      .attach('htmlFile', SAMPLE_PATH);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const { data } = res.body;
    expect(data.pageName).toBe('Login Page');
    expect(data.fields).toHaveLength(2);
    expect(data.buttons).toHaveLength(1);
    expect(data.links).toHaveLength(1);
  });

  test('returns 400 when no file is uploaded', async () => {
    const res = await request(app).post('/api/parse');
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  test('returns 400 for a non-HTML file', async () => {
    const tmpFile = path.join(__dirname, '_test.txt');
    fs.writeFileSync(tmpFile, 'hello', 'utf-8');
    try {
      const res = await request(app)
        .post('/api/parse')
        .attach('htmlFile', tmpFile);
      expect(res.status).toBe(400);
    } finally {
      fs.unlinkSync(tmpFile);
    }
  });
});

describe('POST /api/generate-bdd', () => {
  test('returns 401 when no API key is provided', async () => {
    const savedKey = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;
    try {
      const res = await request(app)
        .post('/api/generate-bdd')
        .attach('htmlFile', SAMPLE_PATH);
      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/API key/i);
    } finally {
      if (savedKey) process.env.OPENAI_API_KEY = savedKey;
    }
  });
});
