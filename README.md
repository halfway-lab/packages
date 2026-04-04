# @halfway-lab/packages

Monorepo for shared packages maintained by Halfway-Lab.

## Packages

### @halfway-lab/reading-note

**Version:** `0.2.0`

Reading-note extraction built on top of a local Half Way Protocol (HWP) runner.

```bash
npm install @halfway-lab/reading-note
```

- [README](./reading-note/README.md)

### @halfway-lab/question-expansion

**Version:** `0.1.6`

Normalize, validate, and audit raw HWP exploration output into stable Question Expander path data.

```bash
npm install @halfway-lab/question-expansion
```

- [README](./question-expansion/README.md)

## Quick Start

Install a specific package:

```bash
npm install @halfway-lab/reading-note
# or
npm install @halfway-lab/question-expansion
```

Or install from GitHub Packages (make sure your npm auth and scope registry are configured for `@halfway-lab`):

```bash
npm install @halfway-lab/reading-note --registry=https://npm.pkg.github.com/halfway-lab
```

## Workspace Structure

```
.
├── reading-note/      # Reading-note extraction package
├── question-expansion/ # Raw exploration payload normalization and audit helpers
├── package.json       # Root workspace configuration
└── README.md          # This file
```

Each package owns its own README, package metadata, and tests. Package versions are managed independently.

## License

MIT
