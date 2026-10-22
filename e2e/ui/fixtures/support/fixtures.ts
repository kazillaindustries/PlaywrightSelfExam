import { test as base } from '@playwright/test';

// Keep ads from blocking test interactions.
export const test = base.extend({
  context: async ({ context }, use) => {
    await context.route(
      /^https?:\/\/[^/]*(googlesyndication|doubleclick|adplus|adsystem)[^/]*\//i,
      (r) => r.abort()
    );

    // Hide known ad containers including ones added after the page loads.
    await context.addInitScript(() => {
      const hideAds = () => {
        document
          .querySelectorAll<HTMLElement>('#fixedban, ins[id^="gpt_unit_"]')
          .forEach((el) => (el.style.display = 'none'));
      };
      document.addEventListener('DOMContentLoaded', hideAds);
      document.addEventListener('DOMContentLoaded', () => {
        new MutationObserver(hideAds).observe(document.body, { childList: true, subtree: true });
      });
    });

    await use(context);
  },
});

export const expect = base.expect;
