import { Link } from 'react-router-dom';
import type { ArticleListItem } from '../types';

interface Props {
  article: ArticleListItem;
}

// Format ngày ISO 8601 → dạng tiếng Việt dễ đọc (ví dụ: 28 tháng 6, 2026)
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('vi-VN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function ArticleCard({ article }: Props) {
  return (
    <div className="article-card">
      <div className="card-title">
        <Link to={`/articles/${article.slug}`}>{article.title}</Link>
      </div>
      {article.published_at && (
        <div className="card-meta">Đăng ngày {formatDate(article.published_at)}</div>
      )}
      {article.tags.length > 0 && (
        <div className="tag-list">
          {article.tags.map((tag) => (
            <span key={tag.id} className="tag-chip">{tag.name}</span>
          ))}
        </div>
      )}
    </div>
  );
}
