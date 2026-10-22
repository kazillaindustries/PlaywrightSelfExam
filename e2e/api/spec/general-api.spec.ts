import { addBooks, seedBooks, assertCollection } from '../utils/books';
import { test, expect } from '../fixtures/fixtures';
import { BASE, BooksResponse, UserResponse, createUser, getIsbns } from '../utils/auth';

test('TC01 Create user (happy)', async ({ createAccount }) => {
  const { userName, response: res } = await createAccount('bilbo_baggins');
  expect(res.status()).toBe(201);
  const body: UserResponse = await res.json();
  expect(body.userID).toEqual(expect.any(String));
  expect(body.userID).not.toBe('');
  expect(body.username).toBe(userName);
  expect(body.books).toEqual([]);
});

test('TC02 Create user duplicate (unhappy)', async ({ request, createAccount }) => {
  const { userName, response: original } = await createAccount('meriadoc_brandybuck');
  expect(original.status(), 'Create original user before duplicate attempt').toBe(201);
  const dup = await createUser(request, userName);
  expect(dup.status()).toBe(406);
});

test('TC03 Add books (happy)', async ({ request, createAuthenticatedAccount }) => {
  const { userId, token } = await createAuthenticatedAccount('peregrin_took');
  const isbns = await getIsbns(request, 2);
  const res = await request.post(`${BASE}/BookStore/v1/Books`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { userId, collectionOfIsbns: isbns.map((i) => ({ isbn: i })) },
  });
  expect(res.status()).toBe(201);
  const body: BooksResponse = await res.json();
  expect(body.books.map((book) => book.isbn).sort()).toEqual([...isbns].sort());
});

test('TC04 Add books invalid ISBN (unhappy)', async ({ request, createAuthenticatedAccount }) => {
  const { userId, token } = await createAuthenticatedAccount('legolas');
  const res = await request.post(`${BASE}/BookStore/v1/Books`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { userId, collectionOfIsbns: [{ isbn: 'INVALID_ISBN' }] },
  });
  expect(res.status()).toBe(400);
  expect(await res.json()).toEqual({
    code: '1205',
    message: 'ISBN supplied is not available in Books Collection!',
  });
});

test('TC05 Remove book (happy)', async ({ request, createAuthenticatedAccount }) => {
  const { userId, token } = await createAuthenticatedAccount('gimli');
  const isbn = (await getIsbns(request, 1))[0];
  const added = await request.post(`${BASE}/BookStore/v1/Books`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { userId, collectionOfIsbns: [{ isbn }] },
  });
  expect(added.status(), 'Add the book before deletion').toBe(201);
  const addedBooks: BooksResponse = await added.json();
  expect(addedBooks.books).toEqual([{ isbn }]);
  const del = await request.delete(`${BASE}/BookStore/v1/Book`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { isbn, userId },
  });
  expect(del.status()).toBe(204);
  const userResponse = await request.get(`${BASE}/Account/v1/User/${userId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(userResponse.status(), 'Read user after deletion').toBe(200);
  const user: UserResponse = await userResponse.json();
  expect(user.books.map((book) => book.isbn)).not.toContain(isbn);
});

test('TC06 Remove book unauthorized (unhappy)', async ({ request, createAuthenticatedAccount }) => {
  const owner = await createAuthenticatedAccount('aragorn');
  const [isbn] = await getIsbns(request, 1);
  await seedBooks(request, { ...owner, isbns: [isbn] });
  await assertCollection(request, owner, [isbn]);

  const response = await request.delete(`${BASE}/BookStore/v1/Book`, {
    data: { isbn, userId: owner.userId },
  });
  expect(response.status()).toBe(401);
  expect(await response.json()).toEqual({ code: '1200', message: 'User not authorized!' });
  await assertCollection(request, owner, [isbn]);
});

const ownershipCases = [
  { name: 'TC07 Add books cannot change another user collection', operation: 'add' },
  { name: 'TC08 Remove book cannot change another user collection', operation: 'remove' },
] as const;

for (const scenario of ownershipCases) {
  test(scenario.name, async ({ request, createAuthenticatedAccount }) => {
    const owner = await createAuthenticatedAccount('frodo_baggins');
    const otherUser = await createAuthenticatedAccount('samwise_gamgee');
    const [ownedIsbn, otherIsbn] = await getIsbns(request, 2);
    await test.step('Both users can independently add and read their own books', async () => {
      await seedBooks(request, { ...owner, isbns: [ownedIsbn] });
      await seedBooks(request, { ...otherUser, isbns: [otherIsbn] });
      await assertCollection(request, owner, [ownedIsbn]);
      await assertCollection(request, otherUser, [otherIsbn]);
    });
    await test.step('A valid token belonging to another user cannot mutate the owner collection', async () => {
      const response =
        scenario.operation === 'add'
          ? await addBooks(request, { ...owner, token: otherUser.token, isbns: [otherIsbn] })
          : await request.delete(`${BASE}/BookStore/v1/Book`, {
              headers: { Authorization: `Bearer ${otherUser.token}` },
              data: { userId: owner.userId, isbn: ownedIsbn },
            });
      expect(response.status()).toBe(401);
      expect(await response.json()).toEqual({ code: '1200', message: 'User not authorized!' });
    });
    await test.step('Neither user collection changed', async () => {
      await assertCollection(request, owner, [ownedIsbn]);
      await assertCollection(request, otherUser, [otherIsbn]);
    });
  });
}

const rejectedAddCases = [
  {
    name: 'TC09 Invalid ISBN preserves existing books and allows recovery',
    isbn: 'INVALID_ISBN',
    error: { code: '1205', message: 'ISBN supplied is not available in Books Collection!' },
  },
  {
    name: 'TC10 Duplicate ISBN preserves existing books and allows recovery',
    isbn: 'existing',
    error: { code: '1210', message: "ISBN already present in the User's Collection!" },
  },
] as const;

for (const scenario of rejectedAddCases) {
  test(scenario.name, async ({ request, createAuthenticatedAccount }) => {
    const owner = await createAuthenticatedAccount('bilbo_baggins');
    const [existingIsbn, nextIsbn] = await getIsbns(request, 2);
    const defaultRequest = { ...owner, isbns: [existingIsbn] };
    await seedBooks(request, defaultRequest);
    await assertCollection(request, owner, [existingIsbn]);

    await test.step('Reject the request without changing the existing collection', async () => {
      const rejectedRequest = {
        ...defaultRequest,
        isbns: [scenario.isbn === 'existing' ? existingIsbn : scenario.isbn],
      };
      const response = await addBooks(request, rejectedRequest);
      expect(response.status()).toBe(400);
      expect(await response.json()).toEqual(scenario.error);
      await assertCollection(request, owner, [existingIsbn]);
    });
    await test.step('A subsequent valid request still succeeds', async () => {
      await seedBooks(request, { ...defaultRequest, isbns: [nextIsbn] });
      await assertCollection(request, owner, [existingIsbn, nextIsbn]);
    });
  });
}

test('TC11 Removed book can be added again without changing other books', async ({
  request,
  createAuthenticatedAccount,
}) => {
  const owner = await createAuthenticatedAccount('peregrin_took');
  const [removedIsbn, retainedIsbn] = await getIsbns(request, 2);
  await test.step('Add and read two books', async () => {
    await seedBooks(request, { ...owner, isbns: [removedIsbn, retainedIsbn] });
    await assertCollection(request, owner, [removedIsbn, retainedIsbn]);
  });
  await test.step('Remove one book and preserve the other', async () => {
    const response = await request.delete(`${BASE}/BookStore/v1/Book`, {
      headers: { Authorization: `Bearer ${owner.token}` },
      data: { userId: owner.userId, isbn: removedIsbn },
    });
    expect(response.status()).toBe(204);
    await assertCollection(request, owner, [retainedIsbn]);
  });
  await test.step('Re-add the removed book exactly once', async () => {
    await seedBooks(request, { ...owner, isbns: [removedIsbn] });
    await assertCollection(request, owner, [removedIsbn, retainedIsbn]);
  });
});
