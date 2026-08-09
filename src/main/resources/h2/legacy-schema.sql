DROP TABLE IF EXISTS t_c3p0;
DROP TABLE IF EXISTS et_news;
DROP TABLE IF EXISTS et_user_exam_history;
DROP TABLE IF EXISTS et_practice_paper;
DROP TABLE IF EXISTS et_user_question_history_t;
DROP TABLE IF EXISTS et_comment;
DROP TABLE IF EXISTS et_exam_paper;
DROP TABLE IF EXISTS et_reference;
DROP TABLE IF EXISTS et_question_2_answer_stage;
DROP TABLE IF EXISTS et_answer_stage;
DROP TABLE IF EXISTS et_question_2_point;
DROP TABLE IF EXISTS et_question;
DROP TABLE IF EXISTS et_question_type;
DROP TABLE IF EXISTS et_knowledge_point;
DROP TABLE IF EXISTS et_group;
DROP TABLE IF EXISTS et_field;
DROP TABLE IF EXISTS et_r_user_role;
DROP TABLE IF EXISTS et_role;
DROP TABLE IF EXISTS et_user;

CREATE TABLE t_c3p0 (
  id INT PRIMARY KEY
);

CREATE TABLE et_user (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(64) NOT NULL,
  password VARCHAR(128) NOT NULL,
  email VARCHAR(128),
  phone VARCHAR(64),
  add_date TIMESTAMP,
  expire_date TIMESTAMP,
  add_by INT,
  enabled VARCHAR(1) NOT NULL,
  truename VARCHAR(64),
  field_id INT,
  department VARCHAR(128),
  last_login_time TIMESTAMP,
  login_time TIMESTAMP,
  UNIQUE (username)
);

CREATE TABLE et_role (
  id INT PRIMARY KEY,
  authority VARCHAR(64) NOT NULL,
  name VARCHAR(64) NOT NULL,
  code VARCHAR(32)
);

CREATE TABLE et_r_user_role (
  user_id INT NOT NULL,
  role_id INT NOT NULL
);

CREATE TABLE et_field (
  field_id INT AUTO_INCREMENT PRIMARY KEY,
  field_name VARCHAR(128) NOT NULL,
  memo VARCHAR(255),
  state INT
);

CREATE TABLE et_group (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(40) NOT NULL,
  group_level_id INT NOT NULL,
  parent INT NOT NULL
);

CREATE TABLE et_knowledge_point (
  point_id INT AUTO_INCREMENT PRIMARY KEY,
  point_name VARCHAR(128) NOT NULL,
  memo VARCHAR(255),
  state INT,
  field_id INT NOT NULL
);

CREATE TABLE et_question_type (
  id INT PRIMARY KEY,
  name VARCHAR(64) NOT NULL,
  subjective INT DEFAULT 0
);

CREATE TABLE et_reference (
  reference_id INT AUTO_INCREMENT PRIMARY KEY,
  reference_name VARCHAR(200) NOT NULL,
  memo VARCHAR(200),
  state INT NOT NULL DEFAULT 1
);

CREATE TABLE et_question (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255),
  content CLOB,
  question_type_id INT NOT NULL,
  create_time TIMESTAMP,
  creator INT,
  answer VARCHAR(255),
  analysis CLOB,
  reference VARCHAR(255),
  examing_point VARCHAR(255),
  keyword VARCHAR(255),
  points FLOAT,
  duration INT DEFAULT 0,
  group_id INT DEFAULT 0,
  is_visible INT DEFAULT 1,
  last_modify TIMESTAMP,
  expose_times INT DEFAULT 0,
  right_times INT DEFAULT 0,
  wrong_times INT DEFAULT 0,
  difficulty FLOAT DEFAULT 0
);

CREATE TABLE et_question_2_point (
  question_id INT NOT NULL,
  point_id INT NOT NULL
);

CREATE TABLE et_answer_stage (
  stage_id INT AUTO_INCREMENT PRIMARY KEY,
  stage_name VARCHAR(128) NOT NULL,
  create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  creator INT,
  memo VARCHAR(255),
  state INT
);

CREATE TABLE et_question_2_answer_stage (
  id INT AUTO_INCREMENT PRIMARY KEY,
  question_id INT NOT NULL,
  stage_id INT NOT NULL,
  creator INT,
  create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE et_exam_paper (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  content CLOB,
  duration INT,
  pass_point FLOAT,
  total_point FLOAT,
  status INT,
  summary VARCHAR(255),
  is_visible INT,
  answer_sheet CLOB,
  group_id INT,
  is_subjective INT,
  creator INT,
  paper_type INT,
  field_id INT
);

CREATE TABLE et_user_exam_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  exam_paper_id INT NOT NULL,
  content CLOB,
  create_time TIMESTAMP,
  answer_sheet CLOB,
  duration INT,
  point_get FLOAT,
  submit_time TIMESTAMP
);

CREATE TABLE et_practice_paper (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  user_id INT NOT NULL,
  content CLOB,
  create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  duration INT,
  pass_point FLOAT,
  total_point FLOAT,
  status INT,
  summary VARCHAR(255),
  is_visible INT,
  answer_sheet CLOB,
  group_id INT,
  is_subjective INT,
  creator INT
);

CREATE TABLE et_user_question_history_t (
  user_question_hist_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  user_question_hist CLOB,
  modify_time TIMESTAMP
);

CREATE TABLE et_comment (
  comment_id INT AUTO_INCREMENT PRIMARY KEY,
  question_id INT NOT NULL,
  index_id INT NOT NULL,
  user_id INT NOT NULL,
  content_msg VARCHAR(255) NOT NULL,
  quoto_id INT DEFAULT 0,
  re_id INT DEFAULT 0,
  create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE et_news (
  id INT AUTO_INCREMENT PRIMARY KEY,
  titile VARCHAR(100) NOT NULL,
  content VARCHAR(2000) NOT NULL,
  user_id INT NOT NULL,
  create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_expire INT NOT NULL DEFAULT 0,
  type INT NOT NULL DEFAULT 0,
  group_id INT NOT NULL DEFAULT -1
);
