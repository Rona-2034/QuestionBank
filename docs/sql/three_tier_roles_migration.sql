-- Run once against the existing QuestionBank database after backing it up.
-- Idempotent: preserve all accounts and existing business-administrator grants.
START TRANSACTION;
INSERT INTO et_role(authority,name,code)
SELECT 'ROLE_SUPER_ADMIN','超级管理员','superadmin'
WHERE NOT EXISTS (SELECT 1 FROM et_role WHERE authority='ROLE_SUPER_ADMIN');
UPDATE et_role SET name='业务管理员' WHERE authority='ROLE_ADMIN';
INSERT INTO et_r_user_role(user_id,role_id)
SELECT u.id,r.id FROM et_user u CROSS JOIN et_role r
WHERE u.id=4 AND u.username='admin' AND r.authority='ROLE_SUPER_ADMIN'
AND NOT EXISTS (SELECT 1 FROM et_r_user_role granted WHERE granted.user_id=u.id AND granted.role_id=r.id);
COMMIT;
