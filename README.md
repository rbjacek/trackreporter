# Track Reporter – blog ready for GitHub Pages

Copy these files into the **root** of the existing Track Reporter website repository:

```
index.html                       (updated home page)
blog/blog.css                    (new scoped stylesheet)
blog/index.html                  (blog listing)
blog/how-to-prove-field-work-was-completed/index.html (article)
```

The updated `index.html` was created from the HTML you supplied. Its existing Firebase Fleet panel, original app script (`app.min.js`), original stylesheet (`style.min.css`), Google Ads tag and purchase conversion tracking are left in place. New additions: Blog nav link, blog promo before main CTA, blog footer link and a blog CSS import.

The blog uses the following **existing website files** (not included in the package):
- `style.min.css`
- `trackreporter1024x1024-transparent.png`
- `trackreporter1024x1024.png`
- `tr_routeview.jpg`, `tr_photogallery.jpg`
- `sample-report.pdf`

The new pages should appear at:
- https://www.trackreporter.com/blog/
- https://www.trackreporter.com/blog/how-to-prove-field-work-was-completed/

After publication check desktop and mobile, confirm app and Fleet links still work, and submit the new URLs through Google Search Console. Add them to your existing sitemap if you already use one; do not overwrite the live sitemap without inspecting it.

The custom blog pages reference `style.min.css` to share existing site styling and layer `blog/blog.css` on top for blog layouts. In the absence of the original CSS when previewed locally, the main home page will not look identical to the live website.
