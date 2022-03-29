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
        <tr><td></td><th colspan="4"><small>Build-in frameworks</small></th></tr>
        <tr><th></th><th colspan="2">Next.js</th><th colspan="2">Nuxt</th><th>Custom</th></tr>
        <tr><td></td><th><small>v11</small></th><th><small>v12</small></th><th><small>v2</small></th><th>v3</th></tr>
    </thead>
    <tbody>
        <tr><th>SSR</th><td colspan="2">✅</td><td colspan="2">✅<td>✅</td></tr>
        <tr><th>SPA</th><td colspan="2">✅</td><td><small>✅</small></td><td><small>✖️</small></td><td>✅</td></tr>
        <tr><th>SSG</th><td colspan="2">✅</td><td><small>✅</small></td><td><small>✖️</small></td><td>✅</td></tr>
        <tr><th>SWR/SWE</th><td colspan="2">✖️</td><td colspan="2">✖️</td><td>✖️</td></tr>
        <tr><th>Auth-aware SSR</th><td colspan="2"><small>Built into <code>reactfire</code>'s hooks.</small></td><td colspan="2">DIY</td><td>DIY</td></tr>
        <tr><th>Local emulator<br><small>(dev mode)</small></th><td colspan="2">🤒</td><td colspan="2">✅</td><td>✅</td></tr>
        <tr><th>Support</th><td colspan="2">experimental</td><td colspan="2">experimental</td><td>experimental</td></tr>
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