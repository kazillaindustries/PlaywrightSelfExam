import { APIRequestContext, expect } from '@playwright/test';
import { BASE, BooksResponse, UserResponse } from './auth';

interface BookRequest {
  userId: string;
  token: string;
  isbns: string[];
}

export async function addBooks(request: APIRequestContext, input: BookRequest) {
  return request.post(`${BASE}/BookStore/v1/Books`, {
    headers: { Authorization: `Bearer ${input.token}` },
    data: {
      userId: input.userId,
      collectionOfIsbns: input.isbns.map((isbn) => ({ isbn })),
    },
  });
}

export async function seedBooks(request: APIRequestContext, input: BookRequest) {
  const response = await addBooks(request, input);
  expect(response.status(), 'Seed the book collection').toBe(201);
  const body: BooksResponse = await response.json();
  expect(body.books.map((book) => book.isbn).sort()).toEqual([...input.isbns].sort());
}

export async function assertCollection(
  request: APIRequestContext,
  owner: { userId: string; token: string },
  expectedIsbns: string[]
) {
  const response = await request.get(`${BASE}/Account/v1/User/${owner.userId}`, {
    headers: { Authorization: `Bearer ${owner.token}` },
  });
  expect(response.status(), 'Read the owner collection').toBe(200);
  const body: UserResponse = await response.json();
  expect(Array.isArray(body.books), 'User books array').toBe(true);
  // Check that no books are missing, added or duplicated.
  expect(body.books.map((book) => book.isbn).sort()).toEqual([...expectedIsbns].sort());
}
