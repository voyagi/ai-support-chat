---
name: gsd:debate-questions
description: Debate phase questions with 3 Opus agents before planning
argument-hint: "<phase number>"
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - Task
  - TodoWrite
  - AskUserQuestion
---

<objective>
Analyze a GSD phase, surface key implementation questions and assumptions,
then route each question through 3 independent Opus agents that debate and
converge on the best answer. This produces high-confidence decisions BEFORE
planning begins, reducing rework and bad assumptions downstream.

**Use this BEFORE** `/gsd:plan-phase` to pre-answer the hard questions.

**Output:** Debated answers presented to user for confirmation, then saved
to `{phase-dir}/DEBATE.md` for the planner to consume.
</objective>

<context>
Phase number: $ARGUMENTS (required)

**Load project state:**
@.planning/STATE.md

**Load roadmap:**
@.planning/ROADMAP.md
</context>

<process>

## 1. Load Phase Context

1. Validate phase number argument (error if missing)
2. Read `.planning/STATE.md` and `.planning/ROADMAP.md`
3. Find the target phase in the roadmap
4. Check for existing `CONTEXT.md` in the phase directory (use as input if present)
5. Check for existing codebase analysis in `.planning/codebase/` (use if present)

## 2. Surface Questions

Analyze the phase goal, requirements, and success criteria to identify
5-8 key questions that need answers before planning. Focus on:

- **Technical approach**: Which library/pattern/architecture to use?
- **Scope boundaries**: What's in vs out? Where does this phase end?
- **Integration points**: How does this connect to existing code?
- **Risk areas**: What could go wrong? What's the hardest part?
- **User-facing decisions**: How should this look/behave/feel?

Present the questions to the user. Ask them to select which ones to debate
(default: all). Use AskUserQuestion with multiSelect.

## 3. Debate Each Question

For each selected question, spawn **3 Task agents in parallel** (all in a
single message). Each agent gets:

- The full phase context (roadmap description, requirements, success criteria)
- The current codebase structure and relevant existing code
- The specific question to answer
- Their analytical role

**Agent A - "The Pragmatist"**: Focuses on the simplest, most practical
answer. What's the fastest path that still meets requirements? Considers
existing patterns in the codebase and avoids over-engineering.

**Agent B - "The Architect"**: Focuses on the best long-term answer.
What approach scales, is maintainable, and follows best practices?
Considers how this decision affects future phases.

**Agent C - "The Skeptic"**: Challenges both other perspectives. What
could go wrong with each approach? Are there hidden costs, edge cases,
or better alternatives nobody considered?

Each agent must return:
- Their recommended answer (1-3 sentences)
- Confidence level (high/medium/low)
- Key reasoning (2-4 bullet points)
- Risks or caveats

All 3 agents use model "opus" for maximum reasoning quality.

## 4. Synthesize and Present

For each question, after all 3 agents return:

1. Compare answers for agreement/disagreement
2. Synthesize the best answer using majority + strongest reasoning
3. Present to user in this format:

**Q: [question]**

**Debated Answer**: [synthesized answer]
**Consensus**: [3/3 agreed | 2/3 majority | Split - flagged]
**Key Reasoning**: [merged bullet points]

If there was disagreement, show the dissenting view briefly.

## 5. User Confirmation

After presenting all debated answers, ask the user:
- Which answers they agree with
- Which they want to override or modify
- Any questions they want to add and debate

## 6. Save DEBATE.md

Write the confirmed answers to the phase directory as `DEBATE.md`:

```markdown
# Phase [N] - Debate Results

Debated on: [date]
Questions debated: [count]

## Decisions

### Q1: [question]
**Answer**: [confirmed answer]
**Consensus**: [level]
**Reasoning**: [bullets]

### Q2: ...
```

This file will be consumed by `/gsd:plan-phase` to inform planning.

## 7. Offer Next Steps

Tell the user:
- "Debate complete. [X] questions answered with [Y]% consensus."
- Suggest running `/gsd:plan-phase [N]` next (the planner will use DEBATE.md)

</process>

<rules>
- Always spawn all 3 agents for a question in a SINGLE message (parallel)
- Use subagent_type "general-purpose" for all agents
- Use model "opus" for all agents (maximum reasoning quality)
- Include relevant codebase context in agent prompts (read key files first)
- If a question is trivial (obvious answer), still debate it but note it
- Never skip user confirmation before saving DEBATE.md
- If DEBATE.md already exists, ask whether to append or replace
</rules>
