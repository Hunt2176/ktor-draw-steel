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
import { ApiService } from '../../core/api.service';
import { RealtimeService } from '../../core/realtime.service';
import { BackgroundService } from '../../core/background.service';
import { Card } from '../../ui/card';
import { IconButton } from '../../ui/icon-button';
import { Icon } from '../../ui/icon';
import { Button } from '../../ui/button';
import { Modal } from '../../ui/modal';
import { CharacterCard } from '../shared/character-card';
import { CharacterEditor } from '../shared/character-editor';
import {
  CharacterSelector,
  type CharacterSelection,
} from '../shared/character-selector';
import { UploadModal } from '../shared/upload-modal';
import { InventoryList } from '../shared/inventory-list';
import {
  emptyCharacter,
  type Character,
  type Combat,
} from '@draw-steel/shared';

@Component({
  selector: 'ds-campaign-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [RealtimeService],
  imports: [
    Card,
    IconButton,
    Icon,
    Button,
    Modal,
    CharacterCard,
    CharacterEditor,
    CharacterSelector,
    UploadModal,
    InventoryList,
  ],
  styles: [
    `
      .section-grid {
        display: grid;
        gap: 1rem;
        grid-template-columns: repeat(auto-fill, minmax(18rem, 1fr));
      }
      .stat-pill {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        padding: 0.3rem 0.75rem;
        border-radius: 9999px;
        font-size: 0.85rem;
        font-weight: 600;
        white-space: nowrap;
        color: var(--color-dark-0);
        border: 1px solid color-mix(in srgb, var(--color-brand-blue) 40%, transparent);
      }
      .empty-state {
        padding: 1.5rem;
        text-align: center;
        color: color-mix(in srgb, var(--color-dark-0) 55%, transparent);
        font-size: 0.95rem;
      }
    `,
  ],
  template: `
    @if (campaign.value(); as details) {
      <div class="flex flex-col gap-6">
        <!-- Header -->
        <header
          class="flex flex-wrap items-center justify-between gap-3 border-b border-[color:var(--color-dark-5)] pb-4"
        >
          <div class="flex flex-wrap items-center gap-3">
            <h1 class="text-3xl font-bold leading-tight">{{ details.campaign.name }}</h1>
            <span class="stat-pill glass">
              Hero Tokens: {{ details.campaign.heroTokens }}
            </span>
          </div>
          <div class="flex items-center gap-2 ml-auto">
            <ds-icon-btn variant="outline" (click)="goDisplay()">
              <ds-icon name="book" />
            </ds-icon-btn>
            <ds-icon-btn variant="outline" (click)="showBackground.set(true)">
              <ds-icon name="image" />
            </ds-icon-btn>
          </div>
        </header>

        <!-- Combats -->
        <section class="flex flex-col gap-3">
          <div class="flex items-center justify-between gap-2">
            <h2 class="text-xl font-bold">Combats</h2>
            <ds-icon-btn (click)="showNewCombat()"><ds-icon name="plus" /></ds-icon-btn>
          </div>
          <div class="section-grid">
            @for (combat of combats.value() ?? []; track combat.id) {
              <ds-card>
                <div class="flex items-center justify-between gap-3">
                  <div class="text-xl font-bold">Round: {{ combat.round }}</div>
                  <div class="flex flex-col gap-2 justify-center">
                    <ds-button (click)="viewCombat(combat)">View</ds-button>
                    <ds-button color="red" (click)="combatToDelete.set(combat)"
                      >Delete</ds-button
                    >
                  </div>
                </div>
              </ds-card>
            } @empty {
              <ds-card>
                <div class="empty-state flex flex-col items-center gap-3">
                  <span>No combats yet</span>
                  <ds-icon-btn (click)="showNewCombat()"><ds-icon name="plus" /></ds-icon-btn>
                </div>
              </ds-card>
            }
          </div>
        </section>

        <!-- Characters -->
        <section class="flex flex-col gap-3">
          <div class="flex items-center justify-between gap-2">
            <h2 class="text-xl font-bold">Characters</h2>
            <ds-icon-btn (click)="newCharacter.set(true)"><ds-icon name="plus" /></ds-icon-btn>
          </div>
          <div class="section-grid items-start">
            @for (character of onstage(); track character.id) {
              <ds-character-card
                type="tile"
                [character]="character"
                (portraitClick)="goCharacter(character)"
              >
                <div cardRight class="shrink">
                  <ds-icon-btn (click)="inventoryCharId.set(character.id)">
                    <ds-icon name="briefcase" />
                  </ds-icon-btn>
                </div>
              </ds-character-card>
            } @empty {
              <ds-card>
                <div class="empty-state flex flex-col items-center gap-3">
                  <span>No characters yet</span>
                  <ds-icon-btn (click)="newCharacter.set(true)"><ds-icon name="plus" /></ds-icon-btn>
                </div>
              </ds-card>
            }
          </div>
        </section>
      </div>

      <!-- Inventory modal -->
      <ds-modal
        [opened]="inventoryChar() != null"
        [title]="'Inventory for ' + (inventoryChar()?.name ?? '')"
        (closed)="inventoryCharId.set(null)"
      >
        @if (inventoryChar(); as ch) {
          <ds-inventory-list [characterId]="ch.id" [items]="ch.inventory" />
        }
      </ds-modal>

      <!-- New character modal -->
      <ds-modal
        [opened]="newCharacter()"
        title="New Character"
        (closed)="newCharacter.set(false)"
      >
        <ds-character-editor [character]="blankCharacter" (submitted)="createCharacter($event)" />
      </ds-modal>

      <!-- New combat modal -->
      <ds-modal [opened]="newCombat()" title="New Combat" (closed)="newCombat.set(false)">
        <div class="flex flex-col gap-3">
          <ds-character-selector
            [characters]="details.characters"
            (selectionChange)="combatSelection.set($event)"
          />
          <hr class="border-[color:var(--color-dark-5)]" />
          <div class="flex justify-end gap-2">
            <ds-button color="gray" (click)="newCombat.set(false)">Cancel</ds-button>
            <ds-button [disabled]="creatingCombat()" (click)="createCombat()"
              >Create</ds-button
            >
          </div>
        </div>
      </ds-modal>

      <!-- Delete combat modal -->
      <ds-modal
        [opened]="combatToDelete() != null"
        title="Delete Combat"
        (closed)="combatToDelete.set(null)"
      >
        <div class="flex flex-col gap-3">
          <div>Are you sure you want to delete this combat?</div>
          <hr class="border-[color:var(--color-dark-5)]" />
          <div class="flex justify-end gap-2">
            <ds-button color="gray" (click)="combatToDelete.set(null)">Cancel</ds-button>
            <ds-button color="red" (click)="deleteCombat()">Delete</ds-button>
          </div>
        </div>
      </ds-modal>

      <!-- Background upload -->
      <ds-upload-modal
        [opened]="showBackground()"
        accept=".png,.jpg,.jpeg,.webp"
        (hide)="showBackground.set(false)"
        (complete)="onBackgroundUploaded($event)"
      />
    } @else {
      <div class="flex items-center justify-center py-16 text-[color:var(--color-dark-0)]">
        <span class="text-lg opacity-70">Loading campaign…</span>
      </div>
    }
  `,
})
export class CampaignDetailPage {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly realtime = inject(RealtimeService);
  private readonly background = inject(BackgroundService);

  readonly id = input<string>('');
  private readonly campaignId = computed(() => Number.parseInt(this.id(), 10));

  protected readonly blankCharacter = emptyCharacter();

  protected readonly newCharacter = signal(false);
  protected readonly newCombat = signal(false);
  protected readonly creatingCombat = signal(false);
  protected readonly combatToDelete = signal<Combat | null>(null);
  protected readonly showBackground = signal(false);
  protected readonly inventoryCharId = signal<number | null>(null);
  protected readonly combatSelection = signal<CharacterSelection>({});

  protected readonly campaign = resource({
    params: () => ({ id: this.campaignId(), rev: this.realtime.revision() }),
    loader: ({ params }) => this.api.fetchCampaign(params.id),
  });

  protected readonly combats = resource({
    params: () => ({ id: this.campaignId(), rev: this.realtime.revision() }),
    loader: ({ params }) => this.api.fetchCombatsFor(params.id),
  });

  protected readonly onstage = computed(
    () => this.campaign.value()?.characters.filter((c) => !c.offstage) ?? [],
  );

  protected readonly inventoryChar = computed<Character | null>(() => {
    const id = this.inventoryCharId();
    if (id == null) return null;
    return this.campaign.value()?.characters.find((c) => c.id === id) ?? null;
  });

  constructor() {
    effect(() => {
      if (Number.isNaN(this.campaignId())) void this.router.navigate(['/']);
    });
    effect(() => this.realtime.watch(this.campaignId()));
    effect(() => this.background.apply(this.campaign.value()?.campaign));
  }

  protected goDisplay(): void {
    void this.router.navigate(['/campaigns', this.campaignId(), 'display']);
  }
  protected goCharacter(character: Character): void {
    void this.router.navigate(['/characters', character.id]);
  }
  protected viewCombat(combat: Combat): void {
    void this.router.navigate(['/combats', combat.id]);
  }

  protected showNewCombat(): void {
    this.combatSelection.set({});
    this.newCombat.set(true);
  }

  protected async createCharacter(result: Partial<Character>): Promise<void> {
    await this.api.createCharacter({
      ...result,
      campaign: this.campaignId(),
      user: 1,
    });
    this.campaign.reload();
    this.newCharacter.set(false);
  }

  protected async createCombat(): Promise<void> {
    const selected = Object.entries(this.combatSelection())
      .filter(([, v]) => v)
      .map(([k]) => Number.parseInt(k, 10));
    this.creatingCombat.set(true);
    try {
      const combat = await this.api.createCombat({
        campaign: this.campaignId(),
        characters: selected,
      });
      this.newCombat.set(false);
      this.combats.reload();
      void this.router.navigate(['/combats', combat.id]);
    } finally {
      this.creatingCombat.set(false);
    }
  }

  protected async deleteCombat(): Promise<void> {
    const combat = this.combatToDelete();
    if (!combat) return;
    await this.api.deleteCombat(combat.id);
    this.combats.reload();
    this.combatToDelete.set(null);
  }

  protected async onBackgroundUploaded(fileName: string): Promise<void> {
    await this.api.updateCampaign(this.campaignId(), {
      background: `/files/${fileName}`,
    });
    this.campaign.reload();
    this.showBackground.set(false);
  }
}
