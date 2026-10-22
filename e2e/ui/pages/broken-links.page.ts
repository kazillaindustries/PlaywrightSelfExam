import { BasePage } from './base.page';
import { expect } from '@playwright/test';

export class BrokenLinksImagesPage extends BasePage {
  private container = 'div.col-12.mt-4.col-md-6';

  async openFromElementsMenu() {
    await this.page.getByRole('link', { name: 'Broken Links - Images', exact: true }).click();
    await this.expectUrl(/\/broken$/);
  }

  async assertBroken(srcFragment: string) {
    const img = this.page.locator(`${this.container} img[src*="${srcFragment}"]`);
    await expect(img).toBeVisible();
    await expect(img).toHaveJSProperty('complete', true);
    await expect(img).toHaveJSProperty('naturalWidth', 0);
  }
}
