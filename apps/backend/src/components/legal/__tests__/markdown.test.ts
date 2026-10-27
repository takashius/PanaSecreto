import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseMarkdownSections } from '../markdown';

describe('parseMarkdownSections', () => {
  it('split headings into sections', () => {
    const md = `# Title

Intro line

## One
Body one

## Two
Body two`;
    const sections = parseMarkdownSections(md);
    assert.equal(sections.length, 3);
    assert.equal(sections[1].title, 'One');
    assert.match(sections[1].body, /Body one/);
  });
});
