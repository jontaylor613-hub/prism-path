# ImportRoster Component Integration Guide

## File Locations

- **CSV Parser Utility**: `/lib/csvParser.ts`
- **Mock Store**: `/lib/mockStore.ts`
- **Import Component**: `/components/features/ImportRoster.tsx`

## Installation

First, install the required dependency:

```bash
npm install papaparse @types/papaparse
```

## Usage Example

Here's how to integrate the ImportRoster component into your TeacherDashboard:

```tsx
// In TeacherDashboard.jsx (or your dashboard component)

import ImportRoster from './components/features/ImportRoster';
import { getAllStudents } from './lib/mockStore';

// In your component:
const [students, setStudents] = useState([]);

const handleImportComplete = (importedStudents) => {
  console.log('Imported students:', importedStudents);
  // Refresh the student list
  const allStudents = getAllStudents();
  setStudents(allStudents);
};

const handleStudentsUpdate = (updatedStudents) => {
  setStudents(updatedStudents);
};

// In your JSX:
<ImportRoster
  onImportComplete={handleImportComplete}
  onStudentsUpdate={handleStudentsUpdate}
  theme={theme} // Optional: pass your theme object
/>
```

## CSV Format

The CSV file must have these exact column headers (case-insensitive):

- `Student Name` (required)
- `Grade` (required)
- `Diagnosis` (required)
- `IEP Goals` (semicolon-separated, e.g., "Goal 1; Goal 2; Goal 3")
- `Accommodations` (semicolon-separated, e.g., "Extended time; Chunking; Movement breaks")

## Example CSV Content

```csv
Student Name,Grade,Diagnosis,IEP Goals,Accommodations
Alex Johnson,5,ADHD,"Improve focus during independent work; Complete assignments on time","Extended time; Chunking; Movement breaks"
Sam Martinez,3,Dyslexia,"Improve reading fluency; Increase comprehension","Read aloud; Extra time; Phonics support"
```

## Integration with Existing Student State

The component uses the mock store (`/lib/mockStore.ts`) to persist imported students. When you import students:

1. They are added to the in-memory mock store
2. The `onImportComplete` callback is triggered with the imported students
3. The `onStudentsUpdate` callback is triggered with all students (including existing ones)

You can then use `getAllStudents()` from `/lib/mockStore.ts` anywhere in your app to access the imported students.

