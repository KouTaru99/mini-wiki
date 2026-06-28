import { Prisma } from '@prisma/client';
import type { NextFunction, Request, Response } from 'express';

// AppError: lỗi có chủ ý từ business logic — controller ném ra thay vì next(err) Prisma thô
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

  // Lỗi Prisma đã biết — map sang HTTP code + error code chuẩn API
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      // Unique constraint: phân biệt slug vs name qua meta.target
      const target = (err.meta?.target as string[] | undefined) ?? [];
      const code = target.some((f) => f.includes('slug'))
        ? 'SLUG_CONFLICT'
        : 'TAG_NAME_CONFLICT';
      res.status(409).json({
        error: {
          code,
          message: `Giá trị đã tồn tại: ${target.join(', ')}.`,
        },
      });
      return;
    }

    if (err.code === 'P2025') {
      // Record not found (findUniqueOrThrow / updateOrThrow)
      res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Không tìm thấy bản ghi.' },
      });
      return;
    }

    if (err.code === 'P2003') {
      // Foreign key constraint — xóa tag còn gắn bài viết
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
