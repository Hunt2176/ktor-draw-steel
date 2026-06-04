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
      <ds-icon-btn ariaLabel="Add condition" (click)="showAdd.set(true)"><ds-icon name="plus" /></ds-icon-btn>
    }
    @if (mode() === 'list' || mode() === 'all') {
      <div class="flex flex-wrap gap-1.5">
        @for (c of character().conditions; track c.id) {
          <span
            class="ds-pill cond"
            [class.cond--save]="c.endType === 'save'"
            [class.cond--eot]="c.endType === 'endOfTurn'"
          >
            <span class="cond__dot" aria-hidden="true"></span>
            {{ c.name }}
            <span class="cond__tag" aria-hidden="true">{{
              c.endType === 'save' ? 'SAVE' : 'EoT'
            }}</span>
            <button
              type="button"
              class="cond__x"
              [attr.aria-label]="'Remove ' + c.name"
              (click)="toDelete.set(c)"
            >
              &times;
            </button>
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
          <span class="ds-label" id="ds-endtype-label">End Type</span>
          <div class="seg" role="group" aria-labelledby="ds-endtype-label">
            <button
              type="button"
              class="seg__btn"
              [class.seg__btn--active]="endType() === 'save'"
              [attr.aria-pressed]="endType() === 'save'"
              (click)="endType.set('save')"
            >
              Save
            </button>
            <button
              type="button"
              class="seg__btn"
              [class.seg__btn--active]="endType() === 'endOfTurn'"
              [attr.aria-pressed]="endType() === 'endOfTurn'"
              (click)="endType.set('endOfTurn')"
            >
              End of Turn
            </button>
          </div>
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
  styles: [
    `
      /* ML2 — condition pills color-coded by endType */
      .cond {
        position: relative;
        border: 1px solid transparent;
        padding-inline: 0.55rem;
      }
      .cond__dot {
        width: 0.5rem;
        height: 0.5rem;
        border-radius: 999px;
        flex: 0 0 auto;
      }
      .cond__tag {
        font-size: 0.6rem;
        font-weight: 700;
        letter-spacing: 0.04em;
        line-height: 1;
        padding: 0.1rem 0.3rem;
        border-radius: 999px;
        background: color-mix(in srgb, var(--color-dark-9) 45%, transparent);
        color: var(--color-dark-0);
      }

      /* Save: green accent */
      .cond--save {
        background: color-mix(in srgb, var(--color-brand-green) 20%, transparent);
        border-color: color-mix(in srgb, var(--color-brand-green) 55%, transparent);
      }
      .cond--save .cond__dot {
        background: var(--color-brand-green);
      }

      /* End of Turn: orange/yellow accent */
      .cond--eot {
        background: color-mix(in srgb, var(--color-brand-orange, #f08c00) 20%, transparent);
        border-color: color-mix(in srgb, var(--color-brand-orange, #f08c00) 55%, transparent);
      }
      .cond--eot .cond__dot {
        background: var(--color-brand-orange, #f08c00);
      }

      /* S2 — larger, clearer remove hit target */
      .cond__x {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 20px;
        min-height: 20px;
        margin-left: 0.1rem;
        border-radius: 999px;
        background: transparent;
        border: none;
        color: inherit;
        cursor: pointer;
        font-size: 1.05rem;
        line-height: 1;
        transition: background 0.12s ease, color 0.12s ease;
      }
      .cond__x:hover,
      .cond__x:focus-visible {
        background: color-mix(in srgb, var(--color-brand-red) 70%, transparent);
        color: #fff;
        outline: none;
      }

      /* ML3 — segmented control for End Type */
      .seg {
        display: inline-flex;
        gap: 0.25rem;
        padding: 0.2rem;
        border-radius: 999px;
        background: var(--color-dark-7);
        border: 1px solid var(--color-dark-4);
        width: fit-content;
      }
      .seg__btn {
        appearance: none;
        border: none;
        cursor: pointer;
        padding: 0.3rem 0.85rem;
        border-radius: 999px;
        font-size: 0.8rem;
        font-weight: 600;
        color: var(--color-dark-1);
        background: transparent;
        transition: background 0.12s ease, color 0.12s ease;
      }
      .seg__btn:hover {
        color: var(--color-dark-0);
      }
      .seg__btn--active {
        background: var(--color-brand-blue);
        color: #fff;
      }
      .seg__btn:focus-visible {
        outline: 2px solid var(--color-brand-blue);
        outline-offset: 2px;
      }
    `,
  ],
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
