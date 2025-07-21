# 🧩 ZMK Configurator for Corne (42-Key) Keyboards

## Overview
This is a modern, interactive web application for customizing ZMK keymaps — specifically designed for split keyboards like the Corne (CRKBD). It features a 3D visual layout, dynamic key mapping, and full import/export support for ZMK .keymap and .dtsi files.

Built with Next.js, Shadcn UI, and React Three Fiber, the app offers an intuitive experience for configuring every key and layer without touching DTS syntax.

## ✨ Key Features

### 🎛 3D Interactive Keyboard Layout
Accurate 3D model of the Corne split layout (Left + Right halves)

Hover, select, and edit each key directly in the 3D view

Labels automatically reflect current bindings per layer

Real-time updates across UI and 3D when mappings change

### ⌨️ Keymap Editing
Full support for ZMK keycodes: &kp, &mt, &mo, &trans, etc.

Edit individual keys by selecting them and choosing new actions

Visual label preview for easy recognition (⇪, ⏎, ⌘, etc.)

### 🧱 Layer Management
Add, remove, rename, and reorder layers

Quickly switch between layers in the editor

Detect and highlight transparent (&trans) or undefined (&none) keys

### 🧩 Advanced Key Behavior
Supports mod-tap (&mt), hold-tap, layer-tap, and other compound bindings

UI for assigning modifiers, layers, or tap vs hold behavior per key

Visual editor for combos (multi-key chords triggering a single output)

### 📂 Import & Export
Load your existing ZMK .keymap or keymap.dtsi file

Automatically parses and visualizes your current layout

Export fully formatted ZMK-compatible config for use with your firmware

Optional: show a diff between imported and modified versions

### 🔄 Persistence & Feedback
Layout auto-saves in your browser for session continuity

Toast notifications for key actions (import, export, errors)

Local validation of bindings and layers before export

### (Optional) 🚀 Flash & Test
WebUSB / WebSerial support for direct firmware flashing (experimental)

Virtual key tester: simulate presses and layer switching

### 🔧 Under the Hood
#### Tech Stack

Next.js for app structure and routing

React Three Fiber for 3D rendering

Shadcn UI for modern interface components

Tailwind CSS for design tokens and utility styling

#### Data Modeling

Keyboard geometry (position, rotation, etc.) is decoupled from keymap state

Layer state is managed per-key, per-layer with unique identifiers

ZMK syntax is parsed into normalized JSON, then regenerated on export

### 📌 Target Use Cases
Tinkerers who want a GUI for managing ZMK layouts

Users of split keyboards like the Corne, Ferris, Lily58

People who want to visualize and experiment before flashing firmware

-------------------Remaining Commits--------------------------------

🏗 Base Setup & Architecture
1. chore: add keyboard layout constants and utilities for keymap modeling
Adds foundational metadata and utilities for modeling the Corne keyboard layout.

Define LAYERS, ROWS, COLS, and TOTAL_KEYS = 42

Add static key position data (e.g. { id: 'k_0_0', row: 0, col: 0, x: ..., y: ..., side: 'left' })

Create utilities like:

getKeyId(row, col, layer)

getKeyPosition(keyId)

getDefaultKeymap() (returns &trans or blank config)

Add types for Key, Layer, Binding, KeymapConfig

2. feat: scaffold initial zmkconfig context and state store (layers, keys, behaviors)
Uses React Context or Zustand/Jotai to store all keymap state.

State includes:

layers: string[]

keymap: Record<layerName, Record<keyId, KeyBinding>>

selectedKey: { layer: string, keyId: string }

Utility actions:

setBinding(layer, keyId, newBinding)

addLayer(name)

removeLayer(name)

3. feat: create layout parser for loading and normalizing keymap.dtsi files
Reads in a real ZMK .keymap or .dtsi and converts to internal format.

Parses bindings like &kp A, &mt LSHIFT SPC, etc.

Normalizes split layout into a flat keymap[layer][keyId] structure

Handles &trans, &none, comments, trailing commas

Abstract parser logic out to a lib/zmk-parser.ts

4. chore: setup Tailwind layer styles for keyboard view and key highlighting
Add visual indicators for hover, selected key, active layer, and blank keys.

Adds utility classes:

.key-hover

.key-selected

.key-blank

.key-binding-label

Optional: add @apply-based classes in a CSS module or use cn() helpers

5. chore: setup file upload and raw text input for importing zmk config
Allows drag-and-drop or text-based config loading.

Adds a file dropzone or text area for .keymap or .dtsi input

Parses file and loads layout state on import

Basic error handling for invalid formats

🎨 Interactive 3D Keyboard Integration
6. feat: wire 3D key meshes to dynamic layout data via key IDs
Each mesh maps to a logical keyId, not hardcoded.

Assign key metadata via props or mesh userData (e.g., keyId: 'k_1_2')

Dynamically label keys based on current selected layer state

Support useFrame or memoized re-renders for performance

7. feat: add hover and select interaction to 3D keys
Clicking or hovering a key updates UI and highlights in 3D.

Raycast hits update selected key in the store

Hover state tracked to highlight or preview key bindings

8. feat: display active layer and keycode label in 3D keycap
Label each keycap in 3D with current binding (e.g., A, MO(1), etc).

Font: drei/Text with small outline or shadow for readability

Pull display symbol from keycode dictionary (KC_A → A, &kp CAPSLOCK → ⇪)

9. chore: add basic camera and controls configuration for corne layout
Sets up a smooth UX for interacting with the 3D keyboard.

OrbitControls limited to appropriate axes

Slight angle and zoom out to show both halves

Responsive sizing and pixel ratio handling

10. feat: add layer toggle and selector UI in Shadcn sidebar
Side panel to select active layer and manage all layers.

Display current layer tabs or a dropdown

Add/remove/rename layers

Active layer affects all interactions and label rendering

🧩 Layer + Key Mapping Flow
11. feat: allow switching editing context between layers
Selecting a new layer updates all 3D labels and key states.

Clicking a layer tab sets active layer in store

UI/3D re-renders according to the layer’s keymap

12. feat: show selected key details in side panel (key, layer, binding)
When a key is clicked, show editable details.

Selected key info: row, col, layer, current binding

Editable dropdown or input for new keycode

13. feat: create searchable keycode selector (mapped to zmk keycodes)
Input/search for key actions like A, Enter, MO(1).

Preload ZMK keycode map as JSON (with display symbol + code + type)

Optionally grouped (Basic, Modifiers, Layers, System)

14. feat: update layout state on binding change and sync 3D view
Changing a key binding updates the store and UI.

Calls setBinding(layer, keyId, newBinding)

Triggers 3D label update and layer serialization

15. chore: add default zmk keycode dictionary and symbol mapping
Maps &kp A → A, &mo 1 → MO(1), &capslock → ⇪, etc.

Flat keycode registry: code → { label, type, symbol, args }

Used for input validation, previews, display

🛠 Import/Export & Serialization
16. feat: add parser for importing zmk .keymap or .dtsi files
Same as #3, but plugged into import UI and input field.

Allow import via file or pasted text

Show filename or summary once loaded

17. feat: serialize current keymap state into ZMK-compatible DTS syntax
Build .keymap or keymap.dtsi string with all bindings.

Write per-layer bindings = <...>; blocks

Include comments with key positions (optional)

Export as downloadable text file

18. chore: add download button to export generated config
UI button to export the generated DTS as a file.

Download Config → triggers file download from serialized output

19. feat: show diff between imported and current config (optional)
Use diffing library to compare two versions of keymap.

Highlight changed bindings per layer

Optional: toggle to show only diffs

🧪 Validations & QoL
20. feat: validate keymap for missing layers and invalid bindings
Basic safety checks to avoid incomplete ZMK exports.

Check all keys are valid ZMK codes or &trans

Warn if fewer than required base layers exist

21. feat: highlight transparent or undefined keys in the 3D model
Show &trans or blank keys differently (e.g., faded, dashed outline).

Helps visually debug gaps in config

Tooltip or icon on hover to explain

22. feat: persist layout in localStorage for session recovery
Saves the current keymap locally in the browser.

Auto-saves after edits

Load from cache if present on page load

23. chore: add dark mode toggle and responsive layout polish
Visual improvements + theme support.

Toggle theme using Shadcn's theming

Adjust 3D view sizing for mobile/tablet

24. chore: add basic toast notifications for import/export success
Friendly toasts via useToast().

Show on successful import/export

Error toast on malformed config