import { FormEvent, useEffect, useState } from 'react';
import { createAdminField, deleteAdminField, fetchAdminFields } from '../api';
import type { AdminFieldItem, AdminListPayload } from '../types';

export function AdminFieldsPage() {
  const [payload, setPayload] = useState<AdminListPayload<AdminFieldItem> | null>(null);
  const [error, setError] = useState('');
  const [fieldName, setFieldName] = useState('');
  const [memo, setMemo] = useState('');

  const load = async () => {
    try {
      setPayload(await fetchAdminFields(1));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '加载失败');
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    await createAdminField({ fieldName, memo, state: true });
    setFieldName('');
    setMemo('');
    await load();
  };

  const handleDelete = async (fieldId: number) => {
    await deleteAdminField(fieldId);
    await load();
  };

  if (error) {
    return <div className="error-banner">{error}</div>;
  }

  return (
    <div className="page-stack">
      <section className="panel">
        <div className="panel-heading">
          <h2>题库管理</h2>
          <span>新增 / 删除题库</span>
        </div>
        <form className="filter-grid" onSubmit={handleSubmit}>
          <label>
            题库名
            <input value={fieldName} onChange={(event) => setFieldName(event.target.value)} />
          </label>
          <label style={{ gridColumn: 'span 3' }}>
            描述
            <input value={memo} onChange={(event) => setMemo(event.target.value)} />
          </label>
          <button className="primary-button" type="submit">
            新增题库
          </button>
        </form>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <h2>题库列表</h2>
          <span>{payload?.items.length || 0} 项</span>
        </div>
        <div className="table-shell">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>名称</th>
                <th>描述</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {payload?.items.map((item) => (
                <tr key={item.fieldId}>
                  <td>{item.fieldId}</td>
                  <td>{item.fieldName}</td>
                  <td>{item.memo || '-'}</td>
                  <td>
                    <button className="ghost-button" type="button" onClick={() => void handleDelete(item.fieldId)}>
                      删除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
