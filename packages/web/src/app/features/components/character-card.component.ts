import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import type { Character } from '../../core/models';
import { getHp, getRecoveries } from '../../core/models';
import { ApiService } from '../../core/api.service';
import { CampaignStore } from '../../core/campaign-store.service';
import { ErrorService } from '../../core/error.service';
import { ToastService } from '../../core/toast.service';
import { parseIntOrUndefined } from '../../core/utils';
import { PALETTE, type AccentColor } from '../../ui/palette';
import { ButtonComponent } from '../../ui/button.component';
import { CardComponent } from '../../ui/card.component';
import { ModalComponent } from '../../ui/modal.component';
import { PopoverComponent } from '../../ui/popover.component';
import { RingProgressComponent, type RingSection } from '../../ui/ring-progress.component';
import { CharacterEditorComponent, type CharacterEditorResult } from './character-editor.component';

interface HpRing {
  sections: RingSection[];
  rootColor?: string;
  currentText: number;
  maxText: number;
  currentColor: string;
  baseColor: string;
  footer?: string;
}

const MINION_COLORS: AccentColor[] = ['red', 'orange', 'green', 'grape', 'teal'];

/**
 * Character tile/full card with HP and recovery rings. Faithful port of the
 * original `CharacterCard`, including the minion-chunk ring, over-max (yellow)
 * and below-zero (dying) ring states, and the HP/recovery modify popovers.
 *
 * Slot content is projected via `[cardLeft]`, `[cardRight]`, `[cardGauges]`,
 * `[cardBottom]`; the host exposes `openEditor()` (via `exportAs`) so slot
 * actions can open the editor.
 */
@Component({
  selector: 'app-character-card',
  standalone: true,
  exportAs: 'characterCard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgTemplateOutlet,
    ButtonComponent,
    CardComponent,
    ModalComponent,
    PopoverComponent,
    RingProgressComponent,
    CharacterEditorComponent,
  ],
  template: `
    <!-- shared ring markup -->
    <ng-template #hpRingTpl>
      <app-popover>
        <div popTarget>
          <div class="flex flex-col items-center px-2">
            <app-ring-progress [size]="100" [sections]="hp().sections" [rootColor]="hp().rootColor">
              <div class="text-center text-lg font-bold" style="text-shadow:0 0 2px rgba(0,0,0,0.3)">
                <span [style.color]="hp().currentColor">{{ hp().currentText }}</span>
                <span [style.color]="hp().baseColor"> / </span>
                <span [style.color]="hp().baseColor">{{ hp().maxText }}</span>
              </div>
            </app-ring-progress>
            @if (hp().footer) {
              <span class="text-sm font-bold" [style.color]="hp().baseColor">{{ hp().footer }}</span>
            }
          </div>
        </div>
        <div popDropdown>
          <div class="flex flex-col gap-2">
            <label class="ds-label">Modify HP</label>
            <input class="ds-input" type="number" min="0" [value]="modHp()" (input)="modHp.set($any($event.target).value)" />
            <div class="flex">
              <app-button class="flex-1" color="red" fullWidth [loading]="hpPending()" (clicked)="damage('DAMAGE')">Damage</app-button>
              <app-button class="flex-1" color="green" fullWidth [loading]="hpPending()" (clicked)="damage('HEAL')">Heal</app-button>
            </div>
            <hr class="ds-divider" />
            <label class="ds-label">Temporary HP</label>
            <input class="ds-input" type="number" min="0" [value]="tempHp()" (input)="tempHp.set($any($event.target).value)" />
            <app-button fullWidth [loading]="hpPending()" (clicked)="saveTempHp()">Submit</app-button>
          </div>
        </div>
      </app-popover>
    </ng-template>

    <ng-template #recRingTpl>
      <app-popover>
        <div popTarget>
          <app-ring-progress [size]="100" [sections]="recoverySections()">
            <span class="text-center text-lg font-bold text-m-blue-light" style="text-shadow:0 0 2px rgba(0,0,0,0.3)">
              {{ recoveries().current }}/{{ recoveries().max }}
            </span>
          </app-ring-progress>
        </div>
        <div popDropdown>
          <div class="flex flex-col gap-2">
            <label class="ds-label">Modify Recoveries</label>
            <input class="ds-input" type="number" min="0" [value]="modRec()" (input)="modRec.set($any($event.target).value)" />
            <div class="flex">
              <app-button class="flex-1" color="green" fullWidth [loading]="recPending()" (clicked)="modifyRec('INCREASE')">Increase</app-button>
              <app-button class="flex-1" color="red" fullWidth [loading]="recPending()" (clicked)="modifyRec('DECREASE')">Decrease</app-button>
            </div>
            <hr class="ds-divider" />
            <label class="ds-label">Temporary Recoveries</label>
            <input class="ds-input" type="number" min="0" [value]="tempRec()" (input)="tempRec.set($any($event.target).value)" />
            <app-button fullWidth [loading]="recPending()" (clicked)="saveTempRec()">Submit</app-button>
          </div>
        </div>
      </app-popover>
    </ng-template>

    <!-- Single card host so each projection selector appears exactly once
         (duplicating an ng-content select across @if branches drops it). -->
    <app-card [class]="type() === 'full' ? 'block w-60' : 'block'">
      @if (type() === 'full') {
        <div class="relative -m-4 mb-0 border-b border-m-dark-4">
          @if (character().pictureUrl) {
            <img
              class="w-full cursor-pointer object-cover"
              style="object-position: top center"
              [src]="character().pictureUrl"
              role="button"
              tabindex="0"
              [attr.aria-label]="'View ' + character().name"
              alt=""
              (click)="portraitClick.emit()"
              (keydown.enter)="portraitClick.emit()"
              (keydown.space)="portraitClick.emit()"
            />
            <div class="absolute bottom-0 flex w-full justify-around bg-black/30 px-1 text-sm font-semibold">
              <span>M {{ character().might }}</span>
              <span>A {{ character().agility }}</span>
              <span>R {{ character().reason }}</span>
              <span>I {{ character().intuition }}</span>
              <span>P {{ character().presence }}</span>
            </div>
          } @else {
            <div class="flex w-full justify-around py-1 text-sm font-semibold">
              <span>M {{ character().might }}</span>
              <span>A {{ character().agility }}</span>
              <span>R {{ character().reason }}</span>
              <span>I {{ character().intuition }}</span>
              <span>P {{ character().presence }}</span>
            </div>
          }
        </div>
        <p class="mt-2 text-center text-xl font-bold">{{ character().name }}</p>
        <div class="-mx-4 flex justify-around">
          <ng-container [ngTemplateOutlet]="hpRingTpl" />
          <ng-container [ngTemplateOutlet]="recRingTpl" />
        </div>
      } @else {
        <div class="flex items-stretch gap-0">
          <ng-content select="[cardLeft]" />
          @if (character().pictureUrl) {
            <img
              class="h-auto w-[100px] flex-none cursor-pointer object-cover"
              style="object-position: top center"
              [src]="character().pictureUrl"
              role="button"
              tabindex="0"
              [attr.aria-label]="'View ' + character().name"
              alt=""
              (click)="portraitClick.emit()"
              (keydown.enter)="portraitClick.emit()"
              (keydown.space)="portraitClick.emit()"
            />
          }
          <div class="flex flex-[5] flex-col">
            <span class="pl-2 text-xl font-bold">{{ character().name }}</span>
            <div class="flex">
              <ng-container [ngTemplateOutlet]="hpRingTpl" />
              <ng-container [ngTemplateOutlet]="recRingTpl" />
            </div>
            <div class="flex w-full"><ng-content select="[cardGauges]" /></div>
          </div>
          <ng-content select="[cardRight]" />
        </div>
      }
      <ng-content select="[cardBottom]" />
    </app-card>

    <app-modal [opened]="editorOpen()" [level]="editorLevel()" (closed)="editorOpen.set(false)">
      @if (editorOpen()) {
        <app-character-editor [character]="character()" (submitted)="save($event)" />
      }
    </app-modal>
  `,
})
export class CharacterCardComponent {
  private readonly api = inject(ApiService);
  private readonly store = inject(CampaignStore);
  private readonly errors = inject(ErrorService);
  private readonly toasts = inject(ToastService);

  readonly character = input.required<Character>();
  readonly type = input<'full' | 'tile'>('full');
  readonly editorLevel = input(0);
  readonly portraitClick = output<void>();

  readonly editorOpen = signal(false);
  readonly modHp = signal('');
  readonly tempHp = signal('');
  readonly modRec = signal('');
  readonly tempRec = signal('');

  /** In-flight flags for the HP and recovery popover actions, driving button
   * spinners so rapid double-taps can't fire overlapping requests. */
  readonly hpPending = signal(false);
  readonly recPending = signal(false);

  readonly hpData = computed(() => getHp(this.character()));
  readonly recoveries = computed(() => getRecoveries(this.character()));

  readonly recoverySections = computed<RingSection[]>(() => {
    const r = this.recoveries();
    const pct = Number.isFinite(r.percent) ? r.percent : 0;
    return [{ value: pct * 100, color: 'blue' }];
  });

  readonly hp = computed<HpRing>(() => {
    const c = this.character();
    const hp = this.hpData();
    const baseColor = hp.percent > 0.5 ? 'green' : hp.percent > 0.25 ? 'orange' : 'red';
    let rootColor: string | undefined;
    let sections: RingSection[] = [{ value: hp.percent * 100, color: baseColor }];
    let currentText = hp.current;
    let maxText = hp.max;
    let currentColor = baseColor;

    if (hp.current > hp.max) {
      rootColor = 'green';
      const offset = hp.current - hp.max;
      currentColor = 'yellow';
      sections = [{ value: (offset / hp.max) * 100, color: 'yellow' }];
    } else if (hp.current <= 0) {
      rootColor = 'red';
      if (hp.current < 0) {
        const newMax = hp.max / 2;
        maxText = -newMax;
        sections = [{ value: (Math.abs(hp.current) / newMax) * 100, color: 'dark' }];
      }
    }

    let footer: string | undefined;
    if (c.minions > 0) {
      rootColor = 'dark';
      sections = [];
      const num = c.minions;
      const chunk = hp.max / num;
      if (chunk > 0) {
        const effectiveCurrent = Math.max(0, Math.min(hp.current, hp.max));
        for (let i = 0; i < num; i++) {
          const start = i * chunk;
          const filledInChunk = Math.max(0, Math.min(effectiveCurrent - start, chunk));
          const value = (filledInChunk / chunk) * (100 / num);
          if (value > 0) {
            sections.push({ value, color: MINION_COLORS[i % MINION_COLORS.length] });
          }
        }
        const remainingMinions = Math.min(num, Math.ceil(effectiveCurrent / chunk));
        footer = `${remainingMinions} Minion${remainingMinions === 1 ? '' : 's'}`;
      }
    }

    return {
      sections,
      rootColor,
      currentText,
      maxText,
      currentColor: PALETTE[currentColor as AccentColor]?.base ?? currentColor,
      baseColor: PALETTE[baseColor as AccentColor]?.base ?? baseColor,
      footer,
    };
  });

  openEditor(): void {
    this.editorOpen.set(true);
  }

  private apply(updated: Character): void {
    this.store.setCharacter(updated.id, updated);
  }

  async save(result: CharacterEditorResult): Promise<void> {
    try {
      const updated = await this.api.saveCharacter(this.character().id, result);
      this.apply(updated);
      this.editorOpen.set(false);
      this.toasts.success(`${updated.name} saved`);
    } catch (err) {
      this.errors.set(err);
    }
  }

  async damage(type: 'HEAL' | 'DAMAGE'): Promise<void> {
    const mod = parseIntOrUndefined(this.modHp());
    if (mod == null) return;
    this.hpPending.set(true);
    try {
      const updated = await this.api.modifyCharacterHp(this.character().id, { mod, type });
      this.apply(updated);
      this.modHp.set('');
    } finally {
      this.hpPending.set(false);
    }
  }

  async saveTempHp(): Promise<void> {
    const value = parseIntOrUndefined(this.tempHp());
    if (value == null || value < 0) return;
    this.hpPending.set(true);
    try {
      const updated = await this.api.saveCharacter(this.character().id, { temporaryHp: value });
      this.apply(updated);
    } finally {
      this.hpPending.set(false);
    }
  }

  async modifyRec(type: 'INCREASE' | 'DECREASE'): Promise<void> {
    const mod = parseIntOrUndefined(this.modRec());
    if (mod == null) return;
    this.recPending.set(true);
    try {
      const updated = await this.api.modifyCharacterRecovery(this.character().id, { mod, type });
      this.apply(updated);
      this.modRec.set('');
    } finally {
      this.recPending.set(false);
    }
  }

  async saveTempRec(): Promise<void> {
    const value = parseIntOrUndefined(this.tempRec());
    if (value == null || value < 0) return;
    this.recPending.set(true);
    try {
      const updated = await this.api.saveCharacter(this.character().id, {
        temporaryRecoveries: value,
      });
      this.apply(updated);
    } finally {
      this.recPending.set(false);
    }
  }
}
