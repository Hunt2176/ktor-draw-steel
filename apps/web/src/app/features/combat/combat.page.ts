import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  resource,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import {
  ApiService,
  type CombatModificationUpdate,
} from '../../core/api.service';
import { RealtimeService } from '../../core/realtime.service';
import { BackgroundService } from '../../core/background.service';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';
import { IconButton } from '../../ui/icon-button';
import { Icon } from '../../ui/icon';
import { Modal } from '../../ui/modal';
import { Popover } from '../../ui/popover';
import { TextInput, NumberInput, Switch, Checkbox } from '../../ui/inputs';
import {
  ValueModifier,
  type ValueModifierChangeEvent,
} from '../../ui/value-modifier';
import { CharacterCard } from '../shared/character-card';
import { CharacterConditions } from '../shared/character-conditions';
import {
  CharacterSelector,
  type CharacterSelection,
} from '../shared/character-selector';
import { InventoryList } from '../shared/inventory-list';
import { getHp, type Combatant } from '@draw-steel/shared';

@Component({
  selector: 'ds-combat-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [RealtimeService],
  imports: [
    Card,
    Button,
    IconButton,
    Icon,
    Modal,
    Popover,
    TextInput,
    NumberInput,
    Switch,
    Checkbox,
    ValueModifier,
    CharacterCard,
    CharacterConditions,
    CharacterSelector,
    InventoryList,
  ],
  template: `
    @if (combat.value(); as combat) {
      @if (campaign.value(); as campaign) {
        <div class="m-2">
          <ds-card class="mb-2">
            <div class="flex justify-between">
              <div class="flex flex-col gap-2">
                <ds-button color="gray" variant="outline" (click)="showModify()"
                  >Modify</ds-button
                >
                <ds-button color="gray" variant="outline" (click)="openQuickAdd()"
                  >Quick Add</ds-button
                >
              </div>
              <div class="flex flex-col justify-center gap-2 items-center">
                <ds-button
                  color="gray"
                  variant="subtle"
                  size="lg"
                  (click)="goCampaign(campaign.campaign.id)"
                  >{{ campaign.campaign.name }}</ds-button
                >
                <div class="text-center font-bold">Round {{ combat.round }}</div>
              </div>
              <div class="flex flex-col gap-3">
                <ds-button (click)="showNextRound.set(true)">
                  <span class="mr-2">Next Round</span>
                  <ds-icon name="arrow-right" />
                </ds-button>
                <div class="flex flex-col items-center">
                  <ds-popover>
                    <ds-button dsTrigger variant="transparent"
                      >Hero Tokens {{ campaign.campaign.heroTokens }}</ds-button
                    >
                    <div dsDropdown>
                      <ds-value-modifier
                        label="Modify Hero Tokens"
                        (changed)="modifyHeroTokens(campaign.campaign.id, $event)"
                      />
                    </div>
                  </ds-popover>
                </div>
              </div>
            </div>
          </ds-card>

          <div class="grid grid-cols-2 gap-2">
            @for (col of columns(); track col.available) {
              <div class="flex flex-col gap-1">
                <ds-card>
                  <div class="text-center text-lg font-bold">{{ col.title }}</div>
                </ds-card>
                <div class="grid gap-2" style="grid-template-columns: 1fr">
                  @for (combatant of col.list; track combatant.id) {
                    <ds-character-card
                      #card
                      type="tile"
                      [character]="combatant.character"
                      (portraitClick)="goCharacter(combatant.character.id)"
                    >
                      <div cardRight class="shrink ml-2 flex flex-col gap-2">
                        <ds-icon-btn (click)="toggleActive(combatant)">
                          <ds-icon
                            [name]="combatant.available ? 'arrow-right' : 'arrow-left'"
                          />
                        </ds-icon-btn>
                        <ds-icon-btn (click)="card.openEditor()"
                          ><ds-icon name="pencil"
                        /></ds-icon-btn>
                        <ds-character-conditions
                          mode="button"
                          [character]="combatant.character"
                        />
                        <ds-icon-btn (click)="inventoryFor.set(combatant.character.id)">
                          <ds-icon name="briefcase" />
                        </ds-icon-btn>
                      </div>
                      <div cardGauges class="flex w-full">
                        <div class="flex justify-center flex-1">
                          <ds-popover>
                            <ds-button dsTrigger color="indigo" variant="subtle">
                              <div class="flex flex-col">
                                <span class="text-lg font-bold">{{
                                  combatant.character.resourceName ?? 'Resources'
                                }}</span>
                                <span class="text-lg font-bold">{{
                                  combatant.resources
                                }}</span>
                              </div>
                            </ds-button>
                            <div dsDropdown>
                              <ds-value-modifier
                                label="Modify Resources"
                                (changed)="modifyValue(combatant, 'resources', $event)"
                              />
                            </div>
                          </ds-popover>
                        </div>
                        <div class="flex justify-center flex-1">
                          <ds-popover>
                            <ds-button dsTrigger color="blue" variant="subtle">
                              <div class="flex flex-col">
                                <span class="text-lg font-bold">Surges</span>
                                <span class="text-lg font-bold">{{
                                  combatant.surges
                                }}</span>
                              </div>
                            </ds-button>
                            <div dsDropdown>
                              <ds-value-modifier
                                label="Modify Surges"
                                (changed)="modifyValue(combatant, 'surges', $event)"
                              />
                            </div>
                          </ds-popover>
                        </div>
                      </div>
                      <div cardBottom>
                        <ds-character-conditions
                          mode="list"
                          [character]="combatant.character"
                        />
                      </div>
                    </ds-character-card>
                  }
                </div>
              </div>
            }
          </div>
        </div>

        <!-- Quick Add modal -->
        <ds-modal
          [opened]="showQuickAdd()"
          title="Quick Add"
          (closed)="showQuickAdd.set(false)"
        >
          <ds-text-input label="Name" [(value)]="qaName" />
          <ds-number-input label="Max HP" [min]="0" [(value)]="qaMaxHp" />
          <ds-number-input label="Minions" [min]="0" [(value)]="qaMinions" />
          <ds-switch label="Offstage" [(checked)]="qaOffstage" />
          <hr class="my-3 border-[color:var(--color-dark-5)]" />
          @if (qaPictureUrl()) {
            <img [src]="qaPictureUrl()" class="mb-3 max-h-40 object-contain" alt="" />
          }
          <ds-text-input label="Picture URL" [(value)]="qaPictureUrl" />
          <hr class="my-3 border-[color:var(--color-dark-5)]" />
          <div class="flex justify-end">
            <ds-button
              [disabled]="qaName() === '' || qaMaxHp() == null"
              (click)="submitQuickAdd(combat.id)"
              >Submit</ds-button
            >
          </div>
        </ds-modal>

        <!-- Next round modal -->
        <ds-modal
          [opened]="showNextRound()"
          [title]="'Advance to round ' + (combat.round + 1)"
          (closed)="showNextRound.set(false)"
        >
          <ds-checkbox label="Clear round only conditions" [(checked)]="clearRoundOnly" />
          <hr class="my-3 border-[color:var(--color-dark-5)]" />
          <div class="flex justify-end gap-2">
            <ds-button color="gray" (click)="showNextRound.set(false)">Cancel</ds-button>
            <ds-button (click)="nextRound(combat.id, combat.round)">Continue</ds-button>
          </div>
        </ds-modal>

        <!-- Modify characters modal -->
        <ds-modal
          [opened]="showModifyChars()"
          title="Modify"
          (closed)="showModifyChars.set(false)"
        >
          <ds-character-selector
            [characters]="campaign.characters"
            [selected]="membership()"
            (selectionChange)="modifySelection.set($event)"
          />
          <hr class="my-3 border-[color:var(--color-dark-5)]" />
          <div class="flex justify-end gap-2">
            <ds-button color="gray" (click)="showModifyChars.set(false)">Cancel</ds-button>
            <ds-button (click)="submitModify(combat.id)">Submit</ds-button>
          </div>
        </ds-modal>

        <!-- Inventory modal -->
        <ds-modal
          [opened]="inventoryFor() != null"
          [title]="'Inventory for ' + (inventoryCharacter(combat)?.name ?? '')"
          (closed)="inventoryFor.set(null)"
        >
          @if (inventoryCharacter(combat); as ch) {
            <ds-inventory-list [characterId]="ch.id" [items]="ch.inventory" />
          }
        </ds-modal>
      }
    }
  `,
})
export class CombatPage {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly realtime = inject(RealtimeService);
  private readonly background = inject(BackgroundService);

  readonly id = input<string>('');
  private readonly combatId = computed(() => Number.parseInt(this.id(), 10));

  protected readonly combat = resource({
    params: () => ({ id: this.combatId(), rev: this.realtime.revision() }),
    loader: ({ params }) => this.api.fetchCombat(params.id),
  });

  protected readonly campaign = resource({
    // Returning undefined params leaves the resource idle until the combat
    // (and thus its campaign id) has loaded — no spurious request/error.
    params: () => {
      const id = this.combat.value()?.campaign;
      return id == null ? undefined : { id, rev: this.realtime.revision() };
    },
    loader: ({ params }) => this.api.fetchCampaign(params.id),
  });

  // Quick add
  protected readonly showQuickAdd = signal(false);
  protected readonly qaName = signal('');
  protected readonly qaMaxHp = signal<number | null>(null);
  protected readonly qaMinions = signal<number | null>(0);
  protected readonly qaOffstage = signal(true);
  protected readonly qaPictureUrl = signal('');

  protected readonly showNextRound = signal(false);
  protected readonly clearRoundOnly = signal(false);
  protected readonly showModifyChars = signal(false);
  protected readonly modifySelection = signal<CharacterSelection>({});
  protected readonly inventoryFor = signal<number | null>(null);

  protected readonly columns = computed(() => {
    const combatants = this.combat.value()?.combatants ?? [];
    const sort = (a: Combatant, b: Combatant): number => {
      const ao = a.character.offstage ? 1 : 0;
      const bo = b.character.offstage ? 1 : 0;
      if (ao !== bo) return ao - bo;
      const ah = getHp(a.character).current;
      const bh = getHp(b.character).current;
      if (ah !== bh) return ah - bh;
      return a.character.name.toLowerCase() < b.character.name.toLowerCase()
        ? -1
        : 1;
    };
    return [
      {
        available: true,
        title: 'Available',
        list: combatants.filter((c) => c.available).sort(sort),
      },
      {
        available: false,
        title: 'Unavailable',
        list: combatants.filter((c) => !c.available).sort(sort),
      },
    ];
  });

  /** Current campaign-character membership for the modify modal. */
  protected readonly membership = computed<CharacterSelection>(() => {
    const inCombat = new Set(
      (this.combat.value()?.combatants ?? []).map((c) => c.character.id),
    );
    const result: CharacterSelection = {};
    for (const c of this.campaign.value()?.characters ?? []) {
      result[c.id] = inCombat.has(c.id);
    }
    return result;
  });

  constructor() {
    effect(() => {
      if (Number.isNaN(this.combatId())) void this.router.navigate(['/campaigns']);
    });
    effect(() => {
      if (this.combat.status() === 'error') void this.router.navigate(['/campaigns']);
    });
    effect(() => this.realtime.watch(this.combat.value()?.campaign));
    effect(() => this.background.apply(this.campaign.value()?.campaign));
  }

  protected inventoryCharacter(combat: { combatants: Combatant[] }) {
    const id = this.inventoryFor();
    if (id == null) return null;
    return combat.combatants.find((c) => c.character.id === id)?.character ?? null;
  }

  protected goCampaign(id: number): void {
    void this.router.navigate(['/campaigns', id]);
  }
  protected goCharacter(id: number): void {
    void this.router.navigate(['/characters', id]);
  }

  protected showModify(): void {
    this.modifySelection.set(this.membership());
    this.showModifyChars.set(true);
  }

  protected openQuickAdd(): void {
    this.qaName.set('');
    this.qaMaxHp.set(null);
    this.qaMinions.set(0);
    this.qaOffstage.set(true);
    this.qaPictureUrl.set('');
    this.showQuickAdd.set(true);
  }

  protected async submitQuickAdd(combatId: number): Promise<void> {
    const name = this.qaName();
    const maxHp = this.qaMaxHp();
    if (name === '' || maxHp == null) return;
    await this.api.quickAddCombatant(combatId, {
      character: { name, maxHp, offstage: this.qaOffstage(), user: 1 },
    });
    this.combat.reload();
    this.showQuickAdd.set(false);
  }

  protected async nextRound(combatId: number, round: number): Promise<void> {
    await this.api.updateCombatRound(combatId, {
      fromRound: round,
      reset: true,
      updateConditions: this.clearRoundOnly(),
    });
    this.combat.reload();
    this.showNextRound.set(false);
  }

  protected async toggleActive(combatant: Combatant): Promise<void> {
    await this.api.updateCombatantActive(combatant.id, !combatant.available);
    this.combat.reload();
  }

  protected async modifyValue(
    combatant: Combatant,
    key: 'resources' | 'surges',
    event: ValueModifierChangeEvent,
  ): Promise<void> {
    await this.api.updateCombatantValue(combatant.id, {
      key,
      value: event.modifyBy,
      type: event.type.toLowerCase() as 'increase' | 'decrease',
    });
    this.combat.reload();
  }

  protected async modifyHeroTokens(
    campaignId: number,
    event: ValueModifierChangeEvent,
  ): Promise<void> {
    await this.api.modifyHeroTokens(campaignId, {
      modifyBy: event.modifyBy,
      type: event.type,
    });
    this.campaign.reload();
  }

  protected async submitModify(combatId: number): Promise<void> {
    const before = this.membership();
    const after = this.modifySelection();
    const add = Object.entries(after)
      .filter(([id, sel]) => sel && !before[Number(id)])
      .map(([id]) => Number(id));
    const remove = Object.entries(after)
      .filter(([id, sel]) => !sel && before[Number(id)])
      .map(([id]) => Number(id));
    const update: CombatModificationUpdate = {};
    if (add.length) update.add = add;
    if (remove.length) update.remove = remove;
    await this.api.updateCombatModification(combatId, update);
    this.combat.reload();
    this.showModifyChars.set(false);
  }
}
