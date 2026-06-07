# Aura - Event Media Platform: Frontend Design & Animation Specs

## 1. Design Concept & Aesthetic
**Theme:** "Cinematic Gallery"
The platform will utilize a dark, minimal UI. Because this is a highly visual platform handling photos and videos, the interface itself must step back and let the event media shine. 

## 2. Design Tokens (CSS / Tailwind Config)

### Color Palette
| Token | Hex Value | Usage |
| :--- | :--- | :--- |
| `bg-primary` | `#050505` | Main application background. |
| `bg-surface` | `#111111` | Event cards, modals, dropdowns. |
| `bg-elevated` | `#1A1A1A` | Hover states for cards, active states. |
| `text-primary` | `#F8F9FA` | Main headings, critical text. |
| `text-secondary` | `#868E96` | Subtitles, event descriptions, metadata. |
| `accent-glow` | `#6366F1` | Indigo/Violet used strictly for AI features (Facial recognition, Smart Search). |
| `border-subtle` | `rgba(255, 255, 255, 0.08)` | Dividers, card borders. |

### Typography
* **Headings:** *Space Grotesk* or *Clash Display* (Geometric, modern, highly legible).
* **Body & UI:** *Inter* (Clean, invisible, perfect for metadata and dense information).

---

## 3. Core UI Layout Mapping
* **Hero:** Catchy headline, CTA for Organizers, search bar for Members.
* **Event Grid:** A staggered masonry or uniform grid displaying event albums.
* **Media View:** A lightbox-style modal for viewing media, containing an interactive sidebar for comments, likes, and AI tags.

---

## 4. Precise Animation Specifications

To achieve the premium feel requested, implement the following using **Framer Motion** (React) or **GSAP**. 

### A. Hero Section: The "Grand Entrance"
* **Staggered Fade & Float:** Elements should not load statically. They must glide into place.
    * *Initial State:* `opacity: 0, y: 30`
    * *Animate To:* `opacity: 1, y: 0`
    * *Framer Motion Config:* `transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}` (Custom bezier curve for a "snappy but smooth" feel).
    * *Staggering:* Headline delays by `0s`, Subheadline by `0.1s`, Search/Action Buttons by `0.2s`.

### B. Event Discovery: Scroll-Triggered Reveals
* **Masonry Gallery Assembly:** As the user scrolls down to the "Recent Events" section, the event cover photos should populate in a wave.
    * *Effect:* Bind an `IntersectionObserver` to the grid container.
    * *Animation:* When `inView`, stagger the children (the event cards) using `staggerChildren: 0.1`. They scale up slightly (`scale: 0.95` to `scale: 1`) and fade in. 

### C. Hover & Interactive States (Crucial for Media)
* **Media Card Spotlight:** When hovering over an event album, implement a flashlight effect.
    * *Implementation:* Track the `onMouseMove` event to get the cursor's X/Y coordinates relative to the card. Use these coordinates to drive a CSS `radial-gradient` background.
    * *CSS:* `background: radial-gradient(600px circle at ${mouseX}px ${mouseY}px, rgba(255,255,255,0.06), transparent 40%);`
* **Thumbnail Crossfade:** Hovering over a video thumbnail immediately crossfades from the static poster image to a muted, looping preview video over `300ms`. 
* **Magnetic "Upload" Button:** The primary CTA for photographers should gently attract to the cursor when within a `40px` radius, giving a tactile, high-end feel.

### D. AI Feature Animations (Facial Recognition & Search)
* **The "Find Me" Scan Effect:** When a user clicks "Find my photos" (Facial Recognition), overlay a subtle scanning animation over a blurred grid of photos.
    * *Effect:* A horizontal line (1px high, glowing indigo `box-shadow: 0 0 10px #6366F1`) animates from `top: 0%` to `top: 100%` of the container, repeating infinitely with a `duration: 1.5s` and `ease: "linear"`.
* **AI Smart Search Simulation:** In your landing page feature breakdown, show how the AI search works.
    * *Effect:* Use a Javascript typing library. Type out: `"Photos of me dancing at the Cultural Fest 2023..."`
    * *Timing:* Type at `40ms` per character. Once complete, flash an `accent-glow` border, then instantly pop up a mock grid of 4 highly relevant photos.

### E. Social Interactions (Micro-interactions)
* **Heart/Like Pop:** When a user likes a photo, do not just turn the icon red.
    * *Effect:* The heart icon briefly shrinks (`scale: 0.8`), then explodes past its normal size (`scale: 1.3`), and settles back (`scale: 1`).
    * *Framer Config:* `animate={{ scale: [1, 0.8, 1.3, 1] }} transition={{ duration: 0.4 }}`.
* **Tag Hover Reveal:** AI-generated tags (e.g., `#concert`, `#night`, `#john_doe`) hidden in the UI should smoothly slide out horizontally from behind the image metadata when hovered.

### F. Footer Outlined Logo
* **SVG Line Drawing:** For the massive "AURA" text in the footer.
    * *Initial State:* `stroke-dasharray: 1000`, `stroke-dashoffset: 1000`
    * *Animate To (on Scroll View):* `stroke-dashoffset: 0`
    * *Duration:* `2 seconds`, finishing with a `.5s` transition that fills the text with `rgba(255,255,255,0.1)`.