import type { Request, Response } from 'express';

// Bắt tất cả route không khớp — đặt TRƯỚC errorHandler, SAU tất cả router
export function notFound(req: Request, res: Response): void {
  res.status(404).json({
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `Route không tồn tại: ${req.method} ${req.path}`,
    },
  });
}
