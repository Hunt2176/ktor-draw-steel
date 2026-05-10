import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, MatToolbarModule, MatButtonModule],
    template: `
    <div class="app-shell">
      <mat-toolbar class="top-nav" color="primary">
        <span class="title">Draw Steel</span>
        <span class="spacer"></span>
        <a mat-button routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">Home</a>
        <a mat-button routerLink="/campaigns" routerLinkActive="active">Campaigns</a>
      </mat-toolbar>

      <main class="page-body">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
    styles: [
        `
      .app-shell {
        min-height: 100vh;
        display: grid;
        grid-template-rows: auto 1fr;
      }

      .top-nav {
        position: sticky;
        top: 0;
        z-index: 10;
      }

      .title {
        font-weight: 600;
        letter-spacing: 0.2px;
      }

      .spacer {
        flex: 1;
      }

      a.active {
        background: rgba(255, 255, 255, 0.2);
      }

      .page-body {
        padding: 1.25rem;
      }

      @media (max-width: 640px) {
        .top-nav {
          gap: 0.4rem;
        }

        .title {
          font-size: 0.95rem;
        }

        .page-body {
          padding: 0.85rem;
        }
      }
    `,
    ],
})
export class AppComponent { }
