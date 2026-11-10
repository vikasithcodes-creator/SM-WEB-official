# Deployment

The site runs as one container: an Express server (`server.ts`) that serves the API under `/api/*` and the built React app from `dist/`. It is deployed to **Google Cloud Run** in the existing Google Cloud project `gen-lang-client-0619517672`, which also holds the Firestore database and Firebase Authentication.

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Local dev server with hot reload (port 3000) |
| `npm run build` | Builds the React app to `dist/` and bundles the server to `build/server.js` |
| `npm start` | Runs the production build (set `NODE_ENV=production`) |
| `npm run lint` | Type-checks the project |

> **Warning:** `firebase-applet-config.json` points at the production Firebase project. A local server with Google credentials reads and writes live orders.

## Settings

| Variable | Required | Notes |
| --- | --- | --- |
| `ADMIN_PASSWORD` | Yes | Admin panel password. Store it in Secret Manager. If unset, the server falls back to a default that is visible in the source code. |
| `GEMINI_API_KEY` | No | Only for the Gemini `/api/chat` endpoint, which the site does not currently use. |
| `PORT` | No | Set by Cloud Run. |

Firebase settings (project, database, web config) come from `firebase-applet-config.json`. On Cloud Run the server reaches Firestore with the service's own identity, so no key file is needed.

## One-time setup

1. Install the [Google Cloud CLI](https://cloud.google.com/sdk/docs/install), then sign in:
   ```bash
   gcloud auth login
   gcloud config set project gen-lang-client-0619517672
   ```
2. Enable the services:
   ```bash
   gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com secretmanager.googleapis.com
   ```
3. Create a service account for the site and let it use Firestore:
   ```bash
   gcloud iam service-accounts create sm-studios-web --display-name="SM Studios website"
   gcloud projects add-iam-policy-binding gen-lang-client-0619517672 \
     --member="serviceAccount:sm-studios-web@gen-lang-client-0619517672.iam.gserviceaccount.com" \
     --role="roles/datastore.user"
   ```
4. Store the admin password as a secret and let the service account read it:
   ```bash
   printf '%s' 'YOUR-NEW-PASSWORD' | gcloud secrets create admin-password --data-file=-
   gcloud secrets add-iam-policy-binding admin-password \
     --member="serviceAccount:sm-studios-web@gen-lang-client-0619517672.iam.gserviceaccount.com" \
     --role="roles/secretmanager.secretAccessor"
   ```

## Deploy

From the repository root:

```bash
gcloud run deploy sm-studios-web --source . --region asia-east1 --allow-unauthenticated --service-account sm-studios-web@gen-lang-client-0619517672.iam.gserviceaccount.com --set-secrets ADMIN_PASSWORD=admin-password:latest --max-instances 1
```

`--max-instances 1` matters: each instance keeps a local copy of orders and products, so several instances could show each other stale data.

### Deploy automatically from GitHub (optional)

In the Cloud Console, open **Cloud Run → sm-studios-web → Set up continuous deployment**, connect the `vikasithcodes-creator/SM-WEB-official` repository, choose branch `^main$` and build type **Dockerfile**. Every merge to `main` then deploys.

## After the first deploy

1. **Firebase Auth:** add the new Cloud Run URL (and later the custom domain) under **Firebase Console → Authentication → Settings → Authorized domains**. Google sign-in fails on unlisted domains.
2. Check the storefront, checkout, order tracking and admin panel on the new URL.
3. Once the new service works, stop using the AI Studio deployment (`ais-pre-…run.app`).

## Known limitations

- Customer uploads (`uploads/`) live on the container disk and are lost when the instance restarts. They should move to Cloud Storage.
