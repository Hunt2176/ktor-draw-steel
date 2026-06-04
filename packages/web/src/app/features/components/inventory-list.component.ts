import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';
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

      <table class="w-full">
        <thead>
          <tr class="text-left text-m-dark-1">
            <th class="py-1">Item</th>
            <th class="py-1">Quantity</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          @for (item of items(); track item.id) {
            <tr>
              <td class="py-1">{{ item.name }}</td>
              <td class="py-1">
                <app-popover>
                  <span popTarget class="cursor-pointer underline-offset-2 hover:underline">{{ item.quantity }}</span>
                  <div popDropdown>
                    <app-value-modifier label="Modify Quantity" (changed)="modifyQuantity(item.id, $event)" />
                  </div>
                </app-popover>
              </td>
              <td class="py-1 text-right">
                <app-confirmation-popover
                  [title]="'Remove ' + item.name"
                  message="Are you sure?"
                  (accepted)="remove(item.id)"
                >
                  <app-action-icon color="red"><app-icon [name]="trash" /></app-action-icon>
                </app-confirmation-popover>
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
})
export class InventoryListComponent {
  private readonly api = inject(ApiService);
  private readonly store = inject(CampaignStore);
  readonly items = input<InventoryItem[]>([]);
  readonly characterId = input<number>();

  protected readonly plus = faPlus;
  protected readonly trash = faTrash;

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
