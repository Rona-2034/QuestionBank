import { FormEvent, useEffect, useState } from 'react';
import { createAdminQuestion, fetchAdminAnswerStages, fetchAdminFields, fetchAdminPoints, uploadQuestionImage } from '../api';
import type { AdminAnswerStageItem, AdminFieldItem, AdminPointItem } from '../types';

const choiceKeys = ['A', 'B', 'C', 'D'];

export function AdminQuestionCreatePage() {
  const [fields, setFields] = useState<AdminFieldItem[]>([]);
  const [points, setPoints] = useState<AdminPointItem[]>([]);
  const [stages, setStages] = useState<AdminAnswerStageItem[]>([]);
  const [fieldId, setFieldId] = useState(1);
  const [pointId, setPointId] = useState(101);
  const [answerStageId, setAnswerStageId] = useState(201);
  const [questionTypeId, setQuestionTypeId] = useState(1);
  const [title, setTitle] = useState('');
  const [answer, setAnswer] = useState('A');
  const [analysis, setAnalysis] = useState('');
  const [referenceName, setReferenceName] = useState('');
  const [examingPoint, setExamingPoint] = useState('');
  const [keyword, setKeyword] = useState('');
  const [pointsValue, setPointsValue] = useState('5');
  const [titleImg, setTitleImg] = useState('');
  const [options, setOptions] = useState<Record<string, string>>({
    A: '',
    B: '',
    C: '',
    D: '',
  });
  const [optionImgs, setOptionImgs] = useState<Record<string, string>>({
    A: '',
    B: '',
    C: '',
    D: '',
  });
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = async (nextFieldId = fieldId) => {
    try {
      const [fieldPayload, pointPayload, stagePayload] = await Promise.all([
        fetchAdminFields(1),
        fetchAdminPoints(nextFieldId, 1),
        fetchAdminAnswerStages(1),
      ]);
      setFields(fieldPayload.items);
      setPoints(pointPayload.items);
      setStages(stagePayload.items);
      if (pointPayload.items.length > 0) {
        setPointId(pointPayload.items[0].pointId);
      }
      if (stagePayload.items.length > 0) {
        setAnswerStageId(stagePayload.items[0].stageId);
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '加载失败');
    }
  };

  const uploadImage = async (file: File, target: 'title' | string) => {
    if (!file.type.startsWith('image/')) {
      setError('只能上传图片文件');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('图片大小不能超过 2MB');
      return;
    }
    setUploading(true);
    setError('');
    try {
      const url = await uploadQuestionImage(file);
      if (target === 'title') {
        setTitleImg(url);
      } else {
        setOptionImgs((current) => ({ ...current, [target]: url }));
      }
      setMessage(`已上传图片：${file.name}`);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '图片上传失败');
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    void load(fieldId);
  }, [fieldId]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const choiceList = Object.fromEntries(
      choiceKeys.filter((key) => options[key].trim()).map((key) => [key, options[key].trim()]),
    );
    const payload = {
      name: title.slice(0, 10) || title,
      content: '',
      question_type_id: questionTypeId,
      create_time: new Date().toISOString(),
      creator: '',
      answer,
      analysis,
      referenceName,
      examingPoint,
      keyword,
      points: Number(pointsValue),
      pointList: [pointId],
      answerStageId,
      answerStageCreator: 0,
      questionContent: {
        title,
        titleImg,
        choiceList,
        choiceImgList: optionImgs,
      },
    };
    const response = await createAdminQuestion(payload);
    setMessage(response.messageInfo || response.result || 'created');
    setTitle('');
    setAnalysis('');
    setReferenceName('');
      setExamingPoint('');
      setKeyword('');
      setOptions({ A: '', B: '', C: '', D: '' });
      setTitleImg('');
      setOptionImgs({ A: '', B: '', C: '', D: '' });
    };

  if (error) {
    return <div className="error-banner">{error}</div>;
  }

  return (
    <div className="page-stack">
      <section className="panel">
        <div className="panel-heading">
          <h2>新增试题</h2>
          <span>保持原题型结构</span>
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
            知识点
            <select value={pointId} onChange={(event) => setPointId(Number(event.target.value))}>
              {points.map((point) => (
                <option key={point.pointId} value={point.pointId}>
                  {point.pointName}
                </option>
              ))}
            </select>
          </label>
          <label>
            阶段
            <select value={answerStageId} onChange={(event) => setAnswerStageId(Number(event.target.value))}>
              {stages.map((stage) => (
                <option key={stage.stageId} value={stage.stageId}>
                  {stage.stageName}
                </option>
              ))}
            </select>
          </label>
          <label>
            题型
            <select value={questionTypeId} onChange={(event) => setQuestionTypeId(Number(event.target.value))}>
              <option value={1}>单选题</option>
              <option value={2}>多选题</option>
              <option value={3}>判断题</option>
              <option value={4}>填空题</option>
            </select>
          </label>
          <label>
            分值
            <input value={pointsValue} onChange={(event) => setPointsValue(event.target.value)} />
          </label>
          <label>
            参考答案
            <select value={answer} onChange={(event) => setAnswer(event.target.value)}>
              {choiceKeys.map((key) => (
                <option key={key} value={key}>
                  {key}
                </option>
              ))}
            </select>
          </label>
          <label style={{ gridColumn: 'span 4' }}>
            标题
            <input value={title} onChange={(event) => setTitle(event.target.value)} />
          </label>
          <label style={{ gridColumn: 'span 4' }}>
            题干图片
            <input
              type="file"
              accept="image/*"
              disabled={uploading}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  void uploadImage(file, 'title');
                }
                event.currentTarget.value = '';
              }}
            />
            {titleImg ? (
              <a href={titleImg} target="_blank" rel="noreferrer" className="status-note">
                预览图片
              </a>
            ) : null}
          </label>
          <label style={{ gridColumn: 'span 2' }}>
            解析
            <input value={analysis} onChange={(event) => setAnalysis(event.target.value)} />
          </label>
          <label>
            出处
            <input value={referenceName} onChange={(event) => setReferenceName(event.target.value)} />
          </label>
          <label>
            考点
            <input value={examingPoint} onChange={(event) => setExamingPoint(event.target.value)} />
          </label>
          <label>
            关键点
            <input value={keyword} onChange={(event) => setKeyword(event.target.value)} />
          </label>
          {choiceKeys.map((key) => (
            <label key={key}>
              选项 {key}
              <input
                value={options[key]}
                onChange={(event) => setOptions((current) => ({ ...current, [key]: event.target.value }))}
              />
              <input
                type="file"
                accept="image/*"
                disabled={uploading}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    void uploadImage(file, key);
                  }
                  event.currentTarget.value = '';
                }}
              />
              {optionImgs[key] ? (
                <a href={optionImgs[key]} target="_blank" rel="noreferrer" className="status-note">
                  预览图片
                </a>
              ) : null}
            </label>
          ))}
          <button className="primary-button" type="submit">
            保存试题
          </button>
        </form>
        {message ? <p className="status-note">{message}</p> : null}
      </section>
    </div>
  );
}
