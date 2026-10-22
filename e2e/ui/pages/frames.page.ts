import { expect } from '@playwright/test';
import { BasePage } from './base.page';

export class FramesPage extends BasePage {
  async openNestedFrames() {
    await this.goto('/nestedframes');
    await this.expectUrl(/\/nestedframes$/);
  }

  async assertNestedContent() {
    const parent = this.page.frameLocator('#frame1');
    const child = parent.frameLocator('iframe');
    await expect(parent.locator('body')).toContainText('Parent frame');
    await expect(child.locator('body')).toHaveText('Child Iframe');
    // Check that child text is not part of the parent document.
    await expect(parent.locator('body')).not.toContainText('Child Iframe');
    await expect(
      this.page.getByRole('heading', { name: 'Nested Frames', exact: true })
    ).toBeVisible();
  }
}
