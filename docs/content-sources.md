# Objective scope and source verification

The user requested 220-1201 and 220-1202. The original supplied PDFs cover 220-1101 and 220-1102; they were retained but were not used to map this content. The user authorized retrieving the official 1200-series PDFs on October 24, 2026.

The retrieved documents are stored as `220-1201-objectives.pdf` (document version 3.0) and `220-1202-objectives.pdf` (document version 2.0). These are the versions served at the official source URLs during implementation; a future version may supersede them. Only domain structure, objective scope, numbering, and weights were used. All teaching prose, scenarios, answer choices and feedback were written for this project. No exam questions or course material were copied.

- [Official Core 1 PDF](https://assets.ctfassets.net/82ripq7fjls2/1oSdlyujpaX3GrM0rir6Ge/91afb2be72785281e8fb4c0d9a70c6f4/CompTIA-A-220-1201-Exam-Objectives-3.0.pdf)
- [Official Core 2 PDF](https://comptiacdn.azureedge.net/webcontent/docs/default-source/exam-objectives/comptia-a-220-1202-exam-objectives.pdf)

Core 1 domain mapping: Mobile Devices (13%, 1.1–1.3), Networking (23%, 2.1–2.8), Hardware (25%, 3.1–3.8), Virtualization and Cloud Computing (11%, 4.1–4.2), Hardware and Network Troubleshooting (28%, 5.1–5.6).

Core 2 domain mapping: Operating Systems (28%, 1.1–1.11), Security (28%, 2.1–2.11), Software Troubleshooting (23%, 3.1–3.4), Operational Procedures (21%, 4.1–4.10).

Phase 1 seeds the first two objectives in each domain, with original instructional titles. These are focused introductory treatments, not exhaustive coverage of each objective's subtopics. The home page and maps identify the material as seed content. `npm run coverage:content` reports both authored and missing objective numbers. Mastery ratings are deferred until scheduling exists in Phase 2; Phase 1 reports completion honestly.

Important series distinction: display components are Core 1 objective 3.1 in this source, not a mobile-device objective. Hardware troubleshooting begins at objective 5.1; the general troubleshooting methodology is not a separately tested objective in the retrieved 1201 document. The support-cycle illustration is a learning aid rather than an additional claimed exam objective.
