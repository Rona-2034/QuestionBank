export interface RoleLike {
  authority?: string;
  name?: string;
}

export interface UserProfile {
  id: number;
  username: string;
  truename?: string;
  email?: string;
  phone?: string;
  department?: string;
  fieldId?: number;
  fieldName?: string;
  enabled?: string;
  roleListStack?: RoleLike[];
}

export interface AuthUser {
  userid: number;
  username: string;
  trueName?: string;
  rolesName?: string;
  enabled?: string;
  fieldId?: number;
  fieldName?: string;
  email?: string;
  lastLoginTime?: string;
  loginTime?: string;
  profile?: UserProfile;
}

export interface AuthState {
  authenticated: boolean;
  user: AuthUser | null;
}

export interface LegacyMessage<T = unknown> {
  result: string;
  generatedId?: number;
  messageInfo?: string;
  object?: T;
}

export interface QuestionImproveResult {
  questionPointId: number;
  questionPointName: string;
  questionTypeId: number;
  questionTypeName: string;
  amount: number;
  rightTimes: number;
  wrongTimes: number;
}

export interface ExamPaper {
  id: number;
  name: string;
  summary?: string;
  duration: number;
  pass_point: number;
  total_point: number;
  paper_type: string;
  status: number;
  creator?: string;
  content?: string;
  answer_sheet?: string;
  create_time?: string;
}

export interface QuestionListItem {
  id: number;
  name?: string;
  creator?: string;
  create_time?: string;
  question_type_id?: number;
  questionTypeName?: string;
  fieldName?: string;
  referenceName?: string;
  examingPoint?: string;
  keyword?: string;
  analysis?: string;
}

export interface PracticeQuestion {
  question: {
    questionId: number;
    questionTypeId: number;
    knowledgePointId: number;
    pointName: string;
    answer: string;
    questionPoint: number;
    content: string;
  };
  html: string;
}

export interface HomePayload {
  classifyMap: Record<string, QuestionImproveResult[]>;
  wrongKnowledgeMap: Record<string, Record<string, number>>;
  historypaper: ExamPaper[];
  practicepaper: ExamPaper[];
  expertpaper: ExamPaper[];
  user: AuthUser | null;
}

export interface QuestionListPayload {
  filters: {
    fieldId: number;
    knowledge: number;
    questionType: number;
    answerStageId: number;
    searchParam: string;
  };
  items: QuestionListItem[];
  fieldList: Array<{ fieldId: number; fieldName: string }>;
  knowledgeList: Array<{ pointId: number; pointName: string }>;
  questionTypeList: Array<{ id: number; name: string }>;
  answerStageList: Array<{ stageId: number; stageName: string }>;
  page: {
    pageNo: number;
    pageSize: number;
    totalPage: number;
    totalRecord: number;
  };
}

export interface PageInfo {
  pageNo: number;
  pageSize: number;
  totalPage: number;
  totalRecord: number;
}

export interface StudentAnalysisItem {
  pointId: number;
  pointName: string;
  amount: number;
  rightTimes: number;
  wrongTimes: number;
  finishRate: number;
  rightRate: number;
}

export interface StudentAnalysisStageTypeItem {
  questionTypeId: number;
  questionTypeName: string;
  restAmount: number;
  rightAmount: number;
  wrongAmount: number;
}

export interface StudentAnalysisStageItem {
  knowledgePointId: number;
  knowledgePointName: string;
  typeAnalysis: StudentAnalysisStageTypeItem[];
  finishRate: number;
}

export interface StudentAnalysisPayload {
  lastLoginTime: string | null;
  kparl: StudentAnalysisItem[];
  labels: string;
  finishrate: string;
  correctrate: string;
  answerStageAnalysisList: StudentAnalysisStageItem[];
}

export interface ExamHistoryItem {
  histId: number;
  examPaperId: number;
  paperName: string;
  duration: number;
  pointGet: number;
  createTime?: string | null;
  submitTime?: string | null;
}

export interface StudentExamHistoryPayload {
  items: ExamHistoryItem[];
  page: PageInfo;
}

export interface AdminFieldItem {
  fieldId: number;
  fieldName: string;
  memo?: string;
  state?: boolean;
  removeable?: boolean;
}

export interface AdminPointItem {
  pointId: number;
  pointName: string;
  fieldId: number;
  fieldName?: string;
  memo?: string;
  state?: number;
  removeable?: boolean;
}

export interface AdminAnswerStageItem {
  stageId: number;
  stageName: string;
  createTime?: string | null;
  creator?: number;
  memo?: string;
  state?: number;
  removeable?: boolean;
}

export interface QuestionContentPayload {
  title?: string;
  titleImg?: string;
  choiceList?: Record<string, string>;
  choiceImgList?: Record<string, string>;
}

export interface AdminQuestionDetailItem {
  id: number;
  name?: string;
  content?: string;
  question_type_id?: number;
  questionTypeName?: string;
  fieldName?: string;
  pointList?: number[];
  answerStageId?: number;
  answer?: string;
  analysis?: string;
  referenceName?: string;
  examingPoint?: string;
  keyword?: string;
  questionContent?: QuestionContentPayload;
}

export interface AdminQuestionDetailPayload {
  question: AdminQuestionDetailItem;
  pointList: Array<{ pointId: number; pointName: string }>;
  fieldList: Array<{ fieldId: number; fieldName: string }>;
  questionTypeList: Array<{ id: number; name: string }>;
  answerStageList: Array<{ stageId: number; stageName: string }>;
}

export interface AdminQuestionAnswerStagePayload {
  object?: { stageId: number; stageName?: string } | null;
}

export interface StudentSettingPayload {
  user: UserProfile | null;
}

export interface AdminExamPaperDetailPayload {
  paper: ExamPaper | null;
}

export interface RenderedQuestion {
  questionId: number;
  content: string;
  answer: string;
  analysis: string;
  questionTypeId: number;
  referenceName?: string;
  pointName?: string;
  fieldName?: string;
  questionPoint: number;
  examingPoint?: string;
  knowledgePointId: number;
}

export interface RenderedQuestionItem {
  question: RenderedQuestion;
  html: string;
}

export interface AdminExamPaperContentPayload {
  paper: ExamPaper | null;
  items: RenderedQuestionItem[];
}

export interface AdminUserItem {
  id: number;
  username: string;
  truename?: string;
  email?: string;
  phone?: string;
  enabled?: string;
  creator?: string;
  fieldId?: number;
  fieldName?: string;
  department?: string;
  create_date?: string;
}

export interface AdminListPayload<T> {
  items: T[];
  page: PageInfo;
}

export interface AdminSystemConfigPayload {
  backupSupported: boolean;
  backupMessage: string;
  adminCount: number;
  admins: AdminUserItem[];
  page: PageInfo;
}

export interface PracticePayload {
  practiceName: string;
  fieldName: string;
  questionTypeName: string;
  knowledgePointId?: number;
  answerStageId?: number;
  questionTypeId: number;
  amount: number;
  finishedQuestionIds?: number[];
  items: PracticeQuestion[];
}

export interface ExamPayload {
  paper: ExamPaper;
  examHistoryId: number;
  examPaperId: number;
  durationSeconds: number;
  items: PracticeQuestion[];
}

export interface PracticeSubmitResponse {
  result: string;
  messageInfo?: string;
  isRight?: boolean;
  questionId?: number;
}

export interface CommentItem {
  commentId: number;
  questionId: number;
  indexId: number;
  userId: number;
  username: string;
  contentMsg: string;
  quotoId: number;
  reId: number;
  createTime?: string;
}

export interface CommentListPayload {
  comments: CommentItem[];
  size: number;
}

export interface AnswerSheetItemPayload {
  question_type_id: number;
  answer: string;
  point: number;
}

export interface ExamResultPayload {
  result?: string;
  messageInfo?: string;
  examPaperId: number;
  submitted: boolean;
  pointGet: number;
  passed: boolean;
  total: number;
  right: number;
  wrong: number;
  createTime?: string | null;
  submitTime?: string | null;
  paper: ExamPaper;
  knowledgeStats: Record<string, { sum: number; rightTimes: number; wrongTimes: number }>;
  answer: Record<string, boolean>;
}

export interface ExamReportItem {
  question: PracticeQuestion['question'];
  answerSheetItem: AnswerSheetItemPayload | null;
  html: string;
}

export interface ExamReportPayload {
  examPaperId: number;
  submitted: boolean;
  items: ExamReportItem[];
}

export interface UserCenterStatistic {
  pointId: number;
  pointName: string;
  amount: number;
  rightTimes: number;
  wrongTimes: number;
  finishRate: number;
  rightRate: number;
}

export interface UserCenterTypeAnalysis {
  questionTypeId: number;
  questionTypeName: string;
  restAmount: number;
  rightAmount: number;
  wrongAmount: number;
}

export interface UserCenterStageAnalysis {
  knowledgePointId: number;
  knowledgePointName: string;
  typeAnalysis: UserCenterTypeAnalysis[];
  finishRate: number;
}

export interface UserCenterPayload {
  username: string | null;
  email: string | null;
  field: string | null;
  lastLoginTime: string | null;
  statistics: UserCenterStatistic[];
  labels: string;
  finishrate: string;
  correctrate: string;
  answerStageAnalysisList: UserCenterStageAnalysis[];
}

export interface ExamPaperCreatePayload {
  paperName: string;
  questionTypeNum?: Record<string, number>;
  questionTypePoint?: Record<string, number>;
  questionKnowledgePointRate?: Record<string, number>;
  paperDifficulty?: number;
  passPoint: number;
  time: number;
  paperPoint: number;
  paperType: string;
}
