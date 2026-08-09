import { expect, test } from '@playwright/test';

async function login(page: import('@playwright/test').Page, username: string, password: string) {
  await page.goto('/app/login');
  await page.getByLabel('用户名').fill(username);
  await page.getByLabel('密码').fill(password);
  await page.getByRole('button', { name: '登录系统' }).click();
}

test('standalone frontend can render legacy snapshot data', async ({ page }) => {
  await login(page, 'admin', '123456');
  await expect(page).toHaveURL(/\/app\/home/);

  await page.goto('/app/admin/sys-admin-list');
  await expect(page.getByText('1 名管理员')).toBeVisible();
  await expect(page.getByRole('cell', { name: 'admin' }).first()).toBeVisible();

  await page.goto('/app/admin/fields');
  await expect(page.getByRole('heading', { name: '题库管理' })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'ARM1组' }).first()).toBeVisible();

  await page.goto('/app/admin/points/1');
  await expect(page.getByRole('cell', { name: '常识类' }).first()).toBeVisible();
  await expect(page.getByRole('cell', { name: '流程类' }).first()).toBeVisible();
  await expect(page.getByRole('cell', { name: '知识类' }).first()).toBeVisible();

  await page.goto('/app/admin/answer-stages');
  await expect(page.getByRole('cell', { name: '轮岗两周' }).first()).toBeVisible();
  await expect(page.getByRole('cell', { name: '定岗一个月' }).first()).toBeVisible();
  await expect(page.getByRole('cell', { name: '定岗半年' }).first()).toBeVisible();

  await page.goto('/app/admin/questions');
  await expect(page.getByText('0 条记录')).toBeVisible();

  await page.goto('/app/admin/exam-papers');
  await expect(page.getByText('0 项')).toBeVisible();
});
