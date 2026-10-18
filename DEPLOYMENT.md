# HubLink Logistics: run and deploy

## Run locally

This is a static HTML, CSS, and JavaScript project with no build step or package installation. Serve the project directory (the directory containing `index.html`) with VS Code Live Server or another static HTTP server. Opening `index.html` as a `file://` URL does not enable the service worker or PWA installation.

To check on a phone over the same Wi-Fi, bind the development server to the computer's LAN interface and open its LAN URL on the phone. This is for local testing; service workers and installation generally require HTTPS, with localhost as the development exception. For public access, deploy to an HTTPS static host.

## GitHub Pages

1. Create or choose a GitHub repository. Put the contents of this project directory (`index.html`, `style.css`, `script.js`, `manifest.webmanifest`, `service-worker.js`, and `icons/`) at the repository root. GitHub Pages branch publishing does not let you select an arbitrary nested project directory.
2. Push the files to the branch you intend to publish.
3. In the repository, open **Settings → Pages**. Under **Build and deployment**, choose **Deploy from a branch**, select the branch and **/(root)**, then save.
4. Wait for the Pages deployment to finish. Open the HTTPS URL shown in Pages. For a project site the URL includes the repository subpath, typically `https://<owner>.github.io/<repository>/`.
5. Verify `manifest.webmanifest`, `service-worker.js`, and `icons/hublink.svg` load under that same subpath. The app uses relative first-party asset, manifest, and service-worker paths; do not change them to root-absolute paths such as `/script.js`, which would break project sites.

No custom GitHub Actions workflow or routing configuration is required for this static app. If a custom domain is used, configure it in Pages and keep HTTPS enabled.

## Vercel

1. Import the GitHub repository into Vercel (or deploy the project directory with the Vercel CLI).
2. Set the **Root Directory** to the directory containing `index.html` (for example, `hublink-prototype` if the app is nested in the repository).
3. Select **Other** as the framework preset. Leave the build command empty; there is no build step. Set the output directory to `.` if Vercel requires an output directory. Do not configure a rewrite to a nonexistent single-page-app route.
4. Deploy and open the HTTPS deployment URL. Vercel serves the app at the domain root, where the same relative URLs resolve correctly.

No `vercel.json`, backend, or dependency installation is required for the current application. Keep the default static-file MIME handling so `.webmanifest` and `.js` are served as files. Add no secrets to frontend files or public environment variables.

## Paths, PWA, and offline behavior

The HTML loads CSS, JavaScript, and icons using relative paths. The manifest uses a relative `start_url` and `scope`; the page registers `./service-worker.js`, whose default scope is its containing directory. This is intended to support both a repository subpath on Pages and the root on Vercel. Keep the project files together at the deployed site path. After changing the cached shell assets, increment `CACHE_NAME` in `service-worker.js` so installed clients update their shell cache.

The manifest and SVG icon are present, and the service worker caches only the static shell. This is not a claim that installation or offline operation has been verified in a browser. The map, map tiles, fonts, and CDN libraries need a network connection; the app does not provide a complete offline workflow. Keep the OpenStreetMap attribution visible and follow the tile provider's usage policy. Do not cache account records, addresses, or authenticated responses in the service worker.

## Data, accounts, and security limitations

The app stores records in browser `localStorage`. That storage belongs to one browser profile on one device and does not synchronize between users or devices. Clearing browser data can remove those records. Deploying the static files does not create shared accounts, a database, or cloud backups.

Login and Buyer/Seller/Administrator role checks run in frontend code against local data. They are useful for this prototype's UI workflows but are not secure authentication or server-side authorization. Anyone able to inspect or modify the browser can bypass frontend checks. Production use with real accounts or private customer data requires a separately designed secure backend/API, database, server-side password hashing and role authorization, and appropriate privacy/security controls. This deployment adds none of those components.

## Deployed-site manual checklist

- Open the HTTPS URL at desktop and mobile sizes; verify the app shell, styles, icons, and navigation load without missing-file errors.
- For GitHub Pages, verify the URL includes the repository path and that the manifest and service worker load from that path. For Vercel, verify the root deployment URL.
- In browser developer tools, check for JavaScript errors, failed asset requests, and service-worker registration errors.
- Test login, logout, role-specific UI, forms, CRUD workflows, and refresh persistence using temporary records only. Confirm local data is not expected to appear on another device.
- Check responsive layouts at 1440, 768, 390, and 320 CSS pixels; verify touch controls, dialogs, tables, map layout, and no horizontal page overflow.
- Test map tiles with a network connection and with tile requests unavailable; confirm attribution and the app's fallback behavior.
- If supported by the browser, inspect the install prompt and installed app launch. Test offline navigation separately; do not assume map/CDN features work offline.
