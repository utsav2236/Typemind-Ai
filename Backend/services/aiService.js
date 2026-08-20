// services/aiService.js
// Provider-agnostic AI service for TypeMind AI.
//
// Uses the OpenAI-compatible API interface, which works with:
//   - OpenAI (default)
//   - Google Gemini via AI_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai/
//   - Any other OpenAI-spec provider
//
// All AI calls:
//   1. Are protected by try/catch — failures never crash the server
//   2. Validate the response structure before returning
//   3. Never expose API keys in logs or responses

import OpenAI from 'openai';
import { env } from '../config/env.js';
import { AI } from '../utils/constants.js';

// ─────────────────────────────────────────────────────────────────────────────
// CLIENT INITIALIZATION
// ─────────────────────────────────────────────────────────────────────────────

let openaiClient = null;

const getClient = () => {
  if (!openaiClient) {
    if (!env.aiApiKey) {
      throw new Error('AI_API_KEY is not configured. Add it to your .env file.');
    }
    openaiClient = new OpenAI({
      apiKey: env.aiApiKey,
      ...(env.aiBaseUrl ? { baseURL: env.aiBaseUrl } : {}),
      timeout: AI.TIMEOUT_MS,
    });
  }
  return openaiClient;
};

// ─────────────────────────────────────────────────────────────────────────────
// SESSION ANALYSIS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate an AI analysis of a completed typing session.
 *
 * @param {{
 *   wpm: number,
 *   rawWpm: number,
 *   accuracy: number,
 *   consistency: number,
 *   typingIQ: number,
 *   weakKeys: Array,
 *   weakWords: Array,
 *   weakFingers: Array,
 *   errors: number,
 *   averageResponseTime: number,
 *   mode: string,
 *   difficulty: string,
 * }} sessionData
 * @param {{
 *   previousWpm: number,
 *   previousAccuracy: number,
 *   totalSessions: number,
 * }} userHistory
 * @returns {Promise<{summary, strengths, weaknesses, recommendations, focusKeys, focusWords, focusFingers}>}
 */
export const analyzeTypingSession = async (sessionData, userHistory = {}) => {
  const client = getClient();

  const prompt = buildAnalysisPrompt(sessionData, userHistory);

  // Truncate prompt if too long
  const safePrompt = prompt.slice(0, AI.MAX_PROMPT_CHARS);

  const response = await client.chat.completions.create({
    model: env.aiModel,
    messages: [
      {
        role: 'system',
        content:
          'You are TypeMind AI, an expert typing performance analyst. Analyze typing data and return structured JSON feedback. Be specific, encouraging, and actionable. Return ONLY valid JSON.',
      },
      { role: 'user', content: safePrompt },
    ],
    max_tokens: AI.MAX_TOKENS_ANALYSIS,
    temperature: 0.7,
    response_format: { type: 'json_object' },
  });

  const raw = response.choices?.[0]?.message?.content ?? '{}';
  return parseAndValidateAnalysis(raw);
};

/**
 * Build the analysis prompt from session data.
 */
const buildAnalysisPrompt = (session, history) => {
  const weakKeyList    = session.weakKeys?.slice(0, 5).map((k) => `${k.key} (${k.accuracy}% accuracy)`).join(', ') || 'none';
  const weakWordList   = session.weakWords?.slice(0, 5).map((w) => w.word).join(', ')    || 'none';
  const weakFingerList = session.weakFingers?.slice(0, 3).map((f) => f.finger).join(', ') || 'none';

  return `Analyze this typing test result and return JSON feedback.

Session Data:
- WPM: ${session.wpm} (raw: ${session.rawWpm})
- Accuracy: ${session.accuracy}%
- Consistency: ${session.consistency}%
- Typing IQ: ${session.typingIQ}
- Errors: ${session.errors}
- Average response time: ${session.averageResponseTime}ms
- Mode: ${session.mode}
- Difficulty: ${session.difficulty}
- Weak keys: ${weakKeyList}
- Weak words: ${weakWordList}
- Weak fingers: ${weakFingerList}

User History:
- Previous average WPM: ${history.previousWpm || 'N/A'}
- Previous accuracy: ${history.previousAccuracy || 'N/A'}%
- Total sessions: ${history.totalSessions || 0}

Return this EXACT JSON structure (no markdown, no explanation):
{
  "summary": "2-3 sentence summary of performance",
  "strengths": ["strength 1", "strength 2"],
  "weaknesses": ["weakness 1", "weakness 2"],
  "recommendations": ["action 1", "action 2", "action 3"],
  "focusKeys": ["key1", "key2"],
  "focusWords": ["word1", "word2"],
  "focusFingers": ["finger1"]
}`;
};

/**
 * Parse and validate AI analysis response.
 * Returns a safe default object if AI response is invalid.
 */
const parseAndValidateAnalysis = (rawJson) => {
  const DEFAULT = {
    summary:         'Analysis completed.',
    strengths:       [],
    weaknesses:      [],
    recommendations: [],
    focusKeys:       [],
    focusWords:      [],
    focusFingers:    [],
  };

  let parsed;
  try {
    parsed = typeof rawJson === 'string' ? JSON.parse(rawJson) : rawJson;
  } catch {
    console.warn('[AI] Failed to parse analysis JSON — using default.');
    return DEFAULT;
  }

  // Validate and sanitize each field
  return {
    summary:         typeof parsed.summary === 'string'         ? parsed.summary.slice(0, 1000) : DEFAULT.summary,
    strengths:       Array.isArray(parsed.strengths)            ? parsed.strengths.slice(0, 5).map(String)       : [],
    weaknesses:      Array.isArray(parsed.weaknesses)           ? parsed.weaknesses.slice(0, 5).map(String)      : [],
    recommendations: Array.isArray(parsed.recommendations)      ? parsed.recommendations.slice(0, 5).map(String) : [],
    focusKeys:       Array.isArray(parsed.focusKeys)            ? parsed.focusKeys.slice(0, 10).map(String)      : [],
    focusWords:      Array.isArray(parsed.focusWords)           ? parsed.focusWords.slice(0, 10).map(String)     : [],
    focusFingers:    Array.isArray(parsed.focusFingers)         ? parsed.focusFingers.slice(0, 5).map(String)    : [],
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// PRACTICE TEXT GENERATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate a personalized typing practice paragraph.
 *
 * @param {string} prompt - The adaptive practice prompt from adaptivePracticeService
 * @returns {Promise<string>} Practice text
 */
export const generatePracticeText = async (prompt) => {
  const client = getClient();

  const safePrompt = prompt.slice(0, AI.MAX_PROMPT_CHARS);

  const response = await client.chat.completions.create({
    model: env.aiModel,
    messages: [{ role: 'user', content: safePrompt }],
    max_tokens: AI.MAX_TOKENS_PRACTICE,
    temperature: 0.85, // Slightly higher temperature for creative variation
  });

  const text = response.choices?.[0]?.message?.content?.trim() ?? '';

  if (!text || text.length < 20) {
    throw new Error('AI returned insufficient practice text.');
  }

  // Strip any accidental markdown formatting
  return text.replace(/^["']|["']$/g, '').trim();
};

// ─────────────────────────────────────────────────────────────────────────────
// RECOMMENDATION GENERATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate a single personalized recommendation string.
 * Used for quick feedback without a full session analysis.
 *
 * @param {{ wpm: number, accuracy: number, weakKeys: string[] }} data
 * @returns {Promise<string>}
 */
export const generateRecommendation = async (data) => {
  const client = getClient();

  const prompt = `You are a typing coach. Given this data:
- WPM: ${data.wpm}
- Accuracy: ${data.accuracy}%
- Weak keys: ${data.weakKeys?.join(', ') || 'none'}

Write ONE concise, specific, encouraging recommendation (max 100 words).`;

  const response = await client.chat.completions.create({
    model: env.aiModel,
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 150,
    temperature: 0.7,
  });

  return response.choices?.[0]?.message?.content?.trim() ?? 'Keep practicing consistently!';
};
