import { FormEvent, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createAdminAdmin, disableAdminUser, enableAdminUser, fetchAdminSystemConfig } from '../api';
import type { AdminSystemConfigPayload } from '../types';

export function SystemConfigPage() {
  const location = useLocation();
  const [payload, setPayload] = useState<AdminSystemConfigPayload | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [truename, setTruename] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('');
  const mode = location.pathname === '/admin/add-admin'
    ? 'add-admin'
    : location.pathname === '/admin/sys-admin-list'
      ? 'admin-list'
      : 'backup';
  const pageTitle = mode === 'backup' ? '数据备份' : mode === 'admin-list' ? '管理员列表' : '添加管理员';

  const load = async () => {
    try {
      setPayload(await fetchAdminSystemConfig(1));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '加载失败');
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setMessage('');
    setError('');
    try {
      const response = await createAdminAdmin({
        username,
        password,
        email,
        truename,
        phone,
        department,
        fieldId: 0,
      });
      if (response.result === 'success') {
        setMessage('管理员已创建');
        setUsername('');
        setPassword('');
        setEmail('');
        setTruename('');
        setPhone('');
        setDepartment('');
        await load();
      } else {
        setError(response.messageInfo || response.result || '创建失败');
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '创建失败');
    }
  };

  const handleDisable = async (userId: number) => {
    await disableAdminUser(userId);
    await load();
  };

  const handleEnable = async (userId: number) => {
    await enableAdminUser(userId);
    await load();
  };

  return (
    <div className="page-stack">
      <section className="panel">
        <div className="panel-heading">
          <h2>{pageTitle}</h2>
          <span>沿用旧系统网站设置分组结构</span>
        </div>
        <div className="result-list">
          <article className="practice-card">
            <h3>数据备份</h3>
            <p>{payload?.backupMessage || '旧系统此处只有入口页，没有实际备份 API。'}</p>
            <Link className="ghost-button" to="/admin/sys-backup">
              进入数据备份
            </Link>
          </article>
          <article className="practice-card">
            <h3>管理员列表</h3>
            <p>{payload?.adminCount || 0} 名管理员</p>
            <Link className="ghost-button" to="/admin/sys-admin-list">
              查看管理员
            </Link>
          </article>
          <article className="practice-card">
            <h3>添加管理员</h3>
            <p>对应旧系统 `/admin/add-admin`。</p>
            <Link className="ghost-button" to="/admin/add-admin">
              新增管理员
            </Link>
          </article>
        </div>
      </section>

      {mode !== 'admin-list' ? (
        <section className="panel">
          <div className="panel-heading">
            <h2>添加管理员</h2>
            <span>对应旧系统 `/admin/add-admin`</span>
          </div>
          <form className="filter-grid" onSubmit={handleSubmit}>
            <label>
              用户名
              <input value={username} onChange={(event) => setUsername(event.target.value)} />
            </label>
            <label>
              密码
              <input value={password} onChange={(event) => setPassword(event.target.value)} />
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
            <button className="primary-button" type="submit">
              新增管理员
            </button>
          </form>
          {message ? <div className="status-note" style={{ marginTop: 12 }}>{message}</div> : null}
          {error ? <div className="error-banner" style={{ marginTop: 12 }}>{error}</div> : null}
        </section>
      ) : null}

      {mode !== 'add-admin' ? (
        <section className="panel">
          <div className="panel-heading">
            <h2>管理员列表</h2>
            <span>{payload?.adminCount || 0} 项</span>
          </div>
          <div className="table-shell">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>账号</th>
                  <th>姓名</th>
                  <th>邮箱</th>
                  <th>状态</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {payload?.admins.map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{item.username}</td>
                    <td>{item.truename || '-'}</td>
                    <td>{item.email || '-'}</td>
                    <td>{item.enabled === '1' ? '启用' : '禁用'}</td>
                    <td>
                      <button className="ghost-button" type="button" onClick={() => void handleDisable(item.id)}>
                        禁用
                      </button>
                      <button className="ghost-button" type="button" onClick={() => void handleEnable(item.id)}>
                        启用
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  );
}
