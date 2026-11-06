# Contributing to sensors.social

Thanks for helping. Issues and pull requests are welcome.

## Run locally

Requires Node.js 16+ and npm.

```sh
git clone https://github.com/airalab/sensors.social.git
cd sensors.social
npm install
npm run dev
```

Before opening a pull request, check that `npm run build` passes and open the
page with `npm run preview`.

## Pull requests

- Every change goes through a pull request against `master`; a maintainer
  reviews and merges it.
- Keep a pull request to one topic. Follow-up fixes go in a new pull request.
- Follow the repository's ESLint and Prettier config. Note that `npm run lint`
  runs `eslint --fix` and rewrites files — don't reformat files you didn't change.
- Blog posts: see [docs/blog.md](docs/blog.md) for the file layout and the
  publishing checklist.

## Licence of contributions

By submitting a contribution you agree that it is licensed under the same
terms as the part of the repository it changes:

- code and everything else — [GNU AGPL v3.0 only](LICENSE);
- blog content in `src/blog/` — [CC BY 4.0](src/blog/LICENSE.md).

See [NOTICE](NOTICE) for copyright holders and details.

## Security issues

Please don't open public issues for vulnerabilities — see [SECURITY.md](SECURITY.md).
