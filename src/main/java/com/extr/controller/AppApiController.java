package com.extr.controller;

import java.io.FileNotFoundException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Date;
import java.util.HashMap;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;
import java.util.TreeSet;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationServiceException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.logout.SecurityContextLogoutHandler;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.stereotype.Controller;
import org.springframework.ui.ExtendedModelMap;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseBody;

import com.extr.controller.domain.AnswerSheetItem;
import com.extr.controller.domain.ExamFinishParam;
import com.extr.controller.domain.Message;
import com.extr.controller.domain.PaperCreatorParam;
import com.extr.controller.domain.QuestionClassificationParam;
import com.extr.controller.domain.QuestionFilter;
import com.extr.controller.domain.QuestionImproveResult;
import com.extr.controller.domain.QuestionQueryResult;
import com.extr.domain.exam.ExamHistory;
import com.extr.domain.exam.ExamPaper;
import com.extr.domain.question.AnswerStage;
import com.extr.domain.question.Comment;
import com.extr.domain.question.Comments;
import com.extr.domain.question.Field;
import com.extr.domain.question.KnowledgePoint;
import com.extr.domain.question.Question;
import com.extr.domain.question.QuestionAnswerStage;
import com.extr.domain.question.QuestionHistory;
import com.extr.domain.question.QuestionType;
import com.extr.domain.question.UserQuestionHistory;
import com.extr.domain.user.User;
import com.extr.file.util.FileUploadUtil;
import com.extr.security.UserInfo;
import com.extr.service.ExamService;
import com.extr.service.CommentService;
import com.extr.service.QuestionService;
import com.extr.service.UserService;
import com.extr.util.Page;
import com.extr.util.QuestionAdapter;
import com.extr.util.StandardPasswordEncoderForSha1;
import com.extr.util.TextLengthValidator;
import com.extr.util.xml.Object2Xml;

@Controller
@RequestMapping("/api/app")
public class AppApiController {

    @Autowired
    private BaseController baseController;
    @Autowired
    private ExamService examService;
    @Autowired
    private CommentService commentService;
    @Autowired
    private QuestionService questionService;
    @Autowired
    private UserService userService;
    @Autowired
    private AuthenticationManager authenticationManager;

    @RequestMapping(value = "/auth/me", method = RequestMethod.GET)
    public @ResponseBody Map<String, Object> me() {
        Map<String, Object> payload = new LinkedHashMap<String, Object>();
        UserInfo userInfo = getCurrentUser();
        payload.put("authenticated", Boolean.valueOf(userInfo != null));
        payload.put("user", buildUserPayload(userInfo));
        return payload;
    }

    @RequestMapping(value = "/auth/login", method = RequestMethod.POST)
    public @ResponseBody Map<String, Object> login(
            @org.springframework.web.bind.annotation.RequestBody User user,
            HttpServletRequest request, HttpServletResponse response) {
        Map<String, Object> payload = new LinkedHashMap<String, Object>();
        String username = user == null || user.getUsername() == null ? ""
                : user.getUsername().trim().toLowerCase();
        String password = user == null || user.getPassword() == null ? ""
                : user.getPassword();
        if (!TextLengthValidator.isRequiredTextValid(username)
                || !TextLengthValidator.isRequiredTextValid(password)) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            payload.put("result", "failed");
            payload.put("messageInfo", "用户名或密码不能为空");
            return payload;
        }

        try {
            Authentication authentication = authenticationManager
                    .authenticate(new UsernamePasswordAuthenticationToken(
                            username, password));
            SecurityContext context = SecurityContextHolder.createEmptyContext();
            context.setAuthentication(authentication);
            SecurityContextHolder.setContext(context);
            HttpSession session = request.getSession(true);
            session.setAttribute(
                    HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY,
                    context);

            UserInfo userInfo = resolveUserInfo(authentication);
            syncLoginTimes(userInfo);

            payload.put("result", "success");
            payload.put("targetUrl", "/home");
            payload.put("authenticated", Boolean.TRUE);
            payload.put("user", buildUserPayload(userInfo));
            return payload;
        } catch (AuthenticationServiceException e) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            payload.put("result", "failed");
            payload.put("messageInfo", e.getMessage());
            return payload;
        } catch (AuthenticationException e) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            payload.put("result", "failed");
            payload.put("messageInfo", "用户名或密码错误");
            return payload;
        }
    }

    @RequestMapping(value = "/auth/logout", method = RequestMethod.POST)
    public @ResponseBody Map<String, Object> logout(HttpServletRequest request,
            HttpServletResponse response) {
        Authentication authentication = SecurityContextHolder.getContext()
                .getAuthentication();
        new SecurityContextLogoutHandler().logout(request, response,
                authentication);
        Map<String, Object> payload = new LinkedHashMap<String, Object>();
        payload.put("result", "success");
        payload.put("authenticated", Boolean.FALSE);
        payload.put("user", null);
        return payload;
    }

    @RequestMapping(value = "/auth/register", method = RequestMethod.POST)
    public @ResponseBody Message register(
            @org.springframework.web.bind.annotation.RequestBody User user) {
        user.setCreator("0");
        user.setCreate_date(new Date());
        user.setFieldId(0);
        Message message = new Message();
        if (!validateUserText(user, message)) {
            return message;
        }
        String password = user.getPassword() + "{" + user.getUsername() + "}";
        String resultPassword = new StandardPasswordEncoderForSha1()
                .encode(password);
        user.setPassword(resultPassword);
        user.setEnabled("1");
        try {
            userService.addUser(user);
        } catch (Exception e) {
            if ("duplicate-username".equals(e.getMessage())) {
                message.setResult(e.getMessage());
                message.setMessageInfo("用户名：" + user.getUsername()
                        + "已经存在");
            } else {
                message.setResult("错误！" + e.getClass().getName());
            }
        }
        return message;
    }

    @RequestMapping(value = "/home", method = RequestMethod.GET)
    public @ResponseBody Map<String, Object> home() {
        ExtendedModelMap model = new ExtendedModelMap();
        baseController.appendBaseInfo(model);
        Map<String, Object> payload = new LinkedHashMap<String, Object>();
        payload.putAll(model);
        payload.put("user", buildUserPayload(getCurrentUser()));
        return payload;
    }

    @RequestMapping(value = "/student/user-center", method = RequestMethod.GET)
    public @ResponseBody Map<String, Object> userCenter() {
        UserInfo userInfo = getCurrentUser();
        List<Map<String, Object>> statistics = buildStatisticsResultList(userInfo);
        Map<String, Object> payload = new LinkedHashMap<String, Object>();
        payload.put("username", userInfo == null ? null : userInfo.getUsername());
        payload.put("email", userInfo == null ? null : userInfo.getEmail());
        payload.put("field", userInfo == null ? null : userInfo.getFieldName());
        payload.put("lastLoginTime", userInfo == null ? null : userInfo.getLastLoginTime());
        payload.put("statistics", statistics);
        payload.put("labels", buildLabels(statistics));
        payload.put("finishrate", buildFinishData(statistics));
        payload.put("correctrate", buildCorrectData(statistics));
        payload.put("answerStageAnalysisList", buildAnswerStageAnalysisList(userInfo));
        return payload;
    }

    @RequestMapping(value = "/student/analysis", method = RequestMethod.GET)
    public @ResponseBody Map<String, Object> analysis() {
        UserInfo userInfo = getCurrentUser();
        List<Map<String, Object>> statistics = buildStatisticsResultList(userInfo);
        Map<String, Object> payload = new LinkedHashMap<String, Object>();
        payload.put("lastLoginTime", userInfo == null ? null : userInfo.getLastLoginTime());
        payload.put("kparl", statistics);
        payload.put("labels", buildLabels(statistics));
        payload.put("finishrate", buildFinishData(statistics));
        payload.put("correctrate", buildCorrectData(statistics));
        payload.put("answerStageAnalysisList", buildAnswerStageAnalysisList(userInfo));
        return payload;
    }

    @RequestMapping(value = "/student/setting", method = RequestMethod.GET)
    public @ResponseBody Map<String, Object> setting() {
        UserInfo userInfo = getCurrentUser();
        Map<String, Object> payload = new LinkedHashMap<String, Object>();
        payload.put("user", userInfo == null ? null : userService.getUserById(userInfo.getUserid()));
        return payload;
    }

    @RequestMapping(value = "/student/setting", method = RequestMethod.POST)
    public @ResponseBody Message updateSetting(
            @org.springframework.web.bind.annotation.RequestBody User user) {
        Message message = new Message();
        UserInfo userInfo = getCurrentUser();
        if (userInfo == null) {
            message.setResult("error");
            message.setMessageInfo("未登录");
            return message;
        }
        if (!validateOptionalUserText(user, message)) {
            return message;
        }
        try {
            user.setId(userInfo.getUserid());
            user.setUsername(userInfo.getUsername());
            user.setFieldId(0);
            userService.updateUser(user, null);
        } catch (Exception e) {
            message.setResult(e.getClass().getName());
        }
        return message;
    }

    @RequestMapping(value = "/student/change-password", method = RequestMethod.POST)
    public @ResponseBody Message changePassword(
            @org.springframework.web.bind.annotation.RequestBody User user) {
        Message message = new Message();
        UserInfo userInfo = getCurrentUser();
        if (userInfo == null) {
            message.setResult("error");
            message.setMessageInfo("未登录");
            return message;
        }
        if (!TextLengthValidator.isRequiredTextValid(user.getPassword())) {
            message.setResult("error");
            message.setMessageInfo(TextLengthValidator.message("密码"));
            return message;
        }
        try {
            String password = user.getPassword() + "{" + userInfo.getUsername() + "}";
            String resultPassword = new StandardPasswordEncoderForSha1().encode(password);
            User update = new User();
            update.setId(userInfo.getUserid());
            update.setUsername(userInfo.getUsername());
            update.setPassword(resultPassword);
            userService.updateUser(update, null);
        } catch (Exception e) {
            message.setResult(e.getClass().getName());
        }
        return message;
    }

    @RequestMapping(value = "/student/exam-history", method = RequestMethod.GET)
    public @ResponseBody Map<String, Object> examHistory(
            @RequestParam(value = "page", required = false, defaultValue = "1") int page) {
        UserInfo userInfo = getCurrentUser();
        Page<ExamHistory> pageModel = new Page<ExamHistory>();
        pageModel.setPageNo(page);
        pageModel.setPageSize(20);
        List<ExamHistory> historyList = examService.getUserExamHistoryListByUserId(
                userInfo.getUserid(), pageModel);
        List<Map<String, Object>> items = new ArrayList<Map<String, Object>>();
        for (ExamHistory history : historyList) {
            Map<String, Object> item = new LinkedHashMap<String, Object>();
            item.put("histId", Integer.valueOf(history.getHistId()));
            item.put("examPaperId", Integer.valueOf(history.getExamPaperId()));
            item.put("paperName", history.getPaperName());
            item.put("duration", Integer.valueOf(history.getDuration()));
            item.put("pointGet", Float.valueOf(history.getPointGet()));
            item.put("createTime", formatDate(history.getCreateTime()));
            item.put("submitTime", formatDate(history.getSubmitTime()));
            items.add(item);
        }
        Map<String, Object> payload = new LinkedHashMap<String, Object>();
        payload.put("items", items);
        payload.put("page", buildPagePayload(pageModel));
        return payload;
    }

    @RequestMapping(value = "/student/practice/improve/{knowledgePointId}/{questionTypeId}", method = RequestMethod.GET)
    public @ResponseBody Map<String, Object> practiceImprove(
            @PathVariable("knowledgePointId") int knowledgePointId,
            @PathVariable("questionTypeId") int questionTypeId,
            HttpServletRequest request) {
        return practiceByPoint(knowledgePointId, questionTypeId, request);
    }

    @RequestMapping(value = "/student/practice/improve-answer-stage/{answerStageId}/{questionTypeId}", method = RequestMethod.GET)
    public @ResponseBody Map<String, Object> practiceImproveByAnswerStage(
            @PathVariable("answerStageId") int answerStageId,
            @PathVariable("questionTypeId") int questionTypeId,
            HttpServletRequest request) {
        return practiceByStage(answerStageId, questionTypeId, request);
    }

    @RequestMapping(value = "/student/practice/incorrect/{knowledgePointId}", method = RequestMethod.GET)
    public @ResponseBody Map<String, Object> practiceIncorrect(
            @PathVariable("knowledgePointId") int knowledgePointId,
            HttpServletRequest request) {
        UserInfo userInfo = getCurrentUser();
        UserQuestionHistory history = questionService
                .getUserQuestionHistoryByUserId(userInfo.getUserid());
        List<Integer> idList = new ArrayList<Integer>();
        if (history != null && history.getHistory() != null
                && history.getHistory().containsKey(Integer.valueOf(0))) {
            Map<Integer, QuestionHistory> wrongMap = history.getHistory().get(Integer.valueOf(0));
            Iterator<Integer> iterator = wrongMap.keySet().iterator();
            while (iterator.hasNext()) {
                Integer key = iterator.next();
                QuestionHistory questionHistory = wrongMap.get(key);
                if (questionHistory != null
                        && questionHistory.getPointId() == knowledgePointId) {
                    idList.add(Integer.valueOf(questionHistory.getQuestionId()));
                }
            }
        }
        List<QuestionQueryResult> questions = idList.isEmpty()
                ? new ArrayList<QuestionQueryResult>()
                : examService.getQuestionDescribeListByIdList(idList);
        Map<String, Object> payload = new LinkedHashMap<String, Object>();
        payload.put("practiceName", "错题练习");
        payload.put("fieldName", resolveFieldName(questions));
        payload.put("questionTypeName", "错题库");
        payload.put("knowledgePointId", Integer.valueOf(knowledgePointId));
        payload.put("questionTypeId", Integer.valueOf(0));
        payload.put("amount", Integer.valueOf(questions.size()));
        payload.put("finishedQuestionIds", idList);
        payload.put("items", renderQuestionItems(questions, buildBaseUrl(request)));
        return payload;
    }

    @RequestMapping(value = "/student/practice/improve-his/{knowledgePointId}/{questionTypeId}", method = RequestMethod.GET)
    public @ResponseBody List<Integer> practiceImproveHistory(
            @PathVariable("knowledgePointId") int knowledgePointId,
            @PathVariable("questionTypeId") int questionTypeId) {
        return loadFinishedQuestionIds(knowledgePointId, questionTypeId);
    }

    @RequestMapping(value = "/student/exam-papers", method = RequestMethod.GET)
    public @ResponseBody Map<String, Object> examPapers(
            @RequestParam(value = "paperType", required = false, defaultValue = "0") int paperType) {
        Map<String, Object> payload = new LinkedHashMap<String, Object>();
        payload.put("paperType", Integer.valueOf(paperType));
        payload.put("items", examService.getExamPaperList4Exam(paperType));
        return payload;
    }

    @RequestMapping(value = "/admin/questions", method = RequestMethod.GET)
    public @ResponseBody Map<String, Object> adminQuestions(
            @RequestParam(value = "fieldId", required = false, defaultValue = "0") int fieldId,
            @RequestParam(value = "knowledge", required = false, defaultValue = "0") int knowledge,
            @RequestParam(value = "questionType", required = false, defaultValue = "0") int questionType,
            @RequestParam(value = "answerStageId", required = false, defaultValue = "0") int answerStageId,
            @RequestParam(value = "searchParam", required = false, defaultValue = "0") String searchParam,
            @RequestParam(value = "page", required = false, defaultValue = "1") int page) {
        QuestionFilter filter = new QuestionFilter();
        filter.setFieldId(fieldId);
        filter.setKnowledge(knowledge);
        filter.setQuestionType(questionType);
        filter.setAnswerStageId(answerStageId);
        if ("0".equals(searchParam)) {
            searchParam = "-1";
        }
        filter.setSearchParam(searchParam);

        Page<Question> pageModel = new Page<Question>();
        pageModel.setPageNo(page);
        pageModel.setPageSize(20);

        Map<String, Object> payload = new LinkedHashMap<String, Object>();
        payload.put("filters", filter);
        payload.put("items", questionService.getQuestionList(pageModel, filter));
        payload.put("fieldList", questionService.getAllField(null));
        payload.put("knowledgeList", questionService.getKnowledgePointByFieldId(fieldId, null));
        payload.put("questionTypeList", questionService.getQuestionTypeList());
        payload.put("answerStageList", questionService.getAnswerStageList(null));
        payload.put("page", buildPagePayload(pageModel));
        return payload;
    }

    @RequestMapping(value = "/admin/fields", method = RequestMethod.GET)
    public @ResponseBody Map<String, Object> adminFields(
            @RequestParam(value = "page", required = false, defaultValue = "1") int page) {
        Page<Field> pageModel = new Page<Field>();
        pageModel.setPageNo(page);
        pageModel.setPageSize(8);
        Map<String, Object> payload = new LinkedHashMap<String, Object>();
        payload.put("items", questionService.getAllField(pageModel));
        payload.put("page", buildPagePayload(pageModel));
        return payload;
    }

    @RequestMapping(value = "/admin/fields", method = RequestMethod.POST)
    public @ResponseBody Message adminFieldCreate(
            @org.springframework.web.bind.annotation.RequestBody Field field) {
        Message message = new Message();
        if (!TextLengthValidator.isRequiredTextValid(field.getFieldName())) {
            message.setResult("error");
            message.setMessageInfo(TextLengthValidator.message("题库名"));
            return message;
        }
        if (!TextLengthValidator.isRequiredTextValid(field.getMemo())) {
            message.setResult("error");
            message.setMessageInfo(TextLengthValidator.message("描述"));
            return message;
        }
        try {
            questionService.addField(field);
        } catch (Exception e) {
            message.setResult(e.getClass().getName());
        }
        return message;
    }

    @RequestMapping(value = "/admin/fields/{fieldId}", method = RequestMethod.DELETE)
    public @ResponseBody Message adminFieldDelete(
            @PathVariable("fieldId") int fieldId) {
        Message message = new Message();
        try {
            List<Integer> idList = new ArrayList<Integer>();
            idList.add(Integer.valueOf(fieldId));
            questionService.deleteFieldByIdList(idList);
        } catch (Exception e) {
            message.setResult(e.getClass().getName());
        }
        return message;
    }

    @RequestMapping(value = "/admin/points/{fieldId}", method = RequestMethod.GET)
    public @ResponseBody Map<String, Object> adminPoints(
            @PathVariable("fieldId") int fieldId,
            @RequestParam(value = "page", required = false, defaultValue = "1") int page) {
        Page<KnowledgePoint> pageModel = new Page<KnowledgePoint>();
        pageModel.setPageNo(page);
        pageModel.setPageSize(8);
        Map<String, Object> payload = new LinkedHashMap<String, Object>();
        payload.put("fieldId", Integer.valueOf(fieldId));
        payload.put("fieldList", questionService.getAllField(null));
        payload.put("items", questionService.getKnowledgePointByFieldId(fieldId, pageModel));
        payload.put("page", buildPagePayload(pageModel));
        return payload;
    }

    @RequestMapping(value = "/admin/points", method = RequestMethod.POST)
    public @ResponseBody Message adminPointCreate(
            @org.springframework.web.bind.annotation.RequestBody KnowledgePoint point) {
        Message message = new Message();
        if (!TextLengthValidator.isRequiredTextValid(point.getPointName())) {
            message.setResult("error");
            message.setMessageInfo(TextLengthValidator.message("知识类名"));
            return message;
        }
        if (!TextLengthValidator.isRequiredTextValid(point.getMemo())) {
            message.setResult("error");
            message.setMessageInfo(TextLengthValidator.message("描述"));
            return message;
        }
        try {
            questionService.addKnowledgePoint(point);
        } catch (Exception e) {
            message.setResult(e.getClass().getName());
        }
        return message;
    }

    @RequestMapping(value = "/admin/points/{pointId}", method = RequestMethod.DELETE)
    public @ResponseBody Message adminPointDelete(
            @PathVariable("pointId") int pointId) {
        Message message = new Message();
        try {
            List<Integer> idList = new ArrayList<Integer>();
            idList.add(Integer.valueOf(pointId));
            questionService.deleteKnowledgePointByIdList(idList);
        } catch (Exception e) {
            message.setResult("error");
            message.setMessageInfo("该知识类已被试题使用，不能删除");
        }
        return message;
    }

    @RequestMapping(value = "/admin/answer-stages", method = RequestMethod.GET)
    public @ResponseBody Map<String, Object> adminAnswerStages(
            @RequestParam(value = "page", required = false, defaultValue = "1") int page) {
        Page<AnswerStage> pageModel = new Page<AnswerStage>();
        pageModel.setPageNo(page);
        pageModel.setPageSize(8);
        Map<String, Object> payload = new LinkedHashMap<String, Object>();
        payload.put("items", questionService.getAnswerStageList(pageModel));
        payload.put("page", buildPagePayload(pageModel));
        return payload;
    }

    @RequestMapping(value = "/admin/answer-stages", method = RequestMethod.POST)
    public @ResponseBody Message adminAnswerStageCreate(
            @org.springframework.web.bind.annotation.RequestBody AnswerStage answerStage) {
        Message message = new Message();
        UserInfo userInfo = getCurrentUser();
        answerStage.setCreator(userInfo == null ? 0 : userInfo.getUserid());
        if (!TextLengthValidator.isRequiredTextValid(answerStage.getStageName())) {
            message.setResult("error");
            message.setMessageInfo(TextLengthValidator.message("答题人阶段名"));
            return message;
        }
        if (!TextLengthValidator.isRequiredTextValid(answerStage.getMemo())) {
            message.setResult("error");
            message.setMessageInfo(TextLengthValidator.message("描述"));
            return message;
        }
        try {
            questionService.addAnswerStage(answerStage);
        } catch (Exception e) {
            message.setResult(e.getClass().getName());
        }
        return message;
    }

    @RequestMapping(value = "/admin/answer-stages/{stageId}", method = RequestMethod.DELETE)
    public @ResponseBody Message adminAnswerStageDelete(
            @PathVariable("stageId") int stageId) {
        Message message = new Message();
        try {
            List<Integer> idList = new ArrayList<Integer>();
            idList.add(Integer.valueOf(stageId));
            questionService.deleteAnswerStageByIdList(idList);
        } catch (Exception e) {
            message.setResult(e.getClass().getName());
        }
        return message;
    }

    @RequestMapping(value = "/admin/question-answer-stage/{questionId}", method = RequestMethod.GET)
    public @ResponseBody Message adminQuestionAnswerStage(
            @PathVariable("questionId") int questionId) {
        Message message = new Message();
        message.setObject(questionService.getQuestionAnswerStageByQuestionId(questionId));
        return message;
    }

    @RequestMapping(value = "/admin/question-detail4add", method = RequestMethod.POST)
    public @ResponseBody List<QuestionQueryResult> adminQuestionDetailForAdd(
            @org.springframework.web.bind.annotation.RequestBody List<Integer> idList,
            HttpServletRequest request) {
        Set<Integer> idSet = new TreeSet<Integer>(idList);
        List<Integer> orderedIdList = new ArrayList<Integer>(idSet);
        List<QuestionQueryResult> returnList = examService
                .getQuestionDescribeListByIdList(orderedIdList);
        String baseUrl = buildBaseUrl(request);
        for (QuestionQueryResult question : returnList) {
            QuestionAdapter adapter = new QuestionAdapter(question, baseUrl);
            question.setContent(adapter.getStringFromXML());
        }
        return returnList;
    }

    @RequestMapping(value = "/admin/files/question-upload", method = RequestMethod.POST)
    public @ResponseBody String adminUploadQuestionFile(
            HttpServletRequest request, HttpServletResponse response) {
        UserInfo userInfo = getCurrentUser();
        List<String> filePathList = new ArrayList<String>();
        try {
            filePathList = FileUploadUtil.uploadFile(request, response,
                    userInfo == null ? null : userInfo.getUsername());
        } catch (FileNotFoundException e) {
            e.printStackTrace();
        } catch (Exception ex) {
            ex.printStackTrace();
        }

        if (filePathList == null || filePathList.size() == 0) {
            return "系统错误";
        }

        return filePathList.get(0);
    }

    @RequestMapping(value = "/admin/files/question-image-upload", method = RequestMethod.POST)
    public @ResponseBody String adminUploadQuestionImage(
            HttpServletRequest request, HttpServletResponse response) {
        UserInfo userInfo = getCurrentUser();
        List<String> filePathList = new ArrayList<String>();
        try {
            filePathList = FileUploadUtil.uploadImg(request, response,
                    userInfo == null ? null : userInfo.getUsername());
        } catch (FileNotFoundException e) {
            e.printStackTrace();
        } catch (Exception ex) {
            ex.printStackTrace();
        }

        if (filePathList == null || filePathList.size() == 0) {
            return "系统错误";
        }

        return filePathList.get(0);
    }

    @RequestMapping(value = "/admin/questions/import/{fieldId}", method = RequestMethod.POST)
    public @ResponseBody Message adminQuestionImport(
            @RequestBody String filePath,
            @PathVariable("fieldId") int fieldId) {
        Message message = new Message();
        UserInfo userInfo = getCurrentUser();
        if (fieldId == 0) {
            message.setResult("error");
            message.setMessageInfo("请选择题库");
            return message;
        }
        try {
            questionService.uploadQuestions(filePath,
                    userInfo == null ? null : userInfo.getUsername(),
                    userInfo == null ? 0 : userInfo.getUserid(), fieldId);
        } catch (RuntimeException e) {
            message.setResult(e.getClass().getName() + ":" + e.getMessage());
            message.setMessageInfo(e.getMessage());
        }
        return message;
    }

    @RequestMapping(value = "/admin/questions/{questionId}", method = RequestMethod.GET)
    public @ResponseBody Map<String, Object> adminQuestionDetail(
            @PathVariable("questionId") int questionId) {
        Map<String, Object> payload = new LinkedHashMap<String, Object>();
        payload.put("question", questionService.getQuestionByQuestionId(questionId));
        payload.put("pointList",
                questionService.getQuestionKnowledgePointListByQuestionId(questionId));
        payload.put("fieldList", questionService.getAllField(null));
        payload.put("questionTypeList", questionService.getQuestionTypeList());
        payload.put("answerStageList", questionService.getAnswerStageList(null));
        return payload;
    }

    @RequestMapping(value = "/admin/questions", method = RequestMethod.POST)
    public @ResponseBody Message adminQuestionCreate(
            @org.springframework.web.bind.annotation.RequestBody Question question) {
        Message message = new Message();
        UserInfo userInfo = getCurrentUser();
        if (question.getQuestionContent() != null) {
            question.setContent(Object2Xml.toXml(question.getQuestionContent()));
        }
        question.setCreate_time(new Date());
        question.setCreator(userInfo == null ? "0" : String.valueOf(userInfo.getUserid()));
        question.setAnswerStageCreator(userInfo == null ? 0 : userInfo.getUserid());
        try {
            questionService.addQuestion(question);
            message.setGeneratedId(Integer.valueOf(question.getId()));
        } catch (Exception e) {
            message.setResult("error");
            message.setMessageInfo(e.getClass().getName());
        }
        return message;
    }

    @RequestMapping(value = "/admin/questions/{questionId}/classification", method = RequestMethod.POST)
    public @ResponseBody Message adminQuestionClassificationUpdate(
            @PathVariable("questionId") int questionId,
            @org.springframework.web.bind.annotation.RequestBody QuestionClassificationParam param) {
        Message message = new Message();
        UserInfo userInfo = getCurrentUser();
        Question question = new Question();
        question.setId(questionId);
        List<Integer> pointIdList = new ArrayList<Integer>();
        pointIdList.add(Integer.valueOf(param.getPointId()));
        question.setPointList(pointIdList);
        try {
            questionService.updateQuestionPointAndAnswerStage(question,
                    userInfo == null ? 0 : userInfo.getUserid(), param.getAnswerStageId());
        } catch (Exception e) {
            message.setResult(e.getClass().getName());
        }
        return message;
    }

    @RequestMapping(value = "/admin/questions/{questionId}", method = RequestMethod.DELETE)
    public @ResponseBody Message adminQuestionDelete(
            @PathVariable("questionId") int questionId) {
        Message message = new Message();
        try {
            questionService.deleteQuestionByQuestionId(questionId);
        } catch (Exception e) {
            message.setResult(e.getClass().getName());
        }
        return message;
    }

    @RequestMapping(value = "/admin/question-form-meta", method = RequestMethod.GET)
    public @ResponseBody Map<String, Object> questionFormMeta() {
        Map<String, Object> payload = new LinkedHashMap<String, Object>();
        payload.put("fieldList", questionService.getAllField(null));
        payload.put("questionTypeList", questionService.getQuestionTypeList());
        payload.put("answerStageList", questionService.getAnswerStageList(null));
        return payload;
    }

    @RequestMapping(value = "/admin/exam-papers", method = RequestMethod.GET)
    public @ResponseBody Map<String, Object> adminExamPapers(
            @RequestParam(value = "paperType", required = false, defaultValue = "0") String paperType,
            @RequestParam(value = "page", required = false, defaultValue = "1") int page) {
        Page<ExamPaper> pageModel = new Page<ExamPaper>();
        pageModel.setPageNo(page);
        pageModel.setPageSize(10);
        Map<String, Object> payload = new LinkedHashMap<String, Object>();
        payload.put("paperType", paperType);
        payload.put("items", examService.getExamPaperListByPaperType(paperType, pageModel));
        payload.put("page", buildPagePayload(pageModel));
        return payload;
    }

    @RequestMapping(value = "/admin/exam-papers/{examPaperId}", method = RequestMethod.GET)
    public @ResponseBody Map<String, Object> adminExamPaperDetail(
            @PathVariable("examPaperId") int examPaperId) {
        Map<String, Object> payload = new LinkedHashMap<String, Object>();
        payload.put("paper", examService.getExamPaperById(examPaperId));
        return payload;
    }

    @SuppressWarnings("unchecked")
    @RequestMapping(value = "/admin/exam-papers/{examPaperId}/content", method = RequestMethod.GET)
    public @ResponseBody Map<String, Object> adminExamPaperContent(
            @PathVariable("examPaperId") int examPaperId,
            HttpServletRequest request) {
        Map<String, Object> payload = new LinkedHashMap<String, Object>();
        ExamPaper examPaper = examService.getExamPaperById(examPaperId);
        payload.put("paper", examPaper);
        payload.put("items", new ArrayList<Map<String, Object>>());
        if (examPaper == null || examPaper.getContent() == null
                || "".equals(examPaper.getContent().trim())) {
            return payload;
        }
        List<QuestionQueryResult> questionList = Object2Xml.toBean(
                examPaper.getContent(), List.class);
        payload.put("items", renderQuestionItems(questionList, buildBaseUrl(request)));
        return payload;
    }

    @RequestMapping(value = "/admin/exam-papers/{examPaperId}/content", method = RequestMethod.POST)
    public @ResponseBody Message adminExamPaperContentUpdate(
            @PathVariable("examPaperId") int examPaperId,
            @org.springframework.web.bind.annotation.RequestBody LinkedHashMap<Integer, Float> questionPointMap) {
        Message message = new Message();
        if (questionPointMap == null || questionPointMap.isEmpty()) {
            message.setResult("error");
            message.setMessageInfo("试卷至少需要保留一道题");
            return message;
        }
        try {
            ExamPaper current = examService.getExamPaperById(examPaperId);
            if (current != null && current.getStatus() == 1) {
                message.setResult("error");
                message.setMessageInfo("已上线试卷不允许修改内容");
                return message;
            }
            List<Integer> idList = new ArrayList<Integer>();
            Iterator<Integer> iterator = questionPointMap.keySet().iterator();
            while (iterator.hasNext()) {
                Integer key = iterator.next();
                if (key != null) {
                    idList.add(key);
                }
            }
            if (idList.isEmpty()) {
                message.setResult("error");
                message.setMessageInfo("试卷至少需要保留一道题");
                return message;
            }
            List<QuestionQueryResult> questionList = examService
                    .getQuestionDescribeListByIdList(idList);
            float totalPoint = 0f;
            for (QuestionQueryResult question : questionList) {
                Float point = questionPointMap.get(Integer.valueOf(question
                        .getQuestionId()));
                if (point == null) {
                    continue;
                }
                question.setQuestionPoint(point.floatValue());
                totalPoint += point.floatValue();
            }
            ExamPaper examPaper = new ExamPaper();
            examPaper.setId(examPaperId);
            examPaper.setContent(Object2Xml.toXml(questionList));
            examPaper.setTotal_point(totalPoint);
            examService.updateExamPaper(examPaper);
        } catch (Exception e) {
            message.setResult(e.getClass().getName());
            message.setMessageInfo(e.getMessage());
        }
        return message;
    }

    @RequestMapping(value = "/admin/exam-papers", method = RequestMethod.POST)
    public @ResponseBody Message adminExamPaperCreate(
            @org.springframework.web.bind.annotation.RequestBody PaperCreatorParam param) {
        Message message = new Message();
        UserInfo userInfo = getCurrentUser();
        ExamPaper examPaper = new ExamPaper();
        examPaper.setName(param.getPaperName());
        examPaper.setDuration(param.getTime());
        examPaper.setPass_point(param.getPassPoint());
        examPaper.setPaper_type(param.getPaperType());
        examPaper.setCreator(userInfo == null ? "0" : String.valueOf(userInfo.getUserid()));
        examPaper.setTotal_point(param.getPaperPoint());
        if (param.getQuestionKnowledgePointRate() == null
                || param.getQuestionKnowledgePointRate().size() == 0) {
            try {
                examService.insertExamPaper(examPaper);
                message.setGeneratedId(Integer.valueOf(examPaper.getId()));
            } catch (Exception e) {
                message.setResult(e.getClass().getName());
            }
            return message;
        }
        List<Integer> idList = new ArrayList<Integer>();
        HashMap<Integer, Float> knowledgeMap = param.getQuestionKnowledgePointRate();
        Iterator<Integer> it = knowledgeMap.keySet().iterator();
        while (it.hasNext()) {
            idList.add(it.next());
        }
        HashMap<Integer, HashMap<Integer, List<com.extr.domain.question.QuestionStruts>>> questionMap = questionService
                .getQuestionStrutsMap(idList);
        try {
            examService.createExamPaper(questionMap, param.getQuestionTypeNum(),
                    param.getQuestionTypePoint(), param.getQuestionKnowledgePointRate(),
                    examPaper);
            message.setGeneratedId(Integer.valueOf(examPaper.getId()));
        } catch (Exception e) {
            message.setResult(e.getClass().getName());
            message.setMessageInfo(e.getMessage());
        }
        return message;
    }

    @RequestMapping(value = "/admin/exam-papers/{examPaperId}", method = RequestMethod.POST)
    public @ResponseBody Message adminExamPaperUpdate(
            @PathVariable("examPaperId") int examPaperId,
            @org.springframework.web.bind.annotation.RequestBody ExamPaper examPaper) {
        Message message = new Message();
        if (examPaper.getName() != null && examPaper.getName().length() == 0) {
            message.setResult("error");
            message.setMessageInfo("试卷名称不能为空");
            return message;
        }
        examPaper.setId(examPaperId);
        examPaper.setStatus(-1);
        try {
            examService.updateExamPaper(examPaper);
            message.setObject(examPaper);
        } catch (Exception e) {
            message.setResult(e.getClass().getName());
        }
        return message;
    }

    @RequestMapping(value = "/admin/exam-papers/{examPaperId}/publish", method = RequestMethod.POST)
    public @ResponseBody Message adminExamPaperPublish(
            @PathVariable("examPaperId") int examPaperId) {
        Message message = new Message();
        ExamPaper examPaper = new ExamPaper();
        examPaper.setId(examPaperId);
        examPaper.setStatus(1);
        try {
            examService.updateExamPaper(examPaper);
        } catch (Exception e) {
            message.setResult(e.getClass().getName());
        }
        return message;
    }

    @RequestMapping(value = "/admin/exam-papers/{examPaperId}/offline", method = RequestMethod.POST)
    public @ResponseBody Message adminExamPaperOffline(
            @PathVariable("examPaperId") int examPaperId) {
        Message message = new Message();
        ExamPaper examPaper = new ExamPaper();
        examPaper.setId(examPaperId);
        examPaper.setStatus(2);
        try {
            examService.updateExamPaper(examPaper);
        } catch (Exception e) {
            message.setResult(e.getClass().getName());
        }
        return message;
    }

    @RequestMapping(value = "/admin/exam-papers/{examPaperId}", method = RequestMethod.DELETE)
    public @ResponseBody Message adminExamPaperDelete(
            @PathVariable("examPaperId") int examPaperId) {
        Message message = new Message();
        try {
            ExamPaper examPaper = examService.getExamPaperById(examPaperId);
            if (examPaper != null && examPaper.getStatus() == 1) {
                message.setResult("已发布的试卷不允许删除");
                return message;
            }
            examService.deleteExamPaper(examPaperId);
        } catch (Exception e) {
            message.setResult(e.getClass().getName());
        }
        return message;
    }

    @RequestMapping(value = "/student/comment-list/{questionId}/{index}/{indexId}", method = RequestMethod.GET)
    public @ResponseBody Message studentCommentList(
            @PathVariable("questionId") int questionId,
            @PathVariable("index") int index,
            @PathVariable("indexId") int indexId) {
        if (index <= 0) {
            index = 1;
        }
        Message msg = new Message();
        msg.setMessageInfo("not-has-next");
        Page<Comment> page = new Page<Comment>();
        if (index == 1) {
            page.setPageNo(index);
            page.setPageSize(6);
        } else {
            index = index + 2;
            page.setPageNo(index);
            page.setPageSize(2);
        }
        try {
            List<Comment> commentList = commentService.getCommentByQuestionId(questionId,
                    indexId, page);
            Comments comments = new Comments();
            comments.setComments(commentList);
            comments.setSize(page.getTotalRecord());
            if (page.getTotalRecord() > page.getPageSize() * index) {
                msg.setMessageInfo("has-next");
            }
            msg.setObject(comments);
        } catch (Exception e) {
            msg.setResult(e.getClass().getName());
        }
        return msg;
    }

    @RequestMapping(value = "/student/submit-comment", method = RequestMethod.POST)
    public @ResponseBody Message studentSubmitComment(
            @org.springframework.web.bind.annotation.RequestBody Comment comment) {
        Message msg = new Message();
        UserInfo userInfo = (UserInfo) org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication().getPrincipal();
        if (!TextLengthValidator.isRequiredTextValid(comment.getContentMsg())) {
            msg.setResult("error");
            msg.setMessageInfo(TextLengthValidator.message("评论"));
            return msg;
        }
        try {
            comment.setUserId(userInfo.getUserid());
            commentService.addComment(comment);
        } catch (Exception e) {
            msg.setResult(e.getClass().getName());
        }
        return msg;
    }

    @RequestMapping(value = "/admin/users", method = RequestMethod.GET)
    public @ResponseBody Map<String, Object> adminUsers(
            @RequestParam(value = "roleId", required = false, defaultValue = "3") int roleId,
            @RequestParam(value = "page", required = false, defaultValue = "1") int page) {
        Page<User> pageModel = new Page<User>();
        pageModel.setPageNo(page);
        pageModel.setPageSize(20);
        Map<String, Object> payload = new LinkedHashMap<String, Object>();
        payload.put("roleId", Integer.valueOf(roleId));
        payload.put("items", userService.getUserListByRoleId(roleId, pageModel));
        payload.put("page", buildPagePayload(pageModel));
        return payload;
    }

    @RequestMapping(value = "/admin/system-config", method = RequestMethod.GET)
    public @ResponseBody Map<String, Object> adminSystemConfig(
            @RequestParam(value = "page", required = false, defaultValue = "1") int page) {
        Page<User> pageModel = new Page<User>();
        pageModel.setPageNo(page);
        pageModel.setPageSize(20);
        List<User> admins = userService.getUserListByRoleId(1, pageModel);
        int adminCount = pageModel.getTotalRecord();
        if (adminCount == 0 && admins != null) {
            adminCount = admins.size();
            pageModel.setTotalRecord(adminCount);
        }
        Map<String, Object> payload = new LinkedHashMap<String, Object>();
        payload.put("backupSupported", Boolean.FALSE);
        payload.put("backupMessage", "旧系统此处只有入口页，没有实际备份 API。");
        payload.put("adminCount", Integer.valueOf(adminCount));
        payload.put("admins", admins);
        payload.put("page", buildPagePayload(pageModel));
        return payload;
    }

    @RequestMapping(value = "/admin/users", method = RequestMethod.POST)
    public @ResponseBody Message adminUserCreate(
            @org.springframework.web.bind.annotation.RequestBody User user) {
        UserInfo userInfo = getCurrentUser();
        user.setCreate_date(new Date());
        user.setFieldId(0);
        user.setCreator(userInfo == null ? "0" : String.valueOf(userInfo.getUserid()));
        Message message = new Message();
        if (!validateUserText(user, message)) {
            return message;
        }
        String password = user.getPassword() + "{" + user.getUsername() + "}";
        String resultPassword = new StandardPasswordEncoderForSha1().encode(password);
        user.setPassword(resultPassword);
        user.setEnabled("1");
        try {
            user.setCreator(userInfo == null ? "0" : String.valueOf(userInfo.getUserid()));
            userService.addUser(user);
        } catch (Exception e) {
            if ("duplicate-username".equals(e.getMessage())) {
                message.setResult(e.getMessage());
                message.setMessageInfo("用户名：" + user.getUsername() + "已经存在");
            } else {
                message.setResult("错误！" + e.getClass().getName());
            }
        }
        return message;
    }

    @RequestMapping(value = "/admin/admins", method = RequestMethod.POST)
    public @ResponseBody Message adminAdminCreate(
            @org.springframework.web.bind.annotation.RequestBody User user) {
        UserInfo userInfo = getCurrentUser();
        user.setCreate_date(new Date());
        user.setFieldId(0);
        user.setCreator(userInfo == null ? "0" : String.valueOf(userInfo.getUserid()));
        Message message = new Message();
        if (!validateUserText(user, message)) {
            return message;
        }
        String password = user.getPassword() + "{" + user.getUsername() + "}";
        String resultPassword = new StandardPasswordEncoderForSha1().encode(password);
        user.setPassword(resultPassword);
        user.setEnabled("1");
        try {
            user.setCreator(userInfo == null ? "0" : String.valueOf(userInfo.getUserid()));
            userService.addAdmin(user);
        } catch (Exception e) {
            if ("duplicate-username".equals(e.getMessage())) {
                message.setResult(e.getMessage());
                message.setMessageInfo("用户名：" + user.getUsername() + "已经存在");
            } else {
                message.setResult("错误！" + e.getClass().getName());
            }
        }
        return message;
    }

    @RequestMapping(value = "/admin/users/{userId}/disable", method = RequestMethod.POST)
    public @ResponseBody Message adminUserDisable(@PathVariable("userId") int userId) {
        Message message = new Message();
        try {
            userService.disableUser(userId);
        } catch (Exception e) {
            message.setResult(e.getClass().getName());
        }
        return message;
    }

    @RequestMapping(value = "/admin/users/{userId}/enable", method = RequestMethod.POST)
    public @ResponseBody Message adminUserEnable(@PathVariable("userId") int userId) {
        Message message = new Message();
        try {
            User user = new User();
            user.setId(userId);
            user.setEnabled("1");
            userService.updateUser(user, null);
        } catch (Exception e) {
            message.setResult(e.getClass().getName());
        }
        return message;
    }

    @RequestMapping(value = "/student/practice/by-point/{knowledgePointId}/{questionTypeId}", method = RequestMethod.GET)
    public @ResponseBody Map<String, Object> practiceByPoint(
            @PathVariable("knowledgePointId") int knowledgePointId,
            @PathVariable("questionTypeId") int questionTypeId,
            HttpServletRequest request) {
        List<QuestionQueryResult> questions = questionService
                .getQuestionAnalysisListByPointIdAndTypeId(questionTypeId,
                        knowledgePointId);
        Map<String, Object> payload = new LinkedHashMap<String, Object>();
        payload.put("practiceName", "强化练习");
        payload.put("fieldName", resolveFieldName(questions));
        payload.put("questionTypeName", resolveQuestionTypeName(questionTypeId));
        payload.put("knowledgePointId", Integer.valueOf(knowledgePointId));
        payload.put("questionTypeId", Integer.valueOf(questionTypeId));
        payload.put("amount", Integer.valueOf(questions.size()));
        payload.put("finishedQuestionIds",
                loadFinishedQuestionIds(knowledgePointId, questionTypeId));
        payload.put("items", renderQuestionItems(questions, buildBaseUrl(request)));
        return payload;
    }

    @RequestMapping(value = "/student/practice/by-stage/{answerStageId}/{questionTypeId}", method = RequestMethod.GET)
    public @ResponseBody Map<String, Object> practiceByStage(
            @PathVariable("answerStageId") int answerStageId,
            @PathVariable("questionTypeId") int questionTypeId,
            HttpServletRequest request) {
        List<QuestionQueryResult> questions = questionService
                .getQuestionAnalysisListByAnswerStageIdAndTypeId(questionTypeId,
                        answerStageId);
        Map<String, Object> payload = new LinkedHashMap<String, Object>();
        payload.put("practiceName", "答题人阶段强化练习");
        payload.put("fieldName", "答题人阶段");
        payload.put("questionTypeName", resolveQuestionTypeName(questionTypeId));
        payload.put("answerStageId", Integer.valueOf(answerStageId));
        payload.put("questionTypeId", Integer.valueOf(questionTypeId));
        payload.put("amount", Integer.valueOf(questions.size()));
        payload.put("items", renderQuestionItems(questions, buildBaseUrl(request)));
        return payload;
    }

    @RequestMapping(value = "/student/practice/submit", method = RequestMethod.POST)
    public @ResponseBody Map<String, Object> submitPractice(
            @org.springframework.web.bind.annotation.RequestBody QuestionHistory questionHistory) {
        Map<String, Object> payload = new LinkedHashMap<String, Object>();
        payload.put("result", "success");
        try {
            payload.put("isRight", Boolean.valueOf(storePracticeHistory(questionHistory)));
            payload.put("questionId", Integer.valueOf(questionHistory.getQuestionId()));
        } catch (Exception e) {
            payload.put("result", e.getClass().getName());
            payload.put("messageInfo", e.getMessage());
        }
        return payload;
    }

    @SuppressWarnings("unchecked")
    @RequestMapping(value = "/student/exams/{examPaperId}", method = RequestMethod.GET)
    public @ResponseBody Map<String, Object> examPayload(
            @PathVariable("examPaperId") int examPaperId,
            HttpServletRequest request) {
        UserInfo userInfo = getCurrentUser();
        ExamHistory examHistory = examService
                .getUserExamHistoryByUserIdAndExamPaperId(userInfo.getUserid(),
                        examPaperId);
        ExamPaper examPaper = examService.getExamPaperById(examPaperId);
        String content = examPaper.getContent();
        if (examHistory == null) {
            examHistory = new ExamHistory();
            examHistory.setContent(content);
            examHistory.setExamPaperId(examPaperId);
            examHistory.setUserId(userInfo.getUserid());
            examHistory.setDuration(examPaper.getDuration());
            examService.addUserExamHistory(examHistory);
        } else {
            content = examHistory.getContent();
        }

        List<QuestionQueryResult> questionList = Object2Xml.toBean(content,
                List.class);

        Map<String, Object> payload = new LinkedHashMap<String, Object>();
        payload.put("paper", examPaper);
        payload.put("examHistoryId", Integer.valueOf(examHistory.getHistId()));
        payload.put("examPaperId", Integer.valueOf(examPaperId));
        payload.put("durationSeconds", Integer.valueOf(examPaper.getDuration() * 60));
        payload.put("items", renderQuestionItems(questionList, buildBaseUrl(request)));
        return payload;
    }

    @SuppressWarnings("unchecked")
    @RequestMapping(value = "/student/exams/submit", method = RequestMethod.POST)
    public @ResponseBody Map<String, Object> submitExam(
            @org.springframework.web.bind.annotation.RequestBody ExamFinishParam examFinishParam) {
        Map<String, Object> payload = new LinkedHashMap<String, Object>();
        payload.put("result", "success");
        try {
            ExamHistory examHistory = examService
                    .getUserExamHistoryByHistId(examFinishParam.getExam_history_id());
            List<QuestionQueryResult> questionList = Object2Xml.toBean(
                    examHistory.getContent(), List.class);
            float pointGet = calculateExamPoint(questionList, examFinishParam.getAs());
            examHistory.setPointGet(pointGet);
            examHistory.setAnswerSheet(Object2Xml.toXml(examFinishParam.getAs()));
            examHistory.setSubmitTime(new Date());
            examHistory.setDuration(examFinishParam.getDuration());
            examService.updateExamHistory(examHistory);
            payload.putAll(buildExamResultPayload(examHistory.getExamPaperId()));
        } catch (Exception e) {
            payload.put("result", e.getClass().getName());
            payload.put("messageInfo", e.getMessage());
        }
        return payload;
    }

    @RequestMapping(value = "/student/exams/{examPaperId}/result", method = RequestMethod.GET)
    public @ResponseBody Map<String, Object> examResult(
            @PathVariable("examPaperId") int examPaperId) {
        return buildExamResultPayload(examPaperId);
    }

    @SuppressWarnings("unchecked")
    @RequestMapping(value = "/student/exams/{examPaperId}/report", method = RequestMethod.GET)
    public @ResponseBody Map<String, Object> examReport(
            @PathVariable("examPaperId") int examPaperId,
            HttpServletRequest request) {
        UserInfo userInfo = getCurrentUser();
        ExamHistory examHistory = examService
                .getUserExamHistoryByUserIdAndExamPaperId(userInfo.getUserid(),
                        examPaperId);
        Map<String, Object> payload = new LinkedHashMap<String, Object>();
        payload.put("examPaperId", Integer.valueOf(examPaperId));
        payload.put("submitted", Boolean.valueOf(examHistory != null
                && examHistory.getAnswerSheet() != null));
        payload.put("items", new ArrayList<Map<String, Object>>());
        if (examHistory == null || examHistory.getAnswerSheet() == null) {
            return payload;
        }

        List<QuestionQueryResult> questionList = Object2Xml.toBean(
                examHistory.getContent(), List.class);
        HashMap<Integer, AnswerSheetItem> answerSheet = Object2Xml.toBean(
                examHistory.getAnswerSheet(), HashMap.class);
        List<Map<String, Object>> items = new ArrayList<Map<String, Object>>();
        String baseUrl = buildBaseUrl(request);
        for (QuestionQueryResult question : questionList) {
            Map<String, Object> item = new LinkedHashMap<String, Object>();
            AnswerSheetItem answerSheetItem = answerSheet.get(Integer
                    .valueOf(question.getQuestionId()));
            item.put("question", question);
            item.put("answerSheetItem", answerSheetItem);
            item.put("html", new QuestionAdapter(answerSheetItem, question,
                    baseUrl).getReportStringFromXML());
            items.add(item);
        }
        payload.put("items", items);
        return payload;
    }

    private String resolveFieldName(List<QuestionQueryResult> questions) {
        if (questions == null || questions.isEmpty()) {
            return "";
        }
        String pointName = questions.get(0).getPointName();
        if (pointName == null) {
            return "";
        }
        String[] parts = pointName.split(">");
        if (parts.length > 1) {
            return parts[1];
        }
        return pointName;
    }

    private String resolveQuestionTypeName(int questionTypeId) {
        List<QuestionType> questionTypeList = questionService.getQuestionTypeList();
        for (QuestionType questionType : questionTypeList) {
            if (questionType.getId() == questionTypeId) {
                return questionType.getName();
            }
        }
        return "";
    }

    private boolean storePracticeHistory(QuestionHistory questionHistory)
            throws Exception {
        UserInfo userInfo = getCurrentUser();
        UserQuestionHistory userQuestionHistory = questionService
                .getUserQuestionHistoryByUserId(userInfo.getUserid());
        boolean isNew = userQuestionHistory == null;
        if (userQuestionHistory == null) {
            userQuestionHistory = new UserQuestionHistory();
            userQuestionHistory.setUserId(userInfo.getUserid());
        }
        boolean isRight = questionHistory.getAnswer().equals(
                questionHistory.getMyAnswer());
        questionHistory.setTime(new Date());
        questionHistory.setRight(isRight);
        userQuestionHistory.setModifyTime(new Date());

        Map<Integer, Map<Integer, QuestionHistory>> history = userQuestionHistory
                .getHistory();
        if (history == null || history.size() == 0) {
            history = new HashMap<Integer, Map<Integer, QuestionHistory>>();
        }
        int questionTypeId = questionHistory.getQuestionTypeId();
        int questionId = questionHistory.getQuestionId();
        if (questionTypeId == 1 || questionTypeId == 2 || questionTypeId == 3
                || questionTypeId == 4) {
            Map<Integer, QuestionHistory> historyMap = new TreeMap<Integer, QuestionHistory>();
            if (isRight) {
                if (history.containsKey(Integer.valueOf(1))) {
                    historyMap = history.get(Integer.valueOf(1));
                }
                if (history.containsKey(Integer.valueOf(0))) {
                    history.get(Integer.valueOf(0)).remove(
                            Integer.valueOf(questionId));
                }
                historyMap.put(Integer.valueOf(questionId), questionHistory);
                history.put(Integer.valueOf(1), historyMap);
            } else {
                if (history.containsKey(Integer.valueOf(0))) {
                    historyMap = history.get(Integer.valueOf(0));
                }
                if (history.containsKey(Integer.valueOf(1))) {
                    history.get(Integer.valueOf(1)).remove(
                            Integer.valueOf(questionId));
                }
                historyMap.put(Integer.valueOf(questionId), questionHistory);
                history.put(Integer.valueOf(0), historyMap);
            }
        } else {
            Map<Integer, QuestionHistory> historyMap = new TreeMap<Integer, QuestionHistory>();
            if (history.containsKey(Integer.valueOf(-1))) {
                historyMap = history.get(Integer.valueOf(-1));
            }
            historyMap.put(Integer.valueOf(questionId), questionHistory);
            history.put(Integer.valueOf(-1), historyMap);
        }

        userQuestionHistory.setHistory(history);
        if (isNew) {
            questionService.addUserQuestionHistory(userQuestionHistory);
        } else {
            questionService.updateUserQuestionHistory(userQuestionHistory);
        }
        return isRight;
    }

    private List<Integer> loadFinishedQuestionIds(int knowledgePointId,
            int questionTypeId) {
        UserInfo userInfo = getCurrentUser();
        UserQuestionHistory history = questionService
                .getUserQuestionHistoryByUserId(userInfo.getUserid());
        Map<Integer, QuestionHistory> rightMap = new TreeMap<Integer, QuestionHistory>();
        Map<Integer, QuestionHistory> wrongMap = new TreeMap<Integer, QuestionHistory>();
        Map<Integer, QuestionHistory> otherMap = new TreeMap<Integer, QuestionHistory>();
        List<QuestionHistory> questionHistoryList = new ArrayList<QuestionHistory>();
        List<Integer> finishedIds = new ArrayList<Integer>();
        if (history != null && history.getHistory() != null) {
            if (history.getHistory().containsKey(Integer.valueOf(0))) {
                wrongMap = history.getHistory().get(Integer.valueOf(0));
                appendMatchedHistory(questionHistoryList, wrongMap,
                        knowledgePointId, questionTypeId);
            }
            if (history.getHistory().containsKey(Integer.valueOf(1))) {
                rightMap = history.getHistory().get(Integer.valueOf(1));
                appendMatchedHistory(questionHistoryList, rightMap,
                        knowledgePointId, questionTypeId);
            }
            if (history.getHistory().containsKey(Integer.valueOf(-1))) {
                otherMap = history.getHistory().get(Integer.valueOf(-1));
                appendMatchedHistory(questionHistoryList, otherMap,
                        knowledgePointId, questionTypeId);
            }
        }

        Collections.sort(questionHistoryList);
        for (QuestionHistory questionHistory : questionHistoryList) {
            finishedIds.add(Integer.valueOf(questionHistory.getQuestionId()));
        }
        return finishedIds;
    }

    private void appendMatchedHistory(List<QuestionHistory> target,
            Map<Integer, QuestionHistory> source, int knowledgePointId,
            int questionTypeId) {
        Iterator<Integer> iterator = source.keySet().iterator();
        while (iterator.hasNext()) {
            Integer key = iterator.next();
            QuestionHistory questionHistory = source.get(key);
            if (questionHistory.getPointId() == knowledgePointId
                    && questionHistory.getQuestionTypeId() == questionTypeId) {
                target.add(questionHistory);
            }
        }
    }

    private List<Map<String, Object>> renderQuestionItems(
            List<QuestionQueryResult> questions, String baseUrl) {
        List<Map<String, Object>> items = new ArrayList<Map<String, Object>>();
        for (QuestionQueryResult question : questions) {
            Map<String, Object> item = new LinkedHashMap<String, Object>();
            item.put("question", question);
            item.put("html", new QuestionAdapter(question, baseUrl).getStringFromXML());
            items.add(item);
        }
        return items;
    }

    private Map<String, Object> buildPagePayload(Page<?> page) {
        Map<String, Object> payload = new LinkedHashMap<String, Object>();
        payload.put("pageNo", Integer.valueOf(page.getPageNo()));
        payload.put("pageSize", Integer.valueOf(page.getPageSize()));
        payload.put("totalPage", Integer.valueOf(page.getTotalPage()));
        payload.put("totalRecord", Integer.valueOf(page.getTotalRecord()));
        return payload;
    }

    private boolean validateUserText(User user, Message message) {
        if (!TextLengthValidator.isRequiredTextValid(user.getUsername())) {
            message.setResult("error");
            message.setMessageInfo(TextLengthValidator.message("用户名"));
            return false;
        }
        if (!TextLengthValidator.isRequiredTextValid(user.getEmail())) {
            message.setResult("error");
            message.setMessageInfo(TextLengthValidator.message("邮箱"));
            return false;
        }
        return validateOptionalUserText(user, message);
    }

    private boolean validateOptionalUserText(User user, Message message) {
        if (!TextLengthValidator.isOptionalTextValid(user.getTruename())) {
            message.setResult("error");
            message.setMessageInfo(TextLengthValidator.message("真实姓名"));
            return false;
        }
        if (!TextLengthValidator.isOptionalTextValid(user.getPhone())) {
            message.setResult("error");
            message.setMessageInfo(TextLengthValidator.message("手机号"));
            return false;
        }
        if (!TextLengthValidator.isOptionalTextValid(user.getDepartment())) {
            message.setResult("error");
            message.setMessageInfo(TextLengthValidator.message("部门"));
            return false;
        }
        return true;
    }

    private Map<String, Object> buildUserPayload(UserInfo userInfo) {
        if (userInfo == null) {
            return null;
        }
        Map<String, Object> payload = new LinkedHashMap<String, Object>();
        payload.put("userid", Integer.valueOf(userInfo.getUserid()));
        payload.put("username", userInfo.getUsername());
        payload.put("trueName", userInfo.getTrueName());
        payload.put("rolesName", userInfo.getRolesName());
        payload.put("enabled", userInfo.getEnabled());
        payload.put("fieldId", Integer.valueOf(userInfo.getFieldId()));
        payload.put("fieldName", userInfo.getFieldName());
        payload.put("email", userInfo.getEmail());
        payload.put("lastLoginTime", userInfo.getLastLoginTime());
        payload.put("loginTime", userInfo.getLoginTime());
        if (userInfo.getUserid() != 0) {
            payload.put("profile", userService.getUserById(userInfo.getUserid()));
        }
        return payload;
    }

    private UserInfo resolveUserInfo(Authentication authentication) {
        if (authentication == null) {
            return null;
        }
        Object principal = authentication.getPrincipal();
        if (principal instanceof UserInfo) {
            return (UserInfo) principal;
        }
        return null;
    }

    private UserInfo getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext()
                .getAuthentication();
        if (authentication == null) {
            return null;
        }
        Object principal = authentication.getPrincipal();
        if (principal instanceof UserInfo) {
            return (UserInfo) principal;
        }
        return null;
    }

    private void syncLoginTimes(UserInfo userInfo) {
        if (userInfo == null) {
            return;
        }
        Date now = new Date();
        try {
            User update = new User();
            update.setId(userInfo.getUserid());
            update.setLoginTime(now);
            update.setLastLoginTime(userInfo.getLoginTime());
            userService.updateUser(update, null);
            userInfo.setLastLoginTime(userInfo.getLoginTime());
            userInfo.setLoginTime(now);
        } catch (Exception e) {
            // Ignore login timestamp update errors to avoid breaking auth.
        }
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> buildExamResultPayload(int examPaperId) {
        UserInfo userInfo = getCurrentUser();
        ExamPaper examPaper = examService.getExamPaperById(examPaperId);
        ExamHistory examHistory = examService
                .getUserExamHistoryByUserIdAndExamPaperId(userInfo.getUserid(),
                        examPaperId);
        Map<String, Object> payload = new LinkedHashMap<String, Object>();
        payload.put("examPaperId", Integer.valueOf(examPaperId));
        payload.put("paper", examPaper);
        payload.put("submitted", Boolean.valueOf(examHistory != null
                && examHistory.getAnswerSheet() != null));
        payload.put("pointGet", Float.valueOf(examHistory == null ? 0f
                : examHistory.getPointGet()));
        payload.put("passed", Boolean.valueOf(examHistory != null
                && examHistory.getPointGet() >= examPaper.getPass_point()));
        payload.put("createTime",
                examHistory == null ? null : formatDate(examHistory.getCreateTime()));
        payload.put("submitTime",
                examHistory == null ? null : formatDate(examHistory.getSubmitTime()));

        Map<String, Map<String, Integer>> knowledgeStats = new LinkedHashMap<String, Map<String, Integer>>();
        Map<Integer, Boolean> answer = new LinkedHashMap<Integer, Boolean>();
        int total = 0;
        int right = 0;
        int wrong = 0;
        if (examHistory != null && examHistory.getContent() != null) {
            List<QuestionQueryResult> questionList = Object2Xml.toBean(
                    examHistory.getContent(), List.class);
            HashMap<Integer, AnswerSheetItem> answerSheet = examHistory
                    .getAnswerSheet() == null ? new HashMap<Integer, AnswerSheetItem>()
                    : Object2Xml.toBean(examHistory.getAnswerSheet(),
                            HashMap.class);
            total = answerSheet.size();
            for (QuestionQueryResult question : questionList) {
                if (question.getQuestionTypeId() != 1
                        && question.getQuestionTypeId() != 2
                        && question.getQuestionTypeId() != 3) {
                    continue;
                }
                AnswerSheetItem item = answerSheet.get(Integer.valueOf(question
                        .getQuestionId()));
                if (item == null) {
                    continue;
                }
                String pointName = resolvePointSummaryName(question.getPointName());
                Map<String, Integer> stats = knowledgeStats.containsKey(pointName) ? knowledgeStats
                        .get(pointName) : new LinkedHashMap<String, Integer>();
                if (!stats.containsKey("sum")) {
                    stats.put("sum", Integer.valueOf(0));
                    stats.put("rightTimes", Integer.valueOf(0));
                    stats.put("wrongTimes", Integer.valueOf(0));
                }
                stats.put("sum", Integer.valueOf(stats.get("sum").intValue() + 1));
                boolean isRight = question.getAnswer().equals(item.getAnswer());
                answer.put(Integer.valueOf(question.getQuestionId()), Boolean
                        .valueOf(isRight));
                if (isRight) {
                    right++;
                    stats.put("rightTimes", Integer.valueOf(stats.get(
                            "rightTimes").intValue() + 1));
                } else {
                    wrong++;
                    stats.put("wrongTimes", Integer.valueOf(stats.get(
                            "wrongTimes").intValue() + 1));
                }
                knowledgeStats.put(pointName, stats);
            }
        }
        payload.put("total", Integer.valueOf(total));
        payload.put("right", Integer.valueOf(right));
        payload.put("wrong", Integer.valueOf(wrong));
        payload.put("knowledgeStats", knowledgeStats);
        payload.put("answer", answer);
        return payload;
    }

    private float calculateExamPoint(List<QuestionQueryResult> questionList,
            HashMap<Integer, AnswerSheetItem> answerSheet) {
        float pointGet = 0f;
        if (answerSheet == null) {
            return pointGet;
        }
        for (QuestionQueryResult questionQueryResult : questionList) {
            AnswerSheetItem item = answerSheet.get(Integer
                    .valueOf(questionQueryResult.getQuestionId()));
            if (item != null
                    && questionQueryResult.getAnswer().equals(item.getAnswer())) {
                pointGet += questionQueryResult.getQuestionPoint();
            }
        }
        return pointGet;
    }

    private String resolvePointSummaryName(String pointName) {
        if (pointName == null || pointName.length() == 0) {
            return "";
        }
        String[] segments = pointName.split(">");
        if (segments.length > 1) {
            return segments[1];
        }
        return pointName;
    }

    private String formatDate(Date date) {
        if (date == null) {
            return null;
        }
        return new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(date);
    }

    private List<Map<String, Object>> buildStatisticsResultList(UserInfo userInfo) {
        List<Map<String, Object>> result = new ArrayList<Map<String, Object>>();
        if (userInfo == null) {
            return result;
        }
        UserQuestionHistory uqh = questionService
                .getUserQuestionHistoryByUserId(userInfo.getUserid());
        Map<Integer, Map<Integer, QuestionHistory>> history = uqh == null
                || uqh.getHistory() == null ? new HashMap<Integer, Map<Integer, QuestionHistory>>()
                        : uqh.getHistory();
        List<KnowledgePoint> pointList = collectUserCenterKnowledgePoints(userInfo);
        Map<Integer, Integer> pointStatisticMap = buildPointStatisticMap(pointList);
        Map<Integer, QuestionHistory> rightMap = history.containsKey(Integer.valueOf(1))
                ? history.get(Integer.valueOf(1)) : new HashMap<Integer, QuestionHistory>();
        Map<Integer, QuestionHistory> wrongMap = history.containsKey(Integer.valueOf(0))
                ? history.get(Integer.valueOf(0)) : new HashMap<Integer, QuestionHistory>();

        for (KnowledgePoint kp : pointList) {
            int rightAmount = countHistoryByPoint(rightMap, kp.getPointId(), -1);
            int wrongAmount = countHistoryByPoint(wrongMap, kp.getPointId(), -1);
            int amount = pointStatisticMap.containsKey(Integer.valueOf(kp.getPointId()))
                    ? pointStatisticMap.get(Integer.valueOf(kp.getPointId())).intValue() : 0;
            float rightRate = amount != 0 && rightAmount + wrongAmount != 0
                    ? (float) Math.round((float) rightAmount * 10000f / amount) / 10000f
                    : 0f;
            float finishRate = amount != 0
                    ? (float) Math.round((float) (rightAmount + wrongAmount) * 10000f / amount)
                            / 10000f
                    : 0f;

            Map<String, Object> item = new LinkedHashMap<String, Object>();
            item.put("pointId", Integer.valueOf(kp.getPointId()));
            item.put("pointName", kp.getPointName());
            item.put("amount", Integer.valueOf(amount));
            item.put("rightTimes", Integer.valueOf(rightAmount));
            item.put("wrongTimes", Integer.valueOf(wrongAmount));
            item.put("finishRate", Float.valueOf(finishRate));
            item.put("rightRate", Float.valueOf(rightRate));
            result.add(item);
        }
        return result;
    }

    private List<Map<String, Object>> buildAnswerStageAnalysisList(UserInfo userInfo) {
        List<Map<String, Object>> result = new ArrayList<Map<String, Object>>();
        if (userInfo == null) {
            return result;
        }
        UserQuestionHistory uqh = questionService
                .getUserQuestionHistoryByUserId(userInfo.getUserid());
        Map<Integer, Map<Integer, QuestionHistory>> history = uqh == null
                || uqh.getHistory() == null ? new HashMap<Integer, Map<Integer, QuestionHistory>>()
                        : uqh.getHistory();
        Map<Integer, QuestionHistory> rightMap = history.containsKey(Integer.valueOf(1))
                ? history.get(Integer.valueOf(1)) : new HashMap<Integer, QuestionHistory>();
        Map<Integer, QuestionHistory> wrongMap = history.containsKey(Integer.valueOf(0))
                ? history.get(Integer.valueOf(0)) : new HashMap<Integer, QuestionHistory>();
        List<AnswerStage> answerStageList = questionService.getAnswerStageList(null);
        List<Integer> answerStageIdList = new ArrayList<Integer>();
        for (AnswerStage answerStage : answerStageList) {
            answerStageIdList.add(Integer.valueOf(answerStage.getStageId()));
        }
        List<QuestionImproveResult> questionImproveList = answerStageIdList.isEmpty()
                ? new ArrayList<QuestionImproveResult>()
                : questionService.getQuestionImproveResultByAnswerStageIdList(answerStageIdList);

        for (AnswerStage answerStage : answerStageList) {
            Map<String, Object> analysis = new LinkedHashMap<String, Object>();
            analysis.put("knowledgePointId", Integer.valueOf(answerStage.getStageId()));
            analysis.put("knowledgePointName", answerStage.getStageName());

            List<Map<String, Object>> typeAnalysis = new ArrayList<Map<String, Object>>();
            float totalCount = 0f;
            float finishQuestionCount = 0f;
            for (QuestionImproveResult qir : questionImproveList) {
                if (qir.getQuestionPointId() == answerStage.getStageId()) {
                    Map<String, Object> typeItem = new LinkedHashMap<String, Object>();
                    typeItem.put("questionTypeId", Integer.valueOf(qir.getQuestionTypeId()));
                    typeItem.put("questionTypeName", qir.getQuestionTypeName());
                    typeItem.put("restAmount", Integer.valueOf(qir.getAmount()));
                    typeItem.put("rightAmount", Integer.valueOf(0));
                    typeItem.put("wrongAmount", Integer.valueOf(0));
                    totalCount += qir.getAmount();
                    typeAnalysis.add(typeItem);
                }
            }
            for (Map<String, Object> typeItem : typeAnalysis) {
                int questionTypeId = ((Number) typeItem.get("questionTypeId")).intValue();
                int rightAmount = getAnswerStageHistoryAmount(rightMap,
                        answerStage.getStageId(), questionTypeId);
                int wrongAmount = getAnswerStageHistoryAmount(wrongMap,
                        answerStage.getStageId(), questionTypeId);
                int restAmount = ((Number) typeItem.get("restAmount")).intValue();
                typeItem.put("rightAmount", Integer.valueOf(rightAmount));
                typeItem.put("wrongAmount", Integer.valueOf(wrongAmount));
                typeItem.put("restAmount", Integer.valueOf(restAmount - rightAmount - wrongAmount));
                finishQuestionCount += rightAmount + wrongAmount;
            }
            analysis.put("typeAnalysis", typeAnalysis);
            analysis.put("finishRate", Float.valueOf(totalCount == 0f ? 0f
                    : ((float) Math.round(finishQuestionCount * 1000f / totalCount)) / 1000f));
            result.add(analysis);
        }
        return result;
    }

    private List<KnowledgePoint> collectUserCenterKnowledgePoints(UserInfo userInfo) {
        List<KnowledgePoint> pointList = questionService
                .getKnowledgePointByFieldId(userInfo.getFieldId(), null);
        List<KnowledgePoint> pointList1 = new ArrayList<KnowledgePoint>();
        if (userInfo.getFieldId() != 0 && userInfo.getFieldId() != 1) {
            pointList1 = questionService.getKnowledgePointByFieldId(1, null);
        }
        pointList.addAll(pointList1);
        return pointList;
    }

    private Map<Integer, Integer> buildPointStatisticMap(List<KnowledgePoint> pointList) {
        List<Integer> pointIdList = new ArrayList<Integer>();
        for (KnowledgePoint kp : pointList) {
            pointIdList.add(Integer.valueOf(kp.getPointId()));
        }
        List<QuestionImproveResult> questionImproveList = pointIdList.isEmpty()
                ? new ArrayList<QuestionImproveResult>()
                : questionService.getQuestionImproveResultByQuestionPointIdList(pointIdList);
        Map<Integer, Integer> pointStatisticMap = new HashMap<Integer, Integer>();
        for (QuestionImproveResult qir : questionImproveList) {
            int amount = pointStatisticMap.containsKey(Integer.valueOf(qir.getQuestionPointId()))
                    ? pointStatisticMap.get(Integer.valueOf(qir.getQuestionPointId())).intValue()
                    : 0;
            if (qir.getQuestionTypeId() == 1 || qir.getQuestionTypeId() == 2
                    || qir.getQuestionTypeId() == 3 || qir.getQuestionTypeId() == 4) {
                amount += qir.getAmount();
            }
            pointStatisticMap.put(Integer.valueOf(qir.getQuestionPointId()),
                    Integer.valueOf(amount));
        }
        return pointStatisticMap;
    }

    private String buildLabels(List<Map<String, Object>> stats) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < stats.size(); i++) {
            sb.append("\"").append(stats.get(i).get("pointName")).append("\"");
            if (i != stats.size() - 1) {
                sb.append(",");
            }
        }
        return sb.toString();
    }

    private String buildFinishData(List<Map<String, Object>> stats) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < stats.size(); i++) {
            Number finishRate = (Number) stats.get(i).get("finishRate");
            sb.append(finishRate.doubleValue() * 100d);
            if (i != stats.size() - 1) {
                sb.append(",");
            }
        }
        return sb.toString();
    }

    private String buildCorrectData(List<Map<String, Object>> stats) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < stats.size(); i++) {
            Number rightRate = (Number) stats.get(i).get("rightRate");
            sb.append(rightRate.doubleValue() * 100d);
            if (i != stats.size() - 1) {
                sb.append(",");
            }
        }
        return sb.toString();
    }

    private int countHistoryByPoint(Map<Integer, QuestionHistory> historyMap,
            int pointId, int questionTypeId) {
        int amount = 0;
        if (historyMap == null) {
            return amount;
        }
        Iterator<Integer> it = historyMap.keySet().iterator();
        while (it.hasNext()) {
            int key = it.next().intValue();
            QuestionHistory qh = historyMap.get(Integer.valueOf(key));
            if (qh == null) {
                continue;
            }
            if (qh.getPointId() != pointId) {
                continue;
            }
            if (questionTypeId != -1 && qh.getQuestionTypeId() != questionTypeId) {
                continue;
            }
            amount++;
        }
        return amount;
    }

    private int getAnswerStageHistoryAmount(Map<Integer, QuestionHistory> historyMap,
            int answerStageId, int questionTypeId) {
        int amount = 0;
        if (historyMap == null) {
            return amount;
        }
        Iterator<Integer> it = historyMap.keySet().iterator();
        while (it.hasNext()) {
            int key = it.next().intValue();
            QuestionHistory qh = historyMap.get(Integer.valueOf(key));
            if (qh == null || qh.getQuestionTypeId() != questionTypeId) {
                continue;
            }
            QuestionAnswerStage answerStage = questionService
                    .getQuestionAnswerStageByQuestionId(qh.getQuestionId());
            if (answerStage != null && answerStage.getStageId() == answerStageId) {
                amount++;
            }
        }
        return amount;
    }

    private String buildBaseUrl(HttpServletRequest request) {
        StringBuilder builder = new StringBuilder();
        builder.append(request.getScheme()).append("://")
                .append(request.getServerName());
        if (!(request.getScheme().equals("http") && request.getServerPort() == 80)
                && !(request.getScheme().equals("https") && request.getServerPort() == 443)) {
            builder.append(":").append(request.getServerPort());
        }
        builder.append(request.getContextPath()).append("/");
        return builder.toString();
    }
}
