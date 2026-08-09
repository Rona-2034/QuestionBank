import { useEffect, useState } from 'react';
import { fetchStudentExamHistory } from '../api';
import type { StudentExamHistoryPayload } from '../types';

export function StudentExamHistoryPage() {
  const [payload, setPayload] = useState<StudentExamHistoryPayload | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    void fetchStudentExamHistory(1)
      .then(setPayload)
      .catch((requestError) => {
        setError(requestError instanceof Error ? requestError.message : '加载失败');
      });
  }, []);

  if (error) {
    return <div className="error-banner">{error}</div>;
  }
  if (!payload) {
    return <div className="page-state">正在加载考试历史...</div>;
  }

  return (
    <div className="page-stack">
      <section className="panel">
        <div className="panel-heading">
          <h2>考试历史</h2>
          <span>沿用旧系统提交记录</span>
        </div>
        <div className="table-shell">
          <table className="data-table">
            <thead>
              <tr>
                <th>试卷</th>
                <th>得分</th>
                <th>创建时间</th>
                <th>提交时间</th>
              </tr>
            </thead>
            <tbody>
              {payload.items.map((item) => (
                <tr key={item.histId}>
                  <td>{item.paperName}</td>
                  <td>{item.pointGet}</td>
                  <td>{item.createTime || '-'}</td>
                  <td>{item.submitTime || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
