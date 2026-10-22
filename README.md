# vinishko-utro — website of „Винишко Утро“

Public GitHub Pages site: https://ivip40.github.io/vinishko-utro/

Contents: `index.html` (issue list with what is inside, contacts: e-mail + Facebook, advertising), `telefoni.html` (useful phones from the latest issue), `site.css` (shared styles, menu, PDF reader), `viewer.js` („Прочети“ opens the PDF in an in-page reader — PDF.js from cdnjs; falls back to a new tab), `logo.svg`, `issues/YYYY-MM-broi-NN.pdf`.

Do not edit here by hand except the texts in `index.html`. New issues are published from the private working repo `ivip40/vinitsa-vestnik` with:

```bash
template/publish-site.sh issue-NN YYYY-MM "Брой N · Месец Година"
```

which copies the PDF, adds the row, commits and pushes. Pages rebuilds in about a minute. Only final, print-approved PDFs belong here — everything in this repo is public.
