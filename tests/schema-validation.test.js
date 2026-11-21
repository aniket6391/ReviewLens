const test = require('node:test');
const assert = require('node:assert/strict');

const ALLOWED_SENTIMENTS = ['positive', 'neutral', 'negative'];
const ALLOWED_TOPICS = [
  'quality',
  'delivery',
  'price',
  'packaging',
  'support',
  'size_fit',
  'other',
];

function validateAnalysis(raw) {
  const errors = [];
  if (!raw || typeof raw !== 'object') {
    return { isValid: false, errors: ['Output is not a valid JSON object'] };
  }

  let sentiment = undefined;
  if (typeof raw.sentiment === 'string') {
    const s = raw.sentiment.trim().toLowerCase();
    if (ALLOWED_SENTIMENTS.includes(s)) {
      sentiment = s;
    } else {
      errors.push(`Invalid sentiment '${raw.sentiment}'`);
    }
  } else {
    errors.push('Missing or non-string sentiment field');
  }

  const topics = [];
  if (Array.isArray(raw.topics)) {
    for (const t of raw.topics) {
      if (typeof t === 'string') {
        const normalized = t.trim().toLowerCase();
        if (ALLOWED_TOPICS.includes(normalized)) {
          if (!topics.includes(normalized)) topics.push(normalized);
        } else {
          errors.push(`Invalid topic '${t}'`);
        }
      }
    }
    if (topics.length === 0) {
      errors.push('Topics array must contain at least one valid topic');
    }
  } else {
    errors.push('Missing or non-array topics field');
  }

  let summary = '';
  if (typeof raw.summary === 'string' && raw.summary.trim().length > 0) {
    summary = raw.summary.trim().replace(/\r?\n|\r/g, ' ');
  } else {
    errors.push('Summary must be a non-empty string in English');
  }

  let needsReply = undefined;
  if (typeof raw.needs_reply === 'boolean') {
    needsReply = raw.needs_reply;
  } else if (raw.needs_reply === 'true' || raw.needs_reply === 'false') {
    needsReply = raw.needs_reply === 'true';
  } else {
    errors.push("needs_reply must be a boolean ('true' or 'false')");
  }

  if (errors.length > 0 || !sentiment || topics.length === 0 || needsReply === undefined) {
    return { isValid: false, errors };
  }

  return {
    isValid: true,
    errors: [],
    validated: { sentiment, topics, summary, needs_reply: needsReply },
  };
}

test('Schema Validator accepts strictly valid AI outputs', () => {
  const valid = {
    sentiment: 'positive',
    topics: ['quality', 'delivery'],
    summary: 'Great product with fast shipping.',
    needs_reply: false,
  };
  const result = validateAnalysis(valid);
  assert.equal(result.isValid, true);
  assert.equal(result.validated.sentiment, 'positive');
  assert.deepEqual(result.validated.topics, ['quality', 'delivery']);
  assert.equal(result.validated.needs_reply, false);
});

test('Schema Validator rejects invalid sentiment values', () => {
  const invalid = {
    sentiment: 'very_good',
    topics: ['quality'],
    summary: 'Decent product',
    needs_reply: false,
  };
  const result = validateAnalysis(invalid);
  assert.equal(result.isValid, false);
  assert.ok(result.errors.some((e) => e.includes('Invalid sentiment')));
});

test('Schema Validator rejects unknown topics', () => {
  const invalid = {
    sentiment: 'negative',
    topics: ['unknown_topic', 'sound_quality'],
    summary: 'Broken earbud',
    needs_reply: true,
  };
  const result = validateAnalysis(invalid);
  assert.equal(result.isValid, false);
  assert.ok(result.errors.some((e) => e.includes('Invalid topic')));
});

test('Schema Validator handles boolean coercion gracefully', () => {
  const validWithStringBool = {
    sentiment: 'negative',
    topics: ['support'],
    summary: 'Slow support response',
    needs_reply: 'true',
  };
  const result = validateAnalysis(validWithStringBool);
  assert.equal(result.isValid, true);
  assert.equal(result.validated.needs_reply, true);
});
