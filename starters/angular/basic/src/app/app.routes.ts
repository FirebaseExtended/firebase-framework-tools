import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home.component').then(c => c.HomeComponent)
  },
  {
    path: 'deferrable-views',
    loadComponent: () => import('./pages/deferrable-views/deferrable-views.component').then(c => c.DeferrableViewsComponent),
  },
  {
    path: 'ssg',
    loadComponent: () => import('./pages/ssg/ssg.component').then(c => c.SsgComponent)
  },
  {
    path: 'ssr',
    loadComponent: () => import('./pages/ssr/ssr.component').then(c => c.SsrComponent)
  },
  {
    path: '**',
    loadComponent: () => import('./pages/not-found/not-found.component').then(c => c.NotFoundComponent)
  }
];
