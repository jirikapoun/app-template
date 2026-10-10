# Features

Every feature of the application is described in its own document in this directory: why it exists, what it must do and look like, how its implementation is planned and, once implemented, how it's built. The descriptions are the basis for implementing the feature's endpoints and views, and the reference for covering them with tests.

## Index

No feature is described yet.

## What a feature is

A feature is a capability of the application that matters to its users: usually a few routes, their JSON responses and their views. Its document describes it from the user's point of view first, and adds the technical side only where the feature needs it.

Changes that aren't features, such as infrastructure, tooling or the Maveric framework, follow the same [collaboration workflow](../../CLAUDE.md#collaboration-workflow), but are planned in the conversation and documented in the [technical topics](../documentation.md#structure).

Ideas for features are collected in the [Roadmap](../roadmap.md#planned). A feature gets a document once its implementation is being prepared; until it's implemented, its roadmap entry links to the document.

## Document structure

The file name is the feature's name in kebab case (`server-status.md`). The sections, in this order:

| Section | Content | Included |
|---|---|---|
| Title | the feature's name (`# Server status`), its status, and what the feature is in one or two sentences | always |
| Motivation | why the feature exists: the problem it solves, the benefit it brings | always |
| Out of scope | what the feature deliberately doesn't do, with links to the roadmap where it's planned | when the boundaries aren't obvious |
| Visual requirements | what the user interface looks like | for features with a user interface |
| Functional requirements | how the feature behaves | always |
| Technical requirements | principles the implementation must follow | when the feature needs any beyond the project's conventions |
| Plan of attack | how the implementation is divided into tasks and steps | while the feature is being implemented |
| Implementation details | facts about the implementation and the decisions behind it | once the feature is implemented |

The status is one of:

- **proposed:** described, but not being implemented yet;
- **in progress:** being implemented according to its plan of attack;
- **implemented:** the requirements are fulfilled.

## Requirements

Unlike the rest of the documentation, requirements describe a target state: while a feature is in progress, they're ahead of the code.

- **One requirement per list item, with an ID:** `V` for visual, `F` for functional and `T` for technical requirements, numbered within the document (`**F1**`). A new requirement takes the next free number; IDs are never renumbered or reused, so that references to them stay valid. Gaps are fine.
- **Requirements are verifiable.** They describe behavior that can be observed, not intentions. *Must* marks what's required, *should* what's desirable but may be left out for a good reason.
- **Data separately from presentation.** Every page URL also answers JSON, so describe what data the feature provides separately from how its views present it: requirements on the data can be tested through the API, without a browser.
- **Visual requirements** cover the layout and content of the views, their states (loading, empty, error), small screens and accessibility.
- **Technical requirements** state only what the feature needs beyond the project's conventions, which the technical topics describe.

The IDs make requirements easy to refer to:

- the tasks and steps of the plan of attack name the requirements they cover (*covers F1, V2*), which shows what a step is about and whether every requirement is covered by some step;
- discussions, open questions and progress reports refer to them (*F3 conflicts with T1*, *F2 is done, V3 only partially*);
- a change of an implemented feature names the requirements it adds or changes;
- tests will name the requirements they verify (`test('F2: …')`), so that a requirement's tests can be found by its ID, and a failing test points to its requirement (the project has no tests yet, see [Roadmap](../roadmap.md#planned)).

## Plan of attack

The plan of attack is the plan agreed in the [collaboration workflow](../../CLAUDE.md#collaboration-workflow), kept in the document, so that the work can continue in any session.

- **Steps** are the units of work: each step is implemented, verified, reviewed and committed on its own, in one commit.
- **Tasks** group the steps of larger features: a task is meaningful on its own, so that after each task the application works and the feature is partially usable. Simple features have only steps.
- **Every task, or every step of a plan without tasks, names the requirements it covers.**
- **Steps are numbered checkboxes** (`- [ ] 2.3` is the third step of the second task), ticked in the commit of their step.
- **The last step updates the documentation** (see [Documentation](../documentation.md#keeping-it-up-to-date)): it writes the implementation details, removes the plan of attack and sets the status to *implemented*. For a feature implemented in a single step, that's part of the step.
- **Notes**, a subsection, collect what's worth documenting as the work goes on: decisions, names, surprises. They're the material for the implementation details.
- **Open questions**, a subsection, list the decisions waiting for an answer, numbered. Answers go into the requirements (product decisions) or the notes (technical decisions).
- **The plan changes** when the work reveals something new; changes are agreed before they're implemented.

## Implementation details

The implementation details stay in the document after the feature is implemented, as its documentation. They cover what's specific to the feature:

- its interface: routes (method and path), views, schemas, as links to their sources rather than copies, so that `pnpm docs:check` notices when they move;
- decisions made while implementing it, with their reasons and the alternatives rejected;
- its known limitations.

Decisions that concern more than one feature belong to the technical topics, which the implementation details link to. The [writing principles](../documentation.md#writing-principles) apply.

## Workflow

A feature document follows the phases of the [collaboration workflow](../../CLAUDE.md#collaboration-workflow):

| Phase | The document |
|---|---|
| Intent | The user describes the feature; the document is drafted from the description: title, motivation, requirements, status *proposed*. |
| Investigation | Findings stay in the conversation; they shape the technical requirements and the plan. |
| Discussion | Product decisions go into the requirements, technical ones into the notes. The agreed plan becomes the plan of attack, the status *in progress*, and the document is committed before the first step. |
| Implementation | Every step is implemented, verified, reported, reviewed and committed, with its checkbox ticked. |
| Wrap-up | The last step turns the notes into implementation details and removes the plan of attack. |

It works the other way round too: a plan of attack written in advance enters the workflow at investigation, where it's checked against the code and adjusted before the first step. A change of an implemented feature is made in its document: the requirements are updated, the status goes back to *in progress*, and a new plan of attack covers the new and changed requirements.

## Template

Sections that don't apply are left out.

```markdown
# <Feature name>

**Status:** proposed

<What the feature is, in one or two sentences.>

## Motivation

<Why the feature exists: the problem it solves, the benefit it brings.>

## Out of scope

- <What the feature deliberately doesn't do.>

## Visual requirements

- **V1** <…>

## Functional requirements

- **F1** <…>

## Technical requirements

- **T1** <…>

## Plan of attack

### 1. <Task>

Covers F1, V1.

- [ ] 1.1 <step>
- [ ] 1.2 <step>

### Notes

- <…>

### Open questions

1. <…>

## Implementation details

<…>
```
