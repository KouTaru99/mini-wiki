import type { NextFunction, Request, Response } from 'express';

// AppError: lỗi có chủ ý từ business logic — controller ném ra thay vì next(err) lỗi DB thô
export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

// Lỗi PostgreSQL (qua driver `pg`) có SQLSTATE `code` + tên `constraint` vi phạm.
// Danh sách mã: https://www.postgresql.org/docs/current/errcodes-appendix.html
interface PgError {
  code: string;
  constraint?: string;
}

function hasStringCode(err: unknown): err is PgError {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    typeof (err as { code: unknown }).code === 'string'
  );
}

// Drizzle bọc lỗi driver gốc vào DrizzleQueryError, lỗi pg thật nằm ở `.cause`
// (theo chuẩn Error cause-chaining của Node) — bóc dần cho tới khi gặp lỗi có
// `.code` dạng SQLSTATE, hoặc hết lớp để bóc.
function extractPgError(err: unknown): PgError | undefined {
  if (hasStringCode(err)) return err;
  if (typeof err === 'object' && err !== null && 'cause' in err) {
    return extractPgError((err as { cause: unknown }).cause);
  }
  return undefined;
}

// Express error handler — 4 tham số bắt buộc để Express nhận diện là error middleware
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  // Lỗi có chủ ý từ controller
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: { code: err.code, message: err.message },
    });
    return;
  }

  // Lỗi PostgreSQL đã biết — map sang HTTP code + error code chuẩn API
  const pgError = extractPgError(err);
  if (pgError) {
    if (pgError.code === '23505') {
      // unique_violation — phân biệt slug vs name qua tên constraint vi phạm
      // (articles_slug_unique / tags_slug_unique / tags_name_unique — xem drizzle/0000_init.sql)
      const targetCode = pgError.constraint?.includes('slug') ? 'SLUG_CONFLICT' : 'TAG_NAME_CONFLICT';
      res.status(409).json({
        error: {
          code: targetCode,
          message: `Giá trị đã tồn tại (constraint: ${pgError.constraint ?? 'unknown'}).`,
        },
      });
      return;
    }

    if (pgError.code === '23503') {
      // foreign_key_violation — trường hợp dự phòng, controller đã kiểm trước khi xóa tag
      res.status(409).json({
        error: {
          code: 'TAG_IN_USE',
          message: 'Tag đang được gắn với bài viết, không thể xóa.',
        },
      });
      return;
    }
  }

  // Lỗi không xác định — 500, log ra stderr (NFR-8)
  console.error('[ERROR 500]', err);
  res.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: 'Đã xảy ra lỗi phía server.' },
  });
}
