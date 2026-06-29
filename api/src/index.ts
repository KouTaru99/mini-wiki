import { app } from './app.js';

const port = process.env.PORT ?? 3000;

app.listen(port, () => {
  console.log(`[mini-wiki] API đang chạy tại http://localhost:${port}`);
  console.log(`[mini-wiki] CORS cho phép origin: ${process.env.CORS_ORIGIN ?? '(chưa đặt)'}`);
});
