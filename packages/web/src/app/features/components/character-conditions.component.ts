import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import type { Character, CharacterCondition } from '../../core/models';
import { ApiService } from '../../core/api.service';
import { CampaignStore } from '../../core/campaign-store.service';
import { ActionIconComponent } from '../../ui/action-icon.component';
import { ButtonComponent } from '../../ui/button.component';
import { IconComponent } from '../../ui/icon.component';
import { ModalComponent } from '../../ui/modal.component';

type Mode = 'button' | 'list' | 'all';

/** Add/remove conditions on a character (Mantine CharacterConditions). */
@Component({
  selector: 'app-character-conditions',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ActionIconComponent, ButtonComponent, IconComponent, ModalComponent],
  template: `
    @if (mode() === 'button' || mode() === 'all') {
      <app-action-icon (clicked)="addOpen.set(true)"><app-icon [name]="plus" /></app-action-icon>
    }
    @if (mode() === 'list' || mode() === 'all') {
      <div class="flex flex-wrap gap-1">
        @for (c of character().conditions; track c.id) {
          <span
            class="inline-flex items-center gap-1 rounded-full bg-m-dark-5 px-2 py-0.5 text-sm text-m-blue-light"
          >
            {{ c.name }}
            <button class="text-m-dark-1 hover:text-m-red" (click)="confirmRemove(c)">×</button>
          </span>
        }
      </div>
    }

    <app-modal title="Add Condition" [opened]="addOpen()" (closed)="addOpen.set(false)">
      <form class="flex flex-col gap-3" (submit)="submit($event)">
        <div>
          <label class="ds-label">Name</label>
          <input class="ds-input" list="condition-options" [value]="name()" (input)="name.set($any($event.target).value)" />
          <datalist id="condition-options">
            @for (opt of options; track opt) {
              <option [value]="opt"></option>
            }
          </datalist>
        </div>
        <div>
          <label class="ds-label">End Type</label>
          <label class="mt-1 flex items-center gap-2">
            <input type="radio" name="endType" value="save" [checked]="endType() === 'save'" (change)="endType.set('save')" />
            Save
          </label>
          <label class="mt-1 flex items-center gap-2">
            <input type="radio" name="endType" value="endOfTurn" [checked]="endType() === 'endOfTurn'" (change)="endType.set('endOfTurn')" />
            End of Turn
          </label>
        </div>
        <app-button [disabled]="!name()" (clicked)="submit($event)">Submit</app-button>
      </form>
    </app-modal>

    <app-modal title="Remove Condition" [opened]="toRemove() != null" (closed)="toRemove.set(null)">
      <p>Are you sure you want to remove {{ toRemove()?.name }} from {{ character().name }}?</p>
      <hr class="ds-divider" />
      <div class="flex justify-end gap-2">
        <app-button color="gray" (clicked)="toRemove.set(null)">Cancel</app-button>
        <app-button color="red" (clicked)="remove()">Remove</app-button>
      </div>
    </app-modal>
  `,
})
export class CharacterConditionsComponent {
  private readonly api = inject(ApiService);
  private readonly store = inject(CampaignStore);
  readonly character = input.required<Character>();
  readonly mode = input<Mode>('all');

  protected readonly plus = faPlus;
  protected readonly options = [
    'Bleeding',
    'Dazed',
    'Frightened',
    'Grabbed',
    'Prone',
    'Restrained',
    'Slowed',
    'Taunted',
    'Weakened',
  ];

  readonly addOpen = signal(false);
  readonly name = signal('');
  readonly endType = signal<'save' | 'endOfTurn'>('save');
  readonly toRemove = signal<CharacterCondition | null>(null);

  async submit(event: Event): Promise<void> {
    event.preventDefault();
    if (!this.name()) return;
    await this.api.addCharacterCondition({
      name: this.name(),
      character: this.character().id,
      endType: this.endType(),
    });
    this.store.refetchCharacter(this.character().id);
    this.addOpen.set(false);
    this.name.set('');
    this.endType.set('save');
  }

  confirmRemove(condition: CharacterCondition): void {
    this.toRemove.set(condition);
  }

  async remove(): Promise<void> {
    const condition = this.toRemove();
    if (!condition) return;
    await this.api.deleteCharacterCondition(condition.id);
    this.store.refetchCharacter(this.character().id);
    this.toRemove.set(null);
  }
}
