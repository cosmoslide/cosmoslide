# CosmosSlide Editor

A WYSIWYG slide editor with canvas-based editing, PDF export, and themeable UI.

## Features

- **Canvas Editing**: Drag, resize, and rotate text elements on a Konva-powered canvas
- **Slide Management**: Add, duplicate, reorder, and delete slides via outline panel
- **Right-click Context Menus**: Canvas and slide thumbnail context menus (Radix UI)
- **PDF Export**: Export presentations as PDF via jsPDF
- **Print Support**: Native browser print dialog
- **Theming**: CSS variable-based theming with light/dark mode and named themes
- **Keyboard Navigation**: Arrow keys for slide navigation, Escape for preview exit

## Installation

```bash
pnpm add @cosmoslide/editor
```

## Quick Start

```tsx
import { SlideEditor } from '@cosmoslide/editor';

function App() {
  return (
    <div style={{ height: '100vh' }}>
      <SlideEditor />
    </div>
  );
}
```

## SlideEditor

The main component that renders the complete editor interface: toolbar, slide outline panel, and canvas.

### Props

| Prop        | Type                   | Required | Description                                     |
| ----------- | ---------------------- | -------- | ----------------------------------------------- |
| `onPublish` | `(blob: Blob) => void` | No       | Called with PDF blob when user clicks "Publish" |
| `theme`     | `string`               | No       | Named theme (e.g. `"bumblebee"`)                |

### Example

```tsx
<SlideEditor
  theme="bumblebee"
  onPublish={async (blob) => {
    const formData = new FormData();
    formData.append('file', blob, 'presentation.pdf');
    await fetch('/api/upload', { method: 'POST', body: formData });
  }}
/>
```

## Theming

The editor uses CSS custom properties for all colors. It ships with light and dark mode defaults, plus a `bumblebee` named theme.

### Built-in Modes

- **Light** (default): Applied via `:root` variables
- **Dark**: Activated when an ancestor has the `dark` class (e.g. `<html class="dark">`)
- **Bumblebee**: Warm golden-yellow palette, activated via `<SlideEditor theme="bumblebee" />`

### Creating a Custom Theme

Add a `[data-editor-theme="name"]` block to your CSS with all 20 variables:

```css
[data-editor-theme='dracula'] {
  --editor-background: oklch(0.2 0.02 280);
  --editor-foreground: oklch(0.92 0 0);
  --editor-surface: oklch(0.25 0.02 280);
  --editor-surface-hover: oklch(0.3 0.02 280);
  --editor-muted: oklch(0.3 0.02 280);
  --editor-muted-hover: oklch(0.35 0.02 280);
  --editor-muted-foreground: oklch(0.65 0 0);
  --editor-canvas: oklch(0.22 0.02 280);
  --editor-border: oklch(0.35 0.02 280);
  --editor-border-secondary: oklch(0.4 0.02 280);
  --editor-primary: oklch(0.7 0.2 300);
  --editor-primary-bg: oklch(0.65 0.22 300);
  --editor-primary-hover: oklch(0.58 0.22 300);
  --editor-primary-muted: oklch(0.3 0.1 300);
  --editor-primary-muted-foreground: oklch(0.75 0.15 300);
  --editor-primary-ring: oklch(0.4 0.12 300);
  --editor-destructive: oklch(0.6 0.22 25);
  --editor-destructive-muted: oklch(0.28 0.08 25);
  --editor-destructive-muted-foreground: oklch(0.75 0.15 25);
  --editor-destructive-hover: oklch(0.32 0.1 25);
}
```

Then use it:

```tsx
<SlideEditor theme="dracula" />
```

### CSS Variable Reference

| Variable                                | Usage                              |
| --------------------------------------- | ---------------------------------- |
| `--editor-background`                   | Main editor background             |
| `--editor-foreground`                   | Primary text color                 |
| `--editor-surface`                      | Toolbar, panels, cards             |
| `--editor-surface-hover`                | Hover state on surfaces            |
| `--editor-muted`                        | Button backgrounds, secondary fill |
| `--editor-muted-hover`                  | Button hover state                 |
| `--editor-muted-foreground`             | Labels, secondary text             |
| `--editor-canvas`                       | Canvas area background             |
| `--editor-border`                       | General borders                    |
| `--editor-border-secondary`             | Input/thumbnail borders            |
| `--editor-primary`                      | Active accent (thumbnail border)   |
| `--editor-primary-bg`                   | Primary action button background   |
| `--editor-primary-hover`                | Primary button hover               |
| `--editor-primary-muted`                | Active state background            |
| `--editor-primary-muted-foreground`     | Active state text                  |
| `--editor-primary-ring`                 | Focus ring on active elements      |
| `--editor-destructive`                  | Destructive accent color           |
| `--editor-destructive-muted`            | Delete button background           |
| `--editor-destructive-muted-foreground` | Delete/error text                  |
| `--editor-destructive-hover`            | Delete button hover                |

## Hooks

### useSlideExport

Renders each slide off-screen and composes a PDF with jsPDF.

```tsx
import { useSlideExport } from '@cosmoslide/editor';

const { exportPdf, isExporting, error } = useSlideExport(presentation);

const blob = await exportPdf(); // Returns Blob | null
```

| Return        | Type                          | Description                   |
| ------------- | ----------------------------- | ----------------------------- |
| `exportPdf`   | `() => Promise<Blob \| null>` | Trigger export, returns blob  |
| `isExporting` | `boolean`                     | Whether export is in progress |
| `error`       | `string \| null`              | Error message if export fails |

## Types

```tsx
import type {
  Presentation,
  Slide,
  SlideElement,
  TextElement,
  SlideDimensions,
  SlidePreset,
} from '@cosmoslide/editor';

import { SLIDE_PRESETS, DEFAULT_DIMENSIONS } from '@cosmoslide/editor';
```

### Slide Presets

| Preset       | Width  | Height |
| ------------ | ------ | ------ |
| Slide 16:9   | 960px  | 540px  |
| Slide 4:3    | 960px  | 720px  |
| A4 Landscape | 1123px | 794px  |

## Legacy Components

The following markdown-to-PDF components are still exported for backward compatibility:

```tsx
import {
  MarkdownToPdfApp,
  MarkdownEditor,
  MarkdownPreview,
  PrintButton,
  PageSizeControls,
  usePdfExport,
} from '@cosmoslide/editor';
```

See earlier versions of this README for their full API documentation.
