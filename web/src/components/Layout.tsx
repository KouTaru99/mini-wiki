import { Link, Outlet } from 'react-router-dom';

export default function Layout() {
  return (
    <>
      <header className="site-header">
        <div className="container">
          <Link to="/" className="logo">Mini-Wiki</Link>
          <nav>
            <Link to="/">Trang chủ</Link>
          </nav>
        </div>
      </header>
      <main>
        <div className="container">
          <Outlet />
        </div>
      </main>
    </>
  );
}
