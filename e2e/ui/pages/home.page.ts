import { BasePage } from './base.page';
import { expect } from '@playwright/test';

export class HomePage extends BasePage {
  async open() {
    await this.page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(this.page).toHaveURL(/demoqa\.com\/$/);
  }

  private async goToCard(cardTitle: string, urlRegex: RegExp) {
    const card = this.page
      .locator('.card')
      .filter({ has: this.page.getByRole('heading', { name: cardTitle, exact: true }) });
    await expect(card).toBeVisible();
    await card.click();
    await expect(this.page).toHaveURL(urlRegex);
  }

  async goToElements() {
    await this.goToCard('Elements', /elements$/);
  }
  async goToForms() {
    await this.goToCard('Forms', /forms$/);
  }
  async goToWidgets() {
    await this.goToCard('Widgets', /widgets$/);
  }
  async goToInteractions() {
    await this.goToCard('Interactions', /\/interaction$/);
  }
}
