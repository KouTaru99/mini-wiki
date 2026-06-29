# Checklist Review Pull Request

## Tại sao cần review trước khi merge?

Trong quy trình PTPM thực tế, code không bao giờ đi thẳng từ máy lập trình viên lên production. Luồng chuẩn là: **nhánh tính năng → Pull Request → reviewer soi theo checklist → merge vào nhánh chính**. Review trước merge giúp bắt lỗi khi chi phí sửa còn thấp nhất (chưa deploy), chia sẻ hiểu biết giữa các thành viên, và đảm bảo code luôn ở trạng thái "ai cũng đọc được, ai cũng bảo trì được". Đây là kỹ năng bắt buộc trong hầu hết công ty phần mềm.

---

## Mục 1 — Đúng đắn

- [ ] **Logic khớp yêu cầu** — code thực hiện đúng acceptance criteria trong spec, không thiếu, không thừa.
- [ ] **Edge case đã xử lý** — giá trị rỗng/null/undefined, chuỗi trống, mảng 0 phần tử, slug không tồn tại đều có nhánh xử lý rõ ràng.
- [ ] **Trùng lặp dữ liệu** — tạo bài trùng title trả 409, không phải 500 hay im lặng tạo bản sao.
- [ ] **Phân trang / giới hạn** — nếu endpoint trả danh sách, có giới hạn số lượng (tránh trả toàn bộ DB).

## Mục 2 — Bảo mật

- [ ] **Tham số hoá query** — mọi truy vấn DB dùng Prisma ORM (tham số hoá tự động); không nối chuỗi SQL thô → chống SQL Injection.
- [ ] **Sanitize output HTML** — nội dung markdown được render qua `marked` + `DOMPurify` (hoặc tương đương) trước khi đưa vào DOM → chống XSS.
- [ ] **Không lộ secret** — không có `API_KEY`, `DATABASE_URL`, password, token trong code hoặc diff; `.env` nằm trong `.gitignore`.
- [ ] **Không expose stack trace** — response lỗi chỉ trả `{ error: { code, message } }`, không kèm `stack` hay đường dẫn file nội bộ.

## Mục 3 — Xử lý lỗi

- [ ] **Mã HTTP đúng** — 200 (OK), 201 (Created), 204 (No Content), 400 (Bad Request), 404 (Not Found), 409 (Conflict); không trả 200 cho lỗi.
- [ ] **Message lỗi rõ** — `"title là bắt buộc"` rõ hơn `"invalid input"`; người dùng đọc hiểu ngay cần làm gì.
- [ ] **Không nuốt lỗi im lặng** — không có `catch (e) {}` rỗng hay `console.log` thay cho xử lý; lỗi phải đi đến `next(err)` hoặc được trả về client.

## Mục 4 — Kiểm thử

- [ ] **Có test cho nhánh mới** — mỗi endpoint/logic mới phải có ít nhất 1 happy-path test và 1 error-path test.
- [ ] **Test chạy xanh** — `npm test` pass 100%, không có test bị skip không lý do.
- [ ] **Coverage không tụt** — nếu project đặt ngưỡng coverage (70%), PR không được kéo tụt xuống dưới ngưỡng.

## Mục 5 — Chất lượng code

- [ ] **Tên biến/hàm rõ nghĩa** — `articleSlug` rõ hơn `s`; `createArticle` rõ hơn `doStuff`.
- [ ] **Không lặp code thừa** — logic xuất hiện ≥2 lần nên được tách thành hàm dùng chung.
- [ ] **Type chặt, không dùng `any`** — TypeScript `any` tắt kiểm tra kiểu, giấu lỗi đến runtime; dùng interface/type cụ thể.
- [ ] **Không code chết** — không có `console.log` debug, hàm/biến khai báo nhưng không dùng, file import thừa.

## Mục 6 — Git & repo

- [ ] **Commit nhỏ, có chủ đề** — mỗi commit làm 1 việc; message theo dạng `[step-X.Y] mô tả ngắn`.
- [ ] **Không lẫn file rác** — không có `dist/`, `coverage/`, `node_modules/`, `.DS_Store` trong diff.
- [ ] **Nhánh đặt tên đúng quy ước** — ví dụ `feature/step-5.2-review-docs`, không phải `test123` hay `fix`.
- [ ] **Không rewrite lịch sử nhánh chung** — không `git push --force` lên `main`/`develop` trừ khi có quy định riêng.
