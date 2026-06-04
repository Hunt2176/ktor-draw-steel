import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { faBoxOpen, faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';
import type { InventoryItem } from '../../core/models';
import { ApiService } from '../../core/api.service';
import { CampaignStore } from '../../core/campaign-store.service';
import { parseIntOrUndefined } from '../../core/utils';
import { ActionIconComponent } from '../../ui/action-icon.component';
import { ButtonComponent } from '../../ui/button.component';
import { IconComponent } from '../../ui/icon.component';
import { ModalComponent } from '../../ui/modal.component';
import { PopoverComponent } from '../../ui/popover.component';
import {
  ValueModifierComponent,
  type ValueModifierChangeEvent,
} from './value-modifier.component';
import { ConfirmationPopoverComponent } from './confirmation-popover.component';

/** A character's inventory: list, adjust quantity, add, and remove items. */
@Component({
  selector: 'app-inventory-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ActionIconComponent,
    ButtonComponent,
    IconComponent,
    ModalComponent,
    PopoverComponent,
    ValueModifierComponent,
    ConfirmationPopoverComponent,
  ],
  template: `
    <div class="flex flex-col gap-3">
      @if (characterId() != null) {
        <div class="flex justify-end">
          <app-button color="green" variant="transparent" (clicked)="openAdd()">
            <app-icon [name]="plus" /><span class="ml-2">Add Item</span>
          </app-button>
        </div>
        <app-modal title="New Item" [opened]="addOpen()" (closed)="addOpen.set(false)">
          <div class="flex flex-col gap-3">
            <div>
              <label class="ds-label">Name</label>
              <input class="ds-input" placeholder="Name" [value]="newName()" (input)="newName.set($any($event.target).value)" />
            </div>
            <div>
              <label class="ds-label">Quantity</label>
              <input class="ds-input" type="number" min="1" [value]="newQuantity()" (input)="newQuantity.set($any($event.target).value)" />
            </div>
            <div>
              <app-button [disabled]="newName().trim().length <= 0" (clicked)="add()">Save</app-button>
            </div>
          </div>
        </app-modal>
      }

      @if (items().length > 0) {
        <ul class="flex flex-col gap-2">
          @for (item of items(); track item.id) {
            <li
              class="ds-inv-row flex items-center gap-3 rounded-lg border border-m-dark-4 bg-m-dark-6/60 px-3 py-2"
            >
              <span class="min-w-0 flex-1 truncate text-m-dark-0">{{ item.name }}</span>

              <app-popover>
                <span
                  popTarget
                  class="ds-qty-chip inline-flex min-w-[2.25rem] items-center justify-center rounded-full border border-ds-accent/40 bg-ds-accent/10 px-2.5 py-0.5 text-sm font-semibold text-ds-accent"
                  title="Modify quantity"
                >
                  {{ item.quantity }}
                </span>
                <div popDropdown>
                  <app-value-modifier
                    label="Modify Quantity"
                    (changed)="modifyQuantity(item.id, $event)"
                  />
                </div>
              </app-popover>

              <app-confirmation-popover
                [title]="'Remove ' + item.name"
                message="Are you sure?"
                (accepted)="remove(item.id)"
              >
                <app-action-icon color="red"><app-icon [name]="trash" /></app-action-icon>
              </app-confirmation-popover>
            </li>
          }
        </ul>
      } @else {
        <div
          class="flex flex-col items-center gap-2 rounded-lg border border-dashed border-m-dark-4 bg-m-dark-6/40 px-4 py-8 text-center"
        >
          <app-icon [name]="boxOpen" class="text-2xl text-m-dark-3" />
          <span class="font-display text-m-dark-1">No items yet</span>
          @if (characterId() != null) {
            <app-button color="green" variant="subtle" (clicked)="openAdd()">
              <app-icon [name]="plus" /><span class="ml-2">Add Item</span>
            </app-button>
          }
        </div>
      }
    </div>
  `,
  styles: [
    `
      .ds-inv-row {
        transition:
          border-color 0.15s ease,
          background-color 0.15s ease;
      }
      .ds-inv-row:hover {
        border-color: color-mix(in srgb, var(--color-ds-accent) 45%, var(--color-m-dark-4));
        background-color: var(--color-m-dark-5);
      }
      .ds-qty-chip {
        cursor: pointer;
        transition:
          background-color 0.15s ease,
          border-color 0.15s ease;
      }
      .ds-qty-chip:hover {
        background-color: color-mix(in srgb, var(--color-ds-accent) 22%, transparent);
        border-color: var(--color-ds-accent);
      }
      @media (prefers-reduced-motion: reduce) {
        .ds-inv-row,
        .ds-qty-chip {
          transition: none;
        }
      }
    `,
  ],
})
export class InventoryListComponent {
  private readonly api = inject(ApiService);
  private readonly store = inject(CampaignStore);
  readonly items = input<InventoryItem[]>([]);
  readonly characterId = input<number>();

  protected readonly plus = faPlus;
  protected readonly trash = faTrash;
  protected readonly boxOpen = faBoxOpen;

  readonly addOpen = signal(false);
  readonly newName = signal('');
  readonly newQuantity = signal<string | number>(1);

  openAdd(): void {
    this.newName.set('');
    this.newQuantity.set(1);
    this.addOpen.set(true);
  }

  private refresh(): void {
    const id = this.characterId();
    if (id != null) this.store.refetchCharacter(id);
  }

  async modifyQuantity(itemId: number, event: ValueModifierChangeEvent): Promise<void> {
    await this.api.modifyInventoryItemQuantity(itemId, event);
    this.refresh();
  }

  async add(): Promise<void> {
    const id = this.characterId();
    if (id == null) return;
    const quantity = parseIntOrUndefined(this.newQuantity()) ?? 0;
    if (quantity <= 0) return;
    await this.api.createInventoryItem(id, { name: this.newName(), quantity });
    this.addOpen.set(false);
    this.refresh();
  }

  async remove(itemId: number): Promise<void> {
    await this.api.deleteInventoryItem(itemId);
    this.refresh();
  }
}
