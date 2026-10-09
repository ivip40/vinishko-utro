# nashata-vinitsa — website of „Нашата Виница“

Public GitHub Pages site: https://ivip40.github.io/nashata-vinitsa/

Contents: `index.html` (issue list, contacts, legal owner line), `logo.svg`, `issues/YYYY-MM-broi-NN.pdf`.

Do not edit here by hand except the texts in `index.html`. New issues are published from the private working repo `ivip40/vinitsa-vestnik` with:

```bash
template/publish-site.sh issue-NN YYYY-MM "Брой N · Месец Година"
```

which copies the PDF, adds the row, commits and pushes. Pages rebuilds in about a minute. Only final, print-approved PDFs belong here — everything in this repo is public.
