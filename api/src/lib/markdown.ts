import DOMPurify from 'isomorphic-dompurify';
import { marked } from 'marked';

// renderMarkdown: Markdown → HTML an toàn
// marked.parse chuyển Markdown → HTML thô; DOMPurify.sanitize loại bỏ các tag/attr nguy hiểm
// (script, onclick, onerror, iframe...) mà marked KHÔNG tự lọc — bỏ bước này → XSS injection.
export async function renderMarkdown(md: string): Promise<string> {
  const html = await marked.parse(md);
  return DOMPurify.sanitize(html);
}
