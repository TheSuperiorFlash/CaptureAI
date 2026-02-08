# Claude Skills for CaptureAI

This directory contains Claude AI skills that enhance Claude's ability to work with the CaptureAI codebase.

## Available Skills

### Frontend Design Skill

The `frontend-design` skill produces production-grade UI code with distinctive aesthetic direction and creative craft.

**Source:** [https://github.com/Ilm-Alan/frontend-design](https://github.com/Ilm-Alan/frontend-design)

**Purpose:** 
- Create bespoke frontend designs with intentional aesthetic direction
- 10 aesthetic archetypes: Editorial, Swiss, Brutalist, Minimalist, Maximalist, Retro-Futuristic, Organic, Industrial, Art Deco, Lo-Fi
- Structured design process: Context → Archetype → Differentiator → Token System → Implementation
- Design token system with CSS custom properties

**Best for:**
- Landing pages, marketing sites, campaigns
- Web components and pages requiring distinctive visual execution
- Any UI requiring aesthetic excellence and creative craft

### Interface Design Skill

The `interface-design` skill helps Claude build UI components with craft, memory, and consistency.

**Source:** [https://github.com/Dammyjay93/interface-design](https://github.com/Dammyjay93/interface-design)

**Purpose:** 
- Build interfaces with intention and systematic consistency
- Remember design decisions across sessions
- Maintain design system patterns in `.interface-design/system.md`

**Best for:**
- Dashboards, admin panels, SaaS apps
- Tools, settings pages, data interfaces
- Any interface design work (not for marketing sites)

## Available Commands

The following commands are available when working with Claude:

**Frontend Design:**
- `/frontend-design` - Invoke the frontend design skill for aesthetic excellence

**Interface Design:**
- `/interface-design:init` - Start building UI with design principles
- `/interface-design:status` - Show current design system state
- `/interface-design:audit <path>` - Check code against system patterns
- `/interface-design:extract` - Extract patterns from existing code

## How It Works

### First Session (No system.md)
1. Claude explores the product domain
2. Suggests design direction based on context
3. Builds components with consistent principles
4. Offers to save patterns to `.interface-design/system.md`

### Subsequent Sessions (system.md exists)
1. Claude automatically loads `.interface-design/system.md`
2. Applies established patterns and design decisions
3. Maintains consistency with existing system
4. Offers to save new patterns if they emerge

## File Structure

```
.claude/
├── README.md                     # This file
├── commands/                     # Available commands
│   ├── init.md                  # Initialize interface design
│   ├── status.md                # Show current system
│   ├── audit.md                 # Audit code against system
│   └── extract.md               # Extract patterns from code
├── skills/                       # Skills directory
│   ├── frontend-design/         # Frontend design skill
│   │   └── SKILL.md             # Main skill definition
│   └── interface-design/        # Interface design skill
│       ├── SKILL.md             # Main skill definition
│       └── references/          # Reference materials
│           ├── example.md       # Examples
│           ├── principles.md    # Design principles
│           └── validation.md    # Validation rules
├── plan.md                      # Project planning (not tracked)
└── settings.local.json          # Local settings (not tracked)
```

## Design System File

When you use the interface-design skill, it will create and maintain a `.interface-design/system.md` file in your project root. This file stores:

- Design direction and personality
- Depth strategy (borders/shadows/layered)
- Color tokens and foundations
- Spacing scales
- Component patterns (buttons, cards, etc.)
- Typography choices

This file is loaded automatically in each session to maintain consistency.

## Usage Example

### Using Frontend Design

```
You: "/frontend-design Create a pricing page for CaptureAI"

Claude will:
1. Read the frontend-design skill
2. Identify context (purpose, users, domain, content density)
3. Select aesthetic archetype (e.g., Swiss/International, Editorial, etc.)
4. Define differentiator (signature interaction or visual element)
5. Create design token system
6. Build production-grade UI with distinctive aesthetic
```

### Using Interface Design

```
You: "Build a dashboard for CaptureAI extension settings"

Claude will:
1. Read the interface-design skill files
2. Check for .interface-design/system.md
3. Explore the product domain (Chrome extension, AI tools, etc.)
4. Suggest a design direction
5. Build components with consistent principles
6. Offer to save the system for future sessions
```

## Notes

**Skill Specialization:**
- The `frontend-design` skill is for **aesthetic excellence** (landing pages, marketing sites, campaigns, distinctive visual execution)
- The `interface-design` skill is for **interface design** (dashboards, apps, tools, data interfaces)
- Both emphasize craft, consistency, and intentional design choices
- The interface-design skill maintains design memory across Claude sessions via `.interface-design/system.md`
