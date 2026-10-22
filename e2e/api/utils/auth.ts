import { randomUUID } from 'node:crypto';
import { APIRequestContext, expect } from '@playwright/test';

export interface Book {
  isbn: string;
}
export interface BooksResponse {
  books: Book[];
}
export interface UserResponse {
  userID: string;
  username: string;
  books: Book[];
}
interface TokenResponse {
  token: string;
  status: string;
  result: string;
}

export const BASE = 'https://demoqa.com';
export const PASSWORD = 'Passw0rd!';

export function uname(prefix: string) {
  return `${prefix}_${randomUUID()}`;
}

export async function createUser(
  request: APIRequestContext,
  userName: string,
  password: string = PASSWORD
) {
  const res = await request.post(`${BASE}/Account/v1/User`, { data: { userName, password } });
  return res;
}

export async function generateToken(
  request: APIRequestContext,
  userName: string,
  password: string = PASSWORD
) {
  const res = await request.post(`${BASE}/Account/v1/GenerateToken`, {
    data: { userName, password },
  });
  expect(res.status(), 'Generate authentication token').toBe(200);
  const body: TokenResponse = await res.json();
  return { res, body };
}

export async function getIsbns(request: APIRequestContext, count = 2): Promise<string[]> {
  const res = await request.get(`${BASE}/BookStore/v1/Books`);
  expect(res.status(), 'Fetch book catalog').toBe(200);
  const body: BooksResponse = await res.json();
  expect(Array.isArray(body.books), 'Catalog books array').toBe(true);
  expect(body.books.length, 'Available catalog books').toBeGreaterThanOrEqual(count);
  const isbns = body.books.slice(0, count).map((book) => book.isbn);
  for (const isbn of isbns) {
    expect(isbn).toEqual(expect.any(String));
    expect(isbn).not.toBe('');
  }
  return isbns;
}
