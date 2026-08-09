import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  deleteAdminQuestion,
  fetchAdminPoints,
  fetchAdminQuestionAnswerStage,
  fetchAdminQuestionDetail,
  updateAdminQuestionClassification,
} from '../api';
import type { AdminQuestionDetailPayload, AdminPointItem } from '../types';

export function AdminQuestionDetailPage() {
  const navigate = useNavigate();
  const { questionId } = useParams();
  const [payload, setPayload] = useState<AdminQuestionDetailPayload | null>(null);
  const [points, setPoints] = useState<AdminPointItem[]>([]);
  const [fieldId, setFieldId] = useState(0);
  const [pointId, setPointId] = useState(0);
  const [answerStageId, setAnswerStageId] = useState(0);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const id = Number(questionId);
    if (!id) {
      setError('无效的试题 ID');
      return;
    }

    const load = async () => {
      try {
        const [detail, stage] = await Promise.all([
          fetchAdminQuestionDetail(id),
          fetchAdminQuestionAnswerStage(id),
        ]);
        setPayload(detail);

        const nextFieldId = detail.fieldList[0]?.fieldId || 0;
        setFieldId(nextFieldId);

        if (nextFieldId) {
          const pointsResponse = await fetchAdminPoints(nextFieldId, 1);
          setPoints(pointsResponse.items);
        } else {
          setPoints([]);
        }

        const currentPointId = detail.question.pointList?.[0] || detail.pointList[0]?.pointId || 0;
        setPointId(currentPointId);
        if (stage.object?.stageId) {
          setAnswerStageId(stage.object.stageId);
        } else if (detail.question.answerStageId) {
          setAnswerStageId(detail.question.answerStageId);
        } else {
          setAnswerStageId(0);
        }
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : '加载失败');
      }
    };

    void load();
  }, [questionId]);

  const handleFieldChange = async (nextFieldId: number) => {
    setFieldId(nextFieldId);
    try {
      const nextPoints = nextFieldId ? await fetchAdminPoints(nextFieldId, 1) : { items: [] };
      setPoints(nextPoints.items);
      const firstPoint = nextPoints.items[0]?.pointId || 0;
      setPointId(firstPoint);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '加载知识类失败');
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!questionId) {
      return;
    }
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const response = await updateAdminQuestionClassification(Number(questionId), {
        pointId,
        answerStageId,
      });
      if (response.result === 'success') {
        setMessage('试题分类已更新');
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
    if (!questionId) {
      return;
    }
    if (!window.confirm('确定删除此试题？')) {
      return;
    }
    try {
      const response = await deleteAdminQuestion(Number(questionId));
      if (response.result === 'success') {
        navigate('/admin/questions');
      } else {
        setError(response.messageInfo || response.result || '删除失败');
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '删除失败');
    }
  };

  const selectedField = payload?.fieldList.find((item) => item.fieldId === fieldId);
  const question = payload?.question;

  if (error && !payload) {
    return <div className="error-banner">{error}</div>;
  }
  if (!payload || !question) {
    return <div className="page-state">正在加载试题详情...</div>;
  }

  return (
    <div className="page-stack">
      <section className="panel">
        <div className="panel-heading">
          <h2>试题详情</h2>
          <span>
            <Link className="ghost-button" to="/admin/questions">
              返回题库
            </Link>
            <button className="ghost-button" type="button" style={{ marginLeft: 12 }} onClick={() => void handleDelete()}>
              删除试题
            </button>
          </span>
        </div>
        <div className="profile-grid" style={{ marginBottom: 16 }}>
          <div className="profile-card">
            <span>ID</span>
            <strong>{question.id}</strong>
          </div>
          <div className="profile-card">
            <span>标题</span>
            <strong>{question.name || '-'}</strong>
          </div>
          <div className="profile-card">
            <span>题型</span>
            <strong>{question.questionTypeName || question.question_type_id || '-'}</strong>
          </div>
          <div className="profile-card">
            <span>题库</span>
            <strong>{question.fieldName || '-'}</strong>
          </div>
        </div>
        <div className="panel" style={{ margin: 0 }}>
          <div className="panel-heading">
            <h2>内容</h2>
            <span>保留后端原始结构</span>
          </div>
          <pre className="status-note" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
            {question.content || JSON.stringify(question.questionContent || {}, null, 2)}
          </pre>
        </div>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <h2>分类修改</h2>
          <span>仅更新知识类与答题人阶段</span>
        </div>
        <form className="filter-grid" onSubmit={handleSubmit}>
          <label>
            题库
            <select value={fieldId} onChange={(event) => void handleFieldChange(Number(event.target.value))}>
              {payload.fieldList.map((field) => (
                <option key={field.fieldId} value={field.fieldId}>
                  {field.fieldName}
                </option>
              ))}
            </select>
          </label>
          <label>
            知识类
            <select value={pointId} onChange={(event) => setPointId(Number(event.target.value))}>
              {points.map((item) => (
                <option key={item.pointId} value={item.pointId}>
                  {item.pointName}
                </option>
              ))}
            </select>
          </label>
          <label>
            答题人阶段
            <select value={answerStageId} onChange={(event) => setAnswerStageId(Number(event.target.value))}>
              <option value={0}>未设置</option>
              {payload.answerStageList.map((item) => (
                <option key={item.stageId} value={item.stageId}>
                  {item.stageName}
                </option>
              ))}
            </select>
          </label>
          <button className="primary-button" type="submit" disabled={saving}>
            {saving ? '保存中...' : '保存分类'}
          </button>
        </form>
        {selectedField ? (
          <p className="status-note" style={{ marginTop: 12 }}>
            当前题库：{selectedField.fieldName}，共 {points.length} 个知识类可选
          </p>
        ) : null}
        {message ? <div className="status-note" style={{ marginTop: 12 }}>{message}</div> : null}
      </section>
    </div>
  );
}
