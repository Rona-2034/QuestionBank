import { expect, test } from '@playwright/test';

async function login(page: import('@playwright/test').Page, username: string, password: string) {
  await page.goto('/app/login');
  await page.getByLabel('用户名').fill(username);
  await page.getByLabel('密码').fill(password);
  await page.getByRole('button', { name: '登录系统' }).click();
}

test('student can complete practice and exam flow', async ({ page }) => {
  await login(page, 'student', '123456');
  await expect(page).toHaveURL(/\/app\/home/);
  await expect(page.getByText('现代科技风前端壳已接入原系统能力')).toBeVisible();

  await page.getByRole('link', { name: '开始' }).first().click();
  await expect(page).toHaveURL(/\/app\/student\/practice\/point\/101\/1/);

  const firstPracticeQuestion = page.locator('.question-render-list > li').first();
  await firstPracticeQuestion.locator('input[type="radio"][value="A"]').check();
  await firstPracticeQuestion.getByRole('button', { name: '提交本题' }).click();
  await expect(firstPracticeQuestion.getByText('回答正确，已写入练习历史。')).toBeVisible();

  await page.goto('/app/home');
  await page.getByRole('link', { name: '进入考试' }).first().click();
  await expect(page).toHaveURL(/\/app\/student\/exam\/301/);

  const examQuestions = page.locator('.question-render-list > li');
  await examQuestions.nth(0).locator('input[type="radio"][value="A"]').check();
  await examQuestions.nth(1).locator('input[type="radio"][value="B"]').check();
  await page.getByRole('button', { name: '提交试卷' }).click();

  await expect(page.getByText('考试结果')).toBeVisible();
  await expect(page.getByText('得分')).toBeVisible();
  await expect(page.getByText('5')).toBeVisible();
  await expect(page.getByText('答卷报告')).toBeVisible();
  await expect(page.getByText('正确答案')).toBeVisible();
});

test('admin can open compatible admin question list', async ({ page }) => {
  await login(page, 'admin', '123456');
  await page.goto('/app/admin/questions');
  await expect(page.getByText('题库管理')).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Java 基础单选 1' })).toBeVisible();
});
