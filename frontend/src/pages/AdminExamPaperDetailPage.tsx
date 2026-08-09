import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  deleteAdminExamPaper,
  fetchAdminExamPaperContent,
  fetchAdminExamPaperDetail,
  fetchAdminQuestionDetailForAdd,
  fetchAdminQuestions,
  offlineAdminExamPaper,
  publishAdminExamPaper,
  saveAdminExamPaperContent,
  updateAdminExamPaper,
} from '../api';
import type {
  AdminExamPaperContentPayload,
  ExamPaper,
  QuestionListPayload,
  RenderedQuestion,
  RenderedQuestionItem,
} from '../types';

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

function getQuestionTypeLabel(questionTypeId: number) {
  switch (questionTypeId) {
    case 1:
      return '单选题';
    case 2:
      return '多选题';
    case 3:
      return '判断题';
    case 4:
      return '填空题';
    case 5:
      return '简答题';
    case 6:
      return '论述题';
    case 7:
      return '分析题';
    default:
      return `题型 ${questionTypeId}`;
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

function updateQuestionHtmlPoint(html: string, point: number) {
  const container = document.createElement('div');
  container.innerHTML = html;
  container.querySelectorAll('.question-point').forEach((item) => {
    item.textContent = Number.isInteger(point) ? String(point) : String(point);
  });
  return container.innerHTML;
}

function normalizeAddedQuestion(question: RenderedQuestion): RenderedQuestionItem {
  return {
    question: {
      ...question,
      questionPoint: Number(question.questionPoint || 0),
    },
    html: question.content,
  };
}

export function AdminExamPaperDetailPage() {
  const navigate = useNavigate();
  const { examPaperId } = useParams();
  const [paper, setPaper] = useState<ExamPaper | null>(null);
  const [name, setName] = useState('');
  const [duration, setDuration] = useState(0);
  const [passPoint, setPassPoint] = useState(0);
  const [totalPoint, setTotalPoint] = useState(0);
  const [paperType, setPaperType] = useState('2');
  const [summary, setSummary] = useState('');
  const [contentItems, setContentItems] = useState<RenderedQuestionItem[]>([]);
  const [selectorPayload, setSelectorPayload] = useState<QuestionListPayload | null>(null);
  const [selectorFilters, setSelectorFilters] = useState({
    fieldId: 0,
    knowledge: 0,
    questionType: 0,
    answerStageId: 0,
    searchParam: '',
    page: 1,
  });
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<number[]>([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [savingContent, setSavingContent] = useState(false);

  const refresh = async () => {
    if (!examPaperId) {
      return;
    }
    const [detail, content] = await Promise.all([
      fetchAdminExamPaperDetail(Number(examPaperId)),
      fetchAdminExamPaperContent(Number(examPaperId)),
    ]);
    setPaper(detail.paper);
    setName(detail.paper?.name || '');
    setDuration(detail.paper?.duration || 0);
    setPassPoint(detail.paper?.pass_point || 0);
    setTotalPoint(detail.paper?.total_point || 0);
    setPaperType(detail.paper?.paper_type || '2');
    setSummary(detail.paper?.summary || '');
    setContentItems((content as AdminExamPaperContentPayload).items || []);
    setError('');
  };

  useEffect(() => {
    void refresh().catch((requestError) => {
      setError(requestError instanceof Error ? requestError.message : '加载失败');
    });
  }, [examPaperId]);

  useEffect(() => {
    void fetchAdminQuestions({
      fieldId: selectorFilters.fieldId,
      knowledge: selectorFilters.knowledge,
      questionType: selectorFilters.questionType,
      answerStageId: selectorFilters.answerStageId,
      searchParam: selectorFilters.searchParam.trim() || 0,
      page: selectorFilters.page,
    })
      .then((payload) => {
        setSelectorPayload(payload);
      })
      .catch((requestError) => {
        setError(requestError instanceof Error ? requestError.message : '加载候选试题失败');
      });
  }, [selectorFilters]);

  const computedTotalPoint = useMemo(
    () => contentItems.reduce((sum, item) => sum + Number(item.question.questionPoint || 0), 0),
    [contentItems],
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!examPaperId) {
      return;
    }
    if (!name || name.length > 40) {
      setError('试卷名称请保持在 1 到 40 个字符以内');
      return;
    }
    if (Number.isNaN(duration) || duration <= 30 || duration >= 241) {
      setError('考试时长必须设置在 30 到 240 分钟之间');
      return;
    }
    if (!Number.isInteger(totalPoint) || totalPoint <= 0) {
      setError('总分必须是大于 0 的整数');
      return;
    }
    if (Number.isNaN(passPoint) || passPoint < 0 || passPoint > totalPoint) {
      setError('及格分数必须小于或等于总分数');
      return;
    }

    setSaving(true);
    setError('');
    setMessage('');
    try {
      const response = await updateAdminExamPaper(Number(examPaperId), {
        name,
        duration,
        pass_point: passPoint,
        total_point: totalPoint,
        paper_type: paperType,
        summary,
      });
      if (response.result === 'success') {
        setMessage('试卷属性已更新');
        await refresh();
      } else {
        setError(response.messageInfo || response.result || '更新失败');
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '更新失败');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!examPaperId || !window.confirm('确定删除此试卷？')) {
      return;
    }
    try {
      const response = await deleteAdminExamPaper(Number(examPaperId));
      if (response.result === 'success') {
        navigate('/admin/exam-papers');
      } else {
        setError(response.messageInfo || response.result || '删除失败');
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '删除失败');
    }
  };

  const handlePublish = async () => {
    if (!examPaperId || !window.confirm('确定上线吗？上线后的试卷将可以进行考试')) {
      return;
    }
    const response = await publishAdminExamPaper(Number(examPaperId));
    if (response.result === 'success') {
      setMessage('试卷成功上线');
      await refresh();
      return;
    }
    setError(response.messageInfo || response.result || '上线失败');
  };

  const handleOffline = async () => {
    if (!examPaperId || !window.confirm('确定下线吗？下线后的试卷将无法再进行考试')) {
      return;
    }
    const response = await offlineAdminExamPaper(Number(examPaperId));
    if (response.result === 'success') {
      setMessage('试卷已成功下线');
      await refresh();
      return;
    }
    setError(response.messageInfo || response.result || '下线失败');
  };

  const handlePointChange = (questionId: number, point: number) => {
    setContentItems((current) =>
      current.map((item) =>
        item.question.questionId === questionId
          ? {
            ...item,
            question: {
              ...item.question,
              questionPoint: point,
            },
            html: updateQuestionHtmlPoint(item.html, point),
          }
          : item,
      ),
    );
  };

  const handleBatchPointChange = (questionTypeId: number, point: number) => {
    setContentItems((current) =>
      current.map((item) =>
        item.question.questionTypeId === questionTypeId
          ? {
            ...item,
            question: {
              ...item.question,
              questionPoint: point,
            },
            html: updateQuestionHtmlPoint(item.html, point),
          }
          : item,
      ),
    );
  };

  const handleRemoveQuestion = (questionId: number) => {
    setContentItems((current) => current.filter((item) => item.question.questionId !== questionId));
  };

  const handleAddQuestions = async () => {
    if (!selectedQuestionIds.length) {
      setError('请选择需要添加的试题');
      return;
    }
    setError('');
    try {
      const response = await fetchAdminQuestionDetailForAdd(selectedQuestionIds);
      const existedIds = new Set(contentItems.map((item) => item.question.questionId));
      const nextItems = response
        .map(normalizeAddedQuestion)
        .filter((item) => !existedIds.has(item.question.questionId));
      if (!nextItems.length) {
        setMessage('选中的试题已全部存在于当前试卷中');
        return;
      }
      setContentItems((current) => [...current, ...nextItems]);
      setSelectedQuestionIds([]);
      setMessage(`已添加 ${nextItems.length} 道试题`);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '添加试题失败');
    }
  };

  const handleSaveContent = async () => {
    if (!examPaperId) {
      return;
    }
    if (!contentItems.length) {
      setError('试卷至少需要保留一道题');
      return;
    }
    const uniqueCount = new Set(contentItems.map((item) => item.question.questionId)).size;
    if (uniqueCount !== contentItems.length) {
      setError('存在重复的题目，请检查');
      return;
    }
    if (!Number.isInteger(computedTotalPoint)) {
      setError('总分不能有小数');
      return;
    }

    setSavingContent(true);
    setError('');
    try {
      const payload = Object.fromEntries(
        contentItems.map((item) => [item.question.questionId, Number(item.question.questionPoint || 0)]),
      );
      const response = await saveAdminExamPaperContent(Number(examPaperId), payload);
      if (response.result === 'success') {
        setMessage('试卷内容已保存');
        await refresh();
      } else {
        setError(response.messageInfo || response.result || '保存失败');
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '保存失败');
    } finally {
      setSavingContent(false);
    }
  };

  if (error && !paper) {
    return <div className="error-banner">{error}</div>;
  }
  if (!paper) {
    return <div className="page-state">正在加载试卷详情...</div>;
  }

  return (
    <div className="page-stack">
      <section className="panel">
        <div className="panel-heading">
          <h2>修改试卷属性</h2>
          <span>
            <Link className="ghost-button" to="/admin/exam-papers">
              返回列表
            </Link>
          </span>
        </div>
        <div className="profile-grid" style={{ marginBottom: 16 }}>
          <div className="profile-card">
            <span>ID</span>
            <strong>{paper.id}</strong>
          </div>
          <div className="profile-card">
            <span>状态</span>
            <strong>{getStatusLabel(paper.status)}</strong>
          </div>
          <div className="profile-card">
            <span>类型</span>
            <strong>{getPaperTypeLabel(paper.paper_type)}</strong>
          </div>
          <div className="profile-card">
            <span>内容总分</span>
            <strong>{computedTotalPoint}</strong>
          </div>
        </div>
        <div className="secondary-actions" style={{ marginBottom: 16 }}>
          {paper.status !== 1 ? (
            <button className="ghost-button" type="button" onClick={() => void handlePublish()}>
              {paper.status === 2 ? '重新上线' : '上线'}
            </button>
          ) : null}
          {paper.status === 1 ? (
            <button className="ghost-button" type="button" onClick={() => void handleOffline()}>
              下线
            </button>
          ) : null}
          {paper.status !== 1 ? (
            <button className="ghost-button" type="button" onClick={() => void handleDelete()}>
              删除
            </button>
          ) : null}
        </div>
        <form className="filter-grid" onSubmit={handleSubmit}>
          <label>
            试卷名称
            <input value={name} onChange={(event) => setName(event.target.value)} />
          </label>
          <label>
            时长(分钟)
            <input type="number" value={duration} onChange={(event) => setDuration(Number(event.target.value))} />
          </label>
          <label>
            及格分数
            <input type="number" value={passPoint} onChange={(event) => setPassPoint(Number(event.target.value))} />
          </label>
          <label>
            总分
            <input type="number" value={totalPoint} onChange={(event) => setTotalPoint(Number(event.target.value))} />
          </label>
          <label>
            试卷类型
            <select value={paperType} onChange={(event) => setPaperType(event.target.value)}>
              <option value="1">随机试卷</option>
              <option value="2">模拟考试</option>
              <option value="3">专家试卷</option>
            </select>
          </label>
          <label>
            说明
            <input value={summary} onChange={(event) => setSummary(event.target.value)} />
          </label>
          <button className="primary-button" type="submit" disabled={saving}>
            {saving ? '保存中...' : '保存试卷属性'}
          </button>
        </form>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <h2>试卷内容编辑</h2>
          <span>
            共 {contentItems.length} 题 / 当前总分 {computedTotalPoint}
          </span>
        </div>
        <div className="secondary-actions" style={{ marginBottom: 16 }}>
          <button className="primary-button" type="button" onClick={() => void handleSaveContent()} disabled={savingContent}>
            {savingContent ? '保存中...' : '保存试卷内容'}
          </button>
        </div>
        <ol className="question-render-list">
          {contentItems.map((item, index) => (
            <li key={item.question.questionId}>
              <div className="panel" style={{ marginBottom: 12 }}>
                <div className="panel-heading">
                  <h2>
                    第 {index + 1} 题
                    {' '}
                    {getQuestionTypeLabel(item.question.questionTypeId)}
                  </h2>
                  <span>ID {item.question.questionId}</span>
                </div>
                <div className="filter-grid" style={{ marginBottom: 12 }}>
                  <label>
                    分值
                    <input
                      type="number"
                      min={0}
                      step="0.5"
                      value={item.question.questionPoint}
                      onChange={(event) => handlePointChange(item.question.questionId, Number(event.target.value))}
                    />
                  </label>
                  <button
                    className="ghost-button"
                    type="button"
                    onClick={() => {
                      const nextPoint = window.prompt('输入该题型统一分值', String(item.question.questionPoint));
                      if (!nextPoint) {
                        return;
                      }
                      const point = Number(nextPoint);
                      if (Number.isNaN(point) || point <= 0) {
                        setError('请输入有效分值');
                        return;
                      }
                      handleBatchPointChange(item.question.questionTypeId, point);
                    }}
                  >
                    批量更新该题型分值
                  </button>
                  <button className="ghost-button" type="button" onClick={() => handleRemoveQuestion(item.question.questionId)}>
                    删除此题
                  </button>
                </div>
                <div dangerouslySetInnerHTML={{ __html: item.html }} />
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <h2>从题库添加试题</h2>
          <span>沿用旧系统筛选条件和 `question-detail4add` 渲染接口</span>
        </div>
        <form
          className="filter-grid"
          onSubmit={(event) => {
            event.preventDefault();
            setSelectorFilters((current) => ({ ...current, page: 1 }));
          }}
        >
          <label>
            题库
            <select
              value={selectorFilters.fieldId}
              onChange={(event) =>
                setSelectorFilters((current) => ({
                  ...current,
                  fieldId: Number(event.target.value),
                  knowledge: 0,
                  page: 1,
                }))
              }
            >
              <option value={0}>全部</option>
              {selectorPayload?.fieldList.map((field) => (
                <option key={field.fieldId} value={field.fieldId}>
                  {field.fieldName}
                </option>
              ))}
            </select>
          </label>
          <label>
            知识类
            <select
              value={selectorFilters.knowledge}
              onChange={(event) =>
                setSelectorFilters((current) => ({
                  ...current,
                  knowledge: Number(event.target.value),
                  page: 1,
                }))
              }
            >
              <option value={0}>全部</option>
              {selectorPayload?.knowledgeList.map((item) => (
                <option key={item.pointId} value={item.pointId}>
                  {item.pointName}
                </option>
              ))}
            </select>
          </label>
          <label>
            题型
            <select
              value={selectorFilters.questionType}
              onChange={(event) =>
                setSelectorFilters((current) => ({
                  ...current,
                  questionType: Number(event.target.value),
                  page: 1,
                }))
              }
            >
              <option value={0}>全部</option>
              {selectorPayload?.questionTypeList.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            答题人阶段
            <select
              value={selectorFilters.answerStageId}
              onChange={(event) =>
                setSelectorFilters((current) => ({
                  ...current,
                  answerStageId: Number(event.target.value),
                  page: 1,
                }))
              }
            >
              <option value={0}>全部</option>
              {selectorPayload?.answerStageList.map((item) => (
                <option key={item.stageId} value={item.stageId}>
                  {item.stageName}
                </option>
              ))}
            </select>
          </label>
          <label>
            关键字
            <input
              value={selectorFilters.searchParam}
              onChange={(event) =>
                setSelectorFilters((current) => ({
                  ...current,
                  searchParam: event.target.value,
                }))
              }
            />
          </label>
          <button className="ghost-button" type="submit">
            刷新候选题
          </button>
        </form>
        <div className="secondary-actions" style={{ margin: '16px 0' }}>
          <button className="primary-button" type="button" onClick={() => void handleAddQuestions()}>
            添加选中试题
          </button>
        </div>
        <div className="table-shell">
          <table className="data-table">
            <thead>
              <tr>
                <th></th>
                <th>ID</th>
                <th>标题</th>
                <th>题型</th>
                <th>题库</th>
                <th>考点</th>
              </tr>
            </thead>
            <tbody>
              {selectorPayload?.items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedQuestionIds.includes(item.id)}
                      onChange={(event) =>
                        setSelectedQuestionIds((current) =>
                          event.target.checked
                            ? [...current, item.id]
                            : current.filter((questionId) => questionId !== item.id)
                        )
                      }
                    />
                  </td>
                  <td>{item.id}</td>
                  <td>{item.name || '-'}</td>
                  <td>{item.questionTypeName || item.question_type_id || '-'}</td>
                  <td>{item.fieldName || '-'}</td>
                  <td>{item.examingPoint || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {selectorPayload ? (
          <div className="pagination-bar">
            <button
              className="ghost-button"
              disabled={selectorPayload.page.pageNo <= 1}
              type="button"
              onClick={() =>
                setSelectorFilters((current) => ({
                  ...current,
                  page: Math.max(1, selectorPayload.page.pageNo - 1),
                }))
              }
            >
              上一页
            </button>
            <span>
              第 {selectorPayload.page.pageNo} / {selectorPayload.page.totalPage} 页
            </span>
            <button
              className="ghost-button"
              disabled={selectorPayload.page.pageNo >= selectorPayload.page.totalPage}
              type="button"
              onClick={() =>
                setSelectorFilters((current) => ({
                  ...current,
                  page: selectorPayload.page.pageNo + 1,
                }))
              }
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
