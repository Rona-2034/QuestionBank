import { FormEvent, useEffect, useState } from 'react';
import { createAdminQuestion, fetchAdminAnswerStages, fetchAdminFields, fetchAdminPoints, uploadQuestionImage } from '../api';
import type { AdminAnswerStageItem, AdminFieldItem, AdminPointItem } from '../types';

// 7 种题型（et_question_type），1~7
const QUESTION_TYPES = [
  { id: 1, name: '单选题' },
  { id: 2, name: '多选题' },
  { id: 3, name: '判断题' },
  { id: 4, name: '填空题' },
  { id: 5, name: '简答题' },
  { id: 6, name: '论述题' },
  { id: 7, name: '分析题' },
];

// 选项字母按 A/B/C/D/E/... 自适应编号
const letterForIndex = (index: number) => String.fromCharCode(65 + index);

export function AdminQuestionCreatePage() {
  const [fields, setFields] = useState<AdminFieldItem[]>([]);
  const [points, setPoints] = useState<AdminPointItem[]>([]);
  const [stages, setStages] = useState<AdminAnswerStageItem[]>([]);
  const [fieldId, setFieldId] = useState(1);
  const [pointId, setPointId] = useState(101);
  const [answerStageId, setAnswerStageId] = useState(201);
  const [questionTypeId, setQuestionTypeId] = useState(1);
  // 题干（分析题为情景/背景）
  const [title, setTitle] = useState('');
  const [answer, setAnswer] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [referenceName, setReferenceName] = useState('');
  const [examingPoint, setExamingPoint] = useState('');
  const [keyword, setKeyword] = useState('');
  const [pointsValue, setPointsValue] = useState('5');
  const [titleImg, setTitleImg] = useState('');

  // 单选/多选选项：字母为 key，动态增删（默认 A、B 起步）
  const [optionKeys, setOptionKeys] = useState<string[]>(['A', 'B']);
  const [options, setOptions] = useState<Record<string, string>>({ A: '', B: '' });
  const [optionImgs, setOptionImgs] = useState<Record<string, string>>({ A: '', B: '' });

  // 填空空位：每个元素为一个空位的参考答案
  const [fillBlanks, setFillBlanks] = useState<string[]>(['']);

  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const typeName = QUESTION_TYPES.find((t) => t.id === questionTypeId)?.name ?? '试题';

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

  // ---- 单选/多选 选项动态增删 ----
  const addOption = () => {
    const next = letterForIndex(optionKeys.length);
    setOptionKeys((current) => [...current, next]);
    setOptions((current) => ({ ...current, [next]: '' }));
    setOptionImgs((current) => ({ ...current, [next]: '' }));
  };

  const removeOption = (key: string) => {
    if (optionKeys.length <= 1) return;
    setOptionKeys((current) => current.filter((k) => k !== key));
    setOptions((current) => {
      const { [key]: _removed, ...rest } = current;
      return rest;
    });
    setOptionImgs((current) => {
      const { [key]: _removed, ...rest } = current;
      return rest;
    });
    if (questionTypeId === 1 && answer === key) {
      const next = optionKeys.find((k) => k !== key);
      if (next) setAnswer(next);
    }
    if (questionTypeId === 2) {
      setAnswer((prev) => prev.split('').filter((c) => c !== key).join(''));
    }
  };

  // 多选答案：勾选字母连写（自动排序，如 "ABD"）
  const toggleMultiOption = (key: string) => {
    setAnswer((prev) => {
      const letters = prev.includes(key) ? prev.replace(key, '') : prev + key;
      return letters.split('').sort().join('');
    });
  };

  // ---- 填空空位动态增删 ----
  const addFillBlank = () => setFillBlanks((current) => [...current, '']);
  const removeFillBlank = (index: number) =>
    setFillBlanks((current) => (current.length <= 1 ? current : current.filter((_, i) => i !== index)));
  const updateFillBlank = (index: number, value: string) =>
    setFillBlanks((current) => current.map((blank, i) => (i === index ? value : blank)));

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    // ---- 防空字符：统一 trim（存储与校验都用处理后的值）----
    const norm = (s: string) => (s ?? '').trim();
    const t = {
      title: norm(title),
      analysis: norm(analysis),
      referenceName: norm(referenceName),
      examingPoint: norm(examingPoint),
      keyword: norm(keyword),
    };

    // ---- 恶意内容拦截（防 XSS / 脚本注入）----
    const MALICIOUS = /<script|javascript:|on(click|error|load|mouseover)\s*=/i;
    const rawFields = [
      title, analysis, referenceName, examingPoint, keyword,
      answer, pointsValue, ...optionKeys.map((k) => options[k] ?? ''), ...fillBlanks,
    ];
    if (rawFields.some((v) => MALICIOUS.test(v))) {
      setError('检测到非法内容（脚本/事件注入被拦截）');
      return;
    }

    // ---- 按题型做规范性校验 ----
    let invalid = '';
    if (!t.title) {
      invalid = '请填写题干 / 情景内容';
    } else if (isChoice) {
      const nonEmptyOptions = optionKeys.filter((key) => (options[key] ?? '').trim());
      if (nonEmptyOptions.length === 0) invalid = '至少填写一个选项内容';
      else if (questionTypeId === 1 && !optionKeys.includes(answer)) invalid = '单项题请选择正确的答案选项';
      else if (questionTypeId === 2 && (answer.split('').some((letter) => !optionKeys.includes(letter)))) invalid = '多项题答案需在已有选项中勾选';
    } else if (questionTypeId === 4) {
      const blanks = fillBlanks.map((b) => b.trim()).filter((b) => b);
      if (blanks.length === 0) invalid = '填空题请至少填写一个空的答案';
    } else if (questionTypeId === 3) {
      if (answer !== '正确' && answer !== '错误') invalid = '判断题答案只能为正确/错误';
    } else if (questionTypeId === 5 || questionTypeId === 6 || questionTypeId === 7) {
      if (!norm(answer)) invalid = '请填写参考答案';
    }
    if (t.referenceName.length > 255 || t.examingPoint.length > 255 || t.keyword.length > 255) {
      invalid = '出处/考点/关键点不能超过 255 字符';
    } else if (t.analysis.length > 100000) {
      invalid = '解析内容过长';
    } else if (!Number.isFinite(Number(pointsValue)) || Number(pointsValue) <= 0) {
      invalid = '分值必须为正数';
    }
    if (invalid) {
      setError(invalid);
      return;
    }

    // ---- 参考答案长度护栏：answer 列为 VARCHAR(255)，超长会导致存库失败 ----
    let finalAnswer = norm(answer);
    let choiceList: Record<string, string> = {};
    let choiceImgList: Record<string, string> = {};
    if (questionTypeId === 1 || questionTypeId === 2) {
      choiceList = Object.fromEntries(
        optionKeys.filter((key) => (options[key] ?? '').trim()).map((key) => [key, (options[key] ?? '').trim()]),
      );
      choiceImgList = Object.fromEntries(optionKeys.filter((key) => optionImgs[key]).map((key) => [key, optionImgs[key]]));
    } else if (questionTypeId === 4) {
      // 填空题：多个空答案用 | 连接写入 answer
      finalAnswer = fillBlanks.map((b) => b.trim()).filter((b) => b).join('|');
    }
    // 判断题(3)/简答(5)/论述(6)/分析(7) 直接用 answer（正确/错误 或 参考答案文本框）.分析题情景放 questionContent.title。
    if (finalAnswer.length > (questionTypeId === 6 || questionTypeId === 7 ? 2000 : 255)) {
      setError(`参考答案过长：${typeName}最多 ${questionTypeId === 6 || questionTypeId === 7 ? 2000 : 255} 个字符`);
      return;
    }

    const payload = {
      name: t.title.slice(0, 10) || t.title,
      content: '',
      question_type_id: questionTypeId,
      create_time: new Date().toISOString(),
      creator: '',
      answer: finalAnswer,
      analysis: t.analysis,
      referenceName: t.referenceName,
      examingPoint: t.examingPoint,
      keyword: t.keyword,
      points: Number(pointsValue),
      pointList: [pointId],
      answerStageId,
      answerStageCreator: 0,
      questionContent: {
        title: t.title,
        titleImg,
        choiceList,
        choiceImgList,
      },
    };
    const response = await createAdminQuestion(payload);
    setMessage(response.messageInfo || response.result || 'created');
    setTitle('');
    setAnalysis('');
    setReferenceName('');
    setExamingPoint('');
    setKeyword('');
    setTitleImg('');
    setAnswer('');
    setOptionKeys(['A', 'B']);
    setOptions({ A: '', B: '' });
    setOptionImgs({ A: '', B: '' });
    setFillBlanks(['']);
  };

  if (error) {
    return <div className="error-banner">{error}</div>;
  }

  const isChoice = questionTypeId === 1 || questionTypeId === 2;

  return (
    <div className="page-stack">
      <section className="panel">
        <div className="panel-heading">
          <h2>新增试题</h2>
          <span>按题型动态渲染 · 支持 1~7 类题型</span>
        </div>
        <form onSubmit={handleSubmit}>
          {/* 通用横条：题库 / 知识点 / 阶段 / 题型 / 分值 / 解析 */}
          <div className="q-create-strip">
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
            <label className="q-create-type-field">
              题型
              <select value={questionTypeId} onChange={(event) => setQuestionTypeId(Number(event.target.value))}>
                {QUESTION_TYPES.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              分值
              <input value={pointsValue} onChange={(event) => setPointsValue(event.target.value)} />
            </label>
            <label>
              解析
              <input value={analysis} onChange={(event) => setAnalysis(event.target.value)} placeholder="整体解析" />
            </label>
          </div>

          {/* 题型专属区：随题型变化 */}
          <div className="q-create-zone">
            <div className="q-create-zone-head">
              <strong>当前题型：{typeName}</strong>
              <span>
                {isChoice ? '选项可动态增删' : questionTypeId === 4 ? '空答案用 | 分隔' : ''}
              </span>
            </div>

            {/* 题干 / 情景背景（所有题型共用）+ 题干图片 */}
            <label className="q-create-field">
              <span>{questionTypeId === 7 ? '情景 / 背景' : '题干'}</span>
              <input
                value={title}
                placeholder={questionTypeId === 7 ? '输入试题情景 / 背景' : '输入题目内容'}
                onChange={(event) => setTitle(event.target.value)}
              />
            </label>
            <label className="q-create-field">
              <span>题干图片</span>
              <div className="q-create-file">
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
                  <a href={titleImg} target="_blank" rel="noreferrer">
                    预览图片
                  </a>
                ) : null}
              </div>
            </label>

            {/* 1 单选 / 2 多选：动态选项区 */}
            {isChoice ? (
              <>
                {optionKeys.map((key) => (
                  <div className="q-create-row" key={key}>
                    <span className="q-create-opt-badge">{key}</span>
                    <div className="q-create-row-main">
                      <input
                        className="q-create-row-input"
                        placeholder={`选项 ${key}`}
                        value={options[key] ?? ''}
                        onChange={(event) => setOptions((current) => ({ ...current, [key]: event.target.value }))}
                      />
                      <div className="q-create-row-file">
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
                          <a href={optionImgs[key]} target="_blank" rel="noreferrer">
                            预览图片
                          </a>
                        ) : null}
                      </div>
                    </div>
                    <div className="q-create-row-answer">
                      {questionTypeId === 1 ? (
                        <label>
                          <input
                            type="radio"
                            name="q-create-single-answer"
                            checked={answer === key}
                            value={key}
                            onChange={(event) => setAnswer(event.target.value)}
                          />
                          设为答案
                        </label>
                      ) : (
                        <label>
                          <input
                            type="checkbox"
                            checked={answer.includes(key)}
                            onChange={() => toggleMultiOption(key)}
                          />
                          勾选为答案
                        </label>
                      )}
                    </div>
                    <button type="button" className="q-create-btn-del" onClick={() => removeOption(key)}>
                      🗑 删除
                    </button>
                  </div>
                ))}
                <div className="q-create-actions">
                  <button type="button" className="q-create-btn-add" onClick={addOption}>
                    ➕ 选项
                  </button>
                  <span className="q-create-hint">
                    {questionTypeId === 1 ? '单选答案单选一个字母' : '多选答案勾选多个字母（保存为连写，如 ABD）'}
                  </span>
                </div>
              </>
            ) : null}

            {/* 3 判断：固定 正确/错误 */}
            {questionTypeId === 3 ? (
              <>
                <label className="q-create-field">
                  <span>参考答案</span>
                  <select value={answer} onChange={(event) => setAnswer(event.target.value)}>
                    <option value="正确">正确</option>
                    <option value="错误">错误</option>
                  </select>
                </label>
              </>
            ) : null}

            {/* 4 填空：动态空位 */}
            {questionTypeId === 4 ? (
              <>
                {fillBlanks.map((blank, index) => (
                  <div className="q-create-row" key={index}>
                    <span className="q-create-num-badge">{index + 1}</span>
                    <div className="q-create-row-main">
                      <input
                        className="q-create-row-input"
                        placeholder={`第 ${index + 1} 空参考答案`}
                        value={blank}
                        onChange={(event) => updateFillBlank(index, event.target.value)}
                      />
                    </div>
                    <button type="button" className="q-create-btn-del" onClick={() => removeFillBlank(index)}>
                      🗑 删除
                    </button>
                  </div>
                ))}
                <div className="q-create-actions">
                  <button type="button" className="q-create-btn-add" onClick={addFillBlank}>
                    ➕ 填空
                  </button>
                  <span className="q-create-hint">保存时多个空答案用 | 连接，如「值1|值2」</span>
                </div>
              </>
            ) : null}

            {/* 5 简答：多行参考答案 */}
            {questionTypeId === 5 ? (
              <label className="q-create-field">
                <span>参考答案</span>
                <textarea rows={4} value={answer} onChange={(event) => setAnswer(event.target.value)} />
              </label>
            ) : null}

            {/* 6 论述：大号多行参考答案 */}
            {questionTypeId === 6 ? (
              <label className="q-create-field q-create-textarea-lg">
                <span>参考答案</span>
                <textarea rows={8} value={answer} onChange={(event) => setAnswer(event.target.value)} />
              </label>
            ) : null}

            {/* 7 分析：情景在题干，单个参考答案（与简答/论述处理一致，零后端改动） */}
            {questionTypeId === 7 ? (
              <label className="q-create-field q-create-textarea-lg">
                <span>参考答案</span>
                <textarea
                  rows={6}
                  value={answer}
                  placeholder="针对情景写出参考答案"
                  onChange={(event) => setAnswer(event.target.value)}
                />
              </label>
            ) : null}
          </div>

          {/* 出处 / 考点 / 关键点 短字段三列排布 */}
          <div className="q-create-grid">
            <label className="q-create-field">
              <span>出处</span>
              <input value={referenceName} onChange={(event) => setReferenceName(event.target.value)} />
            </label>
            <label className="q-create-field">
              <span>考点</span>
              <input value={examingPoint} onChange={(event) => setExamingPoint(event.target.value)} />
            </label>
            <label className="q-create-field">
              <span>关键点</span>
              <input value={keyword} onChange={(event) => setKeyword(event.target.value)} />
            </label>
          </div>

          <div className="q-create-actions" style={{ marginTop: 20 }}>
            <button className="primary-button" type="submit">
              保存试题
            </button>
          </div>
        </form>
        {message ? <p className="status-note" style={{ marginTop: 16 }}>{message}</p> : null}
      </section>
    </div>
  );
}