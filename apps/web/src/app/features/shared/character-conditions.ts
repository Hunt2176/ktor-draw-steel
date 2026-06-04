import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  signal,
} from '@angular/core';
import { ApiService } from '../../core/api.service';
import { Modal } from '../../ui/modal';
import { IconButton } from '../../ui/icon-button';
import { Icon } from '../../ui/icon';
import { Button } from '../../ui/button';
import type { Character, CharacterCondition } from '@draw-steel/shared';

const CONDITION_OPTIONS = [
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

@Component({
  selector: 'ds-character-conditions',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Modal, IconButton, Icon, Button],
  template: `
    @if (mode() === 'button' || mode() === 'all') {
      <ds-icon-btn (click)="showAdd.set(true)"><ds-icon name="plus" /></ds-icon-btn>
    }
    @if (mode() === 'list' || mode() === 'all') {
      <div class="flex flex-wrap gap-1.5">
        @for (c of character().conditions; track c.id) {
          <span class="ds-pill">
            {{ c.name }}
            <button type="button" (click)="toDelete.set(c)">&times;</button>
          </span>
        }
      </div>
    }

    <ds-modal [opened]="showAdd()" title="Add Condition" (closed)="showAdd.set(false)">
      <form (submit)="submit($event)" class="flex flex-col gap-3">
        <label class="ds-field">
          <span class="ds-label">Name</span>
          <input
            class="ds-input"
            list="ds-condition-options"
            [value]="name()"
            (input)="name.set($any($event.target).value)"
            autofocus
          />
          <datalist id="ds-condition-options">
            @for (opt of options; track opt) {
              <option [value]="opt"></option>
            }
          </datalist>
        </label>
        <div class="ds-field">
          <span class="ds-label">End Type</span>
          <label class="flex items-center gap-2">
            <input
              type="radio"
              name="endType"
              value="save"
              [checked]="endType() === 'save'"
              (change)="endType.set('save')"
            />
            Save
          </label>
          <label class="flex items-center gap-2">
            <input
              type="radio"
              name="endType"
              value="endOfTurn"
              [checked]="endType() === 'endOfTurn'"
              (change)="endType.set('endOfTurn')"
            />
            End of Turn
          </label>
        </div>
        <ds-button type="submit" [disabled]="!name()">Submit</ds-button>
      </form>
    </ds-modal>

    <ds-modal
      [opened]="toDelete() != null"
      title="Remove Condition"
      (closed)="toDelete.set(null)"
    >
      <div>
        Are you sure you want to remove {{ toDelete()?.name }} from
        {{ character().name }}?
      </div>
      <div class="flex justify-end gap-2 mt-4">
        <ds-button color="gray" (click)="toDelete.set(null)">Cancel</ds-button>
        <ds-button color="red" (click)="remove()">Remove</ds-button>
      </div>
    </ds-modal>
  `,
})
export class CharacterConditions {
  private readonly api = inject(ApiService);

  readonly character = input.required<Character>();
  readonly mode = input<'button' | 'list' | 'all'>('all');

  protected readonly options = CONDITION_OPTIONS;
  protected readonly showAdd = signal(false);
  protected readonly name = signal('');
  protected readonly endType = signal<'save' | 'endOfTurn'>('save');
  protected readonly toDelete = signal<CharacterCondition | null>(null);

  protected async submit(event: Event): Promise<void> {
    event.preventDefault();
    if (!this.name()) return;
    await this.api.addCharacterCondition({
      name: this.name(),
      character: this.character().id,
      endType: this.endType(),
    });
    this.showAdd.set(false);
    this.name.set('');
    this.endType.set('save');
  }

  protected async remove(): Promise<void> {
    const c = this.toDelete();
    if (!c) return;
    await this.api.deleteCharacterCondition(c.id);
    this.toDelete.set(null);
  }
}
