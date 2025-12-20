# Launch Readiness Features - Usage Guide

## Overview
This document describes the 3 launch readiness modules implemented for the application.

---

## 1. PDF Export Utility (`src/utils/pdfExporter.js`)

**Status:** ✅ Ready to use

**Installation Required:**
```bash
npm install jspdf
```

**Usage Example:**
```javascript
import { generatePDF } from './utils/pdfExporter';

// In your component:
const handleExportPDF = async () => {
  try {
    await generatePDF(
      'Behavior Intervention Plan',  // Title
      markdownContent,                // Markdown text from AI
      'Lincoln Elementary School',    // School name (optional)
      'PrismPath'                     // App name (optional, defaults to PrismPath)
    );
  } catch (error) {
    console.error('PDF export failed:', error);
    alert('Failed to generate PDF. Please ensure jspdf is installed.');
  }
};
```

**Features:**
- Converts Markdown to formatted PDF
- Professional header: "[School Name] - Official Document"
- Clean title formatting
- Proper margins and line spacing
- Footer with app name and generation date
- Page numbers
- Automatic filename generation

**Example Integration:**
Add an export button next to AI-generated content:
```jsx
import { generatePDF } from '../utils/pdfExporter';
import { FileDown } from 'lucide-react';

<button 
  onClick={() => generatePDF('IEP Goals', aiContent, schoolName)}
  className="px-4 py-2 bg-cyan-500 text-white rounded-lg flex items-center gap-2"
>
  <FileDown size={16} />
  Export PDF
</button>
```

---

## 2. Onboarding Tour (`src/components/OnboardingTour.jsx`)

**Status:** ✅ Integrated and active

**Features:**
- Automatically shows for new users (checks `localStorage`)
- Spotlight overlay with dark backdrop
- 3-step guided tour:
  1. **Add Student** button
  2. **AI Tools** (Gem tab)
  3. **Command Bar** (Cmd+K)
- Progress indicators
- Skip and Next buttons
- Responsive positioning

**Integration:**
Already integrated in `TeacherDashboard.jsx`. The tour automatically appears for users who haven't seen it.

**Tour Markers:**
Elements must have `data-tour` attributes:
- `data-tour="add-student"` - Add Student button
- `data-tour="ai-tools"` - Gem/AI Tools tab
- `data-tour="command-bar"` - Command Bar component

**Reset Tour (for testing):**
```javascript
localStorage.removeItem('prismpath_hasSeenTour');
// Refresh page to see tour again
```

---

## 3. Accessibility Menu (`src/components/A11yMenu.jsx`)

**Status:** ✅ Integrated and active

**Features:**
- **Font Mode:**
  - Default: Standard system fonts
  - OpenDyslexic: Dyslexia-friendly font (loaded from CDN)
- **Contrast Mode:**
  - Normal: Standard theme colors
  - High Contrast: Black background (#000) with yellow text (#FFD700)
- Settings persist to localStorage
- Accessible via:
  - Settings button in header
  - Command Bar (Cmd+K → "Accessibility Settings")

**Usage:**
The menu is accessible via:
1. **Header Button:** Click the Settings icon in the top-right header
2. **Command Bar:** Press Cmd+K (or Ctrl+K), then type "Accessibility" or "a11y"

**Integration:**
Already integrated in `TeacherDashboard.jsx` and `CommandBar.jsx`.

**Persistence:**
Settings are automatically saved to `localStorage` under key `prismpath_a11y_settings` and persist across sessions.

**Reset Settings:**
```javascript
localStorage.removeItem('prismpath_a11y_settings');
// Refresh page to reset
```

---

## File Structure

```
src/
├── utils/
│   └── pdfExporter.js          # PDF generation utility
├── components/
│   ├── OnboardingTour.jsx     # Guided tour component
│   └── A11yMenu.jsx            # Accessibility settings menu
└── TeacherDashboard.jsx        # Main dashboard (integrated)
```

---

## Dependencies

**Required:**
- `jspdf` - For PDF generation (install with `npm install jspdf`)
- `lucide-react` - Already installed (for icons)
- `react` - Already installed

**Optional:**
- OpenDyslexic font is loaded from CDN automatically when needed

---

## Testing Checklist

### PDF Export
- [ ] Install jspdf: `npm install jspdf`
- [ ] Test PDF generation with sample markdown
- [ ] Verify header, title, content, and footer formatting
- [ ] Check filename generation

### Onboarding Tour
- [ ] Clear localStorage: `localStorage.removeItem('prismpath_hasSeenTour')`
- [ ] Refresh page - tour should appear
- [ ] Test Next button navigation
- [ ] Test Skip button
- [ ] Verify tour markers are correctly positioned

### Accessibility Menu
- [ ] Open via header Settings button
- [ ] Open via Command Bar (Cmd+K)
- [ ] Test font mode toggle (Default ↔ OpenDyslexic)
- [ ] Test contrast mode toggle (Normal ↔ High Contrast)
- [ ] Refresh page - settings should persist
- [ ] Verify high contrast mode applies correctly

---

## Notes

- **PDF Export:** Requires `jspdf` to be installed. The function will throw an error if not installed.
- **Onboarding Tour:** Only shows once per user (stored in localStorage). Clear the key to test again.
- **Accessibility:** Settings are applied globally and persist across page reloads.
- **High Contrast Mode:** Uses aggressive CSS overrides. Some custom-styled components may need adjustments.

---

## Future Enhancements

- Add more font options (e.g., Comic Sans for dyslexia)
- Add font size controls
- Add color scheme options (beyond high contrast)
- Add keyboard navigation improvements
- Add screen reader announcements
- Export tour completion analytics





