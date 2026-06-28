import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ArticleListPage from './pages/ArticleListPage';
import ArticleDetailPage from './pages/ArticleDetailPage';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<ArticleListPage />} />
        <Route path="/articles/:slug" element={<ArticleDetailPage />} />
      </Route>
    </Routes>
  );
}
