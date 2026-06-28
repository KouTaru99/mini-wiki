import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ArticleListPage from './pages/ArticleListPage';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<ArticleListPage />} />
        {/* Trang chi tiết sẽ thêm ở Bước 4.3 */}
      </Route>
    </Routes>
  );
}
