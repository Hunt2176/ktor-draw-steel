import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  faArrowLeft,
  faArrowRight,
  faBriefcase,
  faPencil,
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
            <div class="flex items-center justify-between">
              <div class="flex flex-col gap-1">
                <app-button variant="outline" color="gray" (clicked)="modifyOpen.set(true)">Modify</app-button>
                <app-button variant="outline" color="gray" (clicked)="quickAddOpen.set(true)">Quick Add</app-button>
              </div>
              <div class="flex flex-col items-center gap-1">
                <a class="text-lg font-semibold text-m-blue-light" [href]="'/campaigns/' + camp.campaign.id" (click)="goToCampaign($event)">{{ camp.campaign.name }}</a>
                <span class="font-bold">Round {{ cb.round }}</span>
              </div>
              <div class="flex flex-col gap-2">
                <app-button (clicked)="nextRoundOpen.set(true)">
                  Next Round <app-icon [name]="arrowRight" />
                </app-button>
                <app-popover position="center">
                  <button popTarget class="ds-btn ds-btn--transparent">Hero Tokens {{ camp.campaign.heroTokens }}</button>
                  <div popDropdown>
                    <app-value-modifier label="Modify Hero Tokens" (changed)="modifyHeroTokens($event)" />
                  </div>
                </app-popover>
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
          <div class="flex flex-col gap-3">
            <div><label class="ds-label">Name</label><input class="ds-input" [value]="qaName()" (input)="qaName.set($any($event.target).value)" /></div>
            <div><label class="ds-label">Max HP</label><input class="ds-input" type="number" min="0" [value]="qaMaxHp()" (input)="qaMaxHp.set($any($event.target).value)" /></div>
            <div><label class="ds-label">Minions</label><input class="ds-input" type="number" min="0" [value]="qaMinions()" (input)="qaMinions.set($any($event.target).value)" /></div>
            <label class="flex items-center gap-2"><input type="checkbox" class="h-4 w-4 accent-[var(--color-m-blue)]" [checked]="qaOffstage()" (change)="qaOffstage.set($any($event.target).checked)" /> Offstage</label>
            <hr class="ds-divider" />
            @if (qaPicturePreview()) { <img class="max-h-48 rounded" [src]="qaPicturePreview()" alt="" /> }
            <div><label class="ds-label">Picture URL</label><input class="ds-input" [value]="qaPictureUrl()" (input)="qaPictureUrl.set($any($event.target).value)" /></div>
            <hr class="ds-divider" />
            <div class="flex justify-end">
              <app-button [disabled]="!qaName() || qaMaxHp() === ''" (clicked)="quickAdd()">Submit</app-button>
            </div>
          </div>
        </app-modal>

        <!-- Next Round modal -->
        <app-modal [title]="'Advance to round ' + (cb.round + 1)" [opened]="nextRoundOpen()" (closed)="nextRoundOpen.set(false)">
          <label class="flex items-center gap-2">
            <input type="checkbox" class="h-4 w-4 accent-[var(--color-m-blue)]" [checked]="clearRoundOnly()" (change)="clearRoundOnly.set($any($event.target).checked)" />
            Clear round only conditions
          </label>
          <hr class="ds-divider" />
          <div class="flex justify-end gap-2">
            <app-button color="gray" (clicked)="nextRoundOpen.set(false)">Cancel</app-button>
            <app-button (clicked)="nextRound()">Continue</app-button>
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
        <app-card class="block"><h3 class="text-center text-lg font-bold">{{ title }}</h3></app-card>
        <div class="grid grid-cols-1 gap-2 lg:grid-cols-2 2xl:grid-cols-3">
          @for (entry of entries; track entry.character.id) {
            <ng-container [ngTemplateOutlet]="cardTpl" [ngTemplateOutletContext]="{ $implicit: entry, available }" />
          }
        </div>
      </div>
    </ng-template>

    <!-- combatant card template -->
    <ng-template #cardTpl let-entry let-available="available">
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
        <div cardGauges class="flex w-full">
          <app-popover class="flex-1">
            <button popTarget class="ds-btn ds-btn--subtle h-auto w-full flex-col" style="--btn-accent: var(--color-m-indigo)">
              <span class="text-lg font-bold">{{ entry.character.resourceName ?? 'Resources' }}</span>
              <span class="text-lg font-bold">{{ entry.combatant.resources }}</span>
            </button>
            <div popDropdown><app-value-modifier label="Modify Resources" (changed)="updateValue(entry.combatant, 'resources', $event)" /></div>
          </app-popover>
          <app-popover class="flex-1">
            <button popTarget class="ds-btn ds-btn--subtle h-auto w-full flex-col">
              <span class="text-lg font-bold">Surges</span>
              <span class="text-lg font-bold">{{ entry.combatant.surges }}</span>
            </button>
            <div popDropdown><app-value-modifier label="Modify Surges" (changed)="updateValue(entry.combatant, 'surges', $event)" /></div>
          </app-popover>
        </div>
        <div cardBottom>
          <app-character-conditions [character]="entry.character" mode="list" />
        </div>
      </app-character-card>
    </ng-template>

    <ng-template #actionsTpl let-entry="entry" let-card="card" let-available="available">
      <div [class]="available ? 'ml-2 flex flex-col items-end' : 'mr-2 flex flex-col'">
        <div class="mb-2"><app-action-icon (clicked)="toggleActive(entry.combatant)"><app-icon [name]="available ? arrowRight : arrowLeft" /></app-action-icon></div>
        <div class="mb-2"><app-action-icon (clicked)="card.openEditor()"><app-icon [name]="pencil" /></app-action-icon></div>
        <div class="mb-2"><app-character-conditions [character]="entry.character" mode="button" /></div>
        <div><app-action-icon (clicked)="inventoryForId.set(entry.character.id)"><app-icon [name]="briefcase" /></app-action-icon></div>
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
