import assert from 'node:assert/strict';
import test from 'node:test';
import { articles } from '../journal-content.js';

test('journal reading times reflect substantial article text', () => {
  assert.equal(articles.length, 3);
  for (const article of articles) {
    assert.ok(article.wordCount >= 500, `${article.id} is too short for an editorial article`);
    assert.equal(Number.parseInt(article.time, 10), Math.ceil(article.wordCount / 160));
    assert.ok(article.sections.length >= 4);
  }
});

test('article prose has sentence punctuation and source links', () => {
  for (const article of articles) {
    const paragraphs = [article.intro, ...article.sections.flatMap(section => section.paragraphs)];
    for (const paragraph of paragraphs) {
      assert.match(paragraph, /[.!?]$/u, `${article.id} has a paragraph without a closing mark`);
      assert.match(paragraph, /[.!?]\s+\p{Lu}/u, `${article.id} has no sentence break in a paragraph`);
    }
    assert.ok(article.sources.length >= 2);
    for (const source of article.sources) assert.equal(new URL(source.url).protocol, 'https:');
  }
});
