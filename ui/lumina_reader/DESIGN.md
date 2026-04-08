```markdown
# Design System Strategy: The Editorial Archive

## 1. Overview & Creative North Star: "The Digital Curator"
Most RSS readers feel like utility tools—dense, cluttered, and clinical. This design system rejects the "utility-first" mindset in favor of a **High-End Editorial** experience. Our Creative North Star is **The Digital Curator**: a system that treats every article like a piece of featured journalism in a premium magazine.

We achieve this through **Intentional Asymmetry** and **Tonal Depth**. Instead of rigid, boxed-in grids, we use breathing room (whitespace) as a luxury asset. By mixing the modern architectural precision of *Manrope* with the literary elegance of *Newsreader*, we create a "Newspaper 2.0" aesthetic that feels native to high-end hardware but grounded in classical readability.

---

## 2. Colors: Depth Through Tonality
Our palette moves away from flat "app" aesthetics into a world of layered surfaces. 

### The Palette
*   **Primary (#0058bc):** Our "Digital Ink." Used for high-priority actions and brand presence.
*   **Surface Hierarchy:** We utilize a tiered system of neutrals to define structure without visual noise.
    *   `surface`: The base canvas.
    *   `surface-container-low`: Secondary background for feed grouping.
    *   `surface-container-highest`: For elevated contextual menus.

### The "No-Line" Rule
**Explicit Instruction:** Use of 1px solid borders for sectioning is strictly prohibited. Boundaries must be defined solely through background color shifts. For example, an article card (`surface_container_low`) should sit on a `surface` background. The contrast between these two tokens is sufficient to define the edge.

### The "Glass & Gradient" Rule
To add soul to the interface, Primary CTAs should not be flat. Use a subtle linear gradient from `primary` (#0058bc) to `primary_container` (#0070eb) at a 135-degree angle. For floating navigation elements, apply **Glassmorphism**: use `surface` at 80% opacity with a `20px` backdrop blur to allow content to "bleed" through softly.

---

## 3. Typography: The Editorial Mix
We use a dual-font strategy to balance UI functionality with reading pleasure.

*   **UI & Navigation (Manrope):** A modern sans-serif that feels engineered and precise.
    *   `display-lg` (3.5rem): Used for massive, bold section headers.
    *   `headline-sm` (1.5rem): Used for primary navigation titles.
*   **The Reading Experience (Newsreader):** A sophisticated serif designed for long-form legibility.
    *   `title-lg` (1.375rem): Reserved for article headlines in the feed.
    *   `body-lg` (1rem): The gold standard for the article view itself. Use a line height of 1.6 to ensure maximum readability.
*   **Functional Metadata (Inter):** 
    *   `label-md` (0.75rem): Used for timestamps, categories, and reading time.

---

## 4. Elevation & Depth: Tonal Layering
Traditional drop shadows are often a crutch for poor layout. In this system, we prioritize **Tonal Layering**.

*   **The Layering Principle:** Depth is achieved by stacking. Place a `surface_container_lowest` card on a `surface_container_low` section to create a soft, natural lift. 
*   **Ambient Shadows:** When an element must "float" (e.g., a Compose FAB), use a shadow with a large blur (32px) and very low opacity (6% of `on_surface`). The shadow should be tinted with the `surface_tint` (#005bc1) to feel like light passing through glass rather than a grey smudge.
*   **The "Ghost Border" Fallback:** If accessibility requires a border, use the `outline_variant` token at **15% opacity**. This creates a "Ghost Border" that defines the shape without breaking the editorial flow.

---

## 5. Components

### Elegant Article Cards
*   **Container:** `surface_container_low` with `xl` (1.5rem) roundedness.
*   **Spacing:** 24px internal padding.
*   **Rule:** No dividers between cards. Use 16px of vertical spacing (`surface` color showing through) to separate them.
*   **Content:** Title in `newsreader / title-md`, source in `inter / label-md` using `primary` color.

### Primary Buttons
*   **Shape:** `full` (pill-shaped) for high-action items; `md` (0.75rem) for secondary actions.
*   **Color:** Gradient from `primary` to `primary_container`. 
*   **Text:** `label-md` in `on_primary`. 

### Navigation Bars
*   **Style:** Integrated into the `surface`. Use a subtle `surface_container_high` background with a backdrop-blur.
*   **Icons:** Use thin-stroke iconography (1.5px weight) to match the refinement of the typography.

### Input Fields
*   **Background:** `surface_container_highest`. 
*   **Border:** None. Use a 2px `primary` bottom indicator only when focused.
*   **Typography:** `body-md` in `on_surface`.

### Contextual Chips
*   **Design:** `surface_container_high` background, no border, `sm` (0.25rem) roundedness. 
*   **Interaction:** On selection, transition to `primary` background with `on_primary` text.

---

## 6. Do's and Don'ts

### Do
*   **Do** embrace extreme whitespace. If a screen feels "empty," it's likely working.
*   **Do** use `Newsreader` for any text longer than two sentences.
*   **Do** use `surface` shifts to separate the sidebar from the main feed.

### Don't
*   **Don't** use 100% black (#000000) for text; use `on_surface` (#1a1c1e) to maintain a premium, softer contrast.
*   **Don't** use standard iOS/Android "Dividers." A layout should be held together by alignment, not lines.
*   **Don't** use sharp corners. Use the `DEFAULT` (0.5rem) as your minimum starting point for any container.

---

## 7. Closing Director's Note
Junior designers often fear "empty space." In this system, whitespace is your most important component. It creates the silence necessary for the user to actually *read*. Treat the typography as the hero, and let the colors provide the stage. If the UI feels "invisible" while the content feels "expensive," you have succeeded.```