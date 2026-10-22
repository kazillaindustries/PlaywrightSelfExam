import { expect } from '@playwright/test';
import { BasePage } from '../pages/base.page';

export class InteractionsPage extends BasePage {
  async assertListOrder(expected: string[]) {
    await expect(this.page.locator('#demo-tabpane-list .list-group-item')).toHaveText(expected);
  }

  async moveListItem(item: string, destination: string) {
    const items = this.page.locator('#demo-tabpane-list .list-group-item');
    const source = items.filter({ hasText: new RegExp(`^${item}$`) });
    const target = items.filter({ hasText: new RegExp(`^${destination}$`) });
    await source.dragTo(target, { targetPosition: { x: 20, y: 35 } });
  }

  async openRevertTab() {
    await this.page.getByRole('tab', { name: 'Revert Draggable', exact: true }).click();
  }

  async assertRevertBehaviour(id: 'revertable' | 'notRevertable', shouldRevert: boolean) {
    const pane = this.page.locator('#droppableExample-tabpane-revertable');
    const source = pane.locator(`#${id}`);
    const target = pane.locator('#droppable');
    await expect(source).toHaveClass(/\bui-draggable\b/);
    await expect(target).toHaveClass(/\bui-droppable\b/);
    await target.scrollIntoViewIfNeeded();
    await source.hover();
    const before = await source.boundingBox();
    const drop = await target.boundingBox();
    if (!before || !drop) {
      throw new Error('Drag source or drop target has no visible bounding box');
    }
    await this.page.mouse.down();
    try {
      await this.page.mouse.move(drop.x + drop.width / 2, drop.y + drop.height / 2, { steps: 15 });
      await this.page.mouse.move(drop.x + drop.width / 2 + 1, drop.y + drop.height / 2);
      // Check that the target reacts to each drag, including the second one.
      await expect(target).toHaveClass(/\bui-droppable-hover\b/);
    } finally {
      await this.page.mouse.up();
    }
    await expect(target).toHaveText('Dropped!');
    if (shouldRevert) {
      // Check that it returns to the start, allowing one pixel for rounding.
      await expect
        .poll(
          async () => {
            const after = await source.boundingBox();
            if (!after) {
              throw new Error('Reverting source has no visible bounding box');
            }
            return Math.max(Math.abs(after.x - before.x), Math.abs(after.y - before.y));
          },
          { message: 'Dragged source returns to its starting position' }
        )
        .toBeLessThanOrEqual(1);
    } else {
      const after = await source.boundingBox();
      if (!after) {
        throw new Error('Dragged source has no visible bounding box');
      }
      expect(after.x + after.width / 2).toBeGreaterThan(drop.x);
      expect(after.x + after.width / 2).toBeLessThan(drop.x + drop.width);
      expect(after.y + after.height / 2).toBeGreaterThan(drop.y);
      expect(after.y + after.height / 2).toBeLessThan(drop.y + drop.height);
    }
  }
  async goToDroppable() {
    await this.page.getByRole('link', { name: 'Droppable', exact: true }).click();
    await expect(this.page).toHaveURL(/droppable$/);
    // Other tabs reuse these IDs, so only look inside the Simple tab.
    await this.page.locator('#droppableExample-tab-simple').click();
  }

  async dragAndDrop() {
    const pane = this.page.locator('#droppableExample-tabpane-simple');
    const source = pane.locator('#draggable');
    const target = pane.locator('#droppable');
    // The elements can appear before dragging is ready.
    await expect(source).toHaveClass(/\bui-draggable\b/);
    await expect(target).toHaveClass(/\bui-droppable\b/);
    await target.scrollIntoViewIfNeeded();
    await source.hover();
    const box = await target.boundingBox();
    if (!box) {
      throw new Error('Drop target has no visible bounding box');
    }
    const x = box.x + box.width / 2;
    const y = box.y + box.height / 2;

    // Move in steps so dragging starts before reaching the target.
    await this.page.mouse.down();
    try {
      await this.page.mouse.move(x, y, { steps: 15 });
      await this.page.mouse.move(x + 1, y);
    } finally {
      await this.page.mouse.up();
    }
  }

  async assertDropped() {
    const pane = this.page.locator('#droppableExample-tabpane-simple');
    const target = pane.locator('#droppable');
    await expect(target).toHaveText('Dropped!');
  }
}
