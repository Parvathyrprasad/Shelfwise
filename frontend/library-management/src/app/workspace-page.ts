import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-workspace-page',
  standalone: true,
  template: `
    <section class="page-intro">
      <p class="eyebrow">SHELFWISE WORKSPACE</p>
      <h1>{{ title }}</h1>
      <p class="description">{{ description }}</p>
    </section>

    <section class="welcome-panel">
      <span class="panel-label">GETTING STARTED</span>
      <h2>Your library, thoughtfully organised.</h2>
      <p>
        This workspace will bring your library operations together.
        The features for this section will be added next.
      </p>
    </section>
  `,
  styles: [`
    .page-intro {
      margin-bottom: 30px;
    }

    .eyebrow {
      color: #477c78;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 1.5px;
      margin-bottom: 10px;
    }

    h1 {
      margin-bottom: 8px;
      font-size: 30px;
      font-weight: 650;
      letter-spacing: -1px;
    }

    .description {
      color: #777c7d;
      font-size: 14px;
    }

    .welcome-panel {
      max-width: 760px;
      padding: 30px;
      background: #ffffff;
      border: 1px solid #dedbd2;
      border-radius: 12px;
    }

    .panel-label {
      color: #c66b48;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 1.2px;
    }

    h2 {
      margin: 16px 0 10px;
      font-size: 21px;
    }

    .welcome-panel p {
      max-width: 480px;
      color: #777c7d;
      line-height: 1.7;
    }
  `]
})
export class WorkspacePage {
  title: string;
  description: string;

  constructor(private route: ActivatedRoute) {
    this.title = this.route.snapshot.data['title'] as string;
    this.description = this.route.snapshot.data['description'] as string;
  }
}
