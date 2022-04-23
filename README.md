# Firebase CLI framework-awareness

## Frameworks

<table>
    <thead>
        <tr><td></td><th colspan="3"><sub><sup>Built-in frameworks</sub></sup></th><td></td></tr>
        <tr><th></th><th>Next.js</th><th>Angular</th><th>Nuxt</th><th>Custom</th></tr>
    </thead>
    <tbody>
        <tr><th>SSR</th><td>✅</td><td>✅</td><td>✅</td><td>👍</td></tr>
        <tr><th>SPA</th><td>✅</td><td>✅</td><td>✅</td><td>👍</td></tr>
        <tr><th>SSG</th><td>✅</td><td>✅</td><td>✅</td><td>👍</td></tr>
        <tr><th>SWR/E</th><td>❌</td><td>❌</td><td>❌</td><td>❌</td></tr>
        <tr><th>Auth+SSR</th><td>✅</td><td>✅</td><td>👍</td><td>👍</td></tr>
        <tr><th>Status</th><td>🔬</td><td>🔬</td><td>🔬</td><td>🔬</td></tr>
    </tbody>
</table>

## Status

![Status: Experimental](https://img.shields.io/badge/Status-Experimental-blue)

This repository is maintained by Googlers but is not a supported Firebase product. Issues here are answered by maintainers and other community members on GitHub on a best-effort basis.

# Contributors

We'd love to accept your patches and contributions to this project. There are
just a few small guidelines you need to follow. [See CONTRIBUTING](./CONTRIBUTING.md).

## Building

```bash
$ cd <YOUR-GIT-CHECKOUT>
$ npm i
$ npm run build
```