# Feature Comparison: Humanizer (blader/humanizer) vs. AuditSoft

- **Source**: `https://github.com/blader/humanizer` (commit `9862685f575c65a8247f90369951df1b3416e3d6`, v3.0.0)
- **Local Project**: `AuditSoft` (`auditsoft-nkc`, v1.1.6)
- **Mode**: `--compare` (Architectural & Strategic Evaluation)
- **Date**: 2026-09-10

---

## 1. Executive Summary

`blader/humanizer` is a widely adopted AI Agent Skill (46,000+ GitHub stars) that instructs Large Language Models (LLMs) to rewrite AI-generated prose so it reads like natural, human writing without altering underlying facts. It accomplishes this using a systematic 4-step workflow and a taxonomy of 25 patterns distilled from Wikipedia's "Signs of AI writing".

`AuditSoft` is an Electron desktop application designed for Vietnamese financial auditors to perform deterministic data reconciliation (NKC vs. CDFS), audit sampling under VSA 530, and automated working paper generation (VACPA B410, HTKK tax XML).

**Recommendation**:
Do **NOT** attempt to transplant or port `blader/humanizer` into the `AuditSoft` application codebase. The technical paradigms, domain semantics, and regulatory environments are in direct conflict. Instead:
1. **Developer / Agent Workflow (Recommended)**: Adopt `humanizer` as an Agent Skill (`ak-humanizer`) in the local AgentKit/OMP harness (`~/.omp/agent/skills/`) to polish documentation, release notes, and commit messages.
2. **Future App Expansion (Optional)**: If AuditSoft in the future introduces an automated narrative audit report module (e.g., Management Letter / Thư Quản Lý), adapt the **methodology** (25 patterns) into a Vietnamese statutory auditing style guide, backed by an isolated offline local LLM or user-provided API key.

---

## 2. Head-to-Head Comparison

| Dimension | Source (`blader/humanizer`) | Local Project (`AuditSoft`) | Assessment & Recommendation |
| :--- | :--- | :--- | :--- |
| **Primary Domain** | General English prose, technical docs, essays, blog posts | Vietnamese statutory financial auditing (VSA / VAS / Circular 200) | **Conflict**: Source addresses general English conversational tells; local domain requires strict Vietnamese accounting and legal language. |
| **Execution Engine** | Generative LLM (Claude 3.5/3.7, GPT-4o, Gemini 2.0) guided by prompt instructions (`SKILL.md`) | Deterministic TypeScript engine running on Node.js / Electron | **Conflict**: Source cannot function deterministically without an LLM; regex replacement alone destroys semantic grammar. |
| **Data Contracts** | Unstructured text, Markdown, optional voice samples | Strictly typed tabular structures (`NormalizedEntry`, BigInt `Money`, `AuditFinding`) | **Incompatible**: AuditSoft data is quantitative and relational; humanizer operates on natural language strings. |
| **Confidentiality & Compliance** | Cloud LLM inference (Anthropic, OpenAI) | Strict offline air-gapped execution (VSA 200, client NDAs, no remote telemetry) | **High Risk**: Sending client audit data to external LLMs breaches auditing confidentiality standards. |
| **Verification & Quality** | Qualitative peer review, subjective "read aloud" checks, Python package structure tests | Automated unit tests (Vitest), TypeScript strict compiler, ESLint, Electron worker isolation | **Different Paradigms**: Deterministic code testing vs. heuristic prompt validation. |
| **Distribution Target** | `skills.sh`, Claude Plugin Marketplace, Agent Skills repo | Windows NSIS Setup & Portable `.exe` (`installer/`) | **Isolated**: Different deployment ecosystems. |

---

## 3. Challenge Framework Evaluation

### Challenge 1: Necessity & Purpose
- **Question**: Does `AuditSoft` need this feature in its client product, or is it needed for developer tooling?
- **Source Answer**: Humanizer is designed to eliminate AI writing artifacts from prose.
- **Local Answer**: AuditSoft currently has no free-form text generation features. Audit findings use standardized, legally guarded templates (e.g., `DATA_MODEL.md §28/§48`: "chỉ dùng unusual / requires review... Cấm kết luận gian lận/sai sót khi chưa có bằng chứng"). Free-form rewriting risks introducing speculative or non-compliant audit opinions.
- **Risk of Incorrect Assumption**: Bloating an offline accounting tool with unneeded, high-risk text generation code.

### Challenge 2: Execution Paradigm
- **Question**: Can Humanizer be ported to native TypeScript without an LLM?
- **Source Answer**: The 25 patterns require semantic understanding (e.g., recognizing "arguing with no one", "forced triads", or "staged run-ups") and creative restructuring while preserving 100% of facts.
- **Local Answer**: A pure TypeScript/Regex port could only detect a handful of superficial tokens (e.g., forbidden words like "delve" or em-dashes), but cannot synthesize grammatical, humanized rewrites.
- **Risk of Incorrect Assumption**: Developing an ineffective, brittle regex linter that produces broken text.

### Challenge 3: Linguistic & Domain Transferability
- **Question**: Do the 25 Wikipedia-based English patterns translate directly to Vietnamese audit prose?
- **Source Answer**: Focuses on English structures: "not only X but Y", "delve", "testament", "nestled", "stands as".
- **Local Answer**: Vietnamese accounting prose has distinct linguistic features. While some translation equivalents exist (e.g. "không chỉ... mà còn...", "đóng vai trò then chốt", "bức tranh toàn cảnh"), Vietnamese auditing requires adherence to statutory terminology (VACPA guidelines).
- **Risk of Incorrect Assumption**: Misflagging valid Vietnamese accounting terminology as "AI slop".

### Challenge 4: Security, Confidentiality & Compliance
- **Question**: What are the operational and privacy ramifications of introducing LLMs into AuditSoft?
- **Source Answer**: Relies on third-party cloud APIs.
- **Local Answer**: Auditors run AuditSoft on sensitive client general ledgers. Transmitting financial records to cloud providers violates auditing confidentiality regulations.
- **Risk of Incorrect Assumption**: Legal liability, loss of user trust, regulatory non-compliance.

### Challenge 5: Maintenance Burden & Architectural Sprawl
- **Question**: Who owns the imported behavior and infrastructure?
- **Source Answer**: Maintained upstream as a community prompt skill.
- **Local Answer**: Maintaining an LLM subsystem (API keys, IPC bridging, prompt versioning, token cost tracking) would divert resources away from core auditing modules (VSA 530 sampling, B410 consolidation, HTKK synchronization).
- **Risk of Incorrect Assumption**: Significant technical debt with low user payoff.

---

## 4. Decision Matrix

| Decision Area | Source (`blader/humanizer`) | AuditSoft Native | Recommendation |
| :--- | :--- | :--- | :--- |
| **Codebase Integration** | Prompt skill in `SKILL.md` | Electron / React / TypeScript | **Do not integrate into app core**; keep AuditSoft deterministic. |
| **Agent Environment Integration** | Claude Code / Agent Skills | Oh My Pi / AgentKit harness | **Adopt into Agent Toolkit** as an agent skill (`ak-humanizer`). |
| **Text Generation** | Dynamic LLM rewrite | Static / Parameterized template strings | **Retain deterministic templates** for audit compliance. |
| **Language & Locale** | English (Wikipedia-based) | Vietnamese (VACPA / VSA-based) | **Retain Vietnamese accounting conventions**. |
| **Network & Privacy** | Cloud API dependent | 100% Local offline execution | **Enforce offline air-gapped architecture**. |

---

## 5. Strategic Pathways & Recommendations

### Pathway A: Install as an Agent Skill (Recommended)
If the goal is to leverage `humanizer` within your development environment:
- Install the skill into the local Agent harness (`~/.omp/agent/skills/ak-humanizer` or via `npx skills add blader/humanizer`).
- Use it during development when drafting documentation, pull requests, release notes, or client user guides to ensure clean, human-sounding technical writing.

### Pathway B: Future AuditSoft Extension (Informational)
If AuditSoft plans a future feature for generating narrative audit working papers (e.g. *Báo cáo tổng hợp kiểm toán* or *Thư quản lý gửi Ban giám đốc*):
1. **Rule Linter**: Port specific lexical checks into a TypeScript helper for Vietnamese audit text (e.g. flagging cliché phrases, ensuring neutral tone without definitive accusations).
2. **Local LLM Integration**: Utilize an on-device, privacy-preserving small language model (e.g. via Ollama or local ONNX runtime) with explicit user consent and clear disclaimer that audit numbers remain strictly deterministic.
