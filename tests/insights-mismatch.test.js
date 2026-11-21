const test = require('node:test');
const assert = require('node:assert/strict');

function checkRatingMismatch(review) {
  if (review.rating === null || !review.sentiment) {
    return { isMismatch: false };
  }
  if (review.rating >= 4 && review.sentiment === 'negative') {
    return {
      isMismatch: true,
      reason: `High rating (${review.rating}★) contradicts Negative sentiment`,
    };
  }
  if (review.rating <= 2 && review.sentiment === 'positive') {
    return {
      isMismatch: true,
      reason: `Low rating (${review.rating}★) contradicts Positive sentiment`,
    };
  }
  return { isMismatch: false };
}

test('Rating Mismatch Detection flags R008 (5 stars with negative text)', () => {
  const r008 = {
    review_id: 'R008',
    rating: 5,
    sentiment: 'negative',
    summary: 'Both handles came off within a week. Never buying again.',
  };

  const check = checkRatingMismatch(r008);
  assert.equal(check.isMismatch, true);
  assert.ok(check.reason.includes('High rating (5★) contradicts Negative sentiment'));
});

test('Rating Mismatch does not flag aligned ratings', () => {
  const r001 = {
    review_id: 'R001',
    rating: 5,
    sentiment: 'positive',
    summary: 'Super soft fabric.',
  };

  const check = checkRatingMismatch(r001);
  assert.equal(check.isMismatch, false);
});
