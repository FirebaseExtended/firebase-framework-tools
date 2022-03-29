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
        <tr><td></td><th colspan="4"><sub><sup>Build-in frameworks</sub></sup></th><th></th></tr>
        <tr><th></th><th colspan="2">Next.js</th><th colspan="2">Nuxt</th><th>Custom</th></tr>
        <tr><td></td><th><sub><sup>v11</sub></sup></th><th><sub><sup>v12</sub></sup></th><th><sub><sup>v2</sub></sup></th><th><sub><sup>v3</sub></sup></th><th></th></tr>
    </thead>
    <tbody>
        <tr><th>SSR</th><td colspan="2">✅</td><td colspan="2">✅<td>✅</td></tr>
        <tr><th>SPA</th><td colspan="2">✅</td><td><sub><sup>✅</sub></sup></td><td><sub><sup>✖️</sub></sup></td><td>✅</td></tr>
        <tr><th>SSG</th><td colspan="2">✅</td><td><sub><sup>✅</sub></sup></td><td><sub><sup>✖️</sub></sup></td><td>✅</td></tr>
        <tr><th>SWR/E</th><td colspan="2">✖️</td><td colspan="2">✖️</td><td>✖️</td></tr>
        <tr><th>Auth+SSR</th><td colspan="2"><small>Built into <code>reactfire</code>'s hooks.</small></td><td colspan="2">DIY</td><td>DIY</td></tr>
        <tr><th>Local emulator<br><sub><sup>dev mode</sub></sup></th><td colspan="2">🤒</td><td colspan="2">✅</td><td>✅</td></tr>
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