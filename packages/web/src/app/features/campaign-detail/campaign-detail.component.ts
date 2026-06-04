import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { faBook, faBriefcase, faImage, faPlus, faShieldHalved } from '@fortawesome/free-solid-svg-icons';
import type { Character, Combat } from '../../core/models';
import { emptyCharacter } from '../../core/models';
import { ApiService } from '../../core/api.service';
import { CampaignStore } from '../../core/campaign-store.service';
import { CampaignBackgroundService } from '../../core/campaign-background.service';
import { ErrorService } from '../../core/error.service';
import { ActionIconComponent } from '../../ui/action-icon.component';
import { ButtonComponent } from '../../ui/button.component';
import { CardComponent } from '../../ui/card.component';
import { IconComponent } from '../../ui/icon.component';
import { ModalComponent } from '../../ui/modal.component';
import { EmptyStateComponent } from '../../ui/empty-state.component';
import { SectionHeaderComponent } from '../../ui/section-header.component';
import { CharacterCardComponent } from '../components/character-card.component';
import { CharacterEditorComponent, type CharacterEditorResult } from '../components/character-editor.component';
import { CharacterSelectorComponent, type CharacterSelection } from '../components/character-selector.component';
import { InventoryListComponent } from '../components/inventory-list.component';
import { UploadModalComponent } from '../components/upload-modal.component';

/** Campaign hub: combats, character roster, background, and display link. */
@Component({
  selector: 'app-campaign-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ActionIconComponent,
    ButtonComponent,
    CardComponent,
    IconComponent,
    ModalComponent,
    EmptyStateComponent,
    SectionHeaderComponent,
    CharacterCardComponent,
    CharacterEditorComponent,
    CharacterSelectorComponent,
    InventoryListComponent,
    UploadModalComponent,
  ],
  template: `
    @if (campaign(); as details) {
      <div class="flex flex-col gap-4 p-3">
        <app-section-header>
          <span class="text-xl">{{ details.campaign.name }}</span>
          <ng-container actions>
            <app-action-icon variant="outline" (clicked)="goToDisplay()"><app-icon [name]="book" /></app-action-icon>
            <app-action-icon variant="outline" (clicked)="backgroundUploadOpen.set(true)"><app-icon [name]="image" /></app-action-icon>
          </ng-container>
        </app-section-header>

        <!-- Combats -->
        <div class="flex flex-col gap-2">
          <app-section-header>
            <span class="text-lg">Combats</span>
            <app-action-icon actions (clicked)="newCombatOpen.set(true)"><app-icon [name]="plus" /></app-action-icon>
          </app-section-header>
          @if (combats(); as combatList) {
            @if (combatList.length === 0) {
              <app-empty-state
                [icon]="shield"
                title="No combats yet"
                message="Start a combat to track initiative and rounds."
              />
            } @else {
              <div class="grid grid-cols-[repeat(auto-fill,minmax(16rem,1fr))] gap-2">
                @for (combat of combatList; track combat.id) {
                  <app-card>
                    <div class="flex items-center justify-between gap-2">
                      <h3 class="font-display text-lg font-bold">Round: {{ combat.round }}</h3>
                      <div class="flex items-center gap-2">
                        <app-button size="sm" (clicked)="viewCombat(combat)">View</app-button>
                        <app-button size="sm" color="red" variant="subtle" (clicked)="combatToDelete.set(combat)">Delete</app-button>
                      </div>
                    </div>
                  </app-card>
                }
              </div>
            }
          }
        </div>

        <!-- Characters -->
        <div class="flex flex-col gap-2">
          <app-section-header>
            <span class="text-lg">Characters</span>
            <app-action-icon actions (clicked)="newCharacterOpen.set(true)"><app-icon [name]="plus" /></app-action-icon>
          </app-section-header>
          <div class="grid grid-cols-[repeat(auto-fill,minmax(16rem,1fr))] items-start gap-2">
            @for (character of characters(); track character.id) {
              <app-character-card [character]="character" type="tile" (portraitClick)="viewCharacter(character)">
                <div cardRight class="flex-shrink">
                  <app-action-icon (clicked)="inventoryCharacterId.set(character.id)"><app-icon [name]="briefcase" /></app-action-icon>
                </div>
              </app-character-card>
            }
          </div>
        </div>
      </div>

      <!-- Inventory modal -->
      <app-modal
        [opened]="inventoryCharacter() != null"
        [title]="'Inventory for ' + (inventoryCharacter()?.name ?? '')"
        (closed)="inventoryCharacterId.set(null)"
      >
        @if (inventoryCharacter(); as ic) {
          <app-inventory-list [characterId]="ic.id" [items]="ic.inventory" />
        }
      </app-modal>

      <!-- New character modal -->
      <app-modal title="New Character" [opened]="newCharacterOpen()" (closed)="newCharacterOpen.set(false)">
        @if (newCharacterOpen()) {
          <app-character-editor [character]="blankCharacter" (submitted)="createCharacter($event)" />
        }
      </app-modal>

      <!-- New combat modal -->
      <app-modal title="New Combat" [opened]="newCombatOpen()" (closed)="newCombatOpen.set(false)">
        <div class="flex flex-col gap-3">
          <app-character-selector [characters]="details.characters" (changed)="combatSelection.set($event)" />
          <hr class="ds-divider" />
          <div class="flex justify-end gap-2">
            <app-button color="gray" (clicked)="newCombatOpen.set(false)">Cancel</app-button>
            <app-button [disabled]="creatingCombat()" (clicked)="createCombat()">Create</app-button>
          </div>
        </div>
      </app-modal>

      <!-- Delete combat modal -->
      <app-modal title="Delete Combat" [opened]="combatToDelete() != null" (closed)="combatToDelete.set(null)">
        <div class="flex flex-col gap-3">
          <span>Are you sure you want to delete this combat?</span>
          <hr class="ds-divider" />
          <div class="flex justify-end gap-2">
            <app-button color="gray" (clicked)="combatToDelete.set(null)">Cancel</app-button>
            <app-button color="red" (clicked)="deleteCombat()">Delete</app-button>
          </div>
        </div>
      </app-modal>

      <!-- Background upload -->
      <app-upload-modal
        [show]="backgroundUploadOpen()"
        accept=".png,.jpg,.jpeg,.webp"
        (hide)="backgroundUploadOpen.set(false)"
        (complete)="setBackground($event)"
      />
    }
  `,
})
export class CampaignDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(ApiService);
  private readonly store = inject(CampaignStore);
  private readonly background = inject(CampaignBackgroundService);
  private readonly errors = inject(ErrorService);

  protected readonly book = faBook;
  protected readonly image = faImage;
  protected readonly plus = faPlus;
  protected readonly briefcase = faBriefcase;
  protected readonly shield = faShieldHalved;
  protected readonly blankCharacter = emptyCharacter();

  private readonly params = toSignal(this.route.paramMap, { requireSync: true });
  private readonly id = computed(() => Number.parseInt(this.params().get('id') ?? '', 10));

  protected readonly campaign = computed(() => {
    const id = this.id();
    if (Number.isNaN(id)) return undefined;
    return this.store.campaign(id)();
  });
  protected readonly combats = computed(() => {
    const id = this.id();
    if (Number.isNaN(id)) return undefined;
    return this.store.combatsFor(id)();
  });

  protected readonly characters = computed(() =>
    (this.campaign()?.characters ?? []).filter((c) => !c.offstage),
  );

  readonly newCharacterOpen = signal(false);
  readonly newCombatOpen = signal(false);
  readonly combatToDelete = signal<Combat | null>(null);
  readonly backgroundUploadOpen = signal(false);
  readonly inventoryCharacterId = signal<number | null>(null);
  readonly combatSelection = signal<CharacterSelection>({});
  readonly creatingCombat = signal(false);

  protected readonly inventoryCharacter = computed(() => {
    const id = this.inventoryCharacterId();
    if (id == null) return null;
    return this.campaign()?.characters.find((c) => c.id === id) ?? null;
  });

  constructor() {
    if (Number.isNaN(this.id())) void this.router.navigate(['/']);
    effect(() => this.background.apply(this.campaign()?.campaign));
  }

  goToDisplay(): void {
    void this.router.navigate(['/campaigns', this.id(), 'display']);
  }
  viewCombat(combat: Combat): void {
    void this.router.navigate(['/combats', combat.id]);
  }
  viewCharacter(character: Character): void {
    void this.router.navigate(['/characters', character.id]);
  }

  async createCharacter(result: CharacterEditorResult): Promise<void> {
    try {
      await this.api.createCharacter({ ...result, campaign: this.id(), user: 1 });
      this.store.refetchCampaign(this.id());
      this.newCharacterOpen.set(false);
    } catch (err) {
      this.errors.set(err);
    }
  }

  async createCombat(): Promise<void> {
    this.creatingCombat.set(true);
    try {
      const characters = Object.entries(this.combatSelection())
        .filter(([, v]) => v)
        .map(([k]) => Number.parseInt(k, 10));
      const combat = await this.api.createCombat({ campaign: this.id(), characters });
      this.store.refetchCombats(this.id());
      this.newCombatOpen.set(false);
      void this.router.navigate(['/combats', combat.id]);
    } finally {
      this.creatingCombat.set(false);
    }
  }

  async deleteCombat(): Promise<void> {
    const combat = this.combatToDelete();
    if (!combat) return;
    await this.api.deleteCombat(combat.id);
    this.store.refetchCombats(this.id());
    this.combatToDelete.set(null);
  }

  async setBackground(fileName: string): Promise<void> {
    await this.api.updateCampaign(this.id(), { background: `/files/${fileName}` });
    this.store.refetchCampaign(this.id());
    this.backgroundUploadOpen.set(false);
  }
}
