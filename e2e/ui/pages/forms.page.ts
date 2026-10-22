import { BasePage } from './base.page';
import { expect } from '@playwright/test';
import path from 'node:path';

export interface PracticeFormData {
  firstName: string;
  lastName: string;
  email: string;
  gender: 'Male' | 'Female' | 'Other';
  mobile: string;
  dateOfBirth: string;
  expectedDateOfBirth: string;
  subjects: string[];
  hobbies: ('Sports' | 'Reading' | 'Music')[];
  picturePath: string;
  address: string;
  state: string;
  city: string;
}

export class FormsPage extends BasePage {
  async goToPracticeForm() {
    await this.page.getByRole('link', { name: 'Practice Form', exact: true }).click();
    await this.expectUrl(/automation-practice-form$/);
  }

  async fillTextBasics(data: PracticeFormData) {
    await this.page.fill('#firstName', data.firstName);
    await this.page.fill('#lastName', data.lastName);
    await this.page.fill('#userEmail', data.email);
    await this.page.fill('#userNumber', data.mobile);
    await this.page.fill('#currentAddress', data.address);
  }

  async selectGender(gender: PracticeFormData['gender']) {
    const idMap: Record<PracticeFormData['gender'], string> = {
      Male: 'gender-radio-1',
      Female: 'gender-radio-2',
      Other: 'gender-radio-3',
    };
    await this.page.locator(`label[for="${idMap[gender]}"]`).click();
    await expect(this.page.locator(`#${idMap[gender]}`)).toBeChecked();
  }

  async setDateOfBirth(date: string) {
    const input = this.page.locator('#dateOfBirthInput');
    await input.click();
    await input.press('ControlOrMeta+A');
    await input.pressSequentially(date);
    await input.press('Enter');
    await input.press('Escape');
    await this.page.locator('#firstName').click();
    await expect(this.page.locator('.react-datepicker')).toBeHidden();
  }

  async selectHobbies(hobbies: PracticeFormData['hobbies']) {
    for (const h of hobbies) {
      await this.page.locator('#hobbiesWrapper label').filter({ hasText: h }).click();
    }
  }

  async addSubjects(subjects: string[]) {
    for (const subject of subjects) {
      const input = this.page.locator('#subjectsInput');
      await input.click();
      await input.fill(subject);
      const menu = this.page.locator('.subjects-auto-complete__menu');
      const option = menu.getByText(subject, { exact: true });
      await option.click();
    }
  }

  async uploadPicture(picturePath: string) {
    await this.page.setInputFiles('#uploadPicture', picturePath);
  }

  async selectStateAndCity(state: string, city: string) {
    await this.page.click('#state');
    await this.page.getByText(state, { exact: true }).click();
    await this.page.click('#city');
    await this.page.getByText(city, { exact: true }).click();
  }

  async submit() {
    await this.page.click('#submit');
  }

  async assertSubmission(data: PracticeFormData) {
    const modal = this.page.locator('.modal-content');
    await expect(modal).toBeVisible();

    const expected: Record<string, string> = {
      'Student Name': `${data.firstName} ${data.lastName}`,
      'Student Email': data.email,
      Gender: data.gender,
      Mobile: data.mobile,
      'Date of Birth': data.expectedDateOfBirth,
      Subjects: data.subjects.join(', '),
      Hobbies: data.hobbies.join(', '),
      Picture: path.basename(data.picturePath),
      Address: data.address,
      'State and City': `${data.state} ${data.city}`,
    };
    for (const [label, value] of Object.entries(expected)) {
      const row = modal.getByRole('row').filter({
        has: this.page.getByRole('cell', { name: label, exact: true }),
      });
      await expect(row.getByRole('cell').nth(1)).toHaveText(value);
    }
  }

  async completeForm(data: PracticeFormData) {
    await this.fillTextBasics(data);
    await this.selectGender(data.gender);
    await this.setDateOfBirth(data.dateOfBirth);
    await this.addSubjects(data.subjects);
    await this.selectHobbies(data.hobbies);
    await this.uploadPicture(data.picturePath);
    await this.selectStateAndCity(data.state, data.city);
  }
}
