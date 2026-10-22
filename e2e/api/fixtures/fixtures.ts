import { APIResponse, test as base, expect } from '@playwright/test';
import { BASE, PASSWORD, UserResponse, createUser, generateToken, uname } from '../utils/auth';

interface TestAccount {
  userId: string;
  userName: string;
  response: APIResponse;
}

export interface AuthenticatedAccount extends TestAccount {
  token: string;
}

interface AccountFixtures {
  createAccount: (name: string) => Promise<TestAccount>;
  createAuthenticatedAccount: (name: string) => Promise<AuthenticatedAccount>;
}

export const test = base.extend<AccountFixtures>({
  createAccount: async ({ request }, use, testInfo) => {
    const accounts: TestAccount[] = [];
    await use(async (name) => {
      const userName = uname(name);
      const response = await createUser(request, userName);
      expect(response.status(), 'Create test account').toBe(201);
      const body: UserResponse = await response.json();
      expect(body.userID).toEqual(expect.any(String));
      expect(body.userID).not.toBe('');
      const account = { userId: body.userID, userName, response };
      accounts.push(account);
      return account;
    });

    const failures: string[] = [];
    for (const account of accounts.reverse()) {
      try {
        const response = await request.delete(`${BASE}/Account/v1/User/${account.userId}`, {
          headers: {
            Authorization: `Basic ${Buffer.from(`${account.userName}:${PASSWORD}`).toString('base64')}`,
          },
        });
        expect(response.status(), 'Delete generated test account').toBe(204);
      } catch (error: unknown) {
        failures.push(error instanceof Error ? error.message : String(error));
      }
    }
    if (failures.length > 0) {
      await testInfo.attach('account-cleanup-errors', {
        body: failures.join('\n'),
        contentType: 'text/plain',
      });
      // Fail if cleanup fails
      if (testInfo.status === testInfo.expectedStatus) {
        throw new Error(`Failed to clean up ${failures.length} generated account(s)`);
      }
    }
  },
  createAuthenticatedAccount: async ({ request, createAccount }, use) => {
    await use(async (name) => {
      const account = await createAccount(name);
      const { body } = await generateToken(request, account.userName);
      expect(body.status).toBe('Success');
      expect(body.token).toEqual(expect.any(String));
      expect(body.token).not.toBe('');
      return { ...account, token: body.token };
    });
  },
});

export { expect };
