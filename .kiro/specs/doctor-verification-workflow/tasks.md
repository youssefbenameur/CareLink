# Implementation Plan: Doctor Verification Workflow

## Overview

Migrate the doctor approval system from the legacy `approvalStatus` field and generic file upload to a structured `doctorVerificationStatus` field with typed credential slots, dedicated pending/rejected pages, and updated access control throughout the app.

## Tasks

- [x] 1. Update `firebase.ts` — typed upload and field migration
  - [x] 1.1 Refactor `uploadDoctorDocuments` to accept a typed documents map
    - Change signature from `files: File[]` to `documents: { doctorLicense?: File; diploma?: File; certification?: File }`
    - Return `{ doctorLicense?: string; diploma?: string; certification?: string }` instead of `string[]`
    - Update storage path to `doctor-documents/{userId}/{documentType}/{timestamp}_{filename}` using the map key as `documentType`
    - _Requirements: 1.6, 5.5_

  - [ ]* 1.2 Write property test for storage path format (Property 4)
    - **Property 4: Storage path includes document type**
    - **Validates: Requirements 1.6, 5.5**

  - [x] 1.3 Update `registerUser` to write `doctorVerificationStatus` instead of `approvalStatus`
    - Replace `approvalStatus` field with `doctorVerificationStatus: 'pending'` for doctor role
    - Remove `approvalStatus` from the `setDoc` call entirely
    - _Requirements: 1.8, 5.3_

  - [ ]* 1.4 Write property test for new doctor record field (Property 6)
    - **Property 6: New doctor record uses doctorVerificationStatus**
    - **Validates: Requirements 1.8, 5.3**

- [x] 2. Update `AuthContext` — typed documents, session retention, and routing
  - [x] 2.1 Update `register` function signature and document upload call
    - Change `doctorFiles?: File[]` parameter to `doctorDocuments?: { doctorLicense?: File; diploma?: File; certification?: File }`
    - Update `uploadDoctorDocuments` call to pass the typed map
    - Update `updateDoc` call to write the returned URL map to `credentialDocuments`
    - Update the `AuthContextType` interface to reflect the new `register` signature
    - _Requirements: 1.6, 1.7, 5.5_

  - [x] 2.2 Update `login` function — remove silent logout, add status-based redirects
    - Remove `logoutUser()` calls for pending and rejected doctors
    - Replace `approvalStatus` checks with `doctorVerificationStatus` checks
    - Redirect pending doctors to `/doctor/pending` with session active
    - Redirect rejected doctors to `/doctor/rejected` with session active
    - Remove the destructive toast notifications for pending/rejected states
    - _Requirements: 2.1, 2.5, 4.3, 5.1_

- [x] 3. Update `RegisterForm` — replace generic upload with three typed slots
  - [x] 3.1 Replace file state with typed `DoctorDocumentSlot` array
    - Remove `doctorFiles: File[]` state and `fileInputRef`
    - Add `documentSlots` state with three entries: `doctorLicense` (required), `diploma` (required), `certification` (optional)
    - Each slot holds `{ key, label, required, file: File | null, error: string | null }`
    - _Requirements: 1.1, 1.2_

  - [x] 3.2 Render three independent upload slots in the doctor section
    - Each slot has its own hidden `<input type="file">` with a ref, a label, a "Choose file" button, filename display, and a remove button
    - Mark required slots with a visual indicator
    - Show inline error message per slot when `slot.error` is set
    - _Requirements: 1.1, 1.2, 1.5_

  - [x] 3.3 Implement per-slot file type validation
    - On file selection, check MIME type against `['application/pdf', 'image/jpeg', 'image/png']`
    - If invalid, set `slot.error` with an inline message; do not add the file to state
    - If valid, set `slot.file` and clear `slot.error`
    - _Requirements: 1.4_

  - [ ]* 3.4 Write property test for file type validation (Property 2)
    - **Property 2: File type validation**
    - **Validates: Requirements 1.4**

  - [ ]* 3.5 Write property test for selected file display (Property 3)
    - **Property 3: Selected file display**
    - **Validates: Requirements 1.5**

  - [x] 3.6 Implement submit-time validation and pass typed map to `register`
    - On submit, check that `doctorLicense` and `diploma` slots have files; if not, set their `error` fields and block submission
    - Build the typed documents map from slot state and pass to `register(email, password, userData, doctorDocuments)`
    - _Requirements: 1.3, 1.6_

  - [ ]* 3.7 Write property test for required document validation (Property 1)
    - **Property 1: Required document validation blocks submission**
    - **Validates: Requirements 1.3**

- [ ] 4. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Create `PendingApproval` page
  - [x] 5.1 Create `src/pages/doctor/PendingApproval.tsx`
    - Display a status icon and heading: "Your application is under review"
    - Display body text explaining the review timeline (3–5 business days) and that the doctor will be notified upon a decision
    - Render a logout button that calls `logout()` from `useAuth` and redirects to `/login`
    - _Requirements: 2.2, 2.4_

- [x] 6. Create `RejectedApplication` page
  - [x] 6.1 Create `src/pages/doctor/RejectedApplication.tsx`
    - Display a status icon and heading: "Application not approved"
    - Display body text explaining the decision and next steps
    - Include a support contact link or email address
    - Render a logout button that calls `logout()` from `useAuth`
    - _Requirements: 2.6_

- [x] 7. Update `ProtectedRoute` — add `doctorVerificationStatus` access control
  - [x] 7.1 Add verification status check for doctor-role routes
    - After the existing role check, add: if `userData.role === 'doctor'` and `allowedRoles` includes `'doctor'`, check `doctorVerificationStatus`
    - If `pending`, return `<Navigate to="/doctor/pending" replace />`
    - If `rejected`, return `<Navigate to="/doctor/rejected" replace />`
    - If `approved` (or any other value), allow access as normal
    - Do NOT apply this check to the `/doctor/pending` and `/doctor/rejected` routes themselves (they will not use `allowedRoles`)
    - _Requirements: 2.3, 4.2, 4.4_

  - [ ]* 7.2 Write property test for pending doctor redirect (Property 7)
    - **Property 7: Pending doctor is redirected on any doctor-only route**
    - **Validates: Requirements 2.3**

  - [ ]* 7.3 Write property test for rejected doctor redirect (Property 8)
    - **Property 8: Rejected doctor is redirected on any doctor-only route**
    - **Validates: Requirements 4.4**

  - [ ]* 7.4 Write property test for approved doctor access (Property 9)
    - **Property 9: Approved doctor is granted access on any doctor-only route**
    - **Validates: Requirements 4.2**

- [x] 8. Update `RoleRedirectPage` — route doctors by `doctorVerificationStatus`
  - [x] 8.1 Expand the `doctor` case to check `doctorVerificationStatus`
    - Replace the direct `navigate('/doctor/dashboard')` with a status check
    - `pending` → `navigate('/doctor/pending')`
    - `rejected` → `navigate('/doctor/rejected')`
    - `approved` (or undefined for legacy records) → `navigate('/doctor/dashboard')`
    - Remove any remaining `approvalStatus` references
    - _Requirements: 4.1, 4.5, 5.1_

  - [ ]* 8.2 Write property test for RoleRedirectPage routing (Property 15)
    - **Property 15: RoleRedirectPage routes doctors by doctorVerificationStatus**
    - **Validates: Requirements 4.5, 5.1**

- [x] 9. Update `DoctorApprovals` admin page — use `doctorVerificationStatus` and typed documents
  - [x] 9.1 Update `PendingDoctor` interface to `DoctorRecord` with typed fields
    - Replace `approvalStatus` with `doctorVerificationStatus: 'pending' | 'approved' | 'rejected'`
    - Replace `credentialDocuments?: string[]` with `credentialDocuments?: { doctorLicense?: string; diploma?: string; certification?: string }`
    - _Requirements: 3.1, 5.2_

  - [x] 9.2 Update `handleApproval` to write `doctorVerificationStatus`
    - Change `updateDoc` call from `{ approvalStatus: status }` to `{ doctorVerificationStatus: status }`
    - Update local state mutation to use `doctorVerificationStatus`
    - _Requirements: 3.4, 3.5, 5.2_

  - [x] 9.3 Update grouping and status badge to use `doctorVerificationStatus`
    - Change `pending` / `reviewed` filter predicates to reference `doctorVerificationStatus`
    - Update `statusBadge` function parameter and comparisons
    - _Requirements: 3.1, 3.2_

  - [x] 9.4 Update review dialog to render labeled document sections
    - Replace the generic numbered document list with three labeled sections: "Medical License" (`doctorLicense`), "Diploma / Degree" (`diploma`), "Additional Certification" (`certification`)
    - Each section shows a link to open the document in a new tab, or "Not provided" if the key is absent
    - Update document count display to count keys in the `credentialDocuments` map
    - _Requirements: 3.3_

  - [ ]* 9.5 Write property test for review dialog labeled sections (Property 12)
    - **Property 12: Review dialog renders labeled document sections**
    - **Validates: Requirements 3.3**

  - [ ]* 9.6 Write property test for doctor list grouping (Property 10)
    - **Property 10: Doctor list grouping invariant**
    - **Validates: Requirements 3.1**

- [x] 10. Update `App.tsx` — add new routes and fix `PublicRoute`
  - [x] 10.1 Import and register `PendingApproval` and `RejectedApplication` pages
    - Add imports for both new page components
    - Add `<Route path="/doctor/pending" element={<PendingApproval />} />` — no `ProtectedRoute` wrapper with role gate
    - Add `<Route path="/doctor/rejected" element={<RejectedApplication />} />` — no `ProtectedRoute` wrapper with role gate
    - _Requirements: 2.2, 2.6_

  - [x] 10.2 Update `PublicRoute` to handle pending/rejected doctor redirects
    - In the `currentUser` branch, check `userData?.doctorVerificationStatus` for doctor role
    - `pending` → redirect to `/doctor/pending`
    - `rejected` → redirect to `/doctor/rejected`
    - `approved` → redirect to `/doctor/dashboard` (existing behavior)
    - _Requirements: 2.1, 4.3_

- [x] 11. Add email notification on doctor approval / rejection
  - [x] 11.1 Add `sendApprovalEmail` helper to `firebase.ts`
    - Import `addDoc` from `firebase/firestore`
    - Write a document to the Firestore `mail` collection with `to`, `message.subject`, and `message.html` fields
    - Approval email: subject "Your CareLink application has been approved", body includes doctor name and a login link
    - Rejection email: subject "Update on your CareLink application", body includes doctor name and support contact link
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.6_

  - [x] 11.2 Call `sendApprovalEmail` in `DoctorApprovals.handleApproval`
    - After the `updateDoc` call succeeds, call `sendApprovalEmail(doctor.email, doctor.name, status)`
    - Wrap the call in a try/catch — log the error with `console.warn` but do NOT show a blocking toast or revert the status
    - The doctor's email and name must be read from the local `selectedDoctor` or the `doctors` list by `doctorId`
    - _Requirements: 6.1, 6.2, 6.5_

- [ ] 12. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- `/doctor/pending` and `/doctor/rejected` routes must NOT be wrapped in `ProtectedRoute allowedRoles={["doctor"]}` — they are accessible to any authenticated doctor regardless of verification status
- Property tests use [fast-check](https://github.com/dubzzz/fast-check) as described in the design document
- The `credentialDocuments` field shape changes from `string[]` to a typed map — existing doctor records with the old shape will show "Not provided" for all slots in the admin panel, which is acceptable for the migration
