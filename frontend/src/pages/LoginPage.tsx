import { FormEvent, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { login } from '../api';
import { useAuth } from '../App';
import seavoLogo from '../assets/seavo-logo.svg';

export function LoginPage() {
  const navigate = useNavigate();
  const auth = useAuth();
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
      await auth.refresh();
      const next = (location.state as { from?: string } | null)?.from || '/home';
      navigate(next, { replace: true });
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
          <img className="auth-logo" src={seavoLogo} alt="SEAVO" />
          <h1>研发部题库</h1>
          <p>使用公司邮箱或姓名登录，开始学习与考试。</p>
        </div>
        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            公司邮箱或姓名
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
          {(location.state as { registered?: boolean } | null)?.registered ? <div className="status-note">注册成功，请使用公司邮箱或姓名登录。</div> : null}
          {error ? <div className="error-banner">{error}</div> : null}
          <button className="primary-button" type="submit" disabled={submitting}>
            {submitting ? '登录中...' : '登录系统'}
          </button>
          <p style={{ margin: '12px 0 0', textAlign: 'center' }}>还没有账号？请先注册</p>
          <button type="button" className="ghost-button" onClick={() => navigate('/user-register')}>
            注册新账号
          </button>
        </form>
      </div>
    </div>
  );
}
