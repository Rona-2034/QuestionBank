import { FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchAdminQuestions } from '../api';
import type { QuestionListPayload } from '../types';

const initialFilters = {
  fieldId: 0,
  knowledge: 0,
  questionType: 0,
  answerStageId: 0,
  searchParam: 0,
  page: 1,
};

export function AdminQuestionsPage() {
  const [filters, setFilters] = useState(initialFilters);
  const [payload, setPayload] = useState<QuestionListPayload | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    void fetchAdminQuestions(filters)
      .then(setPayload)
      .catch((requestError) => {
        setError(requestError instanceof Error ? requestError.message : '加载失败');
      });
  }, [filters]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setFilters((previous) => ({ ...previous, page: 1 }));
  };

  return (
    <div className="page-stack">
      <section className="panel">
        <div className="panel-heading">
          <h2>题库管理</h2>
          <span>
            兼容旧系统筛选结构与分页规则
            {' '}
            <Link className="ghost-button" to="/admin/questions/new" style={{ marginLeft: 12 }}>
              新增试题
            </Link>
            <Link className="ghost-button" to="/admin/question-import" style={{ marginLeft: 12 }}>
              导入试题
            </Link>
          </span>
        </div>
        <form className="filter-grid" onSubmit={handleSubmit}>
          <label>
            题库
            <select
              value={filters.fieldId}
              onChange={(event) =>
                setFilters((previous) => ({ ...previous, fieldId: Number(event.target.value) }))
              }
            >
              <option value={0}>全部</option>
              {payload?.fieldList.map((field) => (
                <option key={field.fieldId} value={field.fieldId}>
                  {field.fieldName}
                </option>
              ))}
            </select>
          </label>
          <label>
            知识类
            <select
              value={filters.knowledge}
              onChange={(event) =>
                setFilters((previous) => ({ ...previous, knowledge: Number(event.target.value) }))
              }
            >
              <option value={0}>全部</option>
              {payload?.knowledgeList.map((item) => (
                <option key={item.pointId} value={item.pointId}>
                  {item.pointName}
                </option>
              ))}
            </select>
          </label>
          <label>
            题型
            <select
              value={filters.questionType}
              onChange={(event) =>
                setFilters((previous) => ({ ...previous, questionType: Number(event.target.value) }))
              }
            >
              <option value={0}>全部</option>
              {payload?.questionTypeList.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            答题人阶段
            <select
              value={filters.answerStageId}
              onChange={(event) =>
                setFilters((previous) => ({
                  ...previous,
                  answerStageId: Number(event.target.value),
                }))
              }
            >
              <option value={0}>全部</option>
              {payload?.answerStageList.map((item) => (
                <option key={item.stageId} value={item.stageId}>
                  {item.stageName}
                </option>
              ))}
            </select>
          </label>
          <label>
            关键字
            <input
              value={String(filters.searchParam === 0 ? '' : filters.searchParam)}
              onChange={(event) =>
                setFilters((previous) => ({
                  ...previous,
                  searchParam: event.target.value === '' ? 0 : Number(event.target.value),
                }))
              }
            />
          </label>
          <button className="primary-button" type="submit">
            筛选
          </button>
        </form>
      </section>

      {error ? <div className="error-banner">{error}</div> : null}

      <section className="panel">
        <div className="panel-heading">
          <h2>试题列表</h2>
          <span>{payload?.page.totalRecord || 0} 条记录</span>
        </div>
        <div className="table-shell">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>标题</th>
                <th>题型</th>
                <th>创建人</th>
                <th>考点</th>
                <th>关键点</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {payload?.items.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.name || '-'}</td>
                  <td>{item.question_type_id || '-'}</td>
                  <td>{item.creator || '-'}</td>
                  <td>{item.examingPoint || '-'}</td>
                  <td>{item.keyword || '-'}</td>
                  <td>
                    <Link className="ghost-button" to={`/admin/questions/${item.id}`}>
                      详情/分类
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="pagination-bar">
          <button
            className="ghost-button"
            disabled={!payload || payload.page.pageNo <= 1}
            onClick={() =>
              setFilters((previous) => ({ ...previous, page: Math.max(1, previous.page - 1) }))
            }
          >
            上一页
          </button>
          <span>
            第 {payload?.page.pageNo || 1} / {payload?.page.totalPage || 1} 页
          </span>
          <button
            className="ghost-button"
            disabled={!payload || payload.page.pageNo >= payload.page.totalPage}
            onClick={() =>
              setFilters((previous) => ({ ...previous, page: previous.page + 1 }))
            }
          >
            下一页
          </button>
        </div>
      </section>
    </div>
  );
}
