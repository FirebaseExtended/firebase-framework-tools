# Firebase CLI & Web Frameworks

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

## Overview

Firebase Hosting integrates with popular modern web frameworks including Angular and Next.js. Using Firebase Hosting and
Cloud Functions for Firebase with these frameworks, you can develop apps and microservices in your preferred framework
environment, and then deploy them in a managed, secure server environment. Support during this early preview includes
the following functionality:

* Deploy Web apps comprised of static web content
* Deploy Web apps that use pre-rendering / Static Site Generation (SSG)
* Deploy Web apps that use server-side Rendering (SSR)—full server rendering on demand

Firebase provides this functionality through the Firebase CLI. When initializing Hosting on the command line, you
provide information about your new or existing Web project, and the CLI sets up the right resources for your chosen Web
framework.

## Status

![Status: Experimental](https://img.shields.io/badge/Status-Experimental-blue)

This repository is maintained by Google but is not a supported Firebase product. Issues here are answered by
maintainers and other community members on GitHub on a best-effort basis.

## Enable framework-awareness

An experimental add-on to the Firebase CLI provides web framework support. To enable it, call the following:

```shell
firebase experiments:enable webframeworks
```

## Prerequisites

- Firebase CLI version 10.9.1 or later (see installation instructions [here](https://firebase.google.com/docs/cli))

## Serve locally

You can test your integration locally by following these steps:

1. Run `firebase serve` from the terminal. This should build your app and serve it using the Firebase CLI.
2. Open your web app at the local URL returned by the CLI (usually http://localhost:5000).

## Deploy your app to Firebase Hosting

When you're ready to share your changes with the world, deploy your app to your live site:

1. Run `firebase deploy` from the terminal.
2. Check your website on: `SITE_ID.web.app` or `PROJECT_ID.web.app` (or your custom domain, if you set one up)

## Integrate Angular

Easily deploy your Angular application to Firebase and serve dynamic content to your users.

### Prerequisites

- Firebase CLI version 10.9.1 or later (see installation instructions [here](https://firebase.google.com/docs/cli))
- (optional) Billing enabled on your Firebase Project (if you plan to use SSR)
- Optional: AngularFire

### Initialize Firebase

To get started, you'll need to initialize Firebase for your framework project. Use the Firebase CLI for a new project,
or modify `firebase.json` for an existing project.

#### Initialize a new project

1. Run the initialization command from the CLI:

```shell
firebase init hosting
```

1. Choose your hosting source directory; this could be an existing Angular app.
1. Choose "Dynamic web hosting with web framework."
1. Choose Angular.

#### Initialize an existing project

Change your hosting config in `firebase.json` to have a `source` option, rather than a `public` option. For example:

```json
{
  "hosting": {
    "source": "./path-to-your-angular-workspace"
  }
}
```

### Serve static content

After initializing Firebase, you can serve static content with the standard deployment command:

```shell
firebase deploy
```

### Pre-render dynamic content

To prerender dynamic content in Angular, you need to set up Angular Universal. The Firebase CLI expects Express Engine:

```shell
ng add @nguniversal/express-engine
```

[See the Angular Universal guide for more information.](https://angular.io/guide/universal)

#### Add prerender URLs

By default, only the root directory will be prerendered. You can add additional routes by locating the prerender step in
`angular.json` and adding more routes:

```json
{
  "prerender": {
    "builder": "@nguniversal/builders:prerender",
    "options": {
      "routes": [
        "/",
        "ANOTHER_ROUTE",
        "AND_ANOTHER"
      ]
    },
    "configurations": {
      /* ... */
    },
    "defaultConfiguration": "production"
  }
}
```

Firebase also respects `guessRoutes` or a `routes.txt` file in the hosting root, if you need to customize further.
See [Angular’s prerendering guide](https://angular.io/guide/prerendering) for more information on those options.

#### Optional: add a server module

#### Deploy

When you deploy with `firebase deploy`, Firebase builds your browser bundle, your server bundle, and prerenders the
application. These elements are deployed to Hosting and Cloud Functions.

#### Custom deploy

The Firebase CLI assumes that you have server, build, and prerender steps in your schematics with a production
configuration.

If you want to tailor the CLI's assumptions, configure ng deploy and alter the configuration in `angular.json`. For
example, you could disable SSR and serve pre-rendered content exclusively by removing `serverTarget`:

```json
{
  "deploy": {
    "builder": "@angular/fire:deploy",
    "options": {
      "browserTarget": "app:build:production",
      "serverTarget": "app:server:production",
      "prerenderTarget": "app:prerender:production"
    }
  }
}
```

### Optional: integrate with the Firebase JS SDK

When including Firebase JS SDK methods in both server and client bundles, guard against runtime errors by checking `isSupported()` before using the product. [Not all products are supported in all environments.](https://firebase.google.com/docs/web/environments-js-sdk#other_environments)

Hint: consider using AngularFire, which does this for you automatically.

### Optional: integrate with the Admin SDK

Admin bundles will fail if included in your browser build, so consider providing them in your server module and injecting as an optional dependency:

```typescript
// your-component.ts
import type { app } from 'firebase-admin';
import { FIREBASE_ADMIN } from '../app.module'; 

@Component({...})
export class YourComponent {

  constructor(@Optional() @Inject(FIREBASE_ADMIN) admin: app.App) {
    ...
  }
}

// app.server.module.ts
import * as admin from 'firebase-admin';
import { FIREBASE_ADMIN } from './app.module';

@NgModule({
  …
  providers: [
    …
    { provide: FIREBASE_ADMIN, useFactory: () => admin.apps[0] || admin.initializeApp() }
  ],
})
export class AppServerModule {}

// app.module.ts
import type { app } from 'firebase-admin';

export const FIREBASE_ADMIN = new InjectionToken<app.App>('firebase-admin');

```

### Serve fully dynamic content with SSR

#### Optional: integrate with Firebase Authentication

The web framework-aware Firebase deployment tooling automatically keeps client and server state in sync using cookies. The Express `res.locals` object will optionally contain an authenticated Firebase App instance (`firebaseApp`) and the currently signed in user (`currentUser`). This can be injected into your module via the REQUEST token (exported from @nguniversal/express-engine/tokens).


## Integrate Next.js

Using the Firebase CLI, you can deploy your Next.js Web apps to Firebase and serve them with Firebase Hosting.  The CLI respects your Next.js settings and translates them to Firebase settings with zero or minimal extra configuration on your part. If your app includes dynamic server-side logic, the CLI deploys that logic to Cloud Functions for Firebase.

Note: Apps with dynamic server-side logic must provide a billing instrument during Cloud Functions setup. Also note that all frameworks-based functionality provided by the Firebase CLI is currently has experimental status, and may change in backward-incompatible ways.

### Before you begin

Before you get started deploying your Next.js app to Firebase, first review the following requirements and options:

- All projects must use firebase-tools 10.8 or higher 
- If your project requires SSR, you must provide a billing instrument 
- Optional: use the experimental ReactFire library to benefit from its Firebase-friendly features

### Initialize Firebase

To get started, you'll need to initialize Firebase for your framework project using the Firebase CLI.

1. Run the initialization command from the CLI and then follow the prompts:
```shell
firebase init hosting
```
2. Choose your hosting source directory; this could be an existing next.js app.
3. Choose "Dynamic web hosting with web framework"
4. Choose Next.js.

### Serve static content

After initializing Firebase, you can serve static content with the standard deployment command:

```shell
firebase deploy
```

You can [view your deployed app](https://firebase.google.com/docs/hosting/test-preview-deploy#view-changes) on its live site.

### Pre-render dynamic content (SSG)

The Firebase CLI will detect usage of [getStaticProps](https://nextjs.org/docs/basic-features/data-fetching/get-static-props) and [getStaticPaths](https://nextjs.org/docs/basic-features/data-fetching/get-static-paths).

#### Optional: integrate with Firebase JS SDK

When including Firebase JS SDK methods in both server and client bundles, guard against runtime errors by checking `isSupported()` before using the product. [Not all products are supported in all environments.](https://firebase.google.com/docs/web/environments-js-sdk#other_environments)

Tip: consider using ReactFire, which does this for you automatically.

#### Optional: integrate with the Admin SDK

Admin SDK bundles will fail if included in your browser build;  refer to them only inside [getStaticProps](https://nextjs.org/docs/basic-features/data-fetching/get-static-props) and [getStaticPaths](https://nextjs.org/docs/basic-features/data-fetching/get-static-paths).

### Serve fully dynamic content (SSR)

The Firebase CLI will detect usage of [getServerSideProps](https://nextjs.org/docs/basic-features/data-fetching/get-server-side-props).

### Configure Hosting behavior with `next.config.js`

#### Image Optimization

Using [Next.js Image Optimization](https://nextjs.org/docs/basic-features/image-optimization) is supported, but it will trigger creation of a Cloud Function, even if you’re not using SSR.

Note: Because of this, Image Optimization and Hosting Preview Channels don’t interoperate well together.

#### Redirects, Rewrites, and Headers

Firebase CLI respects [redirects](https://nextjs.org/docs/api-reference/next.config.js/redirects), [rewrites](https://nextjs.org/docs/api-reference/next.config.js/rewrites), and [headers](https://nextjs.org/docs/api-reference/next.config.js/headers) in `next.config.js`, converting them to their respective equivalent Firebase Hosting configuration at deploy time.

If a Next.js redirect, rewrite, or header cannot be converted to an equivalent Firebase Hosting header, it falls back and builds a Cloud Function—even if you aren’t using Image Optimization or SSR.

#### Optional: integrate with Firebase Authentication

The web framework-aware Firebase deployment tooling will automatically keep client and server state in sync using cookies. There are some methods provided for accessing the authentication context in SSR:

* The Express `res.locals` object will optionally contain an authenticated Firebase App instance (`firebaseApp`) and the currently signed in user (`currentUser`).  This can be accessed in `getServerSideProps`.
* The authenticated Firebase App name is provided on the route query  (`__firebaseAppName`). This allows for manual integration while in context:

```typescript
  // get the authenticated Firebase App
  const firebaseApp = getApp(useRouter().query.__firebaseAppName);
```

## Integrate other frameworks with Express.js

With some additional configuration, you can build on the basic CLI functionality to extend integration support to Frameworks other than Angular and Next.js.

### What you’ll need before you begin

Prerequisites/what you need 
* firebase-tools 10.8+ 
* If SSR, billing details


### Initialize Firebase

To get started, you'll need to initialize Firebase for your framework project. Use the Firebase CLI for a new project,
or modify `firebase.json` for an existing project.

#### Initialize a new project

1. Run the initialization command from the CLI:
```shell
firebase init hosting
```
2. Choose your hosting source directory; this could be an existing web app
3. Choose "Dynamic web hosting with web framework"
4. Choose Express.js / custom


#### Initialize an existing project

Change your hosting config in firebase.json to have a `source` option, rather than a `public` option. For example:

```json
{
  "hosting": {
    "source": "."
  }
}
```

### Serve static content

#### Configure

In order to know how to deploy your application, the Firebase CLI needs to be able to both build your app and know where your tooling places the assets destined for Hosting. This is accomplished with the NPM build script and CJS directories directive in `package.json`.

Given the following package.json:

```json
{
    "name": "express-app",
    "version": "0.0.0",
    "scripts": {
        "build": "spack",
        "static": "cp static/* dist",
        "prerender": "ts-node prerender.ts"
    },
    …
}
```

The Firebase CLI only calls your build script, so you’ll need to ensure that your build script is exhaustive.

Hint: you can add additional steps using &&. If you have a lot of steps consider a shell script or tooling like [npm-run-all](https://www.npmjs.com/package/npm-run-all) or [wireit](https://www.npmjs.com/package/wireit).

```json
{
    "name": "express-app",
    "version": "0.0.0",
    "scripts": {
        "build": "spack && npm run static && npm run prerender",
        "static": "cp static/* dist",
        "prerender": "ts-node prerender.ts"
    },
    …
}
```

If your framework doesn’t support pre-rendering out of the box, consider using a tool like [Rendertron](https://github.com/GoogleChrome/rendertron). Rendertron will allow you to make headless Chrome requests against a local instance of your app, so you can save the resulting HTML to be served on Hosting.

Finally, different frameworks and build tools store their artifacts in different places. Use `directories.serve` to tell the CLI where your build script is outputting the resulting artifacts:

```json
{
    "name": "express-app",
    "version": "0.0.0",
    "scripts": {
        "build": "spack && npm run static && npm run prerender",
        "static": "cp static/* dist",
        "prerender": "ts-node prerender.ts"
    },
    "directories": {
        "serve": "dist"
    },
    …
} 
```

#### Deploy

```shell
firebase deploy
```

Your application should now be configured as an SPA and deployed to Firebase Hosting.

### Serve Dynamic Content

To serve up your Express app on Cloud Functions, ensure that your Express app (or express-style URL handler) is exported in such a way that Firebase can find it after your library has been NPM packed.

To accomplish this, ensure that your files directive includes everything needed for the server and your main entry point is set up correctly in `package.json`:

```json
{
    "name": "express-app",
    "version": "0.0.0",
    "scripts": {
        "build": "spack && npm run static && npm run prerender",
        "static": "cp static/* dist",
        "prerender": "ts-node tools/prerender.ts"
    },
    "directories": {
        "serve": "dist"
    },
    "files": ["dist", "server.js"],
    "main": "server.js",
    ...
}
```

Export your express app from a function named `app`:

```js
// server.js
export function app() {
  const server = express();
   …
   return server;
}
```

Or if you’d rather export an express-style URL handler, name it `handle`:

```js
export function handle(req, res) {
   res.send(‘hello world’);
}
```

#### Deploy

```shell
firebase deploy
```

Your application should now deploy your static content to Firebase Hosting and fall back to your Express app hosted on Cloud Functions.

### Optional: integrate with Firebase Authentication

The web framework-aware Firebase deploy tooling will automatically keep client and server state in sync using cookies. To access the authentication context, the Express `res.locals` object optionally contains an authenticated Firebase App instance (`firebaseApp`) and the currently signed in User (`currentUser`).

### Common Configurations

#### Add `cleanUrls` option

By default, a page created on `/pages/foo/bar.jsx` is only accessible through the url `/foo/bar.html`. To make the page
accessible on `/foo/bar` instead, add `cleanUrls` option to your hosting config in firebase.json.

```json
{
  "hosting": {
    "source": ".",
    "cleanUrls": true
  }
}
```
# Contributors

We'd love to accept your patches and contributions to this project. There are just a few small guidelines you need to
follow. [See CONTRIBUTING](./CONTRIBUTING.md).

## Building

```bash
$ cd <YOUR-GIT-CHECKOUT>
$ npm i
$ npm run build
```
