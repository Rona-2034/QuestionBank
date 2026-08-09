import { FormEvent, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { createAdminPoint, deleteAdminPoint, fetchAdminFields, fetchAdminPoints } from '../api';
import type { AdminFieldItem, AdminListPayload, AdminPointItem } from '../types';

export function AdminPointsPage() {
  const params = useParams();
  const [fieldId, setFieldId] = useState(Number(params.fieldId || 1));
  const [fields, setFields] = useState<AdminFieldItem[]>([]);
  const [payload, setPayload] = useState<AdminListPayload<AdminPointItem> | null>(null);
  const [error, setError] = useState('');
  const [pointName, setPointName] = useState('');
  const [memo, setMemo] = useState('');

  const load = async (nextFieldId = fieldId) => {
    try {
      const [fieldPayload, pointPayload] = await Promise.all([
        fetchAdminFields(1),
        fetchAdminPoints(nextFieldId, 1),
      ]);
      setFields(fieldPayload.items);
      setPayload(pointPayload);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '加载失败');
    }
  };

  useEffect(() => {
    void load(fieldId);
  }, [fieldId]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    await createAdminPoint({ fieldId, pointName, memo, state: 1 });
    setPointName('');
    setMemo('');
    await load(fieldId);
  };

  const handleDelete = async (pointId: number) => {
    await deleteAdminPoint(pointId);
    await load(fieldId);
  };

  if (error) {
    return <div className="error-banner">{error}</div>;
  }

  return (
    <div className="page-stack">
      <section className="panel">
        <div className="panel-heading">
          <h2>知识点管理</h2>
          <span>当前题库 {fieldId}</span>
        </div>
        <form className="filter-grid" onSubmit={handleSubmit}>
          <label>
            题库
            <select value={fieldId} onChange={(event) => setFieldId(Number(event.target.value))}>
              {fields.map((field) => (
                <option key={field.fieldId} value={field.fieldId}>
                  {field.fieldName}
                </option>
              ))}
            </select>
          </label>
          <label>
            知识点名
            <input value={pointName} onChange={(event) => setPointName(event.target.value)} />
          </label>
          <label style={{ gridColumn: 'span 3' }}>
            描述
            <input value={memo} onChange={(event) => setMemo(event.target.value)} />
          </label>
          <button className="primary-button" type="submit">
            新增知识点
          </button>
        </form>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <h2>知识点列表</h2>
          <span>{payload?.items.length || 0} 项</span>
        </div>
        <div className="table-shell">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>名称</th>
                <th>题库</th>
                <th>描述</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {payload?.items.map((item) => (
                <tr key={item.pointId}>
                  <td>{item.pointId}</td>
                  <td>{item.pointName}</td>
                  <td>{item.fieldName || fieldId}</td>
                  <td>{item.memo || '-'}</td>
                  <td>
                    <button className="ghost-button" type="button" onClick={() => void handleDelete(item.pointId)}>
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
