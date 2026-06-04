import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  signal,
} from '@angular/core';
import { ApiService } from '../../core/api.service';
import { Popover } from '../../ui/popover';
import {
  ValueModifier,
  type ValueModifierChangeEvent,
} from '../../ui/value-modifier';
import { ConfirmationPopover } from '../../ui/confirmation-popover';
import { IconButton } from '../../ui/icon-button';
import { Icon } from '../../ui/icon';
import { Button } from '../../ui/button';
import { Modal } from '../../ui/modal';
import { TextInput, NumberInput } from '../../ui/inputs';
import type { InventoryItem } from '@draw-steel/shared';

@Component({
  selector: 'ds-inventory-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    Popover,
    ValueModifier,
    ConfirmationPopover,
    IconButton,
    Icon,
    Button,
    Modal,
    TextInput,
    NumberInput,
  ],
  template: `
    <div class="flex flex-col gap-2">
      @if (characterId() != null) {
        <div class="flex justify-end">
          <ds-button color="green" variant="transparent" (click)="openNew()">
            <ds-icon name="plus" />
            <span class="ml-2">Add Item</span>
          </ds-button>
        </div>
        <ds-modal [opened]="newOpen()" title="New Item" (closed)="newOpen.set(false)">
          <div class="flex flex-col gap-3">
            <ds-text-input label="Name" placeholder="Name" [(value)]="newName" />
            <ds-number-input
              label="Quantity"
              placeholder="Quantity"
              [min]="1"
              [(value)]="newQuantity"
            />
            <div>
              <ds-button [disabled]="!newName().trim()" (click)="add()">Save</ds-button>
            </div>
          </div>
        </ds-modal>
      }

      <table class="w-full text-left">
        <thead>
          <tr class="border-b border-[color:var(--color-dark-5)]">
            <th class="py-1">Item</th>
            <th class="py-1">Quantity</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          @for (item of items(); track item.id) {
            <tr class="border-b border-[color:var(--color-dark-6)]">
              <td class="py-1">{{ item.name }}</td>
              <td class="py-1">
                <ds-popover>
                  <span dsTrigger class="clickable">{{ item.quantity }}</span>
                  <div dsDropdown>
                    <ds-value-modifier
                      label="Modify Quantity"
                      (changed)="modifyQuantity(item.id, $event)"
                    />
                  </div>
                </ds-popover>
              </td>
              <td class="py-1 text-right">
                <ds-confirmation-popover
                  [title]="'Remove ' + item.name"
                  message="Are you sure?"
                  (accept)="remove(item.id)"
                >
                  <ds-icon-btn cpTrigger color="red"><ds-icon name="trash" /></ds-icon-btn>
                </ds-confirmation-popover>
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
})
export class InventoryList {
  private readonly api = inject(ApiService);

  readonly items = input<InventoryItem[]>([]);
  readonly characterId = input<number | undefined>(undefined);

  protected readonly newOpen = signal(false);
  protected readonly newName = signal('');
  protected readonly newQuantity = signal<number | null>(1);

  protected openNew(): void {
    this.newName.set('');
    this.newQuantity.set(1);
    this.newOpen.set(true);
  }

  protected async add(): Promise<void> {
    const characterId = this.characterId();
    if (characterId == null) return;
    const quantity = this.newQuantity() ?? 0;
    if (quantity <= 0) return;
    await this.api.createInventoryItem(characterId, {
      name: this.newName(),
      quantity,
    });
    this.newOpen.set(false);
  }

  protected async modifyQuantity(
    id: number,
    event: ValueModifierChangeEvent,
  ): Promise<void> {
    await this.api.modifyInventoryItemQuantity(id, {
      modifyBy: event.modifyBy,
      type: event.type,
    });
  }

  protected async remove(id: number): Promise<void> {
    await this.api.deleteInventoryItem(id);
  }
}
