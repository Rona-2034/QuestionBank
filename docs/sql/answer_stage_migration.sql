SET FOREIGN_KEY_CHECKS=0;

CREATE TABLE IF NOT EXISTS `et_answer_stage` (
  `stage_id` int(11) NOT NULL AUTO_INCREMENT,
  `stage_name` varchar(100) NOT NULL,
  `create_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `creator` int(11) NOT NULL,
  `memo` varchar(500) DEFAULT NULL,
  `state` decimal(1,0) NOT NULL DEFAULT '1' COMMENT '1 正常 0 废弃',
  PRIMARY KEY (`stage_id`),
  KEY `fk_answer_stage_creator` (`creator`),
  CONSTRAINT `fk_answer_stage_creator` FOREIGN KEY (`creator`) REFERENCES `et_user` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `et_question_2_answer_stage` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `question_id` int(11) NOT NULL,
  `stage_id` int(11) NOT NULL,
  `create_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `creator` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_question_answer_stage` (`question_id`),
  KEY `fk_question_answer_stage_sid` (`stage_id`),
  KEY `fk_question_answer_stage_qid` (`question_id`),
  CONSTRAINT `fk_question_answer_stage_qid` FOREIGN KEY (`question_id`) REFERENCES `et_question` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_question_answer_stage_sid` FOREIGN KEY (`stage_id`) REFERENCES `et_answer_stage` (`stage_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

INSERT INTO `et_answer_stage` (`stage_name`, `creator`, `memo`, `state`)
SELECT '轮岗两周', id, '适合轮岗两周答题人', 1 FROM et_user ORDER BY id LIMIT 1;

INSERT INTO `et_answer_stage` (`stage_name`, `creator`, `memo`, `state`)
SELECT '定岗一个月', id, '适合定岗一个月答题人', 1 FROM et_user ORDER BY id LIMIT 1;

INSERT INTO `et_answer_stage` (`stage_name`, `creator`, `memo`, `state`)
SELECT '定岗半年', id, '适合定岗半年答题人', 1 FROM et_user ORDER BY id LIMIT 1;

SET FOREIGN_KEY_CHECKS=1;
