// TagSummary: dạng tag nhúng trong Article response (không có created_at)
export interface TagSummary {
  id: number;
  name: string;
  slug: string;
}

// Tag: dạng đầy đủ từ GET /api/tags
export interface Tag extends TagSummary {
  created_at: string;
}

// ArticleListItem: shape từ GET /api/articles — không có content/content_html để giảm payload
export interface ArticleListItem {
  id: number;
  title: string;
  slug: string;
  published_at: string | null;
  tags: TagSummary[];
}

// Article: shape từ GET /api/articles/:slug — đầy đủ, bao gồm content_html đã sanitize
export interface Article {
  id: number;
  title: string;
  slug: string;
  content: string;
  // content_html: backend render Markdown → HTML, đã qua DOMPurify.sanitize() → an toàn dùng dangerouslySetInnerHTML
  content_html: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  tags: TagSummary[];
}

// Paginated<T>: wrapper phân trang cho list/search
export interface Paginated<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    query?: string; // chỉ có ở kết quả search
  };
}
