# Firebase Experimental framework-aware CLI

## Usage

```bash
$ npm i -g firebase-frameworks
$ cd <MY-APP>
$ firebase-frameworks init
$ firebase-frameworks build
$ firebase-frameworks serve
$ firebase-frameworks deploy
```

## Frameworks

<table>
    <thead>
        <tr><td></td><th colspan="4"><small>Build-in frameworks</small></th><td></td></tr>
        <tr><th></th><th colspan="2">Next.js</th><th colspan="2">Nuxt</th><th>Custom</th><th>Notes</th></tr>
        <tr><td></td><th><small>v11</small></th><th><small>v12</small></th><th><small>v2</small></th><th>v3</th><td></td></tr>
    </thead>
        <tr><th>SSR</th><td>✅</td><td>✅</td><td>✅</td><td>✅</td><td>&hellip;</td><td></td></tr>
        <tr><th>SPA</th><td>✅</td><td>✅</td><td>&hellip;</td><td>&hellip;</td><td>✅</td><td></td></tr>
        <tr><th>SSG</th><td>✅</td><td>✅</td><td>&hellip;</td><td>&hellip;</td><td>✅</td><td></td></tr>
        <tr><th>SWR/SWE</th><td>❌</td><td>❌</td><td>❌</td><td>❌</td><td>❌</td><td>Not available in Firebase Hosting</td></tr>
        <tr><th>On-demand regen</th><td>&hellip;</td><td>&hellip;</td><td>&hellip;</td><td>&hellip;</td><td>&hellip;</td><td>Investigating&hellip;</td></tr>
        <tr><th>Dev mode</th><td>🤒</td><td>🤒</td><td>&hellip;</td><td>&hellip;</td><td>&hellip;</td><td>WIP&hellip; Next.js is a bit unstable.</td></tr>
        <tr><th>Support</th><td colspan="2">experimental</td><td colspan="2">experimental</td><td>experimental</td><td></td></tr>
    <tbody>
    </tbody>
</table>

# Contributors

We'd love to accept your patches and contributions to this project. There are
just a few small guidelines you need to follow. [See CONTRIBUTING](./CONTRIBUTING.md).

## Building

Build and globally install this library

```bash
$ cd <YOUR-GIT-CHECKOUT>
$ npm i
$ npm run dev
```