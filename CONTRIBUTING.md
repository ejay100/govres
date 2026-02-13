 Contributing to GOVRES

Thanks for helping grow the open reserve ledger! Please follow these steps to keep everything consistent and auditable.

 1. Fork & Clone
1. Fork `github.com/ejay100/govres`.
2. Clone your fork and add this repo as `upstream` for easy syncs.

 2. Create a Branch
- Use descriptive names such as `feat/cocoa-ledger-api` or `fix/oracle-timeout`.
- Keep pull requests focused; avoid bundling unrelated fixes.

 3. Install & Test
bash
npm install
npm run lint
npm run test
npm run build

- API changes should include relevant unit/integration tests (Vitest).
- Frontend work should include Storybook screenshots or GIFs when UI changes are significant.

 4. Coding Standards
- TypeScript across the stack; no implicit `any`.
- Prefer functional services with dependency injection for easier testing.
- Keep comments concise; explain *why* not *what*.
- Follow existing folder conventions under `packages/*`.

 5. Commits & PRs
- Conventional commit style (e.g., `feat: add CRDN redemption route`).
- Reference issues where possible.
- Provide context in the PR description: problem, solution, tests, screenshots.

 6. Security & Data
- Never commit secrets or production data. Use `.env.example` for new variables.
- Report security issues privately via the repository security policy (or email maintainers) before opening a public issue.

By contributing you agree to license your work under the repository’s MIT License.
