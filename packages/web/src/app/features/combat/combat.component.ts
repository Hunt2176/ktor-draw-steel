import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  faArrowLeft,
  faArrowRight,
  faBriefcase,
  faPencil,
  faPlus,
} from '@fortawesome/free-solid-svg-icons';
import type { Character, Combatant } from '../../core/models';
import { getHp } from '../../core/models';
import { ApiService } from '../../core/api.service';
import { CampaignStore } from '../../core/campaign-store.service';
import { WatchService } from '../../core/watch.service';
import { multiSort, parseIntOrUndefined } from '../../core/utils';
import { ActionIconComponent } from '../../ui/action-icon.component';
import { ButtonComponent } from '../../ui/button.component';
import { CardComponent } from '../../ui/card.component';
import { IconComponent } from '../../ui/icon.component';
import { ModalComponent } from '../../ui/modal.component';
import { PopoverComponent } from '../../ui/popover.component';
import { CharacterCardComponent } from '../components/character-card.component';
import { CharacterConditionsComponent } from '../components/character-conditions.component';
import { CharacterSelectorComponent, type CharacterSelection } from '../components/character-selector.component';
import { InventoryListComponent } from '../components/inventory-list.component';
import {
  ValueModifierComponent,
  type ValueModifierChangeEvent,
} from '../components/value-modifier.component';

interface CombatEntry {
  character: Character;
  combatant: Combatant;
}

/** The combat tracker: available/unavailable rosters, resource/surge gauges,
 * hero tokens, round advancement, quick-add, and roster modification. */
@Component({
  selector: 'app-combat',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgTemplateOutlet,
    ActionIconComponent,
    ButtonComponent,
    CardComponent,
    IconComponent,
    ModalComponent,
    PopoverComponent,
    CharacterCardComponent,
    CharacterConditionsComponent,
    CharacterSelectorComponent,
    InventoryListComponent,
    ValueModifierComponent,
  ],
  template: `
    @if (combat(); as cb) {
      @if (campaign(); as camp) {
        <div class="m-2">
          <app-card class="mb-2 block">
            <div class="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
              <!-- Left zone: back-to-campaign + campaign name -->
              <div class="flex min-w-0 items-center gap-2">
                <app-action-icon
                  variant="outline"
                  color="gray"
                  title="Back to campaign"
                  aria-label="Back to campaign"
                  (clicked)="goToCampaign($any($event))"
                >
                  <app-icon [name]="arrowLeft" />
                </app-action-icon>
                <a
                  class="truncate text-lg font-semibold text-ds-accent hover:underline"
                  [href]="'/campaigns/' + camp.campaign.id"
                  (click)="goToCampaign($event)"
                  >{{ camp.campaign.name }}</a
                >
              </div>

              <!-- Center zone: prominent round indicator -->
              <div class="flex flex-1 items-baseline justify-center gap-2">
                <span class="text-sm uppercase tracking-widest text-m-dark-2">Round</span>
                <span class="font-display text-h1 font-bold leading-none text-ds-ember">{{ cb.round }}</span>
              </div>

              <!-- Right zone: primary CTA + hero tokens + roster controls -->
              <div class="flex flex-wrap items-center justify-end gap-2">
                <app-button color="orange" (clicked)="nextRoundOpen.set(true)">
                  Next Round <app-icon [name]="arrowRight" />
                </app-button>
                <app-popover position="center">
                  <button popTarget class="ds-btn ds-btn--outline" style="--btn-accent: var(--color-m-yellow)">
                    Hero Tokens
                    <span class="font-bold">{{ camp.campaign.heroTokens }}</span>
                  </button>
                  <div popDropdown>
                    <app-value-modifier label="Modify Hero Tokens" (changed)="modifyHeroTokens($event)" />
                  </div>
                </app-popover>
                <div class="flex items-center gap-1">
                  <app-button variant="outline" color="gray" (clicked)="modifyOpen.set(true)">Modify</app-button>
                  <app-button variant="outline" color="gray" (clicked)="quickAddOpen.set(true)">
                    <app-icon [name]="plus" /> Quick Add
                  </app-button>
                </div>
              </div>
            </div>
          </app-card>

          <div class="grid grid-cols-2 gap-2">
            <ng-container [ngTemplateOutlet]="columnTpl" [ngTemplateOutletContext]="{ title: 'Available', entries: available(), available: true }" />
            <ng-container [ngTemplateOutlet]="columnTpl" [ngTemplateOutletContext]="{ title: 'Unavailable', entries: unavailable(), available: false }" />
          </div>
        </div>

        <!-- Quick Add modal -->
        <app-modal title="Quick Add" [opened]="quickAddOpen()" (closed)="quickAddOpen.set(false)">
          <div class="flex flex-col gap-4">
            <p class="text-sm text-m-dark-2">Drop a new combatant into this encounter without leaving the tracker.</p>

            <fieldset class="flex flex-col gap-3">
              <legend class="font-display text-sm font-semibold uppercase tracking-wide text-ds-accent">Combatant</legend>
              <div><label class="ds-label">Name</label><input class="ds-input" [value]="qaName()" (input)="qaName.set($any($event.target).value)" /></div>
              <div class="grid grid-cols-2 gap-3">
                <div><label class="ds-label">Max HP</label><input class="ds-input" type="number" min="0" [value]="qaMaxHp()" (input)="qaMaxHp.set($any($event.target).value)" /></div>
                <div><label class="ds-label">Minions</label><input class="ds-input" type="number" min="0" [value]="qaMinions()" (input)="qaMinions.set($any($event.target).value)" /></div>
              </div>
              <label class="flex items-center gap-2 text-sm"><input type="checkbox" class="h-4 w-4 accent-[var(--color-m-blue)]" [checked]="qaOffstage()" (change)="qaOffstage.set($any($event.target).checked)" /> Offstage (hidden from players)</label>
            </fieldset>

            <hr class="ds-divider" />

            <fieldset class="flex flex-col gap-3">
              <legend class="font-display text-sm font-semibold uppercase tracking-wide text-ds-accent">Portrait</legend>
              @if (qaPicturePreview()) { <img class="max-h-48 rounded" [src]="qaPicturePreview()" alt="" /> }
              <div><label class="ds-label">Picture URL</label><input class="ds-input" [value]="qaPictureUrl()" (input)="qaPictureUrl.set($any($event.target).value)" /></div>
            </fieldset>

            <hr class="ds-divider" />
            <div class="flex justify-end gap-2">
              <app-button color="gray" (clicked)="quickAddOpen.set(false)">Cancel</app-button>
              <app-button [disabled]="!qaName() || qaMaxHp() === ''" (clicked)="quickAdd()">
                <app-icon [name]="plus" /> Add Combatant
              </app-button>
            </div>
          </div>
        </app-modal>

        <!-- Next Round modal -->
        <app-modal [title]="'Advance to round ' + (cb.round + 1)" [opened]="nextRoundOpen()" (closed)="nextRoundOpen.set(false)">
          <div class="flex flex-col gap-4">
            <div class="flex items-baseline justify-center gap-3 rounded-lg border border-m-dark-4 bg-m-dark-6/40 px-4 py-3">
              <span class="font-display text-h2 font-bold text-m-dark-2">{{ cb.round }}</span>
              <app-icon [name]="arrowRight" />
              <span class="font-display text-h2 font-bold text-ds-ember">{{ cb.round + 1 }}</span>
            </div>
            <p class="text-sm text-m-dark-2">
              Advancing the round restores every combatant to <span class="font-semibold text-m-dark-0">available</span> and resets their turn-based resources for the new round.
            </p>
            <label class="flex items-start gap-2 text-sm">
              <input type="checkbox" class="mt-0.5 h-4 w-4 accent-[var(--color-m-blue)]" [checked]="clearRoundOnly()" (change)="clearRoundOnly.set($any($event.target).checked)" />
              <span>Also clear <span class="font-semibold text-m-dark-0">round-only</span> conditions (effects that last until the end of this round).</span>
            </label>
          </div>
          <hr class="ds-divider" />
          <div class="flex justify-end gap-2">
            <app-button color="gray" (clicked)="nextRoundOpen.set(false)">Cancel</app-button>
            <app-button color="orange" (clicked)="nextRound()">
              Advance Round <app-icon [name]="arrowRight" />
            </app-button>
          </div>
        </app-modal>

        <!-- Modify modal -->
        <app-modal title="Modify" [opened]="modifyOpen()" (closed)="modifyOpen.set(false)">
          <app-character-selector [characters]="camp.characters" [selected]="membership()" (changed)="modifySelection.set($event)" />
          <hr class="ds-divider" />
          <div class="flex justify-end gap-2">
            <app-button color="gray" (clicked)="modifyOpen.set(false)">Cancel</app-button>
            <app-button (clicked)="submitModify()">Submit</app-button>
          </div>
        </app-modal>

        <!-- Inventory modal -->
        <app-modal [opened]="inventoryFor() != null" [title]="'Inventory for ' + (inventoryFor()?.name ?? '')" (closed)="inventoryForId.set(null)">
          @if (inventoryFor(); as ic) {
            <app-inventory-list [characterId]="ic.id" [items]="ic.inventory" />
          }
        </app-modal>
      }
    }

    <!-- column template -->
    <ng-template #columnTpl let-title="title" let-entries="entries" let-available="available">
      <div class="flex flex-col gap-2">
        <app-card
          class="block"
          [class.border-l-4]="true"
          [style.border-left-color]="available ? 'var(--color-ds-accent)' : 'var(--color-m-dark-3)'"
        >
          <div class="flex items-center justify-center gap-2">
            <h3 class="font-display text-lg font-bold" [class.text-ds-accent]="available" [class.text-m-dark-2]="!available">{{ title }}</h3>
            <span
              class="inline-flex min-w-6 items-center justify-center rounded-full px-2 py-0.5 text-sm font-bold"
              [class.bg-ds-accent]="available"
              [class.text-m-dark-9]="available"
              [class.bg-m-dark-5]="!available"
              [class.text-m-dark-1]="!available"
              >{{ entries.length }}</span
            >
          </div>
        </app-card>
        <div class="grid grid-cols-1 gap-2 lg:grid-cols-2 2xl:grid-cols-3">
          @for (entry of entries; track entry.character.id) {
            <ng-container [ngTemplateOutlet]="cardTpl" [ngTemplateOutletContext]="{ $implicit: entry, available }" />
          }
        </div>
      </div>
    </ng-template>

    <!-- combatant card template -->
    <ng-template #cardTpl let-entry let-available="available">
      <div
        class="rounded-[0.7rem] transition-all"
        [class]="
          available
            ? 'ring-1 ring-ds-accent/60 shadow-ds-glow rounded-l-[0.7rem] border-l-2 border-ds-accent'
            : 'opacity-55 grayscale-[55%] saturate-50'
        "
      >
      <app-character-card #card [character]="entry.character" type="tile" (portraitClick)="viewCharacter(entry.character)">
        <div cardLeft class="flex-shrink">
          @if (!available) {
            <ng-container [ngTemplateOutlet]="actionsTpl" [ngTemplateOutletContext]="{ entry, card, available }" />
          }
        </div>
        <div cardRight class="flex-shrink">
          @if (available) {
            <ng-container [ngTemplateOutlet]="actionsTpl" [ngTemplateOutletContext]="{ entry, card, available }" />
          }
        </div>
        <div cardGauges class="flex w-full gap-1">
          <app-popover class="flex-1">
            <button
              popTarget
              class="ds-btn ds-btn--outline h-auto w-full flex-col gap-0.5 px-2 py-1.5"
              style="--btn-accent: var(--color-m-indigo)"
              [title]="'Modify ' + (entry.character.resourceName ?? 'Resources')"
            >
              <span class="text-[0.65rem] font-semibold uppercase tracking-wide opacity-80">{{ entry.character.resourceName ?? 'Resources' }}</span>
              <span class="text-xl font-bold leading-none">{{ entry.combatant.resources }}</span>
            </button>
            <div popDropdown><app-value-modifier label="Modify Resources" (changed)="updateValue(entry.combatant, 'resources', $event)" /></div>
          </app-popover>
          <app-popover class="flex-1">
            <button
              popTarget
              class="ds-btn ds-btn--outline h-auto w-full flex-col gap-0.5 px-2 py-1.5"
              style="--btn-accent: var(--color-ds-ember)"
              [class.opacity-45]="entry.combatant.surges === 0"
              title="Modify Surges"
            >
              <span class="text-[0.65rem] font-semibold uppercase tracking-wide opacity-80">Surges</span>
              <span class="text-xl font-bold leading-none">{{ entry.combatant.surges }}</span>
            </button>
            <div popDropdown><app-value-modifier label="Modify Surges" (changed)="updateValue(entry.combatant, 'surges', $event)" /></div>
          </app-popover>
        </div>
        <div cardBottom>
          <app-character-conditions [character]="entry.character" mode="list" />
        </div>
      </app-character-card>
      </div>
    </ng-template>

    <ng-template #actionsTpl let-entry="entry" let-card="card" let-available="available">
      <div [class]="available ? 'ml-2 flex flex-col items-end gap-2' : 'mr-2 flex flex-col items-start gap-2'">
        <app-action-icon
          [color]="available ? 'orange' : 'gray'"
          [variant]="available ? 'filled' : 'outline'"
          [title]="available ? 'End Turn' : 'Restore'"
          [attr.aria-label]="available ? 'End Turn' : 'Restore'"
          (clicked)="toggleActive(entry.combatant)"
        >
          <app-icon [name]="available ? arrowRight : arrowLeft" />
        </app-action-icon>
        <app-action-icon variant="outline" color="gray" title="Edit" aria-label="Edit" (clicked)="card.openEditor()"><app-icon [name]="pencil" /></app-action-icon>
        <app-character-conditions [character]="entry.character" mode="button" />
        <app-action-icon variant="outline" color="gray" title="Inventory" aria-label="Inventory" (clicked)="inventoryForId.set(entry.character.id)"><app-icon [name]="briefcase" /></app-action-icon>
      </div>
    </ng-template>
  `,
})
export class CombatComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(ApiService);
  private readonly store = inject(CampaignStore);
  private readonly watcher = inject(WatchService);

  protected readonly arrowLeft = faArrowLeft;
  protected readonly arrowRight = faArrowRight;
  protected readonly pencil = faPencil;
  protected readonly briefcase = faBriefcase;
  protected readonly plus = faPlus;

  private readonly params = toSignal(this.route.paramMap, { requireSync: true });
  private readonly id = computed(() => Number.parseInt(this.params().get('id') ?? '', 10));

  protected readonly combat = computed(() => {
    const id = this.id();
    if (Number.isNaN(id)) return undefined;
    return this.store.combat(id)();
  });
  protected readonly campaign = computed(() => {
    const campaignId = this.combat()?.campaign;
    if (campaignId == null) return undefined;
    return this.store.campaign(campaignId)();
  });

  /** character id → combatant, for the current combat. */
  private readonly combatantByCharacter = computed(() => {
    const map = new Map<number, Combatant>();
    for (const c of this.combat()?.combatants ?? []) map.set(c.character.id, c);
    return map;
  });

  private entries(available: boolean): CombatEntry[] {
    const map = this.combatantByCharacter();
    const result: CombatEntry[] = [];
    for (const character of this.campaign()?.characters ?? []) {
      const combatant = map.get(character.id);
      if (combatant && combatant.available === available) result.push({ character, combatant });
    }
    return result.sort(
      multiSort<CombatEntry>([
        { sortBy: (e) => e.character.offstage, dir: 'ASC' },
        { sortBy: (e) => getHp(e.character).current, dir: 'ASC' },
        { sortBy: (e) => e.character.name.toLowerCase(), dir: 'ASC' },
      ]),
    );
  }
  protected readonly available = computed(() => this.entries(true));
  protected readonly unavailable = computed(() => this.entries(false));

  protected readonly membership = computed<CharacterSelection>(() => {
    const map = this.combatantByCharacter();
    const out: CharacterSelection = {};
    for (const character of this.campaign()?.characters ?? []) out[character.id] = map.has(character.id);
    return out;
  });

  readonly quickAddOpen = signal(false);
  readonly nextRoundOpen = signal(false);
  readonly modifyOpen = signal(false);
  readonly inventoryForId = signal<number | null>(null);
  readonly clearRoundOnly = signal(false);
  readonly modifySelection = signal<CharacterSelection>({});

  readonly qaName = signal('');
  readonly qaMaxHp = signal<string | number>('');
  readonly qaMinions = signal<string | number>(0);
  readonly qaOffstage = signal(true);
  readonly qaPictureUrl = signal('');
  protected readonly qaPicturePreview = computed(() => this.qaPictureUrl().trim() || null);

  protected readonly inventoryFor = computed(() => {
    const id = this.inventoryForId();
    if (id == null) return null;
    return this.campaign()?.characters.find((c) => c.id === id) ?? null;
  });

  constructor() {
    if (Number.isNaN(this.id())) void this.router.navigate(['/']);
    effect(() => {
      const campaignId = this.combat()?.campaign;
      if (campaignId != null) this.watcher.watch(campaignId);
    });
  }

  goToCampaign(event: MouseEvent): void {
    event.preventDefault();
    const id = this.campaign()?.campaign.id;
    if (id == null) return;
    if (event.metaKey || event.ctrlKey) {
      window.open(`/campaigns/${id}`, '_blank');
      return;
    }
    void this.router.navigate(['/campaigns', id]);
  }

  viewCharacter(character: Character): void {
    void this.router.navigate(['/characters', character.id]);
  }

  async toggleActive(combatant: Combatant): Promise<void> {
    await this.api.updateCombatantActive(combatant.id, !combatant.available);
    this.store.refetchCombat(this.id());
  }

  async updateValue(
    combatant: Combatant,
    key: 'resources' | 'surges',
    event: ValueModifierChangeEvent,
  ): Promise<void> {
    await this.api.updateCombatantValue(combatant.id, {
      key,
      value: event.modifyBy,
      type: event.type.toLowerCase() as 'increase' | 'decrease',
    });
    this.store.refetchCombat(this.id());
  }

  async modifyHeroTokens(event: ValueModifierChangeEvent): Promise<void> {
    const campaignId = this.campaign()?.campaign.id;
    if (campaignId == null) return;
    await this.api.modifyHeroTokens(campaignId, event);
    this.store.refetchCampaign(campaignId);
  }

  async nextRound(): Promise<void> {
    const cb = this.combat();
    if (!cb) return;
    const update = await this.api.updateCombatRound(cb.id, {
      fromRound: cb.round,
      reset: true,
      updateConditions: this.clearRoundOnly(),
    });
    this.store.setCombat(cb.id, update);
    const campaignId = this.campaign()?.campaign.id;
    if (campaignId != null) this.store.refetchCampaign(campaignId);
    this.nextRoundOpen.set(false);
    this.clearRoundOnly.set(false);
  }

  async quickAdd(): Promise<void> {
    const maxHp = parseIntOrUndefined(this.qaMaxHp());
    if (!this.qaName() || maxHp == null) return;
    await this.api.quickAddCombatant(this.id(), {
      character: { name: this.qaName(), maxHp, offstage: this.qaOffstage(), user: 1 },
    });
    const campaignId = this.campaign()?.campaign.id;
    if (campaignId != null) this.store.refetchCampaign(campaignId);
    this.store.refetchCombat(this.id());
    this.quickAddOpen.set(false);
    this.qaName.set('');
    this.qaMaxHp.set('');
    this.qaMinions.set(0);
    this.qaOffstage.set(true);
    this.qaPictureUrl.set('');
  }

  async submitModify(): Promise<void> {
    const before = this.membership();
    const after = this.modifySelection();
    const add = Object.entries(after)
      .filter(([id, sel]) => sel && !before[Number(id)])
      .map(([id]) => Number(id));
    const remove = Object.entries(after)
      .filter(([id, sel]) => !sel && before[Number(id)])
      .map(([id]) => Number(id));
    const update: { add?: number[]; remove?: number[] } = {};
    if (add.length) update.add = add;
    if (remove.length) update.remove = remove;
    const result = await this.api.updateCombatModification(this.id(), update);
    this.store.setCombat(this.id(), result);
    this.modifyOpen.set(false);
  }
}
