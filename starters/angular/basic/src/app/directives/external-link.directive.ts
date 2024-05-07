import { isPlatformBrowser } from '@angular/common';
import { Directive, ElementRef, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { WINDOW } from '../providers/window';

@Directive({
  selector: 'a[href]:not([noBlankForExternalLink])',
  host: {
    '[attr.target]': 'target',
    '[attr.rel]': 'rel'
  },
  standalone: true
})
export class ExternalLinkDirective implements OnInit {
  private readonly anchor: ElementRef<HTMLAnchorElement> = inject(ElementRef);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly window = inject(WINDOW);

  target?: '_blank' | '_self' | '_parent' | '_top' | '';
  rel?: 'noopener noreferrer' | '';

  ngOnInit(): void {
    this.setAnchorTarget();
  }

  private setAnchorTarget(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    if (this.isExternalLink(this.anchor.nativeElement.href, this.window.location.origin)) {
      this.target = '_blank';
      this.rel = 'noopener noreferrer';
    }
  }

  private isExternalLink = (link: string, windowOrigin: string) => new URL(link).origin !== windowOrigin;
}
