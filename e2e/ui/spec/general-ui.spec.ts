import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { FramesPage } from '../pages/frames.page';
import { test, expect } from '../fixtures/support/fixtures';
import { randomUUID } from 'node:crypto';
import { HomePage } from '../pages/home.page';
import { ElementsPage } from '../pages/elements.page';
import { WebTablesPage } from '../pages/web-tables.page';
import { BrokenLinksImagesPage } from '../pages/broken-links.page';
import { FormsPage, PracticeFormData } from '../pages/forms.page';
import { WidgetsPage } from '../pages/widgets.page';
import { InteractionsPage } from '../pages/interactions.page';

test.describe('DemoQA UI tests', () => {
  test('TC01: Verify the Web Tables CRUD lifecycle', async ({ page }) => {
    const home = new HomePage(page);
    await home.open();
    const elements = new ElementsPage(page);
    const web = new WebTablesPage(page);
    const original = {
      firstName: 'Frodo',
      lastName: 'Baggins',
      email: `frodo.baggins-${randomUUID()}@example.com`,
      age: 34,
      salary: 42000,
      department: 'Quality Assurance',
    };
    const changes = { salary: 56000, department: 'Engineering' };
    const updated = { ...original, ...changes };

    await home.goToElements();
    await elements.goToWebTables();

    await test.step('Create a uniquely identified record and verify every field', async () => {
      await web.add(original);
      await web.assertRecord(original);
    });

    await test.step('Update salary and department while preserving the other fields', async () => {
      await web.updateByEmail(original.email, changes);
      await web.assertRecord(updated);
    });

    await test.step('Search by email and verify exactly one updated record', async () => {
      await web.search(original.email);
      await web.assertOnlySearchResult(updated);
    });

    await test.step('Delete the record and verify absence with and without the search', async () => {
      await web.deleteByEmail(original.email);
      await web.assertRecordAbsent(original.email);
      await web.search('');
      await web.assertRecordAbsent(original.email);
      await web.assertRecord({ email: 'alden@example.com' });
    });
  });

  test('TC02: Verify image fails to load', async ({ page }) => {
    const home = new HomePage(page);
    await home.open();
    const broken = new BrokenLinksImagesPage(page);

    await home.goToElements();
    await broken.openFromElementsMenu();
    await broken.assertBroken('Toolsqa_1.jpg');
  });

  test('TC03: Verify user can submit the form', async ({ page }) => {
    const home = new HomePage(page);
    await home.open();
    const forms = new FormsPage(page);

    const data: PracticeFormData = {
      firstName: 'Samwise',
      lastName: 'Gamgee',
      email: 'samwise.gamgee@example.com',
      gender: 'Male',
      mobile: '0123456789',
      dateOfBirth: '15 Jan 1990',
      expectedDateOfBirth: '15 January,1990',
      subjects: ['Computer Science'],
      hobbies: ['Reading'],
      picturePath: 'e2e/ui/fixtures/testData/test_image.png',
      address: 'Netherlands',
      state: 'NCR',
      city: 'Delhi',
    };

    await home.goToForms();
    await forms.goToPracticeForm();
    await forms.completeForm(data);
    await forms.submit();
    await forms.assertSubmission(data);
  });

  test('TC04: Verify the progress bar', async ({ page }) => {
    const home = new HomePage(page);
    await home.open();
    const widgets = new WidgetsPage(page);

    await home.goToWidgets();
    await widgets.goToProgressBar();
    await widgets.startProgress();
    await widgets.assertProgressComplete();
  });

  test('TC05: Verify the tooltip', async ({ page }) => {
    const home = new HomePage(page);
    await home.open();
    const widgets = new WidgetsPage(page);

    await home.goToWidgets();
    await widgets.goToToolTips();
    await widgets.assertTooltipText('You hovered over the Button');
  });

  test('TC06: Verify the user can drag and drop', async ({ page }) => {
    const home = new HomePage(page);
    await home.open();
    const interactions = new InteractionsPage(page);

    await home.goToInteractions();
    await interactions.goToDroppable();
    await interactions.dragAndDrop();
    await interactions.assertDropped();
  });

  test('TC07: Verify sortable list order and integrity', async ({ page }) => {
    const interactions = new InteractionsPage(page);
    await interactions.goto('/sortable');
    await interactions.assertListOrder(['One', 'Two', 'Three', 'Four', 'Five', 'Six']);
    await interactions.moveListItem('One', 'Three');
    // Check the order and make sure no items are missing or repeated.
    await interactions.assertListOrder(['Two', 'Three', 'One', 'Four', 'Five', 'Six']);
  });

  test('TC08: Verify downloaded file can be uploaded', async ({ page }, testInfo) => {
    const elements = new ElementsPage(page);
    await elements.goto('/upload-download');
    const download = await elements.downloadSample();
    expect(download.suggestedFilename()).toBe('sampleFile.jpeg');
    const filePath = testInfo.outputPath(download.suggestedFilename());
    await download.saveAs(filePath);
    expect(await download.failure()).toBeNull();
    const bytes = await readFile(filePath);
    expect(bytes.length).toBeGreaterThan(3);
    expect([...bytes.subarray(0, 3)], 'JPEG signature').toEqual([0xff, 0xd8, 0xff]);
    await elements.uploadFile(filePath);
    await elements.assertUploadedFilename(path.basename(filePath));
  });

  test('TC09: Verify parent and child frame content', async ({ page }) => {
    const frames = new FramesPage(page);
    await frames.openNestedFrames();
    await frames.assertNestedContent();
  });

  test('TC10: Verify reverting and non-reverting drops', async ({ page }) => {
    const interactions = new InteractionsPage(page);
    await interactions.goto('/droppable');
    await interactions.openRevertTab();
    await test.step('Accepted revertable source returns to its starting position', async () => {
      await interactions.assertRevertBehaviour('revertable', true);
    });
    await test.step('Accepted non-revertable source remains over the target', async () => {
      await interactions.assertRevertBehaviour('notRevertable', false);
    });
  });

  test('TC11: Verify dynamic button state changes', async ({ page }) => {
    const elements = new ElementsPage(page);
    await elements.goto('/dynamic-properties');
    await elements.assertDynamicButtonChanges();
  });
});
