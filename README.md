# Playing around with Playwright

This is me messing around with Playwright and TypeScript using [DemoQA](https://demoqa.com).

There are 11 UI tests and 11 API tests covering forms, tables, drag and drop, files, frames, and the bookstore API. Originally started as a technical assessment and expanded as a personal practice project.

## Setup

Node.js 24 and npm.

```bash
npm ci
npx playwright install chromium
```

## Run

```bash
npm run tests             # everything
npm run tests:headed      # with the browser visible
npm run test:ui           # UI tests
npm run test:api          # API tests
npm run results           # HTML report
```

## Checks

```bash
npm run typecheck
npm run format:check
npm run format
```

## Limitations

DemoQA isn't my application. Its shared infrastructure, catalog, third-party ads, and behaviour can change without warning. The UI fixture blocks known ad hosts and hides specific ad containers; ads themselves aren't under test. I can create test accounts but can't reset or control the environment. Currently this suite runs only in Chromium.

API accounts are deleted during teardown. Cleanup failures are reported and fail an otherwise passing test; an existing test failure stays primary. If account creation succeeds but its response is lost, or the process is stopped, an account may remain. The shared test password is synthetic, not a real credential.

Local runs have no retries; CI allows one. A retry pass still needs investigation.
