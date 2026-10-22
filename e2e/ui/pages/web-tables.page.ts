import { BasePage } from './base.page';
import { expect } from '@playwright/test';

export interface RecordData {
  firstName: string;
  lastName: string;
  email: string;
  age: number;
  salary: number;
  department: string;
}

export class WebTablesPage extends BasePage {
  async add(record: RecordData) {
    await this.page.click('#addNewRecordButton');
    await this.page.fill('#firstName', record.firstName);
    await this.page.fill('#lastName', record.lastName);
    await this.page.fill('#userEmail', record.email);
    await this.page.fill('#age', String(record.age));
    await this.page.fill('#salary', String(record.salary));
    await this.page.fill('#department', record.department);
    await this.page.click('#submit');
  }

  rowByEmail(email: string) {
    return this.page.getByRole('row').filter({
      has: this.page.getByRole('cell', { name: email, exact: true }),
    });
  }

  async assertRecord(partial: Partial<RecordData> & { email: string }) {
    const row = this.rowByEmail(partial.email);
    await expect(row).toBeVisible();
    const columns: (keyof RecordData)[] = [
      'firstName',
      'lastName',
      'age',
      'email',
      'salary',
      'department',
    ];
    for (const [index, field] of columns.entries()) {
      if (partial[field] !== undefined) {
        await expect(row.getByRole('cell').nth(index)).toHaveText(String(partial[field]));
      }
    }
  }

  async updateByEmail(email: string, changes: Partial<Omit<RecordData, 'email'>>) {
    const row = this.rowByEmail(email);
    await row.getByTitle('Edit', { exact: true }).click();
    const modal = this.page.getByRole('dialog');
    await expect(modal).toBeVisible();
    for (const [field, value] of Object.entries(changes)) {
      await modal.locator(`#${field}`).fill(String(value));
    }
    await modal.getByRole('button', { name: 'Submit', exact: true }).click();
    await expect(modal).toBeHidden();
  }

  async search(email: string) {
    await this.page.getByRole('textbox', { name: 'Type to search', exact: true }).fill(email);
  }

  async assertOnlySearchResult(record: RecordData) {
    const rows = this.page.getByRole('table').locator('tbody').getByRole('row');
    await expect(rows).toHaveCount(1);
    await this.assertRecord(record);
  }

  async deleteByEmail(email: string) {
    await this.rowByEmail(email).getByTitle('Delete', { exact: true }).click();
  }

  async assertRecordAbsent(email: string) {
    await expect(this.rowByEmail(email)).toHaveCount(0);
  }
}
