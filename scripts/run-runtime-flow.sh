#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP_DIR="$ROOT_DIR"
PORT="${E2E_PORT:-8085}"
BASE_URL="http://127.0.0.1:${PORT}"
JETTY_LOG="${JETTY_LOG:-/tmp/examxx-runtime-jetty.log}"
COOKIE_STUDENT="$(mktemp)"
COOKIE_ADMIN="$(mktemp)"
TMP_DIR="$(mktemp -d)"
CURRENT_STEP="initializing"

cleanup() {
  local exit_code=$?
  rm -f "$COOKIE_STUDENT" "$COOKIE_ADMIN"
  if [[ $exit_code -eq 0 ]]; then
    rm -rf "$TMP_DIR"
  else
    echo "Runtime flow failed at step: $CURRENT_STEP" >&2
    echo "Retained artifacts under: $TMP_DIR" >&2
    echo "Jetty log: $JETTY_LOG" >&2
  fi
  if [[ -n "${JETTY_PID:-}" ]] && kill -0 "$JETTY_PID" >/dev/null 2>&1; then
    kill "$JETTY_PID" >/dev/null 2>&1 || true
    wait "$JETTY_PID" >/dev/null 2>&1 || true
  fi
  exit $exit_code
}

trap cleanup EXIT

log_step() {
  CURRENT_STEP="$1"
  echo "==> $CURRENT_STEP"
}

mkdir -p "$(dirname "$JETTY_LOG")"

pushd "$APP_DIR" >/dev/null
log_step "package-war"
mvn -q -DskipTests package
log_step "start-jetty"
nohup mvn org.eclipse.jetty:jetty-maven-plugin:9.4.57.v20241219:run \
  -Djetty.port="$PORT" \
  -Ddb.driverClass=org.h2.Driver \
  "-Ddb.jdbcUrl=jdbc:h2:mem:examxxe2e;MODE=MySQL;DB_CLOSE_DELAY=-1;DATABASE_TO_UPPER=false;INIT=RUNSCRIPT FROM 'classpath:h2/e2e-schema.sql'\;RUNSCRIPT FROM 'classpath:h2/e2e-seed.sql'" \
  -Ddb.user=sa \
  -Ddb.password= \
  >"$JETTY_LOG" 2>&1 &
JETTY_PID=$!
popd >/dev/null

for _ in $(seq 1 60); do
  if curl -fsS "$BASE_URL/app/login" >/dev/null 2>&1; then
    break
  fi
  sleep 2
done

log_step "wait-for-jetty"
if ! curl -fsS "$BASE_URL/app/login" >/dev/null 2>&1; then
  echo "Jetty failed to start. Tail of $JETTY_LOG:" >&2
  tail -n 120 "$JETTY_LOG" >&2 || true
  exit 1
fi

student_login="$TMP_DIR/student-login.json"
log_step "student-login"
curl -fsS -c "$COOKIE_STUDENT" -b "$COOKIE_STUDENT" \
  -H 'Accept: application/json' \
  -H 'Content-Type: application/json;charset=UTF-8' \
  --data '{"username":"student","password":"123456"}' \
  "$BASE_URL/api/app/auth/login" > "$student_login"

student_me="$TMP_DIR/student-me.json"
log_step "student-auth-me"
curl -fsS -c "$COOKIE_STUDENT" -b "$COOKIE_STUDENT" \
  -H 'Accept: application/json' \
  "$BASE_URL/api/app/auth/me" > "$student_me"

student_home="$TMP_DIR/student-home.json"
log_step "student-home"
curl -fsS -c "$COOKIE_STUDENT" -b "$COOKIE_STUDENT" \
  -H 'Accept: application/json' \
  "$BASE_URL/api/app/home" > "$student_home"

practice_before="$TMP_DIR/practice-before.json"
log_step "practice-before"
curl -fsS -c "$COOKIE_STUDENT" -b "$COOKIE_STUDENT" \
  -H 'Accept: application/json' \
  "$BASE_URL/api/app/student/practice/by-point/101/1" > "$practice_before"

practice_submit="$TMP_DIR/practice-submit.json"
log_step "practice-submit"
curl -fsS -c "$COOKIE_STUDENT" -b "$COOKIE_STUDENT" \
  -H 'Accept: application/json' \
  -H 'Content-Type: application/json;charset=UTF-8' \
  --data '{"questionId":1001,"questionTypeId":1,"pointId":101,"answer":"A","myAnswer":"A","from":1}' \
  "$BASE_URL/api/app/student/practice/submit" > "$practice_submit"

practice_after="$TMP_DIR/practice-after.json"
log_step "practice-after"
curl -fsS -c "$COOKIE_STUDENT" -b "$COOKIE_STUDENT" \
  -H 'Accept: application/json' \
  "$BASE_URL/api/app/student/practice/by-point/101/1" > "$practice_after"

practice_wrong_submit="$TMP_DIR/practice-wrong-submit.json"
log_step "practice-wrong-submit"
curl -fsS -c "$COOKIE_STUDENT" -b "$COOKIE_STUDENT" \
  -H 'Accept: application/json' \
  -H 'Content-Type: application/json;charset=UTF-8' \
  --data '{"questionId":1002,"questionTypeId":1,"pointId":101,"answer":"C","myAnswer":"A","from":1}' \
  "$BASE_URL/api/app/student/practice/submit" > "$practice_wrong_submit"

practice_after_wrong="$TMP_DIR/practice-after-wrong.json"
log_step "practice-after-wrong"
curl -fsS -c "$COOKIE_STUDENT" -b "$COOKIE_STUDENT" \
  -H 'Accept: application/json' \
  "$BASE_URL/api/app/student/practice/by-point/101/1" > "$practice_after_wrong"

practice_improve="$TMP_DIR/practice-improve.json"
log_step "practice-improve"
curl -fsS -c "$COOKIE_STUDENT" -b "$COOKIE_STUDENT" \
  -H 'Accept: application/json' \
  "$BASE_URL/api/app/student/practice/improve/101/1" > "$practice_improve"

practice_improve_history="$TMP_DIR/practice-improve-history.json"
log_step "practice-improve-history"
curl -fsS -c "$COOKIE_STUDENT" -b "$COOKIE_STUDENT" \
  -H 'Accept: application/json' \
  "$BASE_URL/api/app/student/practice/improve-his/101/1" > "$practice_improve_history"

practice_incorrect="$TMP_DIR/practice-incorrect.json"
log_step "practice-incorrect"
curl -fsS -c "$COOKIE_STUDENT" -b "$COOKIE_STUDENT" \
  -H 'Accept: application/json' \
  "$BASE_URL/api/app/student/practice/incorrect/101" > "$practice_incorrect"

exam_start="$TMP_DIR/exam-start.json"
log_step "exam-start"
curl -fsS -c "$COOKIE_STUDENT" -b "$COOKIE_STUDENT" \
  -H 'Accept: application/json' \
  "$BASE_URL/api/app/student/exams/301" > "$exam_start"

exam_history_id="$(node -e "const fs=require('fs');const data=JSON.parse(fs.readFileSync(process.argv[1],'utf8'));process.stdout.write(String(data.examHistoryId));" "$exam_start")"

exam_submit="$TMP_DIR/exam-submit.json"
log_step "exam-submit"
curl -fsS -c "$COOKIE_STUDENT" -b "$COOKIE_STUDENT" \
  -H 'Accept: application/json' \
  -H 'Content-Type: application/json;charset=UTF-8' \
  --data "{\"exam_history_id\":${exam_history_id},\"duration\":600,\"as\":{\"1001\":{\"question_type_id\":1,\"answer\":\"A\",\"point\":5},\"1002\":{\"question_type_id\":1,\"answer\":\"B\",\"point\":5}}}" \
  "$BASE_URL/api/app/student/exams/submit" > "$exam_submit"

exam_result="$TMP_DIR/exam-result.json"
log_step "exam-result"
curl -fsS -c "$COOKIE_STUDENT" -b "$COOKIE_STUDENT" \
  -H 'Accept: application/json' \
  "$BASE_URL/api/app/student/exams/301/result" > "$exam_result"

exam_report="$TMP_DIR/exam-report.json"
log_step "exam-report"
curl -fsS -c "$COOKIE_STUDENT" -b "$COOKIE_STUDENT" \
  -H 'Accept: application/json' \
  "$BASE_URL/api/app/student/exams/301/report" > "$exam_report"

user_center="$TMP_DIR/user-center.json"
log_step "user-center"
curl -fsS -c "$COOKIE_STUDENT" -b "$COOKIE_STUDENT" \
  -H 'Accept: application/json' \
  "$BASE_URL/api/app/student/user-center" > "$user_center"

analysis="$TMP_DIR/analysis.json"
log_step "analysis"
curl -fsS -c "$COOKIE_STUDENT" -b "$COOKIE_STUDENT" \
  -H 'Accept: application/json' \
  "$BASE_URL/api/app/student/analysis" > "$analysis"

exam_history="$TMP_DIR/exam-history.json"
log_step "exam-history"
curl -fsS -c "$COOKIE_STUDENT" -b "$COOKIE_STUDENT" \
  -H 'Accept: application/json' \
  "$BASE_URL/api/app/student/exam-history?page=1" > "$exam_history"

comment_submit="$TMP_DIR/comment-submit.json"
log_step "comment-submit"
curl -fsS -c "$COOKIE_STUDENT" -b "$COOKIE_STUDENT" \
  -H 'Accept: application/json' \
  -H 'Content-Type: application/json;charset=UTF-8' \
  --data '{"questionId":1001,"indexId":1,"contentMsg":"runtime flow comment","quotoId":0,"reId":0}' \
  "$BASE_URL/api/app/student/submit-comment" > "$comment_submit"

comment_list="$TMP_DIR/comment-list.json"
log_step "comment-list"
curl -fsS -c "$COOKIE_STUDENT" -b "$COOKIE_STUDENT" \
  -H 'Accept: application/json' \
  "$BASE_URL/api/app/student/comment-list/1001/1/1" > "$comment_list"

admin_login="$TMP_DIR/admin-login.json"
log_step "admin-login"
curl -fsS -c "$COOKIE_ADMIN" -b "$COOKIE_ADMIN" \
  -H 'Accept: application/json' \
  -H 'Content-Type: application/json;charset=UTF-8' \
  --data '{"username":"admin","password":"123456"}' \
  "$BASE_URL/api/app/auth/login" > "$admin_login"

admin_questions="$TMP_DIR/admin-questions.json"
log_step "admin-questions"
curl -fsS -c "$COOKIE_ADMIN" -b "$COOKIE_ADMIN" \
  -H 'Accept: application/json' \
  "$BASE_URL/api/app/admin/questions?page=1" > "$admin_questions"

admin_question_detail="$TMP_DIR/admin-question-detail.json"
log_step "admin-question-detail"
curl -fsS -c "$COOKIE_ADMIN" -b "$COOKIE_ADMIN" \
  -H 'Accept: application/json' \
  "$BASE_URL/api/app/admin/questions/1001" > "$admin_question_detail"

admin_question_detail4add="$TMP_DIR/admin-question-detail4add.json"
log_step "admin-question-detail4add"
curl -fsS -c "$COOKIE_ADMIN" -b "$COOKIE_ADMIN" \
  -H 'Accept: application/json' \
  -H 'Content-Type: application/json;charset=UTF-8' \
  --data '[1001,1002]' \
  "$BASE_URL/api/app/admin/question-detail4add" > "$admin_question_detail4add"

admin_fields="$TMP_DIR/admin-fields.json"
log_step "admin-fields"
curl -fsS -c "$COOKIE_ADMIN" -b "$COOKIE_ADMIN" \
  -H 'Accept: application/json' \
  "$BASE_URL/api/app/admin/fields?page=1" > "$admin_fields"

admin_points="$TMP_DIR/admin-points.json"
log_step "admin-points"
curl -fsS -c "$COOKIE_ADMIN" -b "$COOKIE_ADMIN" \
  -H 'Accept: application/json' \
  "$BASE_URL/api/app/admin/points/1?page=1" > "$admin_points"

admin_answer_stages="$TMP_DIR/admin-answer-stages.json"
log_step "admin-answer-stages"
curl -fsS -c "$COOKIE_ADMIN" -b "$COOKIE_ADMIN" \
  -H 'Accept: application/json' \
  "$BASE_URL/api/app/admin/answer-stages?page=1" > "$admin_answer_stages"

admin_exam_papers="$TMP_DIR/admin-exam-papers.json"
log_step "admin-exam-papers"
curl -fsS -c "$COOKIE_ADMIN" -b "$COOKIE_ADMIN" \
  -H 'Accept: application/json' \
  "$BASE_URL/api/app/admin/exam-papers?paperType=1&page=1" > "$admin_exam_papers"

admin_users="$TMP_DIR/admin-users.json"
log_step "admin-users"
curl -fsS -c "$COOKIE_ADMIN" -b "$COOKIE_ADMIN" \
  -H 'Accept: application/json' \
  "$BASE_URL/api/app/admin/users?roleId=3&page=1" > "$admin_users"

log_step "assert-output"
node - <<'NODE' "$student_login" "$student_me" "$student_home" "$practice_before" "$practice_submit" "$practice_after" "$practice_wrong_submit" "$practice_after_wrong" "$practice_improve" "$practice_improve_history" "$practice_incorrect" "$exam_start" "$exam_submit" "$exam_result" "$exam_report" "$user_center" "$analysis" "$exam_history" "$comment_submit" "$comment_list" "$admin_login" "$admin_questions" "$admin_question_detail" "$admin_question_detail4add" "$admin_fields" "$admin_points" "$admin_answer_stages" "$admin_exam_papers" "$admin_users"
const fs = require('fs');
const [
  studentLoginPath,
  studentMePath,
  studentHomePath,
  practiceBeforePath,
  practiceSubmitPath,
  practiceAfterPath,
  practiceWrongSubmitPath,
  practiceAfterWrongPath,
  practiceImprovePath,
  practiceImproveHistoryPath,
  practiceIncorrectPath,
  examStartPath,
  examSubmitPath,
  examResultPath,
  examReportPath,
  userCenterPath,
  analysisPath,
  examHistoryPath,
  commentSubmitPath,
  commentListPath,
  adminLoginPath,
  adminQuestionsPath,
  adminQuestionDetailPath,
  adminQuestionDetail4AddPath,
  adminFieldsPath,
  adminPointsPath,
  adminAnswerStagesPath,
  adminExamPapersPath,
  adminUsersPath,
] = process.argv.slice(2);

function read(path) {
  return JSON.parse(fs.readFileSync(path, 'utf8'));
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const studentLogin = read(studentLoginPath);
assert(studentLogin.result === 'success', 'Student login failed');

const studentMe = read(studentMePath);
assert(studentMe.authenticated === true, 'Student auth/me not authenticated');
assert(studentMe.user && studentMe.user.username === 'student', 'Student auth/me missing expected user');

const studentHome = read(studentHomePath);
assert(Array.isArray(studentHome.historypaper) && studentHome.historypaper.length === 1, 'Student home missing expected exam paper');

const practiceBefore = read(practiceBeforePath);
assert(Array.isArray(practiceBefore.items) && practiceBefore.items.length === 2, 'Practice list size mismatch');
assert(Array.isArray(practiceBefore.finishedQuestionIds) && practiceBefore.finishedQuestionIds.length === 0, 'Practice history should be empty before submit');

const practiceSubmit = read(practiceSubmitPath);
assert(practiceSubmit.result === 'success' && practiceSubmit.isRight === true, 'Practice submit did not mark correct answer');

const practiceAfter = read(practiceAfterPath);
assert(practiceAfter.finishedQuestionIds.includes(1001), 'Practice history missing submitted question');

const practiceWrongSubmit = read(practiceWrongSubmitPath);
assert(practiceWrongSubmit.result === 'success' && practiceWrongSubmit.isRight === false, 'Practice wrong submit should be incorrect');

const practiceAfterWrong = read(practiceAfterWrongPath);
assert(practiceAfterWrong.finishedQuestionIds.includes(1001) && practiceAfterWrong.finishedQuestionIds.includes(1002), 'Practice history missing expected questions after wrong submit');

const practiceImprove = read(practiceImprovePath);
assert(Array.isArray(practiceImprove.items) && practiceImprove.items.length === 2, 'Practice improve list mismatch');

const practiceImproveHistory = read(practiceImproveHistoryPath);
assert(Array.isArray(practiceImproveHistory) && practiceImproveHistory.length === 2, 'Practice improve history mismatch');

const practiceIncorrect = read(practiceIncorrectPath);
assert(Array.isArray(practiceIncorrect.items) && practiceIncorrect.items.length === 1, 'Practice incorrect list mismatch');

const examStart = read(examStartPath);
assert(examStart.examHistoryId > 0, 'Exam start did not create history');
assert(Array.isArray(examStart.items) && examStart.items.length === 2, 'Exam item list mismatch');

const examSubmit = read(examSubmitPath);
assert(examSubmit.result === 'success', 'Exam submit failed');
assert(examSubmit.pointGet === 5, 'Exam score mismatch after submit');
assert(examSubmit.passed === false, 'Exam pass status should be false');

const examResult = read(examResultPath);
assert(examResult.submitted === true, 'Exam result should be submitted');
assert(examResult.right === 1 && examResult.wrong === 1, 'Exam result counts mismatch');
assert(examResult.knowledgeStats['Java 基础'].sum === 2, 'Knowledge stats missing Java 基础 aggregate');

const examReport = read(examReportPath);
assert(Array.isArray(examReport.items) && examReport.items.length === 2, 'Exam report items mismatch');
assert(typeof examReport.items[0].html === 'string' && examReport.items[0].html.includes('正确答案'), 'Exam report html missing answer block');

const userCenter = read(userCenterPath);
assert(userCenter.username === 'student', 'User center username mismatch');
assert(Array.isArray(userCenter.statistics) && userCenter.statistics.length > 0, 'User center statistics missing');
assert(Array.isArray(userCenter.answerStageAnalysisList) && userCenter.answerStageAnalysisList.length > 0, 'User center analysis missing');

const analysis = read(analysisPath);
assert(Array.isArray(analysis.kparl) && analysis.kparl.length > 0, 'Analysis payload missing kparl');
assert(Array.isArray(analysis.answerStageAnalysisList) && analysis.answerStageAnalysisList.length > 0, 'Analysis payload missing answer stage analysis');

const examHistory = read(examHistoryPath);
assert(Array.isArray(examHistory.items) && examHistory.items.length >= 1, 'Exam history missing entries');

const commentSubmit = read(commentSubmitPath);
assert(commentSubmit.result === 'success', 'Comment submit failed');

const commentList = read(commentListPath);
assert(commentList.result === 'success', 'Comment list failed');
assert(commentList.object && Array.isArray(commentList.object.comments) && commentList.object.comments.length > 0, 'Comment list missing data');

const adminLogin = read(adminLoginPath);
assert(adminLogin.result === 'success', 'Admin login failed');

const adminQuestions = read(adminQuestionsPath);
assert(Array.isArray(adminQuestions.items) && adminQuestions.items.length === 2, 'Admin question list mismatch');
assert(adminQuestions.page.totalRecord === 2, 'Admin page total record mismatch');

const adminQuestionDetail = read(adminQuestionDetailPath);
assert(adminQuestionDetail.question && adminQuestionDetail.question.id === 1001, 'Admin question detail mismatch');
assert(Array.isArray(adminQuestionDetail.pointList) && adminQuestionDetail.pointList.length === 1, 'Admin question detail points mismatch');

const adminQuestionDetail4Add = read(adminQuestionDetail4AddPath);
assert(Array.isArray(adminQuestionDetail4Add) && adminQuestionDetail4Add.length === 2, 'Admin question detail4add mismatch');

const adminFields = read(adminFieldsPath);
assert(Array.isArray(adminFields.items) && adminFields.items.length >= 1, 'Admin fields list missing');

const adminPoints = read(adminPointsPath);
assert(Array.isArray(adminPoints.items) && adminPoints.items.length >= 1, 'Admin points list missing');

const adminAnswerStages = read(adminAnswerStagesPath);
assert(Array.isArray(adminAnswerStages.items) && adminAnswerStages.items.length >= 1, 'Admin answer stages list missing');

const adminExamPapers = read(adminExamPapersPath);
assert(Array.isArray(adminExamPapers.items) && adminExamPapers.items.length === 1, 'Admin exam papers mismatch');

const adminUsers = read(adminUsersPath);
assert(Array.isArray(adminUsers.items) && adminUsers.items.length === 1, 'Admin users mismatch');

console.log(JSON.stringify({
  student: {
    authenticated: studentMe.authenticated,
    practiceFinished: practiceAfter.finishedQuestionIds,
    examScore: examResult.pointGet,
    examRight: examResult.right,
    examWrong: examResult.wrong,
  },
  admin: {
    questionCount: adminQuestions.items.length,
    totalRecord: adminQuestions.page.totalRecord,
  },
}, null, 2));
NODE
