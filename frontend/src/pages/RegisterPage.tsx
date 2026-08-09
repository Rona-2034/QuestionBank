import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser } from '../api';

export function RegisterPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [truename, setTruename] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    setMessage('');
    try {
      const response = await registerUser({
        username,
        password,
        email,
        truename,
        phone,
        department,
      });
      if (response.result === 'success') {
        setMessage('注册成功，正在跳转登录页...');
        setTimeout(() => navigate('/login', { replace: true }), 800);
      } else {
        setError(response.messageInfo || response.result || '注册失败');
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : '注册失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <p className="eyebrow">Open Access</p>
          <h1>研发部题库注册</h1>
          <p>通过 `/api/app/auth/register` 注册，保持原用户数据结构不变。</p>
        </div>
        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            用户名
            <input value={username} onChange={(event) => setUsername(event.target.value)} />
          </label>
          <label>
            密码
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
          </label>
          <label>
            邮箱
            <input value={email} onChange={(event) => setEmail(event.target.value)} />
          </label>
          <label>
            姓名
            <input value={truename} onChange={(event) => setTruename(event.target.value)} />
          </label>
          <label>
            手机
            <input value={phone} onChange={(event) => setPhone(event.target.value)} />
          </label>
          <label>
            部门
            <input value={department} onChange={(event) => setDepartment(event.target.value)} />
          </label>
          {error ? <div className="error-banner">{error}</div> : null}
          {message ? <div className="status-note">{message}</div> : null}
          <button className="primary-button" type="submit" disabled={submitting}>
            {submitting ? '提交中...' : '注册账号'}
          </button>
          <Link to="/login" className="ghost-button" style={{ display: 'inline-block', marginTop: 12 }}>
            返回登录
          </Link>
        </form>
      </div>
    </div>
  );
}
