import { describe, expect, it } from 'vitest';
import { renderMarkdown } from './markdown.js';

describe('renderMarkdown — Markdown → HTML an toàn', () => {
  it('chuyển ## tiêu đề thành thẻ <h2>', async () => {
    const html = await renderMarkdown('## Tiêu đề');
    expect(html).toContain('<h2>');
  });

  it('chuyển **đậm** thành thẻ <strong>', async () => {
    const html = await renderMarkdown('**đậm**');
    expect(html).toContain('<strong>');
  });

  it('XSS: DOMPurify loại bỏ thẻ <script>', async () => {
    const html = await renderMarkdown('<script>alert(1)</script>');
    expect(html).not.toContain('<script>');
  });

  it('XSS: DOMPurify loại bỏ thuộc tính onerror trong <img>', async () => {
    const html = await renderMarkdown('<img src=x onerror=alert(1)>');
    expect(html).not.toContain('onerror');
  });
});
