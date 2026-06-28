import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import type { Tag } from '../types';
import type { ArticleInput } from '../lib/api';
import { getArticle, listTags, createArticle, updateArticle, deleteArticle } from '../lib/api';

type FormState = {
  title: string;
  content: string;
  publishNow: boolean;
  tagIds: number[];
};

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ok' };

type SubmitState =
  | { status: 'idle' }
  | { status: 'submitting' }
  | { status: 'error'; message: string };

export default function ArticleEditorPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const isEdit = slug !== undefined;

  const [loadState, setLoadState] = useState<LoadState>(
    isEdit ? { status: 'loading' } : { status: 'ok' }
  );
  const [tags, setTags] = useState<Tag[]>([]);
  const [form, setForm] = useState<FormState>({
    title: '',
    content: '',
    publishNow: false,
    tagIds: [],
  });
  const [submitState, setSubmitState] = useState<SubmitState>({ status: 'idle' });

  // Tải danh sách tags để hiện checkbox
  useEffect(() => {
    listTags().then(setTags).catch(() => {});
  }, []);

  // Tải bài viết để điền form (chỉ chế độ sửa)
  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    getArticle(slug)
      .then((article) => {
        if (cancelled) return;
        setForm({
          title: article.title,
          content: article.content,
          publishNow: article.published_at !== null,
          tagIds: article.tags.map((t) => t.id),
        });
        setLoadState({ status: 'ok' });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : 'Lỗi không xác định';
        setLoadState({ status: 'error', message });
      });
    return () => { cancelled = true; };
  }, [slug]);

  const toggleTag = (id: number) => {
    setForm((f) => ({
      ...f,
      tagIds: f.tagIds.includes(id)
        ? f.tagIds.filter((tid) => tid !== id)
        : [...f.tagIds, id],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitState({ status: 'submitting' });
    const input: ArticleInput = {
      title: form.title,
      content: form.content,
      published_at: form.publishNow ? new Date().toISOString() : null,
      tagIds: form.tagIds,
    };
    try {
      if (isEdit && slug) {
        const article = await updateArticle(slug, input);
        navigate(`/articles/${article.slug}`);
      } else {
        const article = await createArticle(input);
        navigate(`/articles/${article.slug}`);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Lỗi không xác định';
      setSubmitState({ status: 'error', message });
    }
  };

  const handleDelete = async () => {
    if (!slug) return;
    if (!window.confirm('Xác nhận xóa bài viết này? Thao tác không thể hoàn tác.')) return;
    setSubmitState({ status: 'submitting' });
    try {
      await deleteArticle(slug);
      navigate('/');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Lỗi không xác định';
      setSubmitState({ status: 'error', message });
    }
  };

  if (loadState.status === 'loading') {
    return <p className="state-msg">Đang tải…</p>;
  }

  if (loadState.status === 'error') {
    return (
      <div>
        <Link to="/" className="back-link">← Về danh sách</Link>
        <p className="state-msg error">Lỗi khi tải bài viết: {loadState.message}</p>
      </div>
    );
  }

  const isSubmitting = submitState.status === 'submitting';

  return (
    <div className="editor-page">
      <Link to={isEdit && slug ? `/articles/${slug}` : '/'} className="back-link">
        ← {isEdit ? 'Về bài viết' : 'Về danh sách'}
      </Link>
      <h1 className="page-title">{isEdit ? 'Sửa bài viết' : 'Viết bài mới'}</h1>

      <form className="editor-form" onSubmit={handleSubmit}>
        <div className="form-field">
          <label htmlFor="title">Tiêu đề *</label>
          <input
            id="title"
            type="text"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            required
            maxLength={255}
            placeholder="Nhập tiêu đề bài viết"
            disabled={isSubmitting}
          />
        </div>

        <div className="form-field">
          <label htmlFor="content">Nội dung (Markdown) *</label>
          <textarea
            id="content"
            value={form.content}
            onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
            required
            rows={16}
            placeholder="Nhập nội dung theo định dạng Markdown…"
            disabled={isSubmitting}
          />
        </div>

        <div className="form-field form-field--inline-check">
          <label className="check-label">
            <input
              type="checkbox"
              checked={form.publishNow}
              onChange={(e) => setForm((f) => ({ ...f, publishNow: e.target.checked }))}
              disabled={isSubmitting}
            />
            Xuất bản ngay
          </label>
          <p className="form-hint">Bỏ chọn để lưu nháp (không hiển thị công khai).</p>
        </div>

        {tags.length > 0 && (
          <div className="form-field">
            <label>Thẻ (tags)</label>
            <div className="tag-checkbox-list">
              {tags.map((tag) => (
                <label key={tag.id} className="tag-checkbox-item">
                  <input
                    type="checkbox"
                    checked={form.tagIds.includes(tag.id)}
                    onChange={() => toggleTag(tag.id)}
                    disabled={isSubmitting}
                  />
                  {tag.name}
                </label>
              ))}
            </div>
          </div>
        )}

        {submitState.status === 'error' && (
          <p className="form-error">{submitState.message}</p>
        )}

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Đang lưu…' : isEdit ? 'Lưu thay đổi' : 'Tạo bài viết'}
          </button>
          {isEdit && (
            <button
              type="button"
              className="btn btn-danger"
              onClick={handleDelete}
              disabled={isSubmitting}
            >
              Xóa bài viết
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
