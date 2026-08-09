import { FormEvent, useEffect, useState } from 'react';
import { createAdminAnswerStage, deleteAdminAnswerStage, fetchAdminAnswerStages } from '../api';
import type { AdminAnswerStageItem, AdminListPayload } from '../types';

export function AdminAnswerStagesPage() {
  const [payload, setPayload] = useState<AdminListPayload<AdminAnswerStageItem> | null>(null);
  const [error, setError] = useState('');
  const [stageName, setStageName] = useState('');
  const [memo, setMemo] = useState('');

  const load = async () => {
    try {
      setPayload(await fetchAdminAnswerStages(1));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '加载失败');
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    await createAdminAnswerStage({ stageName, memo, state: 1 });
    setStageName('');
    setMemo('');
    await load();
  };

  const handleDelete = async (stageId: number) => {
    await deleteAdminAnswerStage(stageId);
    await load();
  };

  if (error) {
    return <div className="error-banner">{error}</div>;
  }

  return (
    <div className="page-stack">
      <section className="panel">
        <div className="panel-heading">
          <h2>答题人阶段</h2>
          <span>新增 / 删除阶段</span>
        </div>
        <form className="filter-grid" onSubmit={handleSubmit}>
          <label>
            阶段名
            <input value={stageName} onChange={(event) => setStageName(event.target.value)} />
          </label>
          <label style={{ gridColumn: 'span 3' }}>
            描述
            <input value={memo} onChange={(event) => setMemo(event.target.value)} />
          </label>
          <button className="primary-button" type="submit">
            新增阶段
          </button>
        </form>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <h2>阶段列表</h2>
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
                <tr key={item.stageId}>
                  <td>{item.stageId}</td>
                  <td>{item.stageName}</td>
                  <td>{item.memo || '-'}</td>
                  <td>
                    <button className="ghost-button" type="button" onClick={() => void handleDelete(item.stageId)}>
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
