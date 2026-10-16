package com.extr.integration;

import java.sql.Connection;
import java.util.List;
import java.util.Map;

import javax.sql.DataSource;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.web.FilterChainProxy;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = "examxx.admin-registration-code-sha256=18b76086009fd2daad16cfccaf60843ebb207aff359ff70d64a03182d8b67914")
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class AppApiIntegrationTest {

    @Autowired
    private DataSource dataSource;
    @Autowired
    private WebApplicationContext webApplicationContext;
    @Autowired
    private FilterChainProxy springSecurityFilterChain;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @BeforeEach
    public void setUp() throws Exception {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext)
                .addFilters(springSecurityFilterChain).build();
        objectMapper = new ObjectMapper();
        ResourceDatabasePopulator populator = new ResourceDatabasePopulator();
        populator.addScript(new ClassPathResource("h2/legacy-schema.sql"));
        populator.addScript(new ClassPathResource("h2/data.sql"));
        Connection connection = dataSource.getConnection();
        try {
            populator.populate(connection);
        } finally {
            connection.close();
        }
    }

    @Test
    public void studentApiFlow_shouldSupportPracticeExamSubmitAndReport()
            throws Exception {
        MockHttpSession session = login("student", "123456");

        Map<String, Object> auth = readJson(mockMvc.perform(get("/api/app/auth/me")
                .session(session).header("Accept", "application/json"))
                .andExpect(status().isOk()).andReturn());
        assertTrue(Boolean.TRUE.equals(auth.get("authenticated")));

        Map<String, Object> home = readJson(mockMvc.perform(get("/api/app/home")
                .session(session).header("Accept", "application/json"))
                .andExpect(status().isOk()).andReturn());
        assertEquals(1, castList(home.get("historypaper")).size());

        Map<String, Object> practice = readJson(mockMvc.perform(
                get("/api/app/student/practice/by-point/101/1").session(session)
                        .header("Accept", "application/json"))
                .andExpect(status().isOk()).andReturn());
        assertEquals(2, castList(practice.get("items")).size());
        assertEquals(0, castList(practice.get("finishedQuestionIds")).size());

        Map<String, Object> practiceSubmit = readJson(mockMvc.perform(
                post("/api/app/student/practice/submit").session(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"questionId\":1001,\"questionTypeId\":1,\"pointId\":101,\"answer\":\"A\",\"myAnswer\":\"A\",\"from\":1}"))
                .andExpect(status().isOk()).andReturn());
        assertTrue(Boolean.TRUE.equals(practiceSubmit.get("isRight")));

        Map<String, Object> practiceAfterSubmit = readJson(mockMvc.perform(
                get("/api/app/student/practice/by-point/101/1").session(session)
                        .header("Accept", "application/json"))
                .andExpect(status().isOk()).andReturn());
        assertEquals(1, castList(practiceAfterSubmit.get("finishedQuestionIds"))
                .size());

        Map<String, Object> wrongPracticeSubmit = readJson(mockMvc.perform(
                post("/api/app/student/practice/submit").session(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"questionId\":1002,\"questionTypeId\":1,\"pointId\":101,\"answer\":\"C\",\"myAnswer\":\"A\",\"from\":1}"))
                .andExpect(status().isOk()).andReturn());
        assertFalse(Boolean.TRUE.equals(wrongPracticeSubmit.get("isRight")));

        Map<String, Object> practiceAfterWrongSubmit = readJson(mockMvc.perform(
                get("/api/app/student/practice/by-point/101/1").session(session)
                        .header("Accept", "application/json"))
                .andExpect(status().isOk()).andReturn());
        assertEquals(2, castList(practiceAfterWrongSubmit.get("finishedQuestionIds"))
                .size());

        Map<String, Object> practiceImprove = readJson(mockMvc.perform(
                get("/api/app/student/practice/improve/101/1").session(session)
                        .header("Accept", "application/json"))
                .andExpect(status().isOk()).andReturn());
        assertEquals(2, castList(practiceImprove.get("items")).size());

        List<?> improveHistory = readJsonList(mockMvc.perform(
                get("/api/app/student/practice/improve-his/101/1").session(session)
                        .header("Accept", "application/json"))
                .andExpect(status().isOk()).andReturn());
        assertEquals(2, improveHistory.size());

        Map<String, Object> practiceIncorrect = readJson(mockMvc.perform(
                get("/api/app/student/practice/incorrect/101").session(session)
                        .header("Accept", "application/json"))
                .andExpect(status().isOk()).andReturn());
        assertEquals(1, castList(practiceIncorrect.get("items")).size());

        Map<String, Object> stagePractice = readJson(mockMvc.perform(
                get("/api/app/student/practice/by-stage/201/1").session(session)
                        .header("Accept", "application/json"))
                .andExpect(status().isOk()).andReturn());
        assertEquals(2, castList(stagePractice.get("items")).size());

        Map<String, Object> exam = readJson(mockMvc.perform(get(
                "/api/app/student/exams/301").session(session).header("Accept",
                "application/json")).andExpect(status().isOk()).andReturn());
        Number examHistoryId = (Number) exam.get("examHistoryId");
        assertTrue(examHistoryId.intValue() > 0);

        String submitJson = "{"
                + "\"exam_history_id\":" + examHistoryId.intValue() + ","
                + "\"duration\":600,"
                + "\"as\":{"
                + "\"1001\":{\"question_type_id\":1,\"answer\":\"A\",\"point\":5},"
                + "\"1002\":{\"question_type_id\":1,\"answer\":\"B\",\"point\":5}"
                + "}"
                + "}";
        Map<String, Object> submit = readJson(mockMvc.perform(post(
                "/api/app/student/exams/submit").session(session)
                .contentType(MediaType.APPLICATION_JSON)
                .content(submitJson)).andExpect(status().isOk()).andReturn());
        assertEquals("success", submit.get("result"));
        assertEquals(5.0d,
                ((Number) submit.get("pointGet")).doubleValue(), 0.01d);
        assertFalse(Boolean.TRUE.equals(submit.get("passed")));

        Map<String, Object> result = readJson(mockMvc.perform(get(
                "/api/app/student/exams/301/result").session(session).header(
                "Accept", "application/json")).andExpect(status().isOk())
                .andReturn());
        assertEquals(2, ((Number) result.get("total")).intValue());
        assertEquals(1, ((Number) result.get("right")).intValue());
        assertEquals(1, ((Number) result.get("wrong")).intValue());
        assertTrue(Boolean.TRUE.equals(result.get("submitted")));

        Map<String, Object> report = readJson(mockMvc.perform(get(
                "/api/app/student/exams/301/report").session(session).header(
                "Accept", "application/json")).andExpect(status().isOk())
                .andReturn());
        List<Map<String, Object>> reportItems = castList(report.get("items"));
        assertEquals(2, reportItems.size());
        String html0 = (String) reportItems.get(0).get("html");
        assertTrue(html0.contains("正确答案"));

        Map<String, Object> userCenter = readJson(mockMvc.perform(get(
                "/api/app/student/user-center").session(session).header(
                "Accept", "application/json")).andExpect(status().isOk())
                .andReturn());
        assertEquals("student", userCenter.get("username"));
        assertTrue(castList(userCenter.get("statistics")).size() > 0);
        assertTrue(castList(userCenter.get("answerStageAnalysisList")).size() > 0);

        Map<String, Object> analysis = readJson(mockMvc.perform(get(
                "/api/app/student/analysis").session(session).header(
                "Accept", "application/json")).andExpect(status().isOk())
                .andReturn());
        assertTrue(castList(analysis.get("kparl")).size() > 0);
        assertTrue(castList(analysis.get("answerStageAnalysisList")).size() > 0);

        Map<String, Object> examHistory = readJson(mockMvc.perform(get(
                "/api/app/student/exam-history?page=1").session(session).header(
                "Accept", "application/json")).andExpect(status().isOk())
                .andReturn());
        assertTrue(castList(examHistory.get("items")).size() > 0);
    }

    @Test
    public void adminApi_shouldExposeQuestionListForCompatibleFrontend()
            throws Exception {
        MockHttpSession session = login("admin", "123456");
        Map<String, Object> payload = readJson(mockMvc.perform(get(
                "/api/app/admin/questions?page=1").session(session).header(
                "Accept", "application/json")).andExpect(status().isOk())
                .andReturn());
        assertEquals(2, castList(payload.get("items")).size());
        Map<String, Object> page = castMap(payload.get("page"));
        assertEquals(2, ((Number) page.get("totalRecord")).intValue());

        Map<String, Object> questionDetail = readJson(mockMvc.perform(get(
                "/api/app/admin/questions/1001").session(session).header(
                "Accept", "application/json")).andExpect(status().isOk())
                .andReturn());
        assertEquals(1001, ((Number) castMap(questionDetail.get("question")).get("id")).intValue());
        assertEquals(1, castList(questionDetail.get("pointList")).size());

        List<?> detail4Add = readJsonList(mockMvc.perform(post(
                "/api/app/admin/question-detail4add").session(session)
                .contentType(MediaType.APPLICATION_JSON)
                .content("[1001,1002]")).andExpect(status().isOk()).andReturn());
        assertEquals(2, detail4Add.size());

        Map<String, Object> fields = readJson(mockMvc.perform(get(
                "/api/app/admin/fields?page=1").session(session).header(
                "Accept", "application/json")).andExpect(status().isOk())
                .andReturn());
        assertTrue(castList(fields.get("items")).size() >= 1);

        Map<String, Object> points = readJson(mockMvc.perform(get(
                "/api/app/admin/points/1?page=1").session(session).header(
                "Accept", "application/json")).andExpect(status().isOk())
                .andReturn());
        assertTrue(castList(points.get("items")).size() >= 1);

        Map<String, Object> answerStages = readJson(mockMvc.perform(get(
                "/api/app/admin/answer-stages?page=1").session(session).header(
                "Accept", "application/json")).andExpect(status().isOk())
                .andReturn());
        assertTrue(castList(answerStages.get("items")).size() >= 1);

        Map<String, Object> examPapers = readJson(mockMvc.perform(get(
                "/api/app/admin/exam-papers?paperType=1&page=1").session(session).header(
                "Accept", "application/json")).andExpect(status().isOk())
                .andReturn());
        assertEquals(1, castList(examPapers.get("items")).size());

        Map<String, Object> userList = readJson(mockMvc.perform(get(
                "/api/app/admin/users?roleId=3&page=1").session(session).header(
                "Accept", "application/json")).andExpect(status().isOk())
                .andReturn());
        assertEquals(1, castList(userList.get("items")).size());

        Map<String, Object> systemConfig = readJson(mockMvc.perform(get(
                "/api/app/admin/system-config?page=1").session(session).header(
                "Accept", "application/json")).andExpect(status().isOk())
                .andReturn());
        assertFalse(Boolean.TRUE.equals(systemConfig.get("backupSupported")));
        assertEquals(1, ((Number) systemConfig.get("adminCount")).intValue());
        assertEquals(1, castList(systemConfig.get("admins")).size());
    }

    @Test
    public void authApi_shouldLoginAndLogoutWithoutLegacySecurityEndpoints()
            throws Exception {
        MvcResult login = mockMvc.perform(post("/api/app/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"username\":\"admin\",\"password\":\"123456\"}")
                .header("Accept", "application/json"))
                .andExpect(status().isOk()).andReturn();
        Map<String, Object> loginPayload = readJson(login);
        assertEquals("success", loginPayload.get("result"));
        assertTrue(Boolean.TRUE.equals(loginPayload.get("authenticated")));

        MockHttpSession session = (MockHttpSession) login.getRequest()
                .getSession(false);
        assertTrue(session != null);

        Map<String, Object> auth = readJson(mockMvc.perform(get(
                "/api/app/auth/me").session(session).header("Accept",
                "application/json")).andExpect(status().isOk()).andReturn());
        assertTrue(Boolean.TRUE.equals(auth.get("authenticated")));

        Map<String, Object> logout = readJson(mockMvc.perform(post(
                "/api/app/auth/logout").session(session).header("Accept",
                "application/json")).andExpect(status().isOk()).andReturn());
        assertEquals("success", logout.get("result"));
        assertFalse(Boolean.TRUE.equals(logout.get("authenticated")));

        Map<String, Object> afterLogout = readJson(mockMvc.perform(get(
                "/api/app/auth/me").session(session).header("Accept",
                "application/json")).andExpect(status().isOk()).andReturn());
        assertFalse(Boolean.TRUE.equals(afterLogout.get("authenticated")));
    }

    @Test
    public void permissions_shouldAllowAdminLearningButKeepAdminBoundary() throws Exception {
        mockMvc.perform(get("/api/app/student/setting")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/app/admin/questions")).andExpect(status().isUnauthorized());
        MockHttpSession admin = login("admin", "123456");
        for (String endpoint : List.of("setting", "user-center", "analysis", "exam-history")) {
            mockMvc.perform(get("/api/app/student/" + endpoint).session(admin)).andExpect(status().isOk());
        }
        MockHttpSession student = login("student", "123456");
        mockMvc.perform(get("/api/app/admin/questions").session(student)).andExpect(status().isForbidden());
        Map<String, Object> auth = readJson(mockMvc.perform(get("/api/app/auth/me").session(admin))
                .andExpect(status().isOk()).andReturn());
        assertTrue(((List<?>) castMap(auth.get("user")).get("authorities")).contains("ROLE_ADMIN"));
        assertFalse(castMap(castMap(auth.get("user")).get("profile")).containsKey("password"));
    }

    @Test
    public void registration_shouldNormalizeCompanyEmailAndIgnorePrivilegedFields() throws Exception {
        mockMvc.perform(post("/api/app/auth/register").contentType(MediaType.APPLICATION_JSON)
                .content("{\"truename\":\"注册测试\",\"email\":\" New.User@SEAVO.COM \",\"password\":\"a\",\"enabled\":\"0\",\"roleListStack\":[{\"id\":1}]}"))
                .andExpect(status().isOk());
        MockHttpSession session = login("new.user@seavo.com", "a");
        mockMvc.perform(get("/api/app/student/setting").session(session)).andExpect(status().isOk());
        mockMvc.perform(get("/api/app/admin/questions").session(session)).andExpect(status().isForbidden());
        mockMvc.perform(post("/api/app/auth/register").contentType(MediaType.APPLICATION_JSON)
                .content("{\"truename\":\"注册测试\",\"email\":\"NEW.USER@SEAVO.COM\",\"password\":\"b\"}"))
                .andExpect(status().isConflict());
    }

    @Test
    public void registration_shouldRejectOtherDomainsAndMissingPasswords() throws Exception {
        for (String email : List.of("x@gmail.com", "x@seavo.com.evil.org", "x@@seavo.com", "@seavo.com", "")) {
            mockMvc.perform(post("/api/app/auth/register").contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(Map.of("email", email, "password", "a"))))
                    .andExpect(status().isBadRequest());
        }
        for (String password : List.of("", "  ", "x".repeat(41))) {
            mockMvc.perform(post("/api/app/auth/register").contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(Map.of("email", "valid@seavo.com", "password", password))))
                    .andExpect(status().isBadRequest());
        }
        mockMvc.perform(post("/api/app/auth/register").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    public void memberCreationAndDisable_shouldMatchFrontendActions() throws Exception {
        MockHttpSession admin = login("admin", "123456");
        Map<String, Object> created = readJson(mockMvc.perform(post("/api/app/admin/users").session(admin)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"username\":\" NewMember \",\"email\":\"member@seavo.com\",\"password\":\"a\",\"department\":\"测试小组\"}"))
                .andExpect(status().isOk()).andReturn());
        assertEquals("success", created.get("result"));
        MockHttpSession member = login("newmember", "a");
        Map<String, Object> me = readJson(mockMvc.perform(get("/api/app/auth/me").session(member)).andReturn());
        int id = ((Number) castMap(me.get("user")).get("userid")).intValue();
        mockMvc.perform(post("/api/app/admin/users/" + id + "/disable").session(admin)).andExpect(status().isOk());
        mockMvc.perform(post("/api/app/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content("{\"username\":\"newmember\",\"password\":\"a\"}")).andExpect(status().isUnauthorized());
        mockMvc.perform(post("/api/app/admin/users/" + id + "/enable").session(admin)).andExpect(status().isOk());
        login("newmember", "a");
    }

    @Test
    public void memberCenterAndExamList_shouldShowRealNameAndPublishedPapers() throws Exception {
        MockHttpSession session = login("student", "123456");
        Map<String, Object> saved = readJson(mockMvc.perform(post("/api/app/student/setting").session(session)
                .contentType(MediaType.APPLICATION_JSON).content("{\"truename\":\"测试姓名\"}"))
                .andExpect(status().isOk()).andReturn());
        assertEquals("success", saved.get("result"));
        Map<String, Object> center = readJson(mockMvc.perform(get("/api/app/student/user-center").session(session))
                .andExpect(status().isOk()).andReturn());
        assertEquals("测试姓名", center.get("trueName"));
        Map<String, Object> papers = readJson(mockMvc.perform(get("/api/app/student/exam-papers").session(session))
                .andExpect(status().isOk()).andReturn());
        assertEquals(1, castList(papers.get("items")).size());
        try (Connection connection = dataSource.getConnection(); java.sql.Statement statement = connection.createStatement()) {
            statement.executeUpdate("UPDATE et_exam_paper SET status=0");
        }
        Map<String, Object> unpublished = readJson(mockMvc.perform(get("/api/app/student/exam-papers").session(session))
                .andExpect(status().isOk()).andReturn());
        assertTrue(castList(unpublished.get("items")).isEmpty());
    }

    @Test
    public void administratorRegistration_shouldRequireCodeAndGrantExistingAdminRole() throws Exception {
        for (String code : List.of("", "incorrect", "x".repeat(129))) {
            mockMvc.perform(post("/api/app/auth/register").contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(Map.of("email", "new.admin@seavo.com",
                            "password", "a", "accountType", "admin", "registrationCode", code))))
                    .andExpect(status().isBadRequest());
        }
        mockMvc.perform(post("/api/app/auth/register").contentType(MediaType.APPLICATION_JSON)
                .content("{\"truename\":\"注册测试\",\"email\":\"new.admin@seavo.com\",\"password\":\"a\",\"accountType\":\"admin\"}"))
                .andExpect(status().isBadRequest());
        try (Connection connection = dataSource.getConnection(); java.sql.Statement statement = connection.createStatement();
                java.sql.ResultSet rows = statement.executeQuery("SELECT COUNT(*) FROM et_user WHERE username='new.admin@seavo.com'")) {
            rows.next(); assertEquals(0, rows.getInt(1));
        }
        mockMvc.perform(post("/api/app/auth/register").contentType(MediaType.APPLICATION_JSON)
                .content("{\"truename\":\"注册测试\",\"email\":\"new.admin@seavo.com\",\"password\":\"a\",\"accountType\":\"admin\",\"registrationCode\":\"test-admin-invite\"}"))
                .andExpect(status().isOk());
        MockHttpSession session = login("new.admin@seavo.com", "a");
        Map<String, Object> me = readJson(mockMvc.perform(get("/api/app/auth/me").session(session)).andReturn());
        assertEquals(List.of("ROLE_ADMIN"), castMap(me.get("user")).get("authorities"));
        for (String endpoint : List.of("questions", "exam-papers", "users")) {
            mockMvc.perform(get("/api/app/admin/" + endpoint).session(session)).andExpect(status().isOk());
        }
        mockMvc.perform(get("/api/app/admin/system-config").session(session)).andExpect(status().isForbidden());
        mockMvc.perform(post("/api/app/auth/register").contentType(MediaType.APPLICATION_JSON)
                .content("{\"truename\":\"注册测试\",\"email\":\"invalid@seavo.com\",\"password\":\"a\",\"accountType\":\"superadmin\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    public void threeTierBoundary_shouldBlockRoleAndTargetBypasses() throws Exception {
        MockHttpSession root = login("admin", "123456");
        mockMvc.perform(post("/api/app/auth/register").contentType(MediaType.APPLICATION_JSON)
                .content("{\"truename\":\"注册测试\",\"email\":\"business@seavo.com\",\"password\":\"a\",\"accountType\":\"admin\",\"registrationCode\":\"test-admin-invite\"}"))
                .andExpect(status().isOk());
        MockHttpSession business = login("business@seavo.com", "a");
        Map<String, Object> businessMe = readJson(mockMvc.perform(get("/api/app/auth/me").session(business)).andReturn());
        int businessId = ((Number) castMap(businessMe.get("user")).get("userid")).intValue();
        for (String endpoint : List.of("questions", "exam-papers", "fields", "users?roleId=3")) {
            mockMvc.perform(get("/api/app/admin/" + endpoint).session(business)).andExpect(status().isOk());
        }
        for (String endpoint : List.of("system-config", "users?roleId=1", "users?roleId=4")) {
            mockMvc.perform(get("/api/app/admin/" + endpoint).session(business)).andExpect(status().isForbidden());
        }
        mockMvc.perform(post("/api/app/admin/admins").session(business).contentType(MediaType.APPLICATION_JSON)
                .content("{\"username\":\"forbidden\",\"email\":\"x@seavo.com\",\"password\":\"a\"}"))
                .andExpect(status().isForbidden());
        for (String action : List.of("enable", "disable")) {
            mockMvc.perform(post("/api/app/admin/users/4/" + action).session(business)).andExpect(status().isForbidden());
            mockMvc.perform(post("/api/app/admin/users/" + businessId + "/" + action).session(business)).andExpect(status().isForbidden());
            mockMvc.perform(post("/api/app/admin/users/4/" + action).session(root)).andExpect(status().isForbidden());
        }
        mockMvc.perform(get("/api/app/admin/system-config").session(root)).andExpect(status().isOk());
        Map<String, Object> created = readJson(mockMvc.perform(post("/api/app/admin/users").session(business)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"username\":\"injected\",\"email\":\"injected@seavo.com\",\"password\":\"a\",\"roleListStack\":[{\"id\":4}]}"))
                .andExpect(status().isOk()).andReturn());
        assertEquals("success", created.get("result"));
        MockHttpSession injected = login("injected", "a");
        Map<String, Object> me = readJson(mockMvc.perform(get("/api/app/auth/me").session(injected)).andReturn());
        assertEquals(List.of("ROLE_STUDENT"), castMap(me.get("user")).get("authorities"));
        mockMvc.perform(post("/api/app/admin/admins").session(root).contentType(MediaType.APPLICATION_JSON)
                .content("{\"username\":\"managedadmin\",\"email\":\"managedadmin@seavo.com\",\"password\":\"a\",\"roleListStack\":[{\"id\":4}]}"))
                .andExpect(status().isOk());
        MockHttpSession managed = login("managedadmin", "a");
        Map<String, Object> managedMe = readJson(mockMvc.perform(get("/api/app/auth/me").session(managed)).andReturn());
        assertEquals(List.of("ROLE_ADMIN"), castMap(managedMe.get("user")).get("authorities"));
    }

    @Test
    public void registrationNameAndLoginAliases_shouldResolveCanonicalAccountSafely() throws Exception {
        for (String name : List.of("", "  ", "x".repeat(41))) {
            mockMvc.perform(post("/api/app/auth/register").contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(Map.of("email", "named@seavo.com", "password", "a", "truename", name))))
                    .andExpect(status().isBadRequest());
        }
        mockMvc.perform(post("/api/app/auth/register").contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"named@seavo.com\",\"password\":\"a\"}"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(post("/api/app/auth/register").contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"named@seavo.com\",\"password\":\"a\",\"truename\":\" 姓名登录测试 \"}"))
                .andExpect(status().isOk());
        MockHttpSession byName = login("姓名登录测试", "a");
        Map<String, Object> me = readJson(mockMvc.perform(get("/api/app/auth/me").session(byName)).andReturn());
        assertEquals("named@seavo.com", castMap(me.get("user")).get("username"));
        assertEquals("姓名登录测试", castMap(me.get("user")).get("trueName"));
        login(" NAMED@SEAVO.COM ", "a");
        mockMvc.perform(post("/api/app/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content("{\"username\":\"姓名登录测试\",\"password\":\"wrong\"}"))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(post("/api/app/auth/register").contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"named2@seavo.com\",\"password\":\"b\",\"truename\":\"姓名登录测试\"}"))
                .andExpect(status().isOk());
        Map<String, Object> duplicate = readJson(mockMvc.perform(post("/api/app/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content("{\"username\":\"姓名登录测试\",\"password\":\"a\"}"))
                .andExpect(status().isUnauthorized()).andReturn());
        assertEquals("姓名重复，请使用公司邮箱登录", duplicate.get("messageInfo"));
        login("named@seavo.com", "a"); login("named2@seavo.com", "b");
        login("student@example.com", "123456");
        login("admin", "123456");
    }

    private MockHttpSession login(String username, String password)
            throws Exception {
        MvcResult result = mockMvc.perform(post("/api/app/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"username\":\"" + username + "\",\"password\":\""
                        + password + "\"}")
                .header("Accept", "application/json"))
                .andExpect(status().isOk()).andReturn();
        Map<String, Object> payload = readJson(result);
        assertEquals("success", payload.get("result"));
        return (MockHttpSession) result.getRequest().getSession(false);
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> readJson(MvcResult mvcResult) throws Exception {
        return objectMapper.readValue(mvcResult.getResponse()
                .getContentAsString(java.nio.charset.StandardCharsets.UTF_8),
                Map.class);
    }

    @SuppressWarnings("unchecked")
    private List<Object> readJsonList(MvcResult mvcResult) throws Exception {
        return objectMapper.readValue(mvcResult.getResponse()
                .getContentAsString(java.nio.charset.StandardCharsets.UTF_8),
                List.class);
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> castList(Object value) {
        return (List<Map<String, Object>>) value;
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> castMap(Object value) {
        return (Map<String, Object>) value;
    }
}
