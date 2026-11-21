const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const crypto = require('crypto');

function normalizeTextForHash(text) {
  if (!text) return '';
  const noHtml = text.replace(/<[^>]*>/g, '');
  return noHtml.trim().toLowerCase().replace(/\s+/g, ' ');
}

function hashReviewText(text) {
  const normalized = normalizeTextForHash(text);
  return crypto.createHash('sha256').update(normalized, 'utf8').digest('hex');
}

function parseRating(rawRating) {
  if (rawRating === undefined || rawRating === null) return null;
  const str = String(rawRating).trim();
  if (str === '') return null;
  const num = Number(str);
  if (!isNaN(num) && num >= 1 && num <= 5 && Number.isInteger(num)) {
    return num;
  }
  return null;
}

function findColumnKey(sampleRow, aliases) {
  const keys = Object.keys(sampleRow);
  for (const k of keys) {
    const normalizedKey = k.trim().toLowerCase().replace(/[\s_-]+/g, '');
    for (const alias of aliases) {
      const normalizedAlias = alias.toLowerCase().replace(/[\s_-]+/g, '');
      if (normalizedKey === normalizedAlias) {
        return k;
      }
    }
  }
  return null;
}

function parseAndCleanCsv(csvContent) {
  const sanitizedContent = csvContent.replace(/^\uFEFF/, '').trim();
  const records = parse(sanitizedContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true,
  });

  if (records.length === 0) return [];

  const firstRow = records[0];
  const detectedColumns = Object.keys(firstRow);

  const reviewTextKey = findColumnKey(firstRow, [
    'review_text',
    'review text',
    'reviewtext',
    'review',
    'reviews',
    'text',
    'comment',
    'comments',
    'feedback',
    'body',
    'content',
  ]);

  if (!reviewTextKey) {
    throw new Error(
      `No customer review text column found in CSV. Detected columns: [${detectedColumns.join(
        ', '
      )}]. Please upload a customer reviews CSV.`
    );
  }

  const productKey = findColumnKey(firstRow, ['product', 'item', 'title']);
  const ratingKey = findColumnKey(firstRow, ['rating', 'score', 'stars']);
  const reviewIdKey = findColumnKey(firstRow, ['review_id', 'id']);
  const dateKey = findColumnKey(firstRow, ['date']);

  const cleanedReviews = [];
  const seenHashes = new Map();

  for (let i = 0; i < records.length; i++) {
    const row = records[i];
    const reviewId = String((reviewIdKey && row[reviewIdKey]) || `ROW_${i + 1}`).trim();
    const product = String((productKey && row[productKey]) || 'Unknown Product').trim();
    const rawRatingStr = ratingKey && row[ratingKey] !== undefined ? String(row[ratingKey]).trim() : '';
    const rating = parseRating(rawRatingStr);
    const date = String((dateKey && row[dateKey]) || '2026-10-01').trim();
    const rawReviewText = reviewTextKey && row[reviewTextKey] !== undefined ? String(row[reviewTextKey]) : '';
    const trimmedText = rawReviewText.trim();
    const isEmpty = trimmedText.length === 0;
    const textHash = hashReviewText(trimmedText);

    let isDuplicate = false;
    let duplicateOf = null;

    if (!isEmpty) {
      if (seenHashes.has(textHash)) {
        isDuplicate = true;
        duplicateOf = seenHashes.get(textHash);
      } else {
        seenHashes.set(textHash, reviewId);
      }
    }

    cleanedReviews.push({
      review_id: reviewId,
      product,
      rating,
      rating_raw: rawRatingStr,
      date,
      review_text: rawReviewText,
      cleaned_text: trimmedText,
      text_hash: textHash,
      is_empty: isEmpty,
      is_duplicate: isDuplicate,
      duplicate_of: duplicateOf,
      status: isEmpty ? 'empty_skipped' : isDuplicate ? 'duplicate' : 'valid',
    });
  }

  return cleanedReviews;
}

test('CSV Cleaner properly parses reviews.csv and handles all edge cases', () => {
  const csvPath = path.join(process.cwd(), 'reviews.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const cleaned = parseAndCleanCsv(csvContent);

  // 1. Total parsed rows
  assert.equal(cleaned.length, 30, 'Should parse all 30 rows including multi-line fields');

  // 2. Empty review handling (R005)
  const r005 = cleaned.find((r) => r.review_id === 'R005');
  assert.ok(r005, 'R005 must exist');
  assert.equal(r005.is_empty, true, 'R005 should be marked is_empty: true');
  assert.equal(r005.status, 'empty_skipped', 'R005 should have status empty_skipped');

  // 3. Missing rating handling (R010)
  const r010 = cleaned.find((r) => r.review_id === 'R010');
  assert.ok(r010, 'R010 must exist');
  assert.equal(r010.rating, null, 'R010 rating should be null (unknown)');
  assert.equal(r010.rating_raw, '', 'R010 rating_raw should preserve empty string');

  // 4. Invalid rating handling (R022 has "five")
  const r022 = cleaned.find((r) => r.review_id === 'R022');
  assert.ok(r022, 'R022 must exist');
  assert.equal(r022.rating, null, 'R022 rating should be null (unknown)');
  assert.equal(r022.rating_raw, 'five', 'R022 rating_raw should preserve original text "five"');

  // 5. Duplicate detection (R012 and R015 have identical text)
  const r012 = cleaned.find((r) => r.review_id === 'R012');
  const r015 = cleaned.find((r) => r.review_id === 'R015');
  assert.ok(r012 && r015, 'R012 and R015 must exist');
  assert.equal(r012.is_duplicate, false, 'First occurrence R012 should not be marked duplicate');
  assert.equal(r015.is_duplicate, true, 'Second occurrence R015 should be marked duplicate');
  assert.equal(r015.duplicate_of, 'R012', 'R015 should reference canonical review R012');
  assert.equal(r012.text_hash, r015.text_hash, 'Hashes must match');
});

test('CSV Cleaner throws helpful error when non-review CSV (like Student_Performance.csv) is uploaded', () => {
  const unrelatedCsv = `Hours_Studied,Previous_Scores,Extracurricular_Activities,Sleep_Hours,Sample_Question_Papers_Practiced,Performance_Index
7,99,Yes,9,1,91.0
4,82,No,4,2,65.0
8,51,Yes,7,2,45.0`;

  assert.throws(
    () => {
      parseAndCleanCsv(unrelatedCsv);
    },
    (err) => {
      return (
        err.message.includes('No customer review text column found in CSV') &&
        err.message.includes('Hours_Studied')
      );
    }
  );
});
