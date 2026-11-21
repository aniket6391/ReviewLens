import {
  AiAnalysisResult,
  ALLOWED_SENTIMENTS,
  ALLOWED_TOPICS,
  SentimentType,
  TopicType,
} from './types';

export interface ValidationOutcome {
  isValid: boolean;
  errors: string[];
  validated?: AiAnalysisResult;
}

/**
 * Validates raw AI JSON output against the required schema.
 * Rejects invalid fields or out-of-bounds enum values.
 */
export function validateAnalysis(raw: any): ValidationOutcome {
  const errors: string[] = [];

  if (!raw || typeof raw !== 'object') {
    return { isValid: false, errors: ['Output is not a valid JSON object'] };
  }

  // 1. Validate sentiment
  let sentiment: SentimentType | undefined = undefined;
  if (typeof raw.sentiment === 'string') {
    const s = raw.sentiment.trim().toLowerCase() as SentimentType;
    if (ALLOWED_SENTIMENTS.includes(s)) {
      sentiment = s;
    } else {
      errors.push(`Invalid sentiment '${raw.sentiment}'. Allowed: ${ALLOWED_SENTIMENTS.join(', ')}`);
    }
  } else {
    errors.push('Missing or non-string sentiment field');
  }

  // 2. Validate topics
  const topics: TopicType[] = [];
  if (Array.isArray(raw.topics)) {
    for (const t of raw.topics) {
      if (typeof t === 'string') {
        const normalized = t.trim().toLowerCase() as TopicType;
        if (ALLOWED_TOPICS.includes(normalized)) {
          if (!topics.includes(normalized)) {
            topics.push(normalized);
          }
        } else {
          errors.push(`Invalid topic '${t}'. Allowed: ${ALLOWED_TOPICS.join(', ')}`);
        }
      }
    }
    if (topics.length === 0) {
      errors.push('Topics array must contain at least one valid topic from allowed list');
    }
  } else {
    errors.push('Missing or non-array topics field');
  }

  // 3. Validate summary
  let summary = '';
  if (typeof raw.summary === 'string' && raw.summary.trim().length > 0) {
    summary = raw.summary.trim().replace(/\r?\n|\r/g, ' ');
  } else {
    errors.push('Summary must be a non-empty string in English');
  }

  // 4. Validate needs_reply
  let needsReply: boolean | undefined = undefined;
  if (typeof raw.needs_reply === 'boolean') {
    needsReply = raw.needs_reply;
  } else if (raw.needs_reply === 'true' || raw.needs_reply === 'false') {
    // Gracefully handle string booleans if model outputs string
    needsReply = raw.needs_reply === 'true';
  } else {
    errors.push("needs_reply must be a boolean ('true' or 'false')");
  }

  if (errors.length > 0 || !sentiment || topics.length === 0 || needsReply === undefined) {
    return {
      isValid: false,
      errors,
    };
  }

  return {
    isValid: true,
    errors: [],
    validated: {
      sentiment,
      topics,
      summary,
      needs_reply: needsReply,
    },
  };
}
