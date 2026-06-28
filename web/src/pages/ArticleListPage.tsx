import { useEffect, useState } from 'react';
import type { ArticleListItem, Paginated, Tag } from '../types';
import { listArticles, searchArticles, listTags } from '../lib/api';
import ArticleCard from '../components/ArticleCard';

type DataState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ok'; result: Paginated<ArticleListItem> };

export default function ArticleListPage() {
  const [query, setQuery] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [data, setData] = useState<DataState>({ status: 'loading' });

  // Tải danh sách tags cho dải chip lọc
  useEffect(() => {
    listTags().then(setTags).catch(() => {});
  }, []);

  // Fetch bài viết — debounce 300ms khi có từ khoá tìm kiếm
  useEffect(() => {
    let cancelled = false;
    const q = query.trim();

    const doFetch = () => {
      const promise = q
        ? searchArticles(q)
        : listArticles(activeTag ? { tag: activeTag } : undefined);
      promise
        .then((result) => { if (!cancelled) setData({ status: 'ok', result }); })
        .catch((err: unknown) => {
          if (!cancelled) {
            const message = err instanceof Error ? err.message : 'Lỗi không xác định';
            setData({ status: 'error', message });
          }
        });
    };

    setData({ status: 'loading' });

    if (q) {
      const timer = setTimeout(doFetch, 300);
      return () => { cancelled = true; clearTimeout(timer); };
    }

    doFetch();
    return () => { cancelled = true; };
  }, [query, activeTag]);

  const handleTagClick = (tagSlug: string) => {
    // Tag filter và search là 2 chế độ loại trừ nhau
    setActiveTag((prev) => (prev === tagSlug ? null : tagSlug));
    setQuery('');
  };

  const handleQueryChange = (newQ: string) => {
    setQuery(newQ);
    // Xoá tag filter khi người dùng bắt đầu tìm kiếm
    if (newQ.trim()) setActiveTag(null);
  };

  return (
    <div>
      <h1 className="page-title">Bài viết</h1>

      {/* Ô tìm kiếm */}
      <div className="search-bar">
        <input
          className="search-input"
          type="search"
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          placeholder="Tìm kiếm bài viết…"
        />
      </div>

      {/* Dải chip tag */}
      {tags.length > 0 && (
        <div className="tag-filter">
          {tags.map((tag) => (
            <button
              key={tag.id}
              type="button"
              className={`tag-chip tag-chip--btn${activeTag === tag.slug ? ' tag-chip--active' : ''}`}
              onClick={() => handleTagClick(tag.slug)}
            >
              {tag.name}
            </button>
          ))}
        </div>
      )}

      {/* Kết quả */}
      {data.status === 'loading' && (
        <p className="state-msg">Đang tải…</p>
      )}

      {data.status === 'error' && (
        <p className="state-msg error">Lỗi khi tải danh sách: {data.message}</p>
      )}

      {data.status === 'ok' && (
        data.result.data.length === 0 ? (
          <p className="state-msg">
            {query.trim()
              ? `Không tìm thấy kết quả cho "${query.trim()}".`
              : activeTag
                ? 'Không có bài viết nào với thẻ này.'
                : 'Chưa có bài viết nào.'}
          </p>
        ) : (
          data.result.data.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))
        )
      )}
    </div>
  );
}
