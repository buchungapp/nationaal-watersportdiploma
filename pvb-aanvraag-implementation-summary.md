# PvB Aanvraag Implementation Summary

## Overview
Successfully implemented a fully functional PvB aanvraag (assessment request) details page with role-based access control for three user types: kandidaat (candidate), leercoach (coach), and beoordelaar (assessor).

## Core Business Logic Implementation

### 1. Core Functions Added (`packages/core/src/models/pvb/`)

#### In `beoordeling.ts`:
- `startBeoordeling` - Transitions aanvraag to "in_beoordeling" status
- `updateBeoordelingsCriterium` - Updates single assessment criterion
- `updateBeoordelingsCriteria` - Updates multiple criteria in batch
- `updateOnderdeelUitslag` - Updates component result (behaald/niet_behaald)
- `abortBeoordeling` - Aborts assessment with reason
- `finalizeBeoordeling` - Completes assessment after checking all components

#### In `aanvraag.ts`:
- `denyLeercoachPermission` - Allows leercoach to deny permission with reason

### 2. Server Actions (`apps/web/src/app/_actions/pvb/`)

#### `assessment-action.ts`:
- `startPvbAssessmentAction` - Start assessment
- `updatePvbBeoordelingsCriteriumAction` - Update single criterion
- `updatePvbBeoordelingsCriteriaAction` - Update multiple criteria
- `updatePvbOnderdeelUitslagAction` - Update component result
- `abortPvbAction` - Abort assessment
- `finalizePvbAssessmentAction` - Finalize assessment

#### `leercoach-permission-action.ts`:
- `grantLeercoachPermissionAction` - Grant permission with optional remarks
- `denyLeercoachPermissionAction` - Deny permission with required reason

### 3. UI Components

#### Main Page (`/app/(dashboard)/(account)/profiel/[handle]/pvb-aanvraag/[pvbHandle]/page.tsx`):
- Determines user role based on their relationship to the aanvraag
- Shows 404 if user has no role
- Renders role-specific components

#### Shared Components:
- `aanvraag-card.tsx` - Displays aanvraag details
- `pvb-timeline.tsx` - Shows event timeline
- `toetsdocumenten-card.tsx` - Wrapper for assessment documents

#### Role-Specific Components:

**Leercoach View (`leercoach-view.tsx`):**
- Shows permission grant/deny buttons when status is "wacht_op_voorwaarden"
- Grant dialog with optional remarks field
- Deny dialog with required reason field
- Toast notifications for success/error

**Beoordelaar View (`beoordelaar-view.tsx`):**
- Start assessment button (when status is "gereed_voor_beoordeling")
- Abort assessment with required reason (when status is "in_beoordeling")
- Finalize assessment (when all components are assessed)
- Proper validation and error handling

**Assessment View (`assessment-view.tsx`):**
- Interactive assessment interface with optimistic updates
- Checkbox for each criterion (checked/unchecked/indeterminate)
- Optional remarks per criterion
- Quick buttons to mark entire component as pass/fail
- Real-time updates using React's `useOptimistic` hook
- Hierarchical display of assessment structure

## Key Features Implemented

### 1. Role-Based Access Control
- Kandidaat: Read-only access to their own aanvraag
- Leercoach: Can grant/deny permission during "wacht_op_voorwaarden" status
- Beoordelaar: Can start, assess, abort, or finalize the assessment

### 2. Optimistic UI Updates
- Immediate visual feedback when updating criteria
- Smooth user experience with rollback on errors
- Similar pattern to existing student-module.tsx

### 3. Status Transitions
- Proper validation of current status before transitions
- Event logging for all status changes
- Clear error messages for invalid operations

### 4. Assessment Interface
- Color-coded borders (blue for portfolio, green for praktijk)
- Collapsible sections for better organization
- Werkproces-level checkboxes show aggregate status
- Individual criterion assessment with remarks

## Technical Implementation Details

### 1. Database Schema
- Uses existing PvB tables with proper foreign key relationships
- Event sourcing pattern for audit trail
- Supports multiple assessors per aanvraag

### 2. Server Actions
- Proper actor validation (finds instructor actor for location)
- Comprehensive error handling
- Path revalidation for real-time updates

### 3. Component Architecture
- Client components for interactive features
- Server components for data fetching
- Proper separation of concerns

### 4. UI/UX Considerations
- Consistent with existing dashboard design
- Responsive layout
- Accessible form controls
- Clear visual hierarchy

## Testing Recommendations

### 1. Test Scenarios
- Leercoach granting/denying permission
- Beoordelaar starting assessment
- Updating individual criteria
- Bulk updating criteria for a component
- Aborting assessment with reason
- Finalizing completed assessment

### 2. Edge Cases
- Multiple beoordelaars for different components
- Permission changes during assessment
- Invalid status transitions
- Concurrent updates

### 3. Performance Testing
- Optimistic updates with slow network
- Large number of criteria
- Multiple simultaneous users

## Future Enhancements

### 1. Additional Features
- Email notifications for status changes
- PDF export of assessment results
- Bulk operations for multiple aanvragen
- Assessment scheduling interface

### 2. UI Improvements
- Progress indicators for assessment completion
- Keyboard shortcuts for quick assessment
- Undo/redo functionality
- Auto-save for remarks

### 3. Integration Points
- Calendar integration for assessment dates
- Document upload for evidence
- Video recording of practical assessments
- Digital signature for finalized assessments

## Deployment Considerations

### 1. Database Migrations
- No new tables required
- Uses existing schema

### 2. Environment Variables
- No new environment variables needed

### 3. Performance
- Optimistic updates reduce perceived latency
- Efficient queries with proper indexes
- Minimal server round-trips

## Conclusion

The implementation provides a complete, production-ready solution for PvB assessment management with proper role-based access control, optimistic UI updates, and comprehensive error handling. The code follows existing patterns in the codebase and integrates seamlessly with the current architecture.