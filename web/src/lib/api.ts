import type { Article, ArticleListItem, Paginated, Tag } from '../types';

// Đọc base URL từ biến môi trường Vite (khai báo trong .env hoặc .env.local)
const BASE_URL = import.meta.env.VITE_API_URL as string;

// Hàm fetch có kiểu — ném Error với message từ { error: { code, message } } nếu !res.ok
async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`);
  if (!res.ok) {
    const body = await res.json().catch(() => null) as { error?: { message?: string } } | null;
    const msg = body?.error?.message ?? `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return res.json() as Promise<T>;
}

// Shape input cho tạo/sửa bài viết
export interface ArticleInput {
  title: string;
  content: string;
  published_at: string | null;
  tagIds: number[];
}

// Hàm gửi POST/PUT/DELETE — xử lý 204 No Content (trả undefined)
async function apiSend<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (res.status === 204) return undefined as T;
  if (!res.ok) {
    const b = await res.json().catch(() => null) as { error?: { message?: string } } | null;
    throw new Error(b?.error?.message ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// GET /api/articles?tag=&page=
export function listArticles(params?: { tag?: string; page?: number }): Promise<Paginated<ArticleListItem>> {
  const qs = new URLSearchParams();
  if (params?.tag) qs.set('tag', params.tag);
  if (params?.page && params.page > 1) qs.set('page', String(params.page));
  const query = qs.toString();
  return apiGet<Paginated<ArticleListItem>>(`/articles${query ? `?${query}` : ''}`);
}

// GET /api/articles/:slug
export function getArticle(slug: string): Promise<Article> {
  return apiGet<Article>(`/articles/${encodeURIComponent(slug)}`);
}

// GET /api/tags
export function listTags(): Promise<Tag[]> {
  return apiGet<Tag[]>('/tags');
}

// GET /api/search?q=&page=
export function searchArticles(q: string, page?: number): Promise<Paginated<ArticleListItem>> {
  const qs = new URLSearchParams({ q });
  if (page && page > 1) qs.set('page', String(page));
  return apiGet<Paginated<ArticleListItem>>(`/search?${qs.toString()}`);
}

// POST /api/articles
export function createArticle(input: ArticleInput): Promise<Article> {
  return apiSend<Article>('POST', '/articles', input);
}

// PUT /api/articles/:slug
export function updateArticle(slug: string, input: Partial<ArticleInput>): Promise<Article> {
  return apiSend<Article>('PUT', `/articles/${encodeURIComponent(slug)}`, input);
}

// DELETE /api/articles/:slug — 204 No Content
export function deleteArticle(slug: string): Promise<void> {
  return apiSend<void>('DELETE', `/articles/${encodeURIComponent(slug)}`);
}
