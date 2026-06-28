import { useEffect, useState } from 'react';
import type { ArticleListItem, Paginated } from '../types';
import { listArticles } from '../lib/api';
import ArticleCard from '../components/ArticleCard';

export default function ArticleListPage() {
  const [state, setState] = useState<
    | { status: 'loading' }
    | { status: 'error'; message: string }
    | { status: 'ok'; result: Paginated<ArticleListItem> }
  >({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    listArticles()
      .then((result) => {
        if (!cancelled) setState({ status: 'ok', result });
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : 'Lỗi không xác định';
          setState({ status: 'error', message });
        }
      });
    return () => { cancelled = true; };
  }, []);

  if (state.status === 'loading') {
    return <p className="state-msg">Đang tải…</p>;
  }

  if (state.status === 'error') {
    return <p className="state-msg error">Lỗi khi tải danh sách: {state.message}</p>;
  }

  const { data: articles } = state.result;

  return (
    <div>
      <h1 className="page-title">Bài viết</h1>
      {articles.length === 0 ? (
        <p className="state-msg">Chưa có bài viết nào.</p>
      ) : (
        articles.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))
      )}
    </div>
  );
}
