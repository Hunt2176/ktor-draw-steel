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
          @if (pictureUrl()) {
            <img
              class="ds-img clickable"
              [src]="pictureUrl()"
              (click)="portraitClick.emit()"
              (keydown.enter)="portraitClick.emit()"
              (keydown.space)="portraitClick.emit(); $event.preventDefault()"
              role="button"
              tabindex="0"
              [attr.aria-label]="'Open ' + character().name"
              [alt]="character().name"
            />
          } @else {
            <div
              class="ds-img ds-img-placeholder clickable"
              (click)="portraitClick.emit()"
              (keydown.enter)="portraitClick.emit()"
              (keydown.space)="portraitClick.emit(); $event.preventDefault()"
              role="button"
              tabindex="0"
              [attr.aria-label]="'Open ' + character().name"
            >
              <span class="ds-initials">{{ initials() }}</span>
            </div>
          }
          @if (full()) {
            <div class="ds-stats">
              <span class="ds-stat">
                <span class="ds-stat-key">M</span>
                <span class="ds-stat-val">{{ character().might }}</span>
              </span>
              <span class="ds-stat">
                <span class="ds-stat-key">A</span>
                <span class="ds-stat-val">{{ character().agility }}</span>
              </span>
              <span class="ds-stat">
                <span class="ds-stat-key">R</span>
                <span class="ds-stat-val">{{ character().reason }}</span>
              </span>
              <span class="ds-stat">
                <span class="ds-stat-key">I</span>
                <span class="ds-stat-val">{{ character().intuition }}</span>
              </span>
              <span class="ds-stat">
                <span class="ds-stat-key">P</span>
                <span class="ds-stat-val">{{ character().presence }}</span>
              </span>
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
        border: 1px solid var(--color-dark-4);
        transition:
          transform 0.15s ease,
          box-shadow 0.15s ease,
          border-color 0.15s ease;
      }
      .ds-card:hover {
        transform: translateY(-1px);
        border-color: var(--color-dark-3, #909296);
        box-shadow:
          0 8px 24px rgba(0, 0, 0, 0.45),
          0 2px 6px rgba(0, 0, 0, 0.3);
      }
      /* placeholder portrait — a designed avatar, not an empty box */
      .ds-img-placeholder {
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        background:
          radial-gradient(
            circle at 50% 38%,
            color-mix(in srgb, var(--color-brand-blue, #4dabf7) 14%, transparent),
            transparent 60%
          ),
          linear-gradient(
            155deg,
            var(--color-dark-5) 0%,
            var(--color-dark-7) 100%
          );
        border: 1px solid var(--color-dark-4);
        color: var(--color-dark-2, #909296);
      }
      /* faint monogram ring behind the initials */
      .ds-img-placeholder::before {
        content: '';
        position: absolute;
        width: 4.5rem;
        height: 4.5rem;
        max-width: 60%;
        max-height: 60%;
        aspect-ratio: 1;
        border-radius: 50%;
        border: 1px solid color-mix(in srgb, var(--color-dark-1, #a6a7ab) 22%, transparent);
        box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--color-dark-9, #000) 25%, transparent);
        pointer-events: none;
      }
      .ds-initials {
        position: relative;
        font-weight: 600;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        font-size: 1.5rem;
        line-height: 1;
        user-select: none;
        color: color-mix(in srgb, var(--color-brand-blue, #4dabf7) 30%, var(--color-dark-1, #a6a7ab));
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.45);
      }
      /* full variant */
      .ds-card-full {
        width: 15rem;
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
      .ds-card-full .ds-img-placeholder {
        aspect-ratio: 4 / 3;
        border: none;
        border-radius: 0;
      }
      .ds-card-full .ds-img-placeholder::before {
        width: 6rem;
        height: 6rem;
      }
      .ds-card-full .ds-initials {
        font-size: 2.5rem;
      }
      .ds-card-full .ds-stats {
        position: absolute;
        bottom: 0;
        width: 100%;
        display: flex;
        justify-content: space-between;
        align-items: stretch;
        gap: 0.2rem;
        padding: 0.3rem 0.35rem;
        background: linear-gradient(
          to top,
          rgba(0, 0, 0, 0.72) 0%,
          rgba(0, 0, 0, 0.5) 100%
        );
      }
      .ds-card-full .ds-stat {
        flex: 1 1 0;
        min-width: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.05rem;
        padding: 0.1rem 0.15rem;
        border-radius: 0.3rem;
        background: color-mix(in srgb, var(--color-dark-9, #000) 35%, transparent);
        border: 1px solid color-mix(in srgb, var(--color-dark-3, #909296) 22%, transparent);
        line-height: 1;
      }
      .ds-card-full .ds-stat-key {
        font-size: 0.6rem;
        font-weight: 600;
        letter-spacing: 0.05em;
        text-transform: uppercase;
        color: var(--color-dark-2, #909296);
      }
      .ds-card-full .ds-stat-val {
        font-size: 0.95rem;
        font-weight: 800;
        color: var(--color-dark-0, #fff);
        font-variant-numeric: tabular-nums;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
      }
      .ds-card-full .ds-name {
        text-align: center;
        font-weight: 700;
        font-size: 1.3rem;
        letter-spacing: -0.01em;
        line-height: 1.2;
        color: var(--color-dark-0);
        padding: 0.5rem 0.5rem 0.35rem;
        /* allow up to 2 lines, then ellipsis — keeps dense grids tidy */
        overflow-wrap: anywhere;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
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
      .ds-card-tile .ds-imgwrap {
        flex: 0 0 auto;
        /* top-align so the portrait never stretches to the (taller) body
           height and becomes a tall, thin vertical bar on narrow screens */
        align-self: flex-start;
      }
      .ds-card-tile .ds-img {
        width: 100px;
        height: 100px;
        object-fit: cover;
        object-position: top center;
        border-radius: 0.375rem;
      }
      .ds-card-tile .ds-img-placeholder {
        /* fixed square, never stretched to body height */
        width: 100px;
        height: 100px;
        aspect-ratio: 1;
        border-radius: 0.375rem;
      }
      .ds-card-tile .ds-body {
        display: flex;
        flex-direction: column;
        flex: 1 1 0;
        min-width: 0;
        padding-left: 0.75rem;
        gap: 0.25rem;
      }
      .ds-card-tile .ds-name {
        font-size: 1.3rem;
        font-weight: 700;
        letter-spacing: -0.01em;
        line-height: 1.2;
        color: var(--color-dark-0);
        /* single-line ellipsis keeps tiles tidy in dense grids */
        min-width: 0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .ds-card-tile .ds-rings {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.5rem;
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

  protected readonly pictureUrl = computed(() => {
    const url = this.character().pictureUrl;
    return url && url.trim() ? url : null;
  });
  protected readonly initials = computed(() => {
    const name = this.character().name ?? '';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  });

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
