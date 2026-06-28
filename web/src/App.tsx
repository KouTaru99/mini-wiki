import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ArticleListPage from './pages/ArticleListPage';
import ArticleDetailPage from './pages/ArticleDetailPage';
import ArticleEditorPage from './pages/ArticleEditorPage';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<ArticleListPage />} />
        <Route path="/new" element={<ArticleEditorPage />} />
        <Route path="/articles/:slug" element={<ArticleDetailPage />} />
        <Route path="/articles/:slug/edit" element={<ArticleEditorPage />} />
      </Route>
    </Routes>
  );
}
