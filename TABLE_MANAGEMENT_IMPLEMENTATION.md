# Table Management Implementation

## Overview

This document describes the implementation of database-specific table occupancy management based on user navigation between home page and customer pages.

## Requirements Implemented

1. **Database Selection**: Users first select database and verify password from hotels.csv
2. **Table Occupancy Logic**: 
   - `is_occupied = 0` when user is on home page (table free)
   - `is_occupied = 1` when user is on customer page (table occupied)
3. **Database Independence**: All table operations work within the selected database
4. **Hotel Manager Visibility**: Table status is for hotel manager visibility only

## Implementation Details

### Backend Changes

#### 1. New API Endpoint
- **Endpoint**: `PUT /tables/number/{table_number}/free`
- **Purpose**: Set table as free by table number
- **Location**: `app/routers/table.py`

```python
@router.put("/number/{table_number}/free", response_model=Table)
def set_table_free_by_number(table_number: int, db: Session = Depends(get_db)):
    # Implementation details in the file
```

#### 2. Database Schema Update
- **Added Field**: `last_occupied_at` to tables table
- **Type**: `DATETIME`, nullable
- **Purpose**: Track when table was last occupied
- **Files Modified**: 
  - `app/database.py` (SQLAlchemy model)
  - `app/models/table.py` (Pydantic models)

#### 3. Migration Support
- **Script**: `migrate_table_schema.py`
- **Purpose**: Add `last_occupied_at` column to existing databases
- **Usage**: Run before starting the application with existing databases

### Frontend Changes

#### 1. API Service Updates
- **File**: `frontend/src/services/api.js`
- **New Methods**:
  - `customerService.setTableFreeByNumber(tableNumber)`
  - `adminService.setTableFreeByNumber(tableNumber)`

#### 2. Home Page Updates
- **File**: `frontend/src/pages/Home.js`
- **Changes**:
  - Added `freeTableOnHomeReturn()` function
  - Automatically frees table when user returns to home page
  - Uses selected database for table operations

#### 3. Customer Menu Updates
- **File**: `frontend/src/pages/customer/Menu.js`
- **Changes**:
  - Enhanced back-to-home button to free table before navigation
  - Added `beforeunload` event listener for browser close/refresh
  - Uses `navigator.sendBeacon` for reliable cleanup

## Database Independence

### How It Works
1. **Database Selection**: Users select database on home page
2. **Session Management**: Database credentials stored in localStorage
3. **API Calls**: All table operations use the selected database
4. **Isolation**: Each database maintains its own table occupancy state

### Storage Keys
- `customerSelectedDatabase`: Selected database name
- `customerDatabasePassword`: Database password
- `tableNumber`: Current table number

## Table Occupancy Flow

### User Journey
1. **Home Page**: User selects database and table number
   - Table status: `is_occupied = 0` (free)
2. **Navigate to Customer Page**: User enters customer interface
   - Table status: `is_occupied = 1` (occupied)
   - API call: `PUT /tables/number/{table_number}/occupy`
3. **Return to Home**: User clicks back button or navigates away
   - Table status: `is_occupied = 0` (free)
   - API call: `PUT /tables/number/{table_number}/free`

### Cleanup Scenarios
1. **Back Button**: Explicit table freeing before navigation
2. **Browser Close**: `beforeunload` event with `navigator.sendBeacon`
3. **Page Refresh**: `beforeunload` event with `navigator.sendBeacon`
4. **Direct Navigation**: Home page automatically frees table on load

## Testing

### Test Script
- **File**: `test_table_management.py`
- **Purpose**: Verify table management functionality
- **Tests**:
  - Database selection
  - Table creation
  - Table occupation
  - Table freeing
  - Status retrieval

### Running Tests
```bash
python test_table_management.py
```

## Migration

### For Existing Databases
```bash
python migrate_table_schema.py
```

This will:
- Find all .db files in current directory
- Add `last_occupied_at` column if missing
- Preserve existing data

## API Endpoints Summary

| Method | Endpoint | Purpose |
|--------|----------|---------|
| PUT | `/tables/number/{table_number}/occupy` | Set table as occupied |
| PUT | `/tables/number/{table_number}/free` | Set table as free |
| GET | `/tables/status/summary` | Get table status summary |
| GET | `/tables/number/{table_number}` | Get table by number |

## Error Handling

- **Table Not Found**: Returns 404 error
- **Database Connection**: Graceful fallback and error logging
- **Network Issues**: Silent failure for cleanup operations
- **Invalid Table Number**: Validation and error messages

## Security Considerations

- **Database Access**: Password-protected database selection
- **Session Management**: Credentials stored in localStorage
- **API Security**: Database switching requires authentication
- **Data Isolation**: Complete separation between databases

## Performance Optimizations

- **Minimal API Calls**: Only when necessary
- **Async Operations**: Non-blocking table updates
- **Error Recovery**: Graceful handling of failed operations
- **Cleanup Efficiency**: `navigator.sendBeacon` for reliable cleanup

## Future Enhancements

1. **Real-time Updates**: WebSocket for live table status
2. **Table Reservations**: Advanced booking system
3. **Analytics**: Table utilization tracking
4. **Mobile Support**: Touch-optimized interface
5. **Multi-language**: Internationalization support
