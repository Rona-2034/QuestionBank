import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { changeStudentPassword } from '../api';

export function StudentChangePasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setMessage('');
    if (password !== confirmPassword) {
      setError('两次密码不一致');
      return;
    }
    if (password.length < 6 || password.length > 10) {
      setError('密码长度需要保持在 6 到 10 个字符');
      return;
    }
    setSaving(true);
    try {
      const response = await changeStudentPassword({ password });
      if (response.result === 'success') {
        setMessage('密码已修改');
        navigate('/home');
      } else {
        setError(response.messageInfo || response.result || '修改失败');
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '修改失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-stack">
      <section className="panel">
        <div className="panel-heading">
          <h2>修改密码</h2>
          <span>
            <Link className="ghost-button" to="/student/setting">
              返回个人设置
            </Link>
          </span>
        </div>
        <form className="filter-grid" onSubmit={handleSubmit}>
          <label>
            新密码
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
          </label>
          <label>
            确认新密码
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
          </label>
          <button className="primary-button" type="submit" disabled={saving}>
            {saving ? '提交中...' : '确认修改'}
          </button>
        </form>
        {error ? <div className="error-banner" style={{ marginTop: 12 }}>{error}</div> : null}
        {message ? <div className="status-note" style={{ marginTop: 12 }}>{message}</div> : null}
      </section>
    </div>
  );
}
