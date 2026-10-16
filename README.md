# Connor Mallon — Photography

A static photography portfolio hosted on GitHub Pages.

## Folder layout

| Path | What it is |
| --- | --- |
| `images/<Genre>/` | Your original photos. Each folder becomes a tab. Stays on your computer (not uploaded). |
| `build_gallery.py` | Turns `images/` into `photos/` and `photos.js`. Settings (tab order, tab names, home slideshow, cover photos) are at the top. |
| `photos/`, `photos.js` | Generated. Don't edit by hand. |
| `index.html`, `styles.css`, `app.js` | The site. Bio and tagline are in `index.html`; colors and fonts are at the top of `styles.css`. |
| `assets/bio.jpg` | Photo on the About page. |
| `_old-site/` | The previous Netlify site and logo, kept for reference. Not uploaded. |

## Adding or changing photos

1. Put photos in `images/<Genre>/`. A new folder makes a new tab.
2. Run:

   ```bash
   python3 build_gallery.py
   ```

3. Publish:

   ```bash
   git add -A && git commit -m "Update photos" && git push
   ```

GitHub Pages updates about a minute after the push.

## Preview on your computer

```bash
python3 -m http.server 8765
```

Then open http://localhost:8765.

## First-time move from Netlify to GitHub Pages

1. **Create the repository.** On github.com, click **New repository**. Name it (for example `photography`), make it **Public**, and don't add a README.
2. **Push this folder:**

   ```bash
   git add -A
   git commit -m "New portfolio site"
   git remote add origin https://github.com/<your-username>/photography.git
   git push -u origin main
   ```

3. **Turn on Pages.** In the repository, open **Settings → Pages**. Under *Build and deployment*, choose **Deploy from a branch**, branch **main**, folder **/ (root)**, then **Save**.
4. **Add your domain.** On the same page, enter `connormallonphotography.com` under *Custom domain* and save. (The `CNAME` file in this folder already holds it.)
5. **Point DNS at GitHub.** The domain is registered at **Name.com**, but its DNS is currently run by **Netlify DNS** (nameservers `dns1–4.p09.nsone.net`). To leave Netlify completely:
   - In Name.com → **My Domains → connormallonphotography.com → Nameservers**, switch back to Name.com's default nameservers.
   - Then in Name.com → **DNS Records**, add the records below.

   (Alternative: keep Netlify DNS and edit the records there instead, but then you can't delete your Netlify account.)

   Records:

   | Type | Name | Value |
   | --- | --- | --- |
   | A | `@` | 185.199.108.153 |
   | A | `@` | 185.199.109.153 |
   | A | `@` | 185.199.110.153 |
   | A | `@` | 185.199.111.153 |
   | CNAME | `www` | `<your-username>.github.io` |

   Delete any old `A`, `ALIAS` or `CNAME` records that point at Netlify.
6. **Turn on HTTPS.** Once GitHub shows the DNS check passing (minutes to a few hours), tick **Enforce HTTPS** in Settings → Pages.
7. **Retire Netlify.** After the site loads from GitHub on your domain, remove the domain from the Netlify site (Domain management), then delete the Netlify site.

Optional: in your GitHub account, **Settings → Pages → Add a domain** lets you verify the domain so no one else can claim it on GitHub.

## Contact form

The form posts to Formspree (`https://formspree.io/f/mwvgenyy`, same form as the old site). Messages go to the email on that Formspree account.
