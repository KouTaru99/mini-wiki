import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        {/* Trang danh sách + chi tiết sẽ thêm ở Bước 4.2 và 4.3 */}
        <Route path="/" element={<p>Đang xây dựng…</p>} />
      </Route>
    </Routes>
  );
}
