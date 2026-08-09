import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchStudentSetting, updateStudentSetting } from '../api';
import type { UserProfile } from '../types';

export function StudentSettingPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [truename, setTruename] = useState('');
  const [department, setDepartment] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void fetchStudentSetting()
      .then((payload) => {
        setUser(payload.user);
        setEmail(payload.user?.email || '');
        setPhone(payload.user?.phone || '');
        setTruename(payload.user?.truename || '');
        setDepartment(payload.user?.department || '');
      })
      .catch((requestError) => {
        setError(requestError instanceof Error ? requestError.message : '加载失败');
      });
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const response = await updateStudentSetting({
        id: user?.id,
        username: user?.username,
        email,
        phone,
        truename,
        department,
      });
      if (response.result === 'success') {
        setMessage('资料已更新');
        navigate('/student/user-center');
      } else {
        setError(response.messageInfo || response.result || '更新失败');
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '更新失败');
    } finally {
      setSaving(false);
    }
  };

  if (error) {
    return <div className="error-banner">{error}</div>;
  }
  if (!user) {
    return <div className="page-state">正在加载个人设置...</div>;
  }

  return (
    <div className="page-stack">
      <section className="panel">
        <div className="panel-heading">
          <h2>个人设置</h2>
          <span>沿用老系统的基础资料更新逻辑</span>
        </div>
        <div className="secondary-actions" style={{ marginBottom: 16 }}>
          <Link className="ghost-button" to="/student/change-password">
            修改密码
          </Link>
        </div>
        <form className="filter-grid" onSubmit={handleSubmit}>
          <label>
            账号
            <input value={user.username} disabled />
          </label>
          <label>
            邮箱
            <input value={email} onChange={(event) => setEmail(event.target.value)} />
          </label>
          <label>
            手机
            <input value={phone} onChange={(event) => setPhone(event.target.value)} />
          </label>
          <label>
            姓名
            <input value={truename} onChange={(event) => setTruename(event.target.value)} />
          </label>
          <label>
            部门
            <input value={department} onChange={(event) => setDepartment(event.target.value)} />
          </label>
          <label>
            题库权限
            <input value={user.fieldName || '全部题库'} disabled />
          </label>
          <button className="primary-button" type="submit" disabled={saving}>
            {saving ? '保存中...' : '保存修改'}
          </button>
        </form>
        {message ? <div className="status-note" style={{ marginTop: 12 }}>{message}</div> : null}
      </section>
    </div>
  );
}
