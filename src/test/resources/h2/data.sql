-- 综合测试种子（自包含，无 RUNSCRIPT）：
--   base: 角色/管理员/知识点/题型/法规/答题阶段  （源自 legacy-seed.sql）
--   e2e : 学员/通用题库/知识点101/阶段201/两题/试卷301  （源自 e2e-seed.sql 去除 RUNSCRIPT 后的内容）
INSERT INTO et_role(id, authority, name, code) VALUES (1, 'ROLE_ADMIN', '超级管理员', 'admin');
INSERT INTO et_role(id, authority, name, code) VALUES (2, 'ROLE_TEACHER', '教师', 'teacher');
INSERT INTO et_role(id, authority, name, code) VALUES (3, 'ROLE_STUDENT', '学员', 'student');

INSERT INTO et_user(id, username, password, email, phone, add_date, expire_date, add_by, enabled, truename, field_id, department, last_login_time, login_time)
VALUES
  (4, 'admin', '260acbffd3c30786febc29d7dd71a9880a811e77', '1@1.1', NULL, TIMESTAMP '2015-02-15 21:24:53', NULL, NULL, '1', NULL, 1, '3', TIMESTAMP '2015-02-13 14:52:05', TIMESTAMP '2015-02-15 21:24:53');

INSERT INTO et_r_user_role(user_id, role_id) VALUES (4, 1);

INSERT INTO et_field(field_id, field_name, memo, state) VALUES (1, 'ARM1组', 'ARM1组', 1);

INSERT INTO et_knowledge_point(point_id, point_name, memo, state, field_id) VALUES (1, '常识类', '常识类', 1, 1);
INSERT INTO et_knowledge_point(point_id, point_name, memo, state, field_id) VALUES (2, '流程类', '流程类', 1, 1);
INSERT INTO et_knowledge_point(point_id, point_name, memo, state, field_id) VALUES (3, '知识类', '知识类', 1, 1);

INSERT INTO et_question_type(id, name, subjective) VALUES (1, '单选题', 0);
INSERT INTO et_question_type(id, name, subjective) VALUES (2, '多选题', 0);
INSERT INTO et_question_type(id, name, subjective) VALUES (3, '判断题', 0);
INSERT INTO et_question_type(id, name, subjective) VALUES (4, '填空题', 0);
INSERT INTO et_question_type(id, name, subjective) VALUES (5, '简答题', 1);
INSERT INTO et_question_type(id, name, subjective) VALUES (6, '论述题', 1);
INSERT INTO et_question_type(id, name, subjective) VALUES (7, '分析题', 1);

INSERT INTO et_reference(reference_id, reference_name, memo, state) VALUES (1, '中华人民共和国电力法', '1995年12月28日第八全国人民代表大会常务委员会第十七次会议通过，自1996月1日起施行', 1);
INSERT INTO et_reference(reference_id, reference_name, memo, state) VALUES (2, '电力供应与使用条例', '1996年4月17日国务院令96 号发布，自1996年9月1日起施行', 1);

INSERT INTO et_answer_stage(stage_id, stage_name, create_time, creator, memo, state) VALUES (1, '轮岗两周', TIMESTAMP '2015-02-10 17:28:16', 4, '适合轮岗两周答题人', 1);

-- ---- e2e 补充数据 ----
INSERT INTO et_user(id, username, password, email, phone, add_date, expire_date, add_by, enabled, truename, field_id, department, last_login_time, login_time)
VALUES
  (5, 'student', '3f70af5072e23c9bf59dd1ac1c91f9f8fcc81478', 'student@example.com', '13900000000', CURRENT_TIMESTAMP, NULL, 4, '1', '测试学员', 100, '培训一部', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO et_r_user_role(user_id, role_id) VALUES (5, 3);

INSERT INTO et_field(field_id, field_name, memo, state) VALUES (100, '通用题库', '测试题库', 1);
INSERT INTO et_knowledge_point(point_id, point_name, memo, state, field_id) VALUES (101, 'Java 基础', '集合与语法', 1, 100);
INSERT INTO et_answer_stage(stage_id, stage_name, create_time, creator, memo, state) VALUES (201, '初级答题人', CURRENT_TIMESTAMP, 4, '测试阶段', 1);

INSERT INTO et_question(id, name, content, question_type_id, create_time, creator, answer, analysis, reference, examing_point, keyword, points, last_modify)
VALUES
  (
    1001,
    'Java 基础单选 1',
    '<QuestionContent><title>Java 语言的作者是谁？</title><titleImg></titleImg><choiceList class="linked-hash-map"><entry><string>A</string><string>James Gosling</string></entry><entry><string>B</string><string>Guido van Rossum</string></entry><entry><string>C</string><string>Bjarne Stroustrup</string></entry></choiceList></QuestionContent>',
    1,
    CURRENT_TIMESTAMP,
    4,
    'A',
    'Java 由 James Gosling 主导开发。',
    'Java 编程思想',
    'Java 发展史',
    '作者',
    5,
    CURRENT_TIMESTAMP
  ),
  (
    1002,
    'Java 基础单选 2',
    '<QuestionContent><title>下列哪个集合实现允许按索引访问？</title><titleImg></titleImg><choiceList class="linked-hash-map"><entry><string>A</string><string>Set</string></entry><entry><string>B</string><string>Map</string></entry><entry><string>C</string><string>List</string></entry></choiceList></QuestionContent>',
    1,
    CURRENT_TIMESTAMP,
    4,
    'C',
    'List 是有序集合，可按索引读取。',
    'Java 集合框架',
    '集合接口',
    '集合',
    5,
    CURRENT_TIMESTAMP
  );

INSERT INTO et_question_2_point(question_id, point_id) VALUES (1001, 101);
INSERT INTO et_question_2_point(question_id, point_id) VALUES (1002, 101);
INSERT INTO et_question_2_answer_stage(id, question_id, stage_id, creator, create_time) VALUES (1, 1001, 201, 4, CURRENT_TIMESTAMP);
INSERT INTO et_question_2_answer_stage(id, question_id, stage_id, creator, create_time) VALUES (2, 1002, 201, 4, CURRENT_TIMESTAMP);

INSERT INTO et_exam_paper(id, name, content, duration, pass_point, total_point, status, summary, is_visible, answer_sheet, group_id, is_subjective, creator, paper_type, field_id)
VALUES (
  301,
  'Java 基础摸底卷',
  '<list><com.extr.controller.domain.QuestionQueryResult><questionId>1001</questionId><content>&lt;QuestionContent&gt;&lt;title&gt;Java 语言的作者是谁？&lt;/title&gt;&lt;titleImg&gt;&lt;/titleImg&gt;&lt;choiceList class="linked-hash-map"&gt;&lt;entry&gt;&lt;string&gt;A&lt;/string&gt;&lt;string&gt;James Gosling&lt;/string&gt;&lt;/entry&gt;&lt;entry&gt;&lt;string&gt;B&lt;/string&gt;&lt;string&gt;Guido van Rossum&lt;/string&gt;&lt;/entry&gt;&lt;entry&gt;&lt;string&gt;C&lt;/string&gt;&lt;string&gt;Bjarne Stroustrup&lt;/string&gt;&lt;/entry&gt;&lt;/choiceList&gt;&lt;/QuestionContent&gt;</content><answer>A</answer><analysis>Java 由 James Gosling 主导开发。</analysis><questionTypeId>1</questionTypeId><referenceName>Java 编程思想</referenceName><pointName>通用题库&gt;Java 基础&gt;核心概念</pointName><fieldName>通用题库</fieldName><questionPoint>5.0</questionPoint><examingPoint>Java 发展史</examingPoint><knowledgePointId>101</knowledgePointId></com.extr.controller.domain.QuestionQueryResult><com.extr.controller.domain.QuestionQueryResult><questionId>1002</questionId><content>&lt;QuestionContent&gt;&lt;title&gt;下列哪个集合实现允许按索引访问？&lt;/title&gt;&lt;titleImg&gt;&lt;/titleImg&gt;&lt;choiceList class="linked-hash-map"&gt;&lt;entry&gt;&lt;string&gt;A&lt;/string&gt;&lt;string&gt;Set&lt;/string&gt;&lt;/entry&gt;&lt;entry&gt;&lt;string&gt;B&lt;/string&gt;&lt;string&gt;Map&lt;/string&gt;&lt;/entry&gt;&lt;entry&gt;&lt;string&gt;C&lt;/string&gt;&lt;string&gt;List&lt;/string&gt;&lt;/entry&gt;&lt;/choiceList&gt;&lt;/QuestionContent&gt;</content><answer>C</answer><analysis>List 是有序集合，可按索引读取。</analysis><questionTypeId>1</questionTypeId><referenceName>Java 集合框架</referenceName><pointName>通用题库&gt;Java 基础&gt;核心概念</pointName><fieldName>通用题库</fieldName><questionPoint>5.0</questionPoint><examingPoint>集合接口</examingPoint><knowledgePointId>101</knowledgePointId></com.extr.controller.domain.QuestionQueryResult></list>',
  30,
  6,
  10,
  1,
  '两题摸底卷',
  1,
  NULL,
  0,
  0,
  4,
  1,
  100
);