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
INSERT INTO et_reference(reference_id, reference_name, memo, state) VALUES (3, '供电营业区划分及管理办法', '1996年5月19日电力部第5号令，自1996年9月1日起施行', 1);
INSERT INTO et_reference(reference_id, reference_name, memo, state) VALUES (4, '居民用户家用电器损坏处理办法', '1996年8月21日电力部第7号令，自1996年9月1日起施行', 1);
INSERT INTO et_reference(reference_id, reference_name, memo, state) VALUES (5, '供电营业规则', '1996年10月8日电力部第8号令发布并施行', 1);
INSERT INTO et_reference(reference_id, reference_name, memo, state) VALUES (6, '承装（修、试）电力设施许可证管理办法', '电监会2009年第28号令', 1);
INSERT INTO et_reference(reference_id, reference_name, memo, state) VALUES (7, '供电服务规范', 'GB/T 28583-2012', 1);
INSERT INTO et_reference(reference_id, reference_name, memo, state) VALUES (8, '国家电网公司供电服务规范', '国家电网生〔2003〕477号', 1);
INSERT INTO et_reference(reference_id, reference_name, memo, state) VALUES (9, '国家电网公司城市供电营业规范化服务窗口标准', NULL, 1);
INSERT INTO et_reference(reference_id, reference_name, memo, state) VALUES (10, '国家电网公司供电客户服务提供标准', '国家电网科〔2011〕56 号', 1);
INSERT INTO et_reference(reference_id, reference_name, memo, state) VALUES (11, '关于发布国家电网公司新“三个十条”的通知', '国家电网办〔2011〕1493号', 1);
INSERT INTO et_reference(reference_id, reference_name, memo, state) VALUES (12, '国家电网公司供电服务质量标准', '国家电网科〔2010〕341号', 1);
INSERT INTO et_reference(reference_id, reference_name, memo, state) VALUES (13, '国家电网公司供电营业厅标准化建设手册', '2010年', 1);
INSERT INTO et_reference(reference_id, reference_name, memo, state) VALUES (14, '国家电网公司营销客户档案管理规范（试行）', '国家电网办〔2013〕71号', 1);
INSERT INTO et_reference(reference_id, reference_name, memo, state) VALUES (15, '国家电网公司95598业务管理暂行办法', NULL, 1);
INSERT INTO et_reference(reference_id, reference_name, memo, state) VALUES (16, '国家电网公司关于深化“你用电我用心”大力提升优质服务水平的意见', '国家电网营销〔2014〕104号', 1);
INSERT INTO et_reference(reference_id, reference_name, memo, state) VALUES (17, '国家电网公司业扩报装工作规范（试行）和国家电网公司业扩供电方案编制导则', '国家电网营销〔2010〕1247号', 1);
INSERT INTO et_reference(reference_id, reference_name, memo, state) VALUES (18, '水利电力部关于颁发《电、热价格》的通知', '水电财字第67号', 1);
INSERT INTO et_reference(reference_id, reference_name, memo, state) VALUES (19, '功率因数调整电费办法', '〔83〕水电财字第 215 号', 1);
INSERT INTO et_reference(reference_id, reference_name, memo, state) VALUES (20, '国民经济行业用电分类', '2004年版', 1);
INSERT INTO et_reference(reference_id, reference_name, memo, state) VALUES (21, '电能计量装置技术管理规程', 'DL/T 448-2000', 1);
INSERT INTO et_reference(reference_id, reference_name, memo, state) VALUES (22, '国家电网公司有序用电管理办法', '国家电网营销〔2012〕 38 号', 1);
INSERT INTO et_reference(reference_id, reference_name, memo, state) VALUES (23, '关于全面深化治理整改工作坚决杜绝“三指定” 问题的意见', '国家电网营销〔2011〕 756 号', 1);
INSERT INTO et_reference(reference_id, reference_name, memo, state) VALUES (24, '国家电网公司关于印发进一步简化业扩报装手续优化流程意见的通知', '国家电网营销〔2014〕168号', 1);
INSERT INTO et_reference(reference_id, reference_name, memo, state) VALUES (25, '国家电网公司关于印发分布式电源并网相关意见和规范（修订版）的通知', '国家电网办〔2013〕1781号', 1);
INSERT INTO et_reference(reference_id, reference_name, memo, state) VALUES (26, '国家电网公司关于印发分布式电源并网服务管理规则的通知', '国家电网营销〔2014〕174号', 1);
INSERT INTO et_reference(reference_id, reference_name, memo, state) VALUES (27, '国家电网公司关于可再生能源电价附加补助资金管理有关意见的通知', '国家电网财〔2014〕2044号', 1);
INSERT INTO et_reference(reference_id, reference_name, memo, state) VALUES (28, '国家电网公司营销服务培训题库', '中国电力出版社，国家电网公司营销部编，2013年1月', 1);
INSERT INTO et_reference(reference_id, reference_name, memo, state) VALUES (29, '国家电网公司企业文化手册', '2010年版', 1);
INSERT INTO et_reference(reference_id, reference_name, memo, state) VALUES (30, '建设和弘扬统一的企业文化宣传手册', NULL, 1);

INSERT INTO et_answer_stage(stage_id, stage_name, create_time, creator, memo, state) VALUES (1, '轮岗两周', TIMESTAMP '2015-02-10 17:28:16', 4, '适合轮岗两周答题人', 1);
INSERT INTO et_answer_stage(stage_id, stage_name, create_time, creator, memo, state) VALUES (2, '定岗一个月', TIMESTAMP '2015-02-13 14:53:40', 4, '适合定岗一个月答题人', 1);
INSERT INTO et_answer_stage(stage_id, stage_name, create_time, creator, memo, state) VALUES (3, '定岗半年', TIMESTAMP '2015-02-13 14:53:40', 4, '适合定岗半年答题人', 1);
