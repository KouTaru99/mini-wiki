import { describe, expect, it } from 'vitest';
import { toSlug } from './slug.js';

describe('toSlug — chuyển văn bản sang slug URL-safe', () => {
  it('bỏ dấu tiếng Việt, viết thường, nối bằng dấu gạch ngang', () => {
    expect(toSlug('Học Git Cơ Bản')).toBe('hoc-git-co-ban');
  });

  it('loại bỏ ký tự đặc biệt (!, ?, @, #...)', () => {
    expect(toSlug('Hello! World?')).toBe('hello-world');
  });

  it('thu gọn nhiều khoảng trắng liên tiếp thành một dấu gạch ngang', () => {
    expect(toSlug('Khoảng   trắng   nhiều')).toBe('khoang-trang-nhieu');
  });
});
