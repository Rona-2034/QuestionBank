import type {
  AnswerSheetItemPayload,
  AdminExamPaperDetailPayload,
  AdminExamPaperContentPayload,
  AdminQuestionAnswerStagePayload,
  AdminQuestionDetailPayload,
  AdminSystemConfigPayload,
  AuthState,
  AdminAnswerStageItem,
  AdminFieldItem,
  AdminListPayload,
  AdminPointItem,
  AdminUserItem,
  ExamPaper,
  ExamPaperCreatePayload,
  ExamReportPayload,
  ExamResultPayload,
  HomePayload,
  LegacyMessage,
  QuestionListPayload,
  ExamPayload,
  CommentListPayload,
  PracticePayload,
  RenderedQuestion,
  StudentAnalysisPayload,
  StudentExamHistoryPayload,
  StudentSettingPayload,
  UserCenterPayload,
  PracticeSubmitResponse,
} from './types';

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

function resolveUrl(input: string): string {
  if (/^https?:\/\//i.test(input) || !apiBaseUrl) {
    return input;
  }
  if (input.startsWith('/')) {
    return `${apiBaseUrl}${input}`;
  }
  return `${apiBaseUrl}/${input}`;
}

async function parseResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return (await response.json()) as T;
  }
  return (await response.text()) as T;
}

async function request<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(resolveUrl(input), {
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      ...(init?.headers || {}),
    },
    ...init,
  });
  const payload = await parseResponse<T | LegacyMessage>(response);
  if (!response.ok) {
    const message = typeof payload === 'object' && payload && 'messageInfo' in payload
      ? (payload as LegacyMessage).messageInfo || (payload as LegacyMessage).result
      : `HTTP ${response.status}`;
    throw new Error(message);
  }
  return payload as T;
}

export async function fetchMe(): Promise<AuthState> {
  return request<AuthState>('/api/app/auth/me');
}

export async function login(username: string, password: string): Promise<LegacyMessage<{ username: string }>> {
  return request<LegacyMessage<{ username: string }>>('/api/app/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json;charset=UTF-8',
    },
    body: JSON.stringify({ username, password }),
  });
}

export async function registerUser(payload: {
  username: string;
  password: string;
  email: string;
  truename?: string;
  phone?: string;
  department?: string;
}): Promise<LegacyMessage> {
  return request<LegacyMessage>('/api/app/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json;charset=UTF-8' },
    body: JSON.stringify({ ...payload, fieldId: 0 }),
  });
}

export async function logout(): Promise<void> {
  await request<LegacyMessage>('/api/app/auth/logout', { method: 'POST' });
}

export async function fetchHome(): Promise<HomePayload> {
  return request<HomePayload>('/api/app/home');
}

export async function fetchUserCenter(): Promise<UserCenterPayload> {
  return request<UserCenterPayload>('/api/app/student/user-center');
}

export async function fetchStudentSetting(): Promise<StudentSettingPayload> {
  return request<StudentSettingPayload>('/api/app/student/setting');
}

export async function updateStudentSetting(payload: Record<string, unknown>): Promise<LegacyMessage> {
  return request<LegacyMessage>('/api/app/student/setting', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json;charset=UTF-8' },
    body: JSON.stringify(payload),
  });
}

export async function changeStudentPassword(payload: { password: string }): Promise<LegacyMessage> {
  return request<LegacyMessage>('/api/app/student/change-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json;charset=UTF-8' },
    body: JSON.stringify(payload),
  });
}

export async function fetchStudentAnalysis(): Promise<StudentAnalysisPayload> {
  return request<StudentAnalysisPayload>('/api/app/student/analysis');
}

export async function fetchStudentExamHistory(page = 1): Promise<StudentExamHistoryPayload> {
  return request<StudentExamHistoryPayload>(`/api/app/student/exam-history?page=${page}`);
}

export async function fetchAdminQuestions(params: Record<string, string | number>): Promise<QuestionListPayload> {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    query.set(key, String(value));
  });
  return request<QuestionListPayload>(`/api/app/admin/questions?${query.toString()}`);
}

export async function fetchAdminQuestionDetail(questionId: number): Promise<AdminQuestionDetailPayload> {
  return request<AdminQuestionDetailPayload>(`/api/app/admin/questions/${questionId}`);
}

export async function fetchAdminQuestionAnswerStage(questionId: number): Promise<AdminQuestionAnswerStagePayload> {
  return request<AdminQuestionAnswerStagePayload>(`/api/app/admin/question-answer-stage/${questionId}`);
}

export async function updateAdminQuestionClassification(
  questionId: number,
  payload: { pointId: number; answerStageId: number },
): Promise<LegacyMessage> {
  return request<LegacyMessage>(`/api/app/admin/questions/${questionId}/classification`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json;charset=UTF-8' },
    body: JSON.stringify(payload),
  });
}

export async function deleteAdminQuestion(questionId: number): Promise<LegacyMessage> {
  return request<LegacyMessage>(`/api/app/admin/questions/${questionId}`, { method: 'DELETE' });
}

export async function createAdminQuestion(payload: Record<string, unknown>): Promise<LegacyMessage> {
  return request<LegacyMessage>('/api/app/admin/questions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json;charset=UTF-8' },
    body: JSON.stringify(payload),
  });
}

export async function uploadQuestionFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  return request<string>('/api/app/admin/files/question-upload', {
    method: 'POST',
    body: formData,
  });
}

export async function uploadQuestionImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  return request<string>('/api/app/admin/files/question-image-upload', {
    method: 'POST',
    body: formData,
  });
}

export async function importQuestionFile(fieldId: number, filePath: string): Promise<LegacyMessage> {
  return request<LegacyMessage>(`/api/app/admin/questions/import/${fieldId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json;charset=UTF-8' },
    body: filePath,
  });
}

export async function fetchAdminFields(page = 1): Promise<AdminListPayload<AdminFieldItem>> {
  return request<AdminListPayload<AdminFieldItem>>(`/api/app/admin/fields?page=${page}`);
}

export async function createAdminField(payload: { fieldName: string; memo: string; state?: boolean }): Promise<LegacyMessage> {
  return request<LegacyMessage>('/api/app/admin/fields', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json;charset=UTF-8' },
    body: JSON.stringify(payload),
  });
}

export async function deleteAdminField(fieldId: number): Promise<LegacyMessage> {
  return request<LegacyMessage>(`/api/app/admin/fields/${fieldId}`, { method: 'DELETE' });
}

export async function fetchAdminPoints(fieldId: number, page = 1): Promise<AdminListPayload<AdminPointItem> & { fieldId: number }> {
  return request<AdminListPayload<AdminPointItem> & { fieldId: number }>(`/api/app/admin/points/${fieldId}?page=${page}`);
}

export async function createAdminPoint(payload: { fieldId: number; pointName: string; memo: string; state?: number }): Promise<LegacyMessage> {
  return request<LegacyMessage>('/api/app/admin/points', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json;charset=UTF-8' },
    body: JSON.stringify(payload),
  });
}

export async function deleteAdminPoint(pointId: number): Promise<LegacyMessage> {
  return request<LegacyMessage>(`/api/app/admin/points/${pointId}`, { method: 'DELETE' });
}

export async function fetchAdminAnswerStages(page = 1): Promise<AdminListPayload<AdminAnswerStageItem>> {
  return request<AdminListPayload<AdminAnswerStageItem>>(`/api/app/admin/answer-stages?page=${page}`);
}

export async function createAdminAnswerStage(payload: { stageName: string; memo: string; state?: number }): Promise<LegacyMessage> {
  return request<LegacyMessage>('/api/app/admin/answer-stages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json;charset=UTF-8' },
    body: JSON.stringify(payload),
  });
}

export async function deleteAdminAnswerStage(stageId: number): Promise<LegacyMessage> {
  return request<LegacyMessage>(`/api/app/admin/answer-stages/${stageId}`, { method: 'DELETE' });
}

export async function fetchAdminUsers(roleId = 3, page = 1): Promise<AdminListPayload<AdminUserItem> & { roleId: number }> {
  return request<AdminListPayload<AdminUserItem> & { roleId: number }>(`/api/app/admin/users?roleId=${roleId}&page=${page}`);
}

export async function fetchAdminSystemConfig(page = 1): Promise<AdminSystemConfigPayload> {
  return request<AdminSystemConfigPayload>(`/api/app/admin/system-config?page=${page}`);
}

export async function createAdminUser(payload: { username: string; password: string; email: string; truename?: string; phone?: string; department?: string; fieldId?: number }): Promise<LegacyMessage> {
  return request<LegacyMessage>('/api/app/admin/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json;charset=UTF-8' },
    body: JSON.stringify(payload),
  });
}

export async function createAdminAdmin(payload: { username: string; password: string; email: string; truename?: string; phone?: string; department?: string; fieldId?: number }): Promise<LegacyMessage> {
  return request<LegacyMessage>('/api/app/admin/admins', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json;charset=UTF-8' },
    body: JSON.stringify(payload),
  });
}

export async function disableAdminUser(userId: number): Promise<LegacyMessage> {
  return request<LegacyMessage>(`/api/app/admin/users/${userId}/disable`, { method: 'POST' });
}

export async function enableAdminUser(userId: number): Promise<LegacyMessage> {
  return request<LegacyMessage>(`/api/app/admin/users/${userId}/enable`, { method: 'POST' });
}

export async function fetchAdminExamPapers(paperType = 0, page = 1): Promise<AdminListPayload<ExamPaper> & { paperType: number }> {
  return request<AdminListPayload<ExamPaper> & { paperType: number }>(`/api/app/admin/exam-papers?paperType=${paperType}&page=${page}`);
}

export async function fetchAdminExamPaperDetail(examPaperId: number): Promise<AdminExamPaperDetailPayload> {
  return request<AdminExamPaperDetailPayload>(`/api/app/admin/exam-papers/${examPaperId}`);
}

export async function fetchAdminExamPaperContent(examPaperId: number): Promise<AdminExamPaperContentPayload> {
  return request<AdminExamPaperContentPayload>(`/api/app/admin/exam-papers/${examPaperId}/content`);
}

export async function createAdminExamPaper(payload: ExamPaperCreatePayload): Promise<LegacyMessage> {
  return request<LegacyMessage>('/api/app/admin/exam-papers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json;charset=UTF-8' },
    body: JSON.stringify(payload),
  });
}

export async function updateAdminExamPaper(examPaperId: number, payload: Record<string, unknown>): Promise<LegacyMessage> {
  return request<LegacyMessage>(`/api/app/admin/exam-papers/${examPaperId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json;charset=UTF-8' },
    body: JSON.stringify(payload),
  });
}

export async function publishAdminExamPaper(examPaperId: number): Promise<LegacyMessage> {
  return request<LegacyMessage>(`/api/app/admin/exam-papers/${examPaperId}/publish`, { method: 'POST' });
}

export async function offlineAdminExamPaper(examPaperId: number): Promise<LegacyMessage> {
  return request<LegacyMessage>(`/api/app/admin/exam-papers/${examPaperId}/offline`, { method: 'POST' });
}

export async function deleteAdminExamPaper(examPaperId: number): Promise<LegacyMessage> {
  return request<LegacyMessage>(`/api/app/admin/exam-papers/${examPaperId}`, { method: 'DELETE' });
}

export async function saveAdminExamPaperContent(examPaperId: number, payload: Record<number, number>): Promise<LegacyMessage> {
  return request<LegacyMessage>(`/api/app/admin/exam-papers/${examPaperId}/content`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json;charset=UTF-8' },
    body: JSON.stringify(payload),
  });
}

export async function fetchAdminQuestionDetailForAdd(ids: number[]): Promise<RenderedQuestion[]> {
  return request<RenderedQuestion[]>('/api/app/admin/question-detail4add', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json;charset=UTF-8' },
    body: JSON.stringify(ids),
  });
}

export async function fetchPracticeByPoint(knowledgePointId: string, questionTypeId: string): Promise<PracticePayload> {
  return request<PracticePayload>(`/api/app/student/practice/by-point/${knowledgePointId}/${questionTypeId}`);
}

export async function fetchPracticeByStage(answerStageId: string, questionTypeId: string): Promise<PracticePayload> {
  return request<PracticePayload>(`/api/app/student/practice/by-stage/${answerStageId}/${questionTypeId}`);
}

export async function fetchPracticeIncorrect(knowledgePointId: string): Promise<PracticePayload> {
  return request<PracticePayload>(`/api/app/student/practice/incorrect/${knowledgePointId}`);
}

export async function submitPractice(payload: {
  questionId: number;
  questionTypeId: number;
  pointId: number;
  answer: string;
  myAnswer: string;
  from: number;
}): Promise<PracticeSubmitResponse> {
  return request<PracticeSubmitResponse>('/api/app/student/practice/submit', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json;charset=UTF-8',
    },
    body: JSON.stringify(payload),
  });
}

export async function fetchQuestionComments(
  questionId: number,
  index = 1,
  indexId = 0,
): Promise<LegacyMessage<CommentListPayload>> {
  return request<LegacyMessage<CommentListPayload>>(`/api/app/student/comment-list/${questionId}/${index}/${indexId}`);
}

export async function submitQuestionComment(payload: {
  questionId: number;
  contentMsg: string;
  quotoId?: number;
  reId?: number;
  indexId?: number;
}): Promise<LegacyMessage> {
  return request<LegacyMessage>('/api/app/student/submit-comment', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json;charset=UTF-8',
    },
    body: JSON.stringify({
      ...payload,
      quotoId: payload.quotoId ?? 0,
      reId: payload.reId ?? 0,
    }),
  });
}

export async function fetchExam(examPaperId: string): Promise<ExamPayload> {
  return request<ExamPayload>(`/api/app/student/exams/${examPaperId}`);
}

export async function submitExam(payload: {
  exam_history_id: number;
  duration: number;
  as: Record<number, AnswerSheetItemPayload>;
}): Promise<ExamResultPayload> {
  return request<ExamResultPayload>('/api/app/student/exams/submit', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json;charset=UTF-8',
    },
    body: JSON.stringify(payload),
  });
}

export async function fetchExamResult(examPaperId: string): Promise<ExamResultPayload> {
  return request<ExamResultPayload>(`/api/app/student/exams/${examPaperId}/result`);
}

export async function fetchExamReport(examPaperId: string): Promise<ExamReportPayload> {
  return request<ExamReportPayload>(`/api/app/student/exams/${examPaperId}/report`);
}
