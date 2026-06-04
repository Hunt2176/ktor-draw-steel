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

      @if (items().length > 0) {
        <table class="inventory-table w-full text-left">
          <thead>
            <tr>
              <th>Item</th>
              <th class="qty-col">Quantity</th>
              <th class="actions-col"></th>
            </tr>
          </thead>
          <tbody>
            @for (item of items(); track item.id) {
              <tr>
                <td>{{ item.name }}</td>
                <td class="qty-col">
                  <ds-popover>
                    <span dsTrigger class="clickable qty-value">{{ item.quantity }}</span>
                    <div dsDropdown>
                      <ds-value-modifier
                        label="Modify Quantity"
                        (changed)="modifyQuantity(item.id, $event)"
                      />
                    </div>
                  </ds-popover>
                </td>
                <td class="actions-col text-right">
                  <ds-confirmation-popover
                    [title]="'Remove ' + item.name"
                    message="Are you sure?"
                    (accept)="remove(item.id)"
                  >
                    <ds-icon-btn cpTrigger color="red" [ariaLabel]="'Remove ' + item.name"><ds-icon name="trash" /></ds-icon-btn>
                  </ds-confirmation-popover>
                </td>
              </tr>
            }
          </tbody>
        </table>
      } @else {
        <div class="inventory-empty">No items</div>
      }
    </div>
  `,
  styles: `
    .inventory-table {
      border-collapse: collapse;
    }

    .inventory-table thead th {
      padding: 0.5rem 0.75rem;
      font-size: 0.7rem;
      font-weight: 600;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--color-dark-2);
      border-bottom: 1px solid var(--color-dark-4);
    }

    .inventory-table tbody td {
      padding: 0.5rem 0.75rem;
      border-bottom: 1px solid var(--color-dark-6);
    }

    .inventory-table tbody tr {
      transition: background-color 0.12s ease;
    }

    .inventory-table tbody tr:hover {
      background-color: var(--color-dark-6);
    }

    .inventory-table tbody tr:last-child td {
      border-bottom: none;
    }

    .qty-col {
      width: 8rem;
      text-align: right;
    }

    .qty-value {
      display: inline-block;
      min-width: 1.5rem;
      text-align: right;
    }

    .actions-col {
      width: 3rem;
    }

    .inventory-empty {
      padding: 1.25rem 0.75rem;
      text-align: center;
      font-size: 0.875rem;
      color: var(--color-dark-2);
      border: 1px solid var(--color-dark-4);
      border-radius: 0.375rem;
      background-color: var(--color-dark-7);
    }
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
