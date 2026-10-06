# GitHub Pages deployment

Repository: <https://github.com/Eurekaleo/awesome-physical-ai>

Website: <https://eurekaleo.github.io/awesome-physical-ai/>

## Initial setup

1. In the repository's **Settings > Pages**, set **Source** to **GitHub Actions**.
2. Keep the default branch named `main`, or update both workflow branch filters.
3. Push the reviewed public files to `main`, or run **Deploy GitHub Pages** from the Actions tab.
4. Confirm that the workflow builds and uploads `dist/`, then inspect the deployed homepage and reference filters.

The quality workflow runs on pull requests and pushes. The deployment workflow builds the site independently and deploys only after validation passes. Repository content access is read-only; only the deployment job receives Pages and OpenID Connect write permissions. Concurrent deployments are serialized.

## Deployment boundary

The build selects these public paths:

- `index.html`, `404.html`, `robots.txt`, `sitemap.xml`, and `site.webmanifest`
- Approved web assets under `assets/`
- CSS and JavaScript under `site/`
- `data/references.json`

The output also receives an empty `.nojekyll` marker. Repository documentation, workflow files, import tools, raw bibliography files, manuscript files, and archives are never copied. The script rejects symlinks and unsupported extensions under the selected directories.

## Verify a release

```sh
npm run build
npm run preview
```

After deployment, check the site at its `/awesome-physical-ai/` project path, including a hard reload, a nonexistent URL, mobile navigation, and at least one reference link. Browser caches can retain an older asset briefly after deployment.

## Roll back

Revert the problematic source commit through a reviewed pull request and let the Pages workflow rebuild. Do not change the upload directory to the repository root to work around a deployment failure.
