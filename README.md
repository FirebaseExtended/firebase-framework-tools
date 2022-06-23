# Firebase CLI framework-awareness

## Frameworks

<table>
    <thead>
        <tr><td></td><th colspan="3"><sub><sup>Built-in frameworks</sub></sup></th><td></td></tr>
        <tr>
            <th></th>
            <th><a href="#deploy-nextjs">Next.js</a></th>
            <th><a href="#deploy-angular">Angular</a></th>
            <th>Nuxt</th>
            <th>Custom</th>
        </tr>
    </thead>
    <tbody>
        <tr><th>SSR</th><td>✅</td><td>✅</td><td>🔜</td><td>👍</td></tr>
        <tr><th>SPA</th><td>✅</td><td>✅</td><td>🔜</td><td>👍</td></tr>
        <tr><th>SSG</th><td>✅</td><td>✅</td><td>🔜</td><td>👍</td></tr>
        <tr><th>SWR/E</th><td>❌</td><td>❌</td><td>🔜</td><td>❌</td></tr>
        <tr><th>Auth+SSR</th><td>✅</td><td>✅</td><td>🔜</td><td>👍</td></tr>
        <tr><th>Status</th><td>🔬</td><td>🔬</td><td>🔬</td><td>🔬</td></tr>
    </tbody>
</table>

## Status

![Status: Experimental](https://img.shields.io/badge/Status-Experimental-blue)

This repository is maintained by Googlers but is not a supported Firebase product. Issues here are answered by maintainers and other community members on GitHub on a best-effort basis.

# Enable framework-awareness

This is an experimental addon to the Firebase CLI to add web framework support, to enable it call the following:

```shell
firebase --open-sesame frameworkawareness
```

# Deploy Next.js

Easily deploy your Next.js application to Firebase and serve dynamic content to your users.

## What you'll need before you begin

### Prerequisites
- Firebase CLI version 10.9.1 or later (see installation instructions [here](https://firebase.google.com/docs/cli))
- (optional) Billing enabled on your Firebase Project (if you plan to use SSR)

### Initialize Firebase
To get started, you'll need to initialize Firebase for your framework project. Use the Firebase CLI for a new project, or modify `firebase.json` for an existing project.

#### Initialize a new project

Run the initialization command from the CLI:
    ```shell
    firebase init hosting
    ```

#### Initialize an existing project

Change your hosting config in firebase.json to have a `source` option, rather than a `public` option. For example:

```json
{
  "hosting": {
    "source": "."
  }
}
```

### Serve locally

You can test your integration locally by following these steps:
1. Run `firebase serve` from the terminal. This should build your Next.js app and serve it using the Firebase CLI.
2. Open your web app at the local URL returned by the CLI (usually http://localhost:5000)

### Deploy your app to Firebase Hosting

When you're ready to share your changes with the world, deploy your Next.js app to your live site:
1. Run `firebase deploy` from the terminal.
2. Check your website on: `SITE_ID.web.app` or `PROJECT_ID.web.app` (or your custom domain, if you did setup one)

# Deploy Angular

Easily deploy your Angular application to Firebase and serve dynamic content to your users.

## What you'll need before you begin

### Prerequisites
- Firebase CLI version 10.9.1 or later (see installation instructions [here](https://firebase.google.com/docs/cli))
- (optional) Billing enabled on your Firebase Project (if you plan to use SSR)

### Initialize Firebase
To get started, you'll need to initialize Firebase for your framework project. Use the Firebase CLI for a new project, or modify `firebase.json` for an existing project.

#### Initialize a new project

Run the initialization command from the CLI:

```shell
firebase init hosting
```

#### Initialize an existing project

Change your hosting config in `firebase.json` to have a `source` option, rather than a `public` option. For example:

```json
{
  "hosting": {
    "source": "."
  }
}
```

### Serve locally

You can test your integration locally by following these steps:
1. Run `firebase serve` from the terminal. This should build your Angular app and serve it using the Firebase CLI.
2. Open your web app at the local URL returned by the CLI (usually http://localhost:5000)

### Deploy your app to Firebase Hosting

When you're ready to share your changes with the world, deploy your Angular app to your live site:
1. Run `firebase deploy` from the terminal.
2. Check your website on: `SITE_ID.web.app` or `PROJECT_ID.web.app` (or your custom domain, if you did setup one)

# Contributors

We'd love to accept your patches and contributions to this project. There are
just a few small guidelines you need to follow. [See CONTRIBUTING](./CONTRIBUTING.md).

## Building

```bash
$ cd <YOUR-GIT-CHECKOUT>
$ npm i
$ npm run build
```
