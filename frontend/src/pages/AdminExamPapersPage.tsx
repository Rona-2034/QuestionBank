import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  deleteAdminExamPaper,
  fetchAdminExamPapers,
  offlineAdminExamPaper,
  publishAdminExamPaper,
} from '../api';
import type { AdminListPayload, ExamPaper } from '../types';

function getPaperTypeLabel(paperType: string | number) {
  switch (String(paperType)) {
    case '1':
      return '随机组卷';
    case '2':
      return '模拟考试';
    case '3':
      return '专家试卷';
    default:
      return '-';
  }
}

function getStatusLabel(status: number) {
  switch (status) {
    case 0:
      return '未上线';
    case 1:
      return '已上线';
    case 2:
      return '已下线';
    default:
      return String(status);
  }
}

export function AdminExamPapersPage() {
  const [paperType, setPaperType] = useState(0);
  const [payload, setPayload] = useState<AdminListPayload<ExamPaper> | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = async (nextPaperType = paperType, page = 1) => {
    try {
      setPayload(await fetchAdminExamPapers(nextPaperType, page));
      setError('');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '加载失败');
    }
  };

  useEffect(() => {
    void load(paperType, 1);
  }, [paperType]);

  const handlePublish = async (paperId: number, actionText: string) => {
    if (!window.confirm(`确定${actionText}吗？上线后的试卷将可以进行考试`)) {
      return;
    }
    const response = await publishAdminExamPaper(paperId);
    if (response.result === 'success') {
      setMessage('试卷成功上线');
      await load(paperType, payload?.page.pageNo || 1);
      return;
    }
    setError(response.messageInfo || response.result || '操作失败');
  };

  const handleOffline = async (paperId: number) => {
    if (!window.confirm('确定下线吗？下线后的试卷将无法再进行考试')) {
      return;
    }
    const response = await offlineAdminExamPaper(paperId);
    if (response.result === 'success') {
      setMessage('试卷已成功下线');
      await load(paperType, payload?.page.pageNo || 1);
      return;
    }
    setError(response.messageInfo || response.result || '操作失败');
  };

  const handleDelete = async (paperId: number) => {
    if (!window.confirm('确定删除？')) {
      return;
    }
    const response = await deleteAdminExamPaper(paperId);
    if (response.result === 'success') {
      setMessage('删除成功');
      await load(paperType, payload?.page.pageNo || 1);
      return;
    }
    setError(response.messageInfo || response.result || '操作失败');
  };

  if (error && !payload) {
    return <div className="error-banner">{error}</div>;
  }

  return (
    <div className="page-stack">
      <section className="panel">
        <div className="panel-heading">
          <h2>试卷管理</h2>
          <span>全部 / 随机组卷 / 模拟考试 / 专家试卷</span>
        </div>
        <label style={{ maxWidth: 240, display: 'block' }}>
          <span className="status-note">试卷分类</span>
          <select value={paperType} onChange={(event) => setPaperType(Number(event.target.value))}>
            <option value={0}>全部</option>
            <option value={1}>随机组卷</option>
            <option value={2}>模拟考试</option>
            <option value={3}>专家试卷</option>
          </select>
        </label>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <h2>试卷列表</h2>
          <span>
            {payload?.page.totalRecord || 0} 项
            <Link className="ghost-button" to="/admin/exam-papers/new" style={{ marginLeft: 12 }}>
              创建新试卷
            </Link>
          </span>
        </div>
        <div className="table-shell">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>试卷名称</th>
                <th>时长</th>
                <th>类别</th>
                <th>创建人</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {payload?.items.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.name}</td>
                  <td>{item.duration} 分钟</td>
                  <td>{getPaperTypeLabel(item.paper_type)}</td>
                  <td>{item.creator || '-'}</td>
                  <td>{getStatusLabel(item.status)}</td>
                  <td>
                    {item.status === 0 ? (
                      <>
                        <Link className="ghost-button" to={`/admin/exam-papers/${item.id}`}>
                          修改属性
                        </Link>
                        <button className="ghost-button" type="button" onClick={() => void handlePublish(item.id, '上线')}>
                          上线
                        </button>
                        <button className="ghost-button" type="button" onClick={() => void handleDelete(item.id)}>
                          删除
                        </button>
                      </>
                    ) : null}
                    {item.status === 1 ? (
                      <button className="ghost-button" type="button" onClick={() => void handleOffline(item.id)}>
                        下线
                      </button>
                    ) : null}
                    {item.status === 2 ? (
                      <>
                        <button className="ghost-button" type="button" onClick={() => void handlePublish(item.id, '重新上线')}>
                          重新上线
                        </button>
                        <button className="ghost-button" type="button" onClick={() => void handleDelete(item.id)}>
                          删除
                        </button>
                      </>
                    ) : null}
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
              onClick={() => void load(paperType, Math.max(1, payload.page.pageNo - 1))}
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
              onClick={() => void load(paperType, payload.page.pageNo + 1)}
            >
              下一页
            </button>
          </div>
        ) : null}
      </section>

      {error ? <div className="error-banner">{error}</div> : null}
      {message ? <div className="status-note">{message}</div> : null}
    </div>
  );
}
