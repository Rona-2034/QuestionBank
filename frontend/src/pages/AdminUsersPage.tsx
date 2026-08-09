import { FormEvent, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { createAdminUser, disableAdminUser, enableAdminUser, fetchAdminFields, fetchAdminUsers } from '../api';
import type { AdminFieldItem, AdminListPayload, AdminUserItem } from '../types';

function formatDate(value?: string) {
  if (!value) {
    return '-';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function isWordLike(value: string) {
  return /^[A-Za-z0-9_]+$/.test(value);
}

export function AdminUsersPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const mode = location.pathname === '/admin/add-user' ? 'add' : 'list';
  const [payload, setPayload] = useState<AdminListPayload<AdminUserItem> | null>(null);
  const [fields, setFields] = useState<AdminFieldItem[]>([]);
  const [fieldId, setFieldId] = useState(-1);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [department, setDepartment] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  const loadUsers = async (page = 1) => {
    try {
      setPayload(await fetchAdminUsers(3, page));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '加载失败');
    }
  };

  useEffect(() => {
    void loadUsers();
    void fetchAdminFields(1)
      .then((response) => {
        setFields(response.items);
      })
      .catch((requestError) => {
        setError(requestError instanceof Error ? requestError.message : '加载题库失败');
      });
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setMessage('');

    if (!username || username.length > 40 || !isWordLike(username)) {
      setError('用户名只能由 1 到 40 位字母、数字或下划线组成');
      return;
    }
    if (!department || department.length > 40 || !isWordLike(department)) {
      setError('部门只能由 1 到 40 位字母、数字或下划线组成');
      return;
    }
    if (!email || email.length > 40) {
      setError('邮箱不能为空，且长度不能超过 40 个字符');
      return;
    }
    if (!/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(email)) {
      setError('邮箱格式无效');
      return;
    }
    if (password.length < 6 || password.length > 20) {
      setError('密码请保持在 6 到 20 个字符以内');
      return;
    }

    setSaving(true);
    try {
      const response = await createAdminUser({
        username,
        email,
        password,
        department,
        fieldId: fieldId > 0 ? fieldId : 0,
      });
      if (response.result === 'success') {
        setMessage('成员已创建');
        setUsername('');
        setEmail('');
        setPassword('');
        setDepartment('');
        setFieldId(-1);
        await loadUsers();
        navigate('/admin/user-list');
      } else {
        setError(response.messageInfo || response.result || '创建失败');
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '创建失败');
    } finally {
      setSaving(false);
    }
  };

  const handleDisable = async (userId: number) => {
    if (!window.confirm('确定要禁用该用户吗？')) {
      return;
    }
    setError('');
    await disableAdminUser(userId);
    await loadUsers(payload?.page.pageNo || 1);
  };

  const handleEnable = async (userId: number) => {
    setError('');
    await enableAdminUser(userId);
    await loadUsers(payload?.page.pageNo || 1);
  };

  return (
    <div className="page-stack">
      <section className="panel">
        <div className="panel-heading">
          <h2>{mode === 'add' ? '添加成员' : '成员管理'}</h2>
          <span>沿用旧系统成员管理与添加成员的分离结构</span>
        </div>
        <div className="result-list">
          <article className="practice-card">
            <h3>成员管理</h3>
            <p>仅展示学员角色，管理员入口保留在网站设置。</p>
            <Link className="ghost-button" to="/admin/user-list">
              查看成员
            </Link>
          </article>
          <article className="practice-card">
            <h3>添加成员</h3>
            <p>对应旧系统 `/admin/add-user` 独立页面。</p>
            <Link className="ghost-button" to="/admin/add-user">
              新增成员
            </Link>
          </article>
        </div>
      </section>

      {mode !== 'list' ? (
        <section className="panel">
          <div className="panel-heading">
            <h2>添加成员</h2>
            <span>题库选择保留为可选项，后端仍按旧逻辑写入全题库访问</span>
          </div>
          <form className="filter-grid" onSubmit={handleSubmit}>
            <label>
              默认题库
              <select value={fieldId} onChange={(event) => setFieldId(Number(event.target.value))}>
                <option value={-1}>-- 可不填 --</option>
                {fields.map((field) => (
                  <option key={field.fieldId} value={field.fieldId}>
                    {field.fieldName}
                  </option>
                ))}
              </select>
            </label>
            <label>
              用户名
              <input value={username} onChange={(event) => setUsername(event.target.value)} />
            </label>
            <label>
              邮箱
              <input value={email} onChange={(event) => setEmail(event.target.value)} />
            </label>
            <label>
              密码
              <input value={password} onChange={(event) => setPassword(event.target.value)} />
            </label>
            <label>
              部门
              <input value={department} onChange={(event) => setDepartment(event.target.value)} />
            </label>
            <button className="primary-button" type="submit" disabled={saving}>
              {saving ? '提交中...' : '确认添加'}
            </button>
          </form>
        </section>
      ) : null}

      {mode !== 'add' ? (
        <section className="panel">
          <div className="panel-heading">
            <h2>成员列表</h2>
            <span>{payload?.page.totalRecord || 0} 名成员</span>
          </div>
          <div className="table-shell">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>用户名</th>
                  <th>邮箱</th>
                  <th>部门</th>
                  <th>题库</th>
                  <th>注册时间</th>
                  <th>状态</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {payload?.items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{item.username}</td>
                    <td>{item.email || '-'}</td>
                    <td>{item.department || '-'}</td>
                    <td>{item.fieldName || '-'}</td>
                    <td>{formatDate(item.create_date)}</td>
                    <td>{item.enabled === '1' ? '启用' : '注销'}</td>
                    <td>
                      {item.enabled === '1' ? (
                        <button className="ghost-button" type="button" onClick={() => void handleDisable(item.id)}>
                          禁用
                        </button>
                      ) : (
                        <button className="ghost-button" type="button" onClick={() => void handleEnable(item.id)}>
                          启用
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {payload ? (
            <div className="pagination-bar">
              <button
                className="ghost-button"
                disabled={payload.page.pageNo <= 1}
                type="button"
                onClick={() => void loadUsers(Math.max(1, payload.page.pageNo - 1))}
              >
                上一页
              </button>
              <span>
                第 {payload.page.pageNo} / {payload.page.totalPage} 页
              </span>
              <button
                className="ghost-button"
                disabled={payload.page.pageNo >= payload.page.totalPage}
                type="button"
                onClick={() => void loadUsers(payload.page.pageNo + 1)}
              >
                下一页
              </button>
            </div>
          ) : null}
        </section>
      ) : null}

      {error ? <div className="error-banner">{error}</div> : null}
      {message ? <div className="status-note">{message}</div> : null}
    </div>
  );
}
