import { BasePage } from './base.page';
import { expect } from '@playwright/test';

export class ElementsPage extends BasePage {
  async downloadSample() {
    const download = this.page.waitForEvent('download');
    await this.page.getByRole('button', { name: 'Download', exact: true }).click();
    return download;
  }

  async uploadFile(filePath: string) {
    await this.page.locator('#uploadFile').setInputFiles(filePath);
  }

  async assertUploadedFilename(filename: string) {
    // Browser shows a fake path to hide the real file location.
    await expect(this.page.locator('#uploadedFilePath')).toHaveText(`C:\\fakepath\\${filename}`);
  }

  async assertDynamicButtonChanges() {
    const enableButton = this.page.getByRole('button', {
      name: 'Will enable 5 seconds',
      exact: true,
    });
    await expect(enableButton).toBeDisabled();
    await expect(this.page.locator('#visibleAfter')).toHaveCount(0);
    await expect(this.page.locator('#colorChange')).not.toHaveClass(/\btext-danger\b/);
    // DemoQA changes these buttons after five seconds; allow up to ten for the check.
    await expect(enableButton).toBeEnabled({ timeout: 10000 });
    await enableButton.click();
    await expect(this.page.locator('#visibleAfter')).toBeVisible();
    await expect(this.page.locator('#colorChange')).toHaveClass(/\btext-danger\b/);
  }
  async openMenuItem(name: string) {
    await this.page.getByRole('link', { name: name, exact: true }).click();
  }
  async goToWebTables() {
    await this.openMenuItem('Web Tables');
    await this.expectUrl(/\/webtables$/);
  }
  async goToBrokenLinksImages() {
    await this.openMenuItem('Broken Links - Images');
    await this.expectUrl(/\/broken$/);
  }
}
