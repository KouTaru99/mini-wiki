import slugify from 'slugify';

// toSlug: chuyển văn bản (kể cả tiếng Việt) → slug URL-safe
// locale 'vi' → bỏ dấu đúng (ví dụ "học" → "hoc"), strict → xóa ký tự đặc biệt
export function toSlug(text: string): string {
  return slugify(text, { lower: true, locale: 'vi', strict: true });
}
