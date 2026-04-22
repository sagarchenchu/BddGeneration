const OpenAI = require('openai');

/**
 * Builds the system prompt for the BDD generator.
 */
function buildSystemPrompt() {
  return `You are a QA automation expert. Given a structured JSON description of a web page, generate comprehensive BDD (Behaviour-Driven Development) test scenarios in Gherkin syntax.

Rules:
- Write Feature, Background (if applicable), and multiple Scenario blocks.
- Cover happy paths, validation errors, and edge cases.
- Use Given / When / Then / And keywords correctly.
- Keep step descriptions concise but meaningful.
- Return ONLY the raw Gherkin text – no markdown fences, no extra commentary.`;
}

/**
 * Builds the user prompt from the parsed page JSON.
 * @param {object} pageJson
 */
function buildUserPrompt(pageJson) {
  return `Generate BDD scenarios for the following page:

${JSON.stringify(pageJson, null, 2)}`;
}

/**
 * Generates BDD scenarios using the OpenAI API.
 *
 * @param {object} pageJson   - Structured JSON produced by htmlParser.
 * @param {string} [apiKey]   - OpenAI API key (falls back to OPENAI_API_KEY env var).
 * @param {string} [model]    - OpenAI model name (defaults to gpt-4o-mini).
 * @returns {Promise<string>} - Gherkin BDD text.
 */
async function generateBdd(pageJson, apiKey, model = 'gpt-4o-mini') {
  const key = apiKey || process.env.OPENAI_API_KEY;
  if (!key) {
    throw new Error(
      'OpenAI API key is required. Set OPENAI_API_KEY environment variable or pass it explicitly.'
    );
  }

  const client = new OpenAI({ apiKey: key });

  const completion = await client.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: buildSystemPrompt() },
      { role: 'user', content: buildUserPrompt(pageJson) },
    ],
    temperature: 0.3,
  });

  return completion.choices[0].message.content.trim();
}

module.exports = { generateBdd };
