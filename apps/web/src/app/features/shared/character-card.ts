import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { ApiService } from '../../core/api.service';
import { ErrorService } from '../../core/error.service';
import { RingProgress, type RingSection } from '../../ui/ring-progress';
import { Popover } from '../../ui/popover';
import { NumberInput } from '../../ui/inputs';
import { Button } from '../../ui/button';
import { Modal } from '../../ui/modal';
import {
  CharacterEditor,
  type CharacterEditorResult,
} from './character-editor';
import { getHp, getRecoveries, type Character } from '@draw-steel/shared';

interface HpRing {
  sections: RingSection[];
  rootColor: string | undefined;
  currentText: number;
  maxText: number;
  currentColor: string;
  labelColor: string;
  footer: string | null;
}

const MINION_COLORS = ['red', 'orange', 'green', 'grape', 'teal'];

/**
 * Character card (Mantine parity). A single unified template is used for both
 * the `full` and `tile` variants — each content slot is projected exactly once
 * (duplicating `<ng-content select>` across `@if` branches misroutes content).
 */
@Component({
  selector: 'ds-character-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet, RingProgress, Popover, NumberInput, Button, Modal, CharacterEditor],
  template: `
    <ds-modal [opened]="editorOpened()" (closed)="editorOpened.set(false)">
      <ds-character-editor [character]="character()" (submitted)="save($event)" />
    </ds-modal>

    <div
      class="glass shadow ds-card"
      [class.ds-card-full]="full()"
      [class.ds-card-tile]="!full()"
    >
      <div class="ds-main">
        <div class="ds-left"><ng-content select="[cardLeft]" /></div>
        <div class="ds-imgwrap">
          <img
            class="ds-img clickable"
            [src]="character().pictureUrl ?? ''"
            (click)="portraitClick.emit()"
            alt=""
          />
          @if (full()) {
            <div class="ds-stats">
              <span>M {{ character().might }}</span>
              <span>A {{ character().agility }}</span>
              <span>R {{ character().reason }}</span>
              <span>I {{ character().intuition }}</span>
              <span>P {{ character().presence }}</span>
            </div>
          }
        </div>
        <div class="ds-body">
          <div class="ds-name">{{ character().name }}</div>
          <div class="ds-rings">
            <ng-container [ngTemplateOutlet]="hpBar" />
            <ng-container [ngTemplateOutlet]="recoveriesBar" />
            <div class="ds-gauges"><ng-content select="[cardGauges]" /></div>
          </div>
        </div>
        <div class="ds-right"><ng-content select="[cardRight]" /></div>
      </div>
      <div class="ds-bottom"><ng-content select="[cardBottom]" /></div>
    </div>

    <ng-template #hpBar>
      <div class="px-2 flex flex-col items-center">
        <ds-popover>
          <div dsTrigger class="flex flex-col items-center clickable">
            <ds-ring-progress
              [sections]="hp().sections"
              [rootColor]="hp().rootColor"
              [size]="100"
            >
              <div class="text-center font-bold text-lg drop-shadow">
                <span [style.color]="colorHex(hp().currentColor)">{{ hp().currentText }}</span>
                <span [style.color]="colorHex(hp().labelColor)"> / </span>
                <span [style.color]="colorHex(hp().labelColor)">{{ hp().maxText }}</span>
              </div>
            </ds-ring-progress>
            @if (hp().footer) {
              <div class="text-center font-bold text-sm" [style.color]="colorHex(hp().labelColor)">
                {{ hp().footer }}
              </div>
            }
          </div>
          <div dsDropdown>
            <div class="flex flex-col gap-3">
              <ds-number-input label="Modify HP" [min]="0" [(value)]="modHp" />
              <div class="flex">
                <ds-button color="red" fullWidth class="flex-1" (click)="damage()">Damage</ds-button>
                <ds-button color="green" fullWidth class="flex-1" (click)="heal()">Heal</ds-button>
              </div>
              <hr class="border-[color:var(--color-dark-5)]" />
              <ds-number-input label="Temporary HP" [min]="0" [(value)]="tempHp" />
              <ds-button fullWidth [disabled]="tempHpInvalid()" (click)="saveTempHp()">Submit</ds-button>
            </div>
          </div>
        </ds-popover>
      </div>
    </ng-template>

    <ng-template #recoveriesBar>
      <ds-popover>
        <div dsTrigger class="clickable">
          <ds-ring-progress
            [sections]="[{ value: recoveries().percent * 100, color: 'blue' }]"
            [size]="100"
          >
            <div class="text-center font-bold text-lg text-[#4dabf7] drop-shadow">
              {{ recoveries().current }}/{{ recoveries().max }}
            </div>
          </ds-ring-progress>
        </div>
        <div dsDropdown>
          <div class="flex flex-col gap-3">
            <ds-number-input label="Modify Recoveries" [min]="0" [(value)]="modRecoveries" />
            <div class="flex">
              <ds-button color="green" fullWidth class="flex-1" (click)="recoveryMod('INCREASE')">Increase</ds-button>
              <ds-button color="red" fullWidth class="flex-1" (click)="recoveryMod('DECREASE')">Decrease</ds-button>
            </div>
            <hr class="border-[color:var(--color-dark-5)]" />
            <ds-number-input label="Temporary Recoveries" [min]="0" [(value)]="tempRecoveries" />
            <ds-button fullWidth [disabled]="tempRecInvalid()" (click)="saveTempRecoveries()">Submit</ds-button>
          </div>
        </div>
      </ds-popover>
    </ng-template>
  `,
  styles: [
    `
      .ds-card {
        border-radius: 0.6rem;
      }
      /* full variant */
      .ds-card-full {
        width: 15rem;
        border: 1px solid var(--color-dark-4);
        overflow: hidden;
      }
      .ds-card-full .ds-main {
        display: flex;
        flex-direction: column;
      }
      .ds-card-full .ds-left,
      .ds-card-full .ds-right {
        display: none;
      }
      .ds-card-full .ds-imgwrap {
        position: relative;
        border-bottom: 1px solid var(--color-dark-4);
      }
      .ds-card-full .ds-img {
        width: 100%;
        object-fit: cover;
        object-position: top center;
      }
      .ds-card-full .ds-stats {
        position: absolute;
        bottom: 0;
        width: 100%;
        display: flex;
        justify-content: space-around;
        font-weight: 600;
        padding: 0.1rem 0.25rem;
        background: rgba(0, 0, 0, 0.4);
      }
      .ds-card-full .ds-name {
        text-align: center;
        font-weight: 700;
        font-size: 1.25rem;
        padding: 0.25rem;
      }
      .ds-card-full .ds-rings {
        display: flex;
        justify-content: space-around;
        align-items: center;
        padding-bottom: 0.5rem;
      }
      .ds-card-full .ds-bottom:not(:empty) {
        border-top: 1px solid var(--color-dark-4);
        padding: 0.5rem 0.75rem 0.75rem;
      }
      /* tile variant */
      .ds-card-tile {
        padding: 0.75rem;
      }
      .ds-card-tile .ds-main {
        display: flex;
        flex-direction: row;
        align-items: stretch;
        flex-wrap: nowrap;
        gap: 0;
      }
      .ds-card-tile .ds-img {
        width: 100px;
        object-fit: cover;
        object-position: top center;
        border-radius: 0.375rem;
      }
      .ds-card-tile .ds-body {
        display: flex;
        flex-direction: column;
        flex: 5;
        min-width: 0;
      }
      .ds-card-tile .ds-name {
        font-size: 1.25rem;
        font-weight: 700;
        padding-left: 0.5rem;
      }
      .ds-card-tile .ds-rings {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
      }
      .ds-card-tile .ds-gauges {
        display: flex;
        width: 100%;
      }
      .ds-card-tile .ds-right {
        flex-shrink: 1;
      }
      .ds-gauges:empty {
        display: none;
      }
    `,
  ],
})
export class CharacterCard {
  private readonly api = inject(ApiService);
  private readonly errors = inject(ErrorService);

  readonly character = input.required<Character>();
  readonly type = input<'full' | 'tile'>('full');
  readonly portraitClick = output<void>();

  protected readonly full = computed(() => this.type() === 'full');
  protected readonly editorOpened = signal(false);

  protected readonly modHp = signal<number | null>(null);
  protected readonly tempHp = signal<number | null>(null);
  protected readonly modRecoveries = signal<number | null>(null);
  protected readonly tempRecoveries = signal<number | null>(null);

  protected readonly recoveries = computed(() => getRecoveries(this.character()));
  protected readonly hp = computed<HpRing>(() => this.computeHp());

  protected readonly tempHpInvalid = computed(() => {
    const t = this.tempHp();
    return t == null || t === this.character().temporaryHp || t < 0;
  });
  protected readonly tempRecInvalid = computed(() => {
    const t = this.tempRecoveries();
    return t == null || t === this.character().temporaryRecoveries || t < 0;
  });

  constructor() {
    effect(() => {
      const c = this.character();
      this.tempHp.set(c.temporaryHp === 0 ? null : c.temporaryHp);
      this.tempRecoveries.set(
        c.temporaryRecoveries === 0 ? null : c.temporaryRecoveries,
      );
    });
  }

  /** Public — slot content (e.g. an edit button) calls this via a template ref. */
  openEditor(): void {
    this.editorOpened.set(true);
  }

  protected colorHex(name: string): string {
    const map: Record<string, string> = {
      green: '#40c057',
      orange: '#fd7e14',
      red: '#fa5252',
      yellow: '#fcc419',
      dark: '#c1c2c5',
    };
    return map[name] ?? name;
  }

  private computeHp(): HpRing {
    const char = this.character();
    const hp = getHp(char);
    const overColor = 'yellow';
    const underColor = 'dark';

    const color =
      hp.percent > 0.5 ? 'green' : hp.percent > 0.25 ? 'orange' : 'red';

    let footer: string | null = null;
    let rootColor: string | undefined = undefined;
    let sections: RingSection[] = [{ value: hp.percent * 100, color }];
    let currentText = hp.current;
    let maxText = hp.max;
    let currentColor = color;

    if (hp.current > hp.max) {
      rootColor = 'green';
      const offset = hp.current - hp.max;
      currentColor = overColor;
      sections = [{ value: (offset / hp.max) * 100, color: overColor }];
    } else if (hp.current <= 0) {
      rootColor = 'red';
      if (hp.current < 0) {
        const newMax = hp.max / 2;
        maxText = -newMax;
        sections = [
          { value: (Math.abs(hp.current) / newMax) * 100, color: underColor },
        ];
      }
    }

    if (char.minions > 0) {
      rootColor = underColor;
      sections = [];
      const num = char.minions;
      const chunk = hp.max / num;
      if (chunk > 0) {
        const effectiveCurrent = Math.max(0, Math.min(hp.current, hp.max));
        for (let i = 0; i < num; i++) {
          const start = i * chunk;
          const filledInChunk = Math.max(
            0,
            Math.min(effectiveCurrent - start, chunk),
          );
          const value = (filledInChunk / chunk) * (100 / num);
          if (value > 0) {
            sections.push({ value, color: MINION_COLORS[i % MINION_COLORS.length] });
          }
        }
        const remainingMinions = Math.min(
          num,
          Math.ceil(effectiveCurrent / chunk),
        );
        footer = `${remainingMinions} Minion${remainingMinions === 1 ? '' : 's'}`;
      }
    }

    return {
      sections,
      rootColor,
      currentText,
      maxText,
      currentColor,
      labelColor: color,
      footer,
    };
  }

  protected async damage(): Promise<void> {
    const mod = this.modHp();
    if (mod == null || Number.isNaN(mod)) return;
    await this.api.modifyCharacterHp(this.character().id, { mod, type: 'DAMAGE' });
  }
  protected async heal(): Promise<void> {
    const mod = this.modHp();
    if (mod == null || Number.isNaN(mod)) return;
    await this.api.modifyCharacterHp(this.character().id, { mod, type: 'HEAL' });
  }
  protected async recoveryMod(type: 'INCREASE' | 'DECREASE'): Promise<void> {
    const mod = this.modRecoveries();
    if (mod == null || Number.isNaN(mod)) return;
    await this.api.modifyCharacterRecovery(this.character().id, { mod, type });
  }
  protected async saveTempHp(): Promise<void> {
    const toSet = this.tempHp();
    if (toSet == null || toSet === this.character().temporaryHp || toSet < 0) return;
    await this.api.saveCharacter(this.character().id, { temporaryHp: toSet });
  }
  protected async saveTempRecoveries(): Promise<void> {
    const toSet = this.tempRecoveries();
    if (
      toSet == null ||
      toSet === this.character().temporaryRecoveries ||
      toSet < 0
    )
      return;
    await this.api.saveCharacter(this.character().id, {
      temporaryRecoveries: toSet,
    });
  }

  protected async save(result: CharacterEditorResult): Promise<void> {
    try {
      await this.api.saveCharacter(this.character().id, result);
      this.editorOpened.set(false);
    } catch (e) {
      this.errors.show(e);
    }
  }
}
