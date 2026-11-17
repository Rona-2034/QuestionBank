import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import { fetchMe, logout } from './api';
import type { AuthState } from './types';
import { LoginPage } from './pages/LoginPage';
import { HomePage } from './pages/HomePage';
import { AdminQuestionsPage } from './pages/AdminQuestionsPage';
import { PracticePage } from './pages/PracticePage';
import { ExamPage } from './pages/ExamPage';
import { ExamReportPage } from './pages/ExamReportPage';
import { UserCenterPage } from './pages/UserCenterPage';
import { StudentAnalysisPage } from './pages/StudentAnalysisPage';
import { StudentExamHistoryPage } from './pages/StudentExamHistoryPage';
import { StudentSettingPage } from './pages/StudentSettingPage';
import { StudentChangePasswordPage } from './pages/StudentChangePasswordPage';
import { AdminFieldsPage } from './pages/AdminFieldsPage';
import { AdminPointsPage } from './pages/AdminPointsPage';
import { AdminAnswerStagesPage } from './pages/AdminAnswerStagesPage';
import { AdminUsersPage } from './pages/AdminUsersPage';
import { AdminExamPapersPage } from './pages/AdminExamPapersPage';
import { AdminExamPaperCreatePage } from './pages/AdminExamPaperCreatePage';
import { AdminExamPaperDetailPage } from './pages/AdminExamPaperDetailPage';
import { AdminQuestionCreatePage } from './pages/AdminQuestionCreatePage';
import { AdminQuestionDetailPage } from './pages/AdminQuestionDetailPage';
import { AdminQuestionImportPage } from './pages/AdminQuestionImportPage';
import { RegisterPage } from './pages/RegisterPage';
import { SystemConfigPage } from './pages/SystemConfigPage';
import { AppShell } from './components/AppShell';
import { isAdmin, isSuperAdmin } from './permissions';
import { StudentExamPapersPage } from './pages/StudentExamPapersPage';
import { PracticeIndexPage } from './pages/PracticeIndexPage';

interface AuthContextValue extends AuthState {
  loading: boolean;
  refresh(): Promise<void>;
  signOut(): Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('Auth context missing');
  }
  return context;
}

function RequireAuth({ children }: { children: JSX.Element }) {
  const auth = useAuth();
  const location = useLocation();
  if (auth.loading) {
    return <div className="page-state">正在验证登录状态...</div>;
  }
  if (!auth.authenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return children;
}

function RequireAdmin({ children }: { children: JSX.Element }) {
  const auth = useAuth();
  if (!isAdmin(auth.user)) {
    return <Navigate to="/home" replace />;
  }
  return children;
}

function RequireSuperAdmin({ children }: { children: JSX.Element }) {
  const auth = useAuth();
  return isSuperAdmin(auth.user) ? children : <Navigate to="/home" replace />;
}

function HomeGate() {
  const auth = useAuth();
  if (auth.loading) {
    return <div className="page-state">正在加载系统...</div>;
  }
  return <Navigate to={auth.authenticated ? '/home' : '/login'} replace />;
}

function RedirectToExamPaperDetail() {
  const { examPaperId } = useParams();
  return <Navigate to={`/admin/exam-papers/${examPaperId || ''}`} replace />;
}

function RedirectToPointsPage() {
  const { fieldId } = useParams();
  return <Navigate to={`/admin/points/${fieldId || '1'}`} replace />;
}

function RedirectToQuestionImport() {
  return <Navigate to="/admin/question-import" replace />;
}

function RedirectToUserCenter() {
  return <Navigate to="/student/user-center" replace />;
}

function RedirectToPracticePoint() {
  const { knowledgePointId, questionTypeId } = useParams();
  return <Navigate to={`/student/practice/point/${knowledgePointId || ''}/${questionTypeId || ''}`} replace />;
}

function RedirectToPracticeStage() {
  const { answerStageId, questionTypeId } = useParams();
  return <Navigate to={`/student/practice/stage/${answerStageId || ''}/${questionTypeId || ''}`} replace />;
}

function RedirectToPracticeIncorrect() {
  const { knowledgePointId } = useParams();
  return <Navigate to={`/student/practice/incorrect/${knowledgePointId || ''}/0`} replace />;
}

function RedirectToExam() {
  const { examPaperId } = useParams();
  return <Navigate to={`/student/exam/${examPaperId || ''}`} replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomeGate />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/user-login-page" element={<Navigate to="/login" replace />} />
      <Route path="/user-register" element={<RegisterPage />} />
      <Route path="/start-exam" element={<Navigate to="/home" replace />} />
      <Route
        path="/home"
        element={
          <RequireAuth>
            <>
              <HomePage />
            </>
          </RequireAuth>
        }
      />
      <Route
        path="/student/user-center"
        element={
          <RequireAuth>
            <>
              <UserCenterPage />
            </>
          </RequireAuth>
        }
      />
      <Route path="/student/usercenter" element={<RedirectToUserCenter />} />
      <Route path="/student/exam-papers" element={<RequireAuth><StudentExamPapersPage /></RequireAuth>} />
      <Route path="/student/practice" element={<RequireAuth><PracticeIndexPage /></RequireAuth>} />
      <Route
        path="/student/setting"
        element={
          <RequireAuth>
            <>
              <StudentSettingPage />
            </>
          </RequireAuth>
        }
      />
      <Route
        path="/student/change-password"
        element={
          <RequireAuth>
            <>
              <StudentChangePasswordPage />
            </>
          </RequireAuth>
        }
      />
      <Route
        path="/student/analysis"
        element={
          <RequireAuth>
            <>
              <StudentAnalysisPage />
            </>
          </RequireAuth>
        }
      />
      <Route
        path="/student/exam-history"
        element={
          <RequireAuth>
            <>
              <StudentExamHistoryPage />
            </>
          </RequireAuth>
        }
      />
      <Route
        path="/student/practice/:mode/:primaryId/:questionTypeId"
        element={
          <RequireAuth>
            <>
              <PracticePage />
            </>
          </RequireAuth>
        }
      />
      <Route path="/student/practice-improve/:knowledgePointId/:questionTypeId" element={<RedirectToPracticePoint />} />
      <Route path="/student/practice-improve-answer-stage/:answerStageId/:questionTypeId" element={<RedirectToPracticeStage />} />
      <Route path="/student/practice-incorrect/:knowledgePointId" element={<RedirectToPracticeIncorrect />} />
      <Route path="/student/examing/:examPaperId" element={<RedirectToExam />} />
      <Route
        path="/student/exam-report/:examPaperId"
        element={
          <RequireAuth>
            <>
              <ExamReportPage />
            </>
          </RequireAuth>
        }
      />
      <Route path="/student/finish-exam/:examPaperId" element={<RedirectToExam />} />
      <Route
        path="/student/exam/:examPaperId"
        element={
          <RequireAuth>
            <>
              <ExamPage />
            </>
          </RequireAuth>
        }
      />
      <Route
        path="/admin/questions"
        element={
          <RequireAuth>
            <RequireAdmin>
              <>
                <AdminQuestionsPage />
              </>
            </RequireAdmin>
          </RequireAuth>
        }
      />
      <Route path="/admin/question-list" element={<Navigate to="/admin/questions" replace />} />
      <Route
        path="/admin/questions/:questionId"
        element={
          <RequireAuth>
            <RequireAdmin>
              <>
                <AdminQuestionDetailPage />
              </>
            </RequireAdmin>
          </RequireAuth>
        }
      />
      <Route path="/admin/question-add" element={<Navigate to="/admin/questions/new" replace />} />
      <Route
        path="/admin/questions/new"
        element={
          <RequireAuth>
            <RequireAdmin>
              <>
                <AdminQuestionCreatePage />
              </>
            </RequireAdmin>
          </RequireAuth>
        }
      />
      <Route
        path="/admin/question-import"
        element={
          <RequireAuth>
            <RequireAdmin>
              <>
                <AdminQuestionImportPage />
              </>
            </RequireAdmin>
          </RequireAuth>
        }
      />
      <Route path="/admin/question-import/:fieldId" element={<RedirectToQuestionImport />} />
      <Route
        path="/admin/exam-papers/new"
        element={
          <RequireAuth>
            <RequireAdmin>
              <>
                <AdminExamPaperCreatePage />
              </>
            </RequireAdmin>
          </RequireAuth>
        }
      />
      <Route path="/admin/exampaper-list" element={<Navigate to="/admin/exam-papers" replace />} />
      <Route path="/admin/exampaper-add" element={<Navigate to="/admin/exam-papers/new" replace />} />
      <Route path="/admin/exampaper-edit/:examPaperId" element={<RedirectToExamPaperDetail />} />
      <Route path="/admin/exampaper-preview/:examPaperId" element={<RedirectToExamPaperDetail />} />
      <Route
        path="/admin/exam-papers/:examPaperId"
        element={
          <RequireAuth>
            <RequireAdmin>
              <>
                <AdminExamPaperDetailPage />
              </>
            </RequireAdmin>
          </RequireAuth>
        }
      />
      <Route
        path="/admin/user-list"
        element={
          <RequireAuth>
            <RequireAdmin>
              <>
                <AdminUsersPage />
              </>
            </RequireAdmin>
          </RequireAuth>
        }
      />
      <Route
        path="/admin/add-user"
        element={
          <RequireAuth>
            <RequireAdmin>
              <>
                <AdminUsersPage />
              </>
            </RequireAdmin>
          </RequireAuth>
        }
      />
      <Route path="/admin/field-list-1" element={<Navigate to="/admin/fields" replace />} />
      <Route path="/admin/add-field" element={<Navigate to="/admin/fields" replace />} />
      <Route path="/admin/add-point" element={<Navigate to="/admin/points/1" replace />} />
      <Route path="/admin/point-list/:fieldId" element={<RedirectToPointsPage />} />
      <Route path="/admin/add-answer-stage" element={<Navigate to="/admin/answer-stages" replace />} />
      <Route path="/admin/answer-stage-list" element={<Navigate to="/admin/answer-stages" replace />} />
      <Route path="/admin/sys-backup" element={<RequireAuth><RequireSuperAdmin><><SystemConfigPage /></></RequireSuperAdmin></RequireAuth>} />
      <Route path="/admin/sys-admin-list" element={<RequireAuth><RequireSuperAdmin><><SystemConfigPage /></></RequireSuperAdmin></RequireAuth>} />
      <Route path="/admin/add-admin" element={<RequireAuth><RequireSuperAdmin><><SystemConfigPage /></></RequireSuperAdmin></RequireAuth>} />
      <Route
        path="/admin/fields"
        element={
          <RequireAuth>
            <RequireAdmin>
              <>
                <AdminFieldsPage />
              </>
            </RequireAdmin>
          </RequireAuth>
        }
      />
      <Route
        path="/admin/points/:fieldId"
        element={
          <RequireAuth>
            <RequireAdmin>
              <>
                <AdminPointsPage />
              </>
            </RequireAdmin>
          </RequireAuth>
        }
      />
      <Route
        path="/admin/answer-stages"
        element={
          <RequireAuth>
            <RequireAdmin>
              <>
                <AdminAnswerStagesPage />
              </>
            </RequireAdmin>
          </RequireAuth>
        }
      />
      <Route
        path="/admin/users"
        element={
          <RequireAuth>
            <RequireAdmin>
              <>
                <AdminUsersPage />
              </>
            </RequireAdmin>
          </RequireAuth>
        }
      />
      <Route
        path="/admin/exam-papers"
        element={
          <RequireAuth>
            <RequireAdmin>
              <>
                <AdminExamPapersPage />
              </>
            </RequireAdmin>
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [auth, setAuth] = useState<AuthState>({
    authenticated: false,
    user: null,
  });
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    try {
      const next = await fetchMe();
      setAuth(next);
    } catch {
      setAuth({ authenticated: false, user: null });
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    await logout();
    setAuth({ authenticated: false, user: null });
    navigate('/login');
  };

  useEffect(() => {
    void refresh();
  }, []);

  useEffect(() => {
    const expire = () => {
      setAuth({ authenticated: false, user: null });
      navigate('/login', { replace: true, state: { from: location.pathname } });
    };
    window.addEventListener('auth-expired', expire);
    return () => window.removeEventListener('auth-expired', expire);
  }, [navigate, location.pathname]);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...auth,
      loading,
      refresh,
      signOut,
    }),
    [auth, loading],
  );

  return (
    <AuthContext.Provider value={value}>
      {auth.authenticated && !['/login', '/user-login-page', '/user-register'].includes(location.pathname) ? (
        <AppShell user={auth.user} onLogout={signOut}><AppRoutes /></AppShell>
      ) : <AppRoutes />}
    </AuthContext.Provider>
  );
}
