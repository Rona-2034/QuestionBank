SET FOREIGN_KEY_CHECKS=0;

DROP TEMPORARY TABLE IF EXISTS `tmp_driving_question_ids`;
CREATE TEMPORARY TABLE `tmp_driving_question_ids` (
  `id` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MEMORY;

INSERT IGNORE INTO `tmp_driving_question_ids` (`id`)
SELECT `id`
FROM `et_question`
WHERE `id` IN (1, 4, 128)
   OR `content` LIKE '%驾驶机动车%'
   OR `content` LIKE '%安全行车、文明驾驶基础知识%';

DELETE qa
FROM `et_question_2_answer_stage` qa
INNER JOIN `tmp_driving_question_ids` q ON q.`id` = qa.`question_id`;

DELETE qp
FROM `et_question_2_point` qp
INNER JOIN `tmp_driving_question_ids` q ON q.`id` = qp.`question_id`;

DELETE c
FROM `et_comment` c
INNER JOIN `tmp_driving_question_ids` q ON q.`id` = c.`question_id`;

DELETE question
FROM `et_question` question
INNER JOIN `tmp_driving_question_ids` q ON q.`id` = question.`id`;

DELETE FROM `et_knowledge_point`
WHERE `point_name` IN (
  '道路交通安全法律、法规和规章',
  '道路交通信号',
  '安全行车、文明驾驶基础知识',
  '机动车驾驶操作相关基础知识'
)
AND NOT EXISTS (
  SELECT 1
  FROM `et_question_2_point` qp
  WHERE qp.`point_id` = `et_knowledge_point`.`point_id`
);

INSERT INTO `et_knowledge_point` (`point_name`, `field_id`, `memo`, `state`)
SELECT '常识类', f.`field_id`, '常识类', 1
FROM `et_field` f
WHERE NOT EXISTS (
  SELECT 1 FROM `et_knowledge_point` kp
  WHERE kp.`field_id` = f.`field_id` AND kp.`point_name` = '常识类'
);

INSERT INTO `et_knowledge_point` (`point_name`, `field_id`, `memo`, `state`)
SELECT '流程类', f.`field_id`, '流程类', 1
FROM `et_field` f
WHERE NOT EXISTS (
  SELECT 1 FROM `et_knowledge_point` kp
  WHERE kp.`field_id` = f.`field_id` AND kp.`point_name` = '流程类'
);

INSERT INTO `et_knowledge_point` (`point_name`, `field_id`, `memo`, `state`)
SELECT '知识类', f.`field_id`, '知识类', 1
FROM `et_field` f
WHERE NOT EXISTS (
  SELECT 1 FROM `et_knowledge_point` kp
  WHERE kp.`field_id` = f.`field_id` AND kp.`point_name` = '知识类'
);

SET @question_count := (SELECT COUNT(1) FROM `et_question`);
SET @sql := IF(@question_count = 0,
  'ALTER TABLE `et_question` AUTO_INCREMENT = 1',
  'SELECT ''et_question is not empty; AUTO_INCREMENT was not reset''');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

DROP TEMPORARY TABLE IF EXISTS `tmp_driving_question_ids`;

SET FOREIGN_KEY_CHECKS=1;
