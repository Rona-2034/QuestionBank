import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createAdminExamPaper, fetchAdminFields, fetchAdminPoints } from '../api';
import type { AdminFieldItem, AdminPointItem, PageInfo } from '../types';

const QUESTION_TYPES = [
  { id: 1, name: '单选题' },
  { id: 2, name: '多选题' },
  { id: 3, name: '判断题' },
  { id: 4, name: '填空题' },
  { id: 5, name: '简答题' },
  { id: 6, name: '论述题' },
  { id: 7, name: '分析题' },
];

export function AdminExamPaperCreatePage() {
  const navigate = useNavigate();
  const [fields, setFields] = useState<AdminFieldItem[]>([]);
  const [fieldId, setFieldId] = useState(0);
  const [points, setPoints] = useState<AdminPointItem[]>([]);
  const [page, setPage] = useState<PageInfo | null>(null);
  const [selectedPointIds, setSelectedPointIds] = useState<number[]>([]);
  const [paperName, setPaperName] = useState('');
  const [createMode, setCreateMode] = useState('2');
  const [paperType, setPaperType] = useState('2');
  const [duration, setDuration] = useState(120);
  const [passPoint, setPassPoint] = useState(60);
  const [paperPoint, setPaperPoint] = useState(100);
  const [questionTypeNum, setQuestionTypeNum] = useState<Record<number, number>>({});
  const [questionTypePoint, setQuestionTypePoint] = useState<Record<number, number>>({});
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  const loadPoints = async (nextFieldId = fieldId, nextPage = 1) => {
    if (!nextFieldId) {
      setPoints([]);
      setPage(null);
      return;
    }
    try {
      const response = await fetchAdminPoints(nextFieldId, nextPage);
      setFieldId(nextFieldId);
      setPoints(response.items);
      setPage(response.page);
      setError('');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '加载知识类失败');
    }
  };

  useEffect(() => {
    void fetchAdminFields(1)
      .then((response) => {
        setFields(response.items);
        const firstFieldId = response.items[0]?.fieldId || 0;
        if (firstFieldId) {
          void loadPoints(firstFieldId, 1);
        }
      })
      .catch((requestError) => {
        setError(requestError instanceof Error ? requestError.message : '加载题库失败');
      });
  }, []);

  useEffect(() => {
    const total = QUESTION_TYPES.reduce((sum, item) => {
      const amount = Number(questionTypeNum[item.id] || 0);
      const point = Number(questionTypePoint[item.id] || 0);
      return sum + amount * point;
    }, 0);
    setPaperPoint(total > 0 ? total : 0);
  }, [questionTypeNum, questionTypePoint]);

  const togglePoint = (pointId: number) => {
    setSelectedPointIds((current) =>
      current.includes(pointId)
        ? current.filter((item) => item !== pointId)
        : [...current, pointId],
    );
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setMessage('');

    if (!paperName || paperName.length > 40) {
      setError('试卷名称请保持在 1 到 40 个字符以内');
      return;
    }
    if (Number.isNaN(duration) || duration <= 30 || duration >= 241) {
      setError('考试时长必须设置在 30 到 240 分钟之间');
      return;
    }

    const effectiveTotalPoint = createMode === '2' ? paperPoint : 100;
    if (Number.isNaN(passPoint) || passPoint < 0 || passPoint > effectiveTotalPoint) {
      setError('及格分数必须小于或等于总分数');
      return;
    }

    if (createMode === '2') {
      if (!Number.isInteger(paperPoint) || paperPoint <= 0) {
        setError('总分必须是大于 0 的整数');
        return;
      }
      if (selectedPointIds.length === 0) {
        setError('至少选择一个知识类');
        return;
      }
      if (selectedPointIds.length > 100) {
        setError('知识类数量不应该超过 100 个');
        return;
      }
    }

    const knowledgeRateMap: Record<string, number> = {};
    if (createMode === '2') {
      selectedPointIds.forEach((pointId) => {
        knowledgeRateMap[String(pointId)] = 0;
      });
    }

    setSaving(true);
    try {
      const response = await createAdminExamPaper({
        paperName,
        paperType,
        time: duration,
        passPoint,
        paperPoint: effectiveTotalPoint,
        questionTypeNum:
          createMode === '2'
            ? Object.fromEntries(QUESTION_TYPES.map((item) => [String(item.id), Number(questionTypeNum[item.id] || 0)]))
            : undefined,
        questionTypePoint:
          createMode === '2'
            ? Object.fromEntries(QUESTION_TYPES.map((item) => [String(item.id), Number(questionTypePoint[item.id] || 0)]))
            : undefined,
        questionKnowledgePointRate: knowledgeRateMap,
      });
      if (response.result === 'success' && response.generatedId) {
        setMessage('试卷已创建');
        navigate(`/admin/exampaper-edit/${response.generatedId}`);
      } else {
        setError(response.messageInfo || response.result || '创建失败');
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '创建失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-stack">
      <section className="panel">
        <div className="panel-heading">
          <h2>创建新试卷</h2>
          <span>
            <Link className="ghost-button" to="/admin/exam-papers">
              返回列表
            </Link>
          </span>
        </div>
        <form className="filter-grid" onSubmit={handleSubmit}>
          <label>
            试卷名称
            <input value={paperName} onChange={(event) => setPaperName(event.target.value)} />
          </label>
          <label>
            组卷方式
            <select value={createMode} onChange={(event) => setCreateMode(event.target.value)}>
              <option value="2">自动组卷</option>
              <option value="1">手动组卷</option>
            </select>
          </label>
          <label>
            试卷类型
            <select value={paperType} onChange={(event) => setPaperType(event.target.value)}>
              <option value="3">专家试卷</option>
              <option value="2">模拟考试</option>
              <option value="1">随机试卷</option>
            </select>
          </label>
          <label>
            及格分数
            <input type="number" value={passPoint} onChange={(event) => setPassPoint(Number(event.target.value))} />
          </label>
          <label>
            时长(分钟)
            <input type="number" value={duration} onChange={(event) => setDuration(Number(event.target.value))} />
          </label>
          {createMode === '2' ? (
            <label>
              总分
              <input type="number" readOnly value={paperPoint} />
            </label>
          ) : null}
          <button className="primary-button" type="submit" disabled={saving}>
            {saving ? '创建中...' : '创建试卷'}
          </button>
        </form>
      </section>

      {createMode === '2' ? (
        <>
          <section className="panel">
            <div className="panel-heading">
              <h2>题型分布</h2>
              <span>自动组卷时按题量与分值生成总分</span>
            </div>
            <div className="table-shell">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>题型</th>
                    <th>数量</th>
                    <th>单题分值</th>
                  </tr>
                </thead>
                <tbody>
                  {QUESTION_TYPES.map((item) => (
                    <tr key={item.id}>
                      <td>{item.name}</td>
                      <td>
                        <input
                          type="number"
                          min={0}
                          value={questionTypeNum[item.id] || 0}
                          onChange={(event) =>
                            setQuestionTypeNum((current) => ({
                              ...current,
                              [item.id]: Number(event.target.value),
                            }))
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min={0}
                          value={questionTypePoint[item.id] || 0}
                          onChange={(event) =>
                            setQuestionTypePoint((current) => ({
                              ...current,
                              [item.id]: Number(event.target.value),
                            }))
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="panel">
            <div className="panel-heading">
              <h2>知识类范围</h2>
              <span>至少选择一个知识类，最多 100 个</span>
            </div>
            <label style={{ maxWidth: 280, display: 'block' }}>
              <span className="status-note">题库</span>
              <select value={fieldId} onChange={(event) => void loadPoints(Number(event.target.value), 1)}>
                {fields.map((field) => (
                  <option key={field.fieldId} value={field.fieldId}>
                    {field.fieldName}
                  </option>
                ))}
              </select>
            </label>
            <div className="result-list" style={{ marginTop: 16 }}>
              {points.map((point) => (
                <article key={point.pointId} className="practice-card">
                  <label style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <input
                      type="checkbox"
                      checked={selectedPointIds.includes(point.pointId)}
                      onChange={() => togglePoint(point.pointId)}
                    />
                    <div>
                      <strong>{point.pointName}</strong>
                      <div className="status-note">{point.memo || '知识类'}</div>
                    </div>
                  </label>
                </article>
              ))}
            </div>
            {page ? (
              <div className="pagination-bar">
                <button
                  className="ghost-button"
                  disabled={page.pageNo <= 1}
                  type="button"
                  onClick={() => void loadPoints(fieldId, Math.max(1, page.pageNo - 1))}
                >
                  上一页
                </button>
                <span>
                  第 {page.pageNo} / {page.totalPage} 页
                </span>
                <button
                  className="ghost-button"
                  disabled={page.pageNo >= page.totalPage}
                  type="button"
                  onClick={() => void loadPoints(fieldId, page.pageNo + 1)}
                >
                  下一页
                </button>
              </div>
            ) : null}
            <p className="status-note" style={{ marginTop: 16 }}>
              已选择 {selectedPointIds.length} 个知识类
            </p>
          </section>
        </>
      ) : (
        <section className="panel">
          <div className="panel-heading">
            <h2>手动组卷说明</h2>
            <span>旧系统手动组卷先创建空试卷，再进入后续内容编辑</span>
          </div>
          <p className="status-note">
            当前会按旧逻辑提交空的知识类范围，后端创建试卷后再进入编辑页。
          </p>
        </section>
      )}

      {error ? <div className="error-banner">{error}</div> : null}
      {message ? <div className="status-note">{message}</div> : null}
    </div>
  );
}
