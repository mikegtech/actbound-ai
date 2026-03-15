Act as the repo's GitHub local security engineer.

Implement secure, enterprise-grade local git hooks for this monorepo using pre-commit.

Requirements:

- fast enough for everyday developer use
- block secrets before commit
- run staged-file checks where possible
- support TS/JS/JSON/YAML/Markdown
- document setup and usage

Please:

1. Add pre-commit configuration
2. Add gitleaks secret scanning for staged content
3. Add formatting/linting hooks where practical
4. Add lightweight YAML/JSON/Markdown hygiene hooks
5. Add a pre-push hook for heavier monorepo validation if justified
6. Document installation and failure remediation
7. Keep the configuration explicit and maintainable

At the end, summarize:

- what hooks run on commit
- what hooks run on push
- what developers need installed
- what CI must still enforce
