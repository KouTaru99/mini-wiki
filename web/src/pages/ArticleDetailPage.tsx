import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { Article } from '../types';
import { getArticle } from '../lib/api';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('vi-VN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function ArticleDetailPage() {
  const { slug } = useParams<{ slug: string }>();

  const [state, setState] = useState<
    | { status: 'loading' }
    | { status: 'notfound' }
    | { status: 'error'; message: string }
    | { status: 'ok'; article: Article }
  >({ status: 'loading' });

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    getArticle(slug)
      .then((article) => {
        if (!cancelled) setState({ status: 'ok', article });
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : 'Lỗi không xác định';
          // Backend trả "ARTICLE_NOT_FOUND" trong message khi 404
          if (message.includes('ARTICLE_NOT_FOUND') || message.includes('404')) {
            setState({ status: 'notfound' });
          } else {
            setState({ status: 'error', message });
          }
        }
      });
    return () => { cancelled = true; };
  }, [slug]);

  if (state.status === 'loading') {
    return <p className="state-msg">Đang tải…</p>;
  }

  if (state.status === 'notfound') {
    return (
      <div>
        <Link to="/" className="back-link">← Về danh sách</Link>
        <p className="state-msg">Không tìm thấy bài viết.</p>
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div>
        <Link to="/" className="back-link">← Về danh sách</Link>
        <p className="state-msg error">Lỗi khi tải bài viết: {state.message}</p>
      </div>
    );
  }

  const { article } = state;

  return (
    <article className="article-detail">
      <Link to="/" className="back-link">← Về danh sách</Link>

      <div className="article-header">
        <h1 className="article-title">{article.title}</h1>
        {article.published_at && (
          <div className="article-meta">Đăng ngày {formatDate(article.published_at)}</div>
        )}
        {article.tags.length > 0 && (
          <div className="tag-list">
            {article.tags.map((tag) => (
              <span key={tag.id} className="tag-chip">{tag.name}</span>
            ))}
          </div>
        )}
      </div>

      {/*
        content_html: backend đã render Markdown → HTML và sanitize bằng DOMPurify
        (isomorphic-dompurify) trước khi trả về — loại bỏ script/onerror/iframe...
        → an toàn dùng dangerouslySetInnerHTML mà không cần sanitize lại phía FE.
      */}
      <div
        className="article-content"
        dangerouslySetInnerHTML={{ __html: article.content_html }}
      />
    </article>
  );
}
