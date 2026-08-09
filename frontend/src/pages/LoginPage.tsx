import { FormEvent, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { login, fetchMe } from '../api';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await login(username, password);
      await fetchMe();
      const next = (location.state as { from?: string } | null)?.from || '/home';
      navigate(next, { replace: true });
      window.location.reload();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : '登录失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <p className="eyebrow">Modernized with Vite</p>
          <h1>研发部题库</h1>
          <p>沿用现有数据结构与权限体系，升级为现代前端交互层。</p>
        </div>
        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            用户名
            <input value={username} onChange={(event) => setUsername(event.target.value)} />
          </label>
          <label>
            密码
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          {error ? <div className="error-banner">{error}</div> : null}
          <button className="primary-button" type="submit" disabled={submitting}>
            {submitting ? '登录中...' : '登录系统'}
          </button>
          <Link to="/user-register" className="ghost-button" style={{ display: 'inline-block', marginTop: 12 }}>
            注册账号
          </Link>
        </form>
      </div>
    </div>
  );
}
