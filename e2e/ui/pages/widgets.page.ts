import { expect } from '@playwright/test';
import { BasePage } from './base.page';

export class WidgetsPage extends BasePage {
  async goToToolTips() {
    await this.page.getByRole('link', { name: 'Tool Tips', exact: true }).click();
    await expect(this.page).toHaveURL(/tool-tips$/);
  }

  async goToProgressBar() {
    await this.page.getByRole('link', { name: 'Progress Bar', exact: true }).click();
    await expect(this.page).toHaveURL(/progress-bar$/);
  }

  async startProgress() {
    await this.page.click('#startStopButton');
  }

  async assertProgressComplete() {
    const barContainer = this.page.locator('#progressBar');
    const bar = barContainer.locator('.progress-bar');
    // The progress text reaches 100% before the success colour appears.
    await expect(bar).toHaveText('100%', { timeout: 15000 });
    await expect(bar).toHaveClass(/\bbg-success\b/);
  }

  async hoverButtonToolTip() {
    const button = this.page.locator('#toolTipButton');
    await expect(button).toBeVisible();
    await button.hover();
    const tipRoot = this.page.locator('#buttonToolTip.show');
    const tipInner = tipRoot.locator('.tooltip-inner');
    return tipInner;
  }

  async assertTooltipText(expected: string) {
    const tipInner = await this.hoverButtonToolTip();
    await expect(tipInner).toBeVisible();
    await expect(tipInner).toHaveText(expected);
  }
}
