# Documentation

How the project is documented, how to write documentation that fits in, and how to keep it up to date.

## Structure

| Location | Content | Audience |
|---|---|---|
| `README.md` | overview of the project: stack, quick start, scripts, structure, documentation index | everyone |
| `docs/*.md` | technical topics, one per file | developers of the project |
| `apps/*/README.md`, `packages/*/README.md` | purpose and specifics of an application package | developers of the project |
| `libs/maveric-*/README.md` | usage and API of a Maveric package | users of the framework |
| `libs/maveric/README.md` | index page of the Maveric project | anyone interested in the framework |
| `CLAUDE.md` | guidance for Claude Code | Claude Code |

## README formats

**Project README** (`README.md`):

- what the project is, technology stack;
- quick start, scripts;
- repository structure, with links to the package READMEs;
- architecture in brief, documentation index (a table of all `docs/` files);
- conventions.

**Application packages** (`@app/*`):

- purpose, and the package's place in the architecture;
- contents (key files and directories);
- public interface (the package's `exports`);
- package-specific sections (writing views, configuration, …);
- build: what it produces, and the output layout;
- see also: links to the related documents.

**Framework packages** (`@maveric/*`), written for future public use:

- what the package does, and how it relates to the other Maveric packages;
- a status note while the API is unstable;
- installation, including peer dependencies;
- quick start;
- API reference;
- how it works, compatibility, limitations.

Keep them brief while the framework is in early development; details likely to change don't belong there yet.

**Maveric project** (`libs/maveric/README.md`), the entry point for anyone interested in the framework:

- what Maveric is and why it exists;
- features;
- a minimal example, and how it works;
- packages, underlying technologies;
- a step-by-step guide for a new project;
- status and roadmap.

## Writing principles

- **Describe the current state and the reasons for it.** Documentation isn't a chronicle: explain why things are the way they are, including rejected alternatives where they explain a decision, but not how they came to be.
- **One place per fact.** Package READMEs summarize and link to `docs/`, instead of repeating it. Every duplicated detail is another place to keep up to date.
- **Mark what isn't verified,** for example *implemented, but not exercised yet*, or *not tested yet*.
- **Diagrams** use [Mermaid](https://mermaid.js.org). Prefer the `-->|label|` form of edge labels, which all renderers support.
- **Code examples** are derived from the actual code. They aren't compiled yet (see [Roadmap](roadmap.md)), so keep them close to the source.
- **Emojis** are used sparingly, only where they help scanning (the features list of the Maveric project, for example), never in technical documents.
- **Link generously** between documents, with relative links and anchors, and end package READMEs with a *See also* section.

## Keeping it up to date

Outdated documentation is worse than none, so the documentation is checked whenever a change is finished.

### When

- **For changes spanning several commits**, the documentation is updated once the whole change is done, as its last step, with its own commit. Intermediate steps often change what earlier steps did, so documenting them would only create churn. Notes made along the way serve as the list of things to document.
- **For changes done in a single commit**, the documentation is updated in the same commit.

### How

1. **Find what's affected.** For every removed, changed or added behavior, search `docs/` and all READMEs for its identifiers: file and package names, exports, configuration keys, scripts, environment variables. Searching is more reliable than remembering.
2. **Removed functionality:** delete its mentions, or rewrite the text depending on them.
3. **Changed functionality:** align the text, and also the code examples, tables (scripts, environment variables, exports, packages) and diagrams; those go stale most easily.
4. **New functionality:** decide whether it, or a decision made while developing it, is worth documenting. If so:
   1. extend existing topics — the default;
   2. or describe it in a new topic file (possibly together with the first option) — agree on it first;
   3. or, when neither fits, restructure the topics by extracting parts of existing ones into a new topic — agree on it first, and use it sparingly.
5. **Check the usual suspects:**
   - [Roadmap](roadmap.md): remove what's done or resolved, add new limitations and ideas;
   - the project README: the documentation index, the scripts table, the repository structure;
   - counts that drift, such as the number of ESLint warnings in [Tooling](tooling.md#eslint);
   - `CLAUDE.md`.
6. **Verify the links** with `pnpm docs:check`, which checks that every relative link in every Markdown file points to an existing file and heading.
