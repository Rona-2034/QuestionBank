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

@SpringBootTest
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
