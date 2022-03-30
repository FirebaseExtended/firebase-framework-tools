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
        <tr><th></th><th>Next.js</th><th>Nuxt</th><th>Custom</th></tr>
    </thead>
    <tbody>
        <tr><th>SSR</th><td>✅</td><td>✅<td>👍</td></tr>
        <tr><th>SPA</th><td>✅</td><td>✅</td><td>👍</td></tr>
        <tr><th>SSG</th><td>✅</td><td>✅</td><td>👍</td></tr>
        <tr><th>SWR/E</th><td>❌</a></td><td>❌</a></td><td>❌</a></td></tr>
        <tr><th>Auth+SSR</th><td>✅<td>👍</td><td>👍</td></tr>
        <tr><th>Dev Mode<br><sub><sup>Firebase Emulators</sub></sup></th><td>🤒</td><td>✖️</td><td>✖️</td></tr>
        <tr><th>Support</th><td>🔬</td><td>🔬</td><td>🔬</td></tr>
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