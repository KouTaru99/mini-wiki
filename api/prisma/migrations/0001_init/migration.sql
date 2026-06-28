-- Migration 0001_init — Mini-Wiki v1
-- Áp dụng bằng: prisma migrate deploy (Chặng 3)

-- ─── Bảng articles (Bài viết) ────────────────────────────────────────────────
CREATE TABLE articles (
  id           SERIAL        PRIMARY KEY,
  title        VARCHAR(255)  NOT NULL,
  slug         VARCHAR(255)  NOT NULL UNIQUE,
  content      TEXT          NOT NULL,
  published_at TIMESTAMPTZ,  -- NULL = bản nháp; có giá trị = đã đăng (khớp schema.prisma DateTime?, KHÔNG default)
  created_at   TIMESTAMPTZ   DEFAULT NOW(),
  updated_at   TIMESTAMPTZ   DEFAULT NOW()
);

-- ─── Bảng tags (Nhãn) ────────────────────────────────────────────────────────
CREATE TABLE tags (
  id         SERIAL       PRIMARY KEY,
  name       VARCHAR(100) NOT NULL UNIQUE,
  slug       VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ  DEFAULT NOW()
);

-- ─── Bảng article_tags (Nối nhiều-nhiều Article ↔ Tag) ───────────────────────
CREATE TABLE article_tags (
  article_id INT NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  tag_id     INT NOT NULL REFERENCES tags(id)     ON DELETE RESTRICT,
  PRIMARY KEY (article_id, tag_id)
);

-- ─── Index Full-Text Search (GIN) ─────────────────────────────────────────────
-- GIN index trên tsvector kết hợp title + content, dùng dictionary 'simple'
-- (PostgreSQL không có dictionary tiếng Việt built-in; 'simple' đủ cho v1).
CREATE INDEX idx_articles_fts
  ON articles
  USING GIN (to_tsvector('simple', title || ' ' || content));
