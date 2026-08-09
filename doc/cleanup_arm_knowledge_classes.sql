SET FOREIGN_KEY_CHECKS=0;

DELETE FROM `et_knowledge_point`
WHERE `point_name` NOT IN ('常识类', '流程类', '知识类')
AND NOT EXISTS (
  SELECT 1
  FROM `et_question_2_point` qp
  WHERE qp.`point_id` = `et_knowledge_point`.`point_id`
);

INSERT INTO `et_knowledge_point` (`point_name`, `field_id`, `memo`, `state`)
SELECT '常识类', f.`field_id`, '常识类', 1
FROM `et_field` f
WHERE NOT EXISTS (
  SELECT 1
  FROM `et_knowledge_point` kp
  WHERE kp.`field_id` = f.`field_id`
    AND kp.`point_name` = '常识类'
);

INSERT INTO `et_knowledge_point` (`point_name`, `field_id`, `memo`, `state`)
SELECT '流程类', f.`field_id`, '流程类', 1
FROM `et_field` f
WHERE NOT EXISTS (
  SELECT 1
  FROM `et_knowledge_point` kp
  WHERE kp.`field_id` = f.`field_id`
    AND kp.`point_name` = '流程类'
);

INSERT INTO `et_knowledge_point` (`point_name`, `field_id`, `memo`, `state`)
SELECT '知识类', f.`field_id`, '知识类', 1
FROM `et_field` f
WHERE NOT EXISTS (
  SELECT 1
  FROM `et_knowledge_point` kp
  WHERE kp.`field_id` = f.`field_id`
    AND kp.`point_name` = '知识类'
);

SET FOREIGN_KEY_CHECKS=1;
