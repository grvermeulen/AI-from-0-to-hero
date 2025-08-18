import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  const template = `You are an expert test engineer.
Given a ReadyAPI (SoapUI) test suite description, produce equivalent Playwright API tests in TypeScript.

Instructions:
- Use @playwright/test and request fixture
- Include positive and at least one negative case
- Add schema or field assertions where applicable
- Keep examples concise

Input:
<paste ReadyAPI outline here>

Output:
- A short plan (bullets)
- TS code snippet with 2-3 tests`;
  return NextResponse.json({ template });
}



