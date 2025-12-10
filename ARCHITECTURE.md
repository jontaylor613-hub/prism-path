# Architecture Overview

## File Structure

```
/prism-path
  /api
    generate.js          - AI backend route (Router Pattern)
  
  /lib
    csvParser.js         - CSV parsing utility
    mockStore.js         - In-memory student data store (fallback)
    studentService.js    - Unified service (Firebase + Mock fallback)
  
  /components
    /features
      ImportRoster.jsx   - CSV import component
  
  /src
    studentData.js       - Firebase student operations
    firebase.js          - Firebase configuration
```

## Data Flow Architecture

### Unified Student Service (`/lib/studentService.js`)

The `studentService` provides a **unified interface** that automatically:

1. **Tries Firebase first** (when configured and available)
2. **Falls back to mock store** (when Firebase fails or isn't configured)
3. **Works seamlessly** - no code changes needed when Firebase is connected

#### Key Functions:

- `getStudents(userId, userRole)` - Get all students
- `getStudent(studentId, userId, userRole)` - Get single student
- `createStudent(studentData, userId, userRole)` - Create student
- `importStudentsFromCSV(students, userId, userRole)` - Bulk import
- `updateStudent(studentId, updates, userId, userRole)` - Update student
- `removeStudent(studentId, userId, userRole)` - Remove student
- `getStudentDataForAPI(studentId)` - Get student data for API routes

#### Firebase Availability Check:

- Checks Firebase config validity (not placeholder values)
- Tests Firebase connection with timeout (2 seconds)
- Caches result for 30 seconds (performance optimization)
- Automatically falls back to mock store on failure

### Mock Store (`/lib/mockStore.js`)

In-memory store that:
- Provides fallback when Firebase is unavailable
- Maintains same data structure as Firebase
- Supports all CRUD operations
- Initializes with default mock student

### CSV Import Flow

1. **User uploads CSV** → `ImportRoster.jsx`
2. **Parse CSV** → `csvParser.js` validates and parses
3. **Preview data** → Shows first 5 students
4. **Confirm import** → `studentService.importStudentsFromCSV()`
5. **Service tries Firebase** → If available, creates in Firebase
6. **Falls back to mock** → If Firebase fails, uses mock store
7. **Update UI** → Parent component refreshes student list

## API Route Architecture

### Router Pattern (`/api/generate.js`)

The API route uses a **switch-based router** with 4 distinct modes:

1. **`neuro_driver`** - Executive function coach (gemini-1.5-flash)
2. **`accommodation_gem`** - Curriculum differentiator (gemini-1.5-pro)
3. **`iep_builder`** - Special Education Case Manager (gemini-1.5-pro)
4. **`instant_accommodation`** - Inclusion specialist (gemini-1.5-flash)

### Key Features:

- **Request-scoped variables** - All data instantiated per request (prevents stale state)
- **Fresh student data** - Fetches student data fresh for each request
- **Mode isolation** - Each mode has its own handler function
- **Error handling** - Comprehensive error handling with fallbacks

## Performance Optimizations

1. **Firebase availability caching** - Results cached for 30 seconds
2. **Lazy loading** - CSV parser only loads papaparse when needed
3. **Request isolation** - No shared state between requests
4. **Automatic fallback** - Seamless transition from Firebase to mock

## Migration Path

When Firebase is fully connected:

1. **No code changes needed** - The unified service automatically uses Firebase
2. **Mock store remains** - Still available as fallback
3. **CSV import works** - Automatically imports to Firebase when available
4. **API routes** - Can be updated to use Firebase if needed (currently uses mock for simplicity)

## Benefits

✅ **Works immediately** - App functions without Firebase configuration  
✅ **Seamless migration** - Automatically uses Firebase when connected  
✅ **No breaking changes** - Existing code continues to work  
✅ **Performance** - Caching and optimizations reduce Firebase calls  
✅ **Reliability** - Automatic fallback prevents crashes  

