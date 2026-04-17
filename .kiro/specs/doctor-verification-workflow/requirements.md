# Requirements Document

## Introduction

CareLink is a React + Firebase healthcare platform supporting three roles: patient, doctor, and admin. This feature implements a complete doctor verification workflow — from credential submission during registration, through admin review, to post-decision access control. The goal is to replace the current generic file upload and silent blocking behavior with a structured, transparent process that gives doctors clear feedback at every stage and gives admins the tools to review typed credential documents per doctor.

The workflow covers four areas:
1. Typed credential document upload during doctor registration
2. A "pending approval" holding screen shown to doctors after signup
3. An admin panel for reviewing, approving, or rejecting doctor applications
4. Post-decision access control (approved doctors log in normally; rejected doctors see a clear rejection message)

The existing `approvalStatus` Firestore field is replaced by `doctorVerificationStatus` throughout the system.

---

## Glossary

- **CareLink**: The healthcare web application being built on React and Firebase.
- **Registration_Form**: The React component (`RegisterForm.tsx`) used by new users to create an account.
- **Auth_Context**: The React context (`AuthContext.tsx`) that manages authentication state and login/logout logic.
- **Firebase_Storage**: The Firebase cloud storage service used to persist uploaded files.
- **Firestore**: The Firebase NoSQL database storing user records and application data.
- **Doctor_Document**: A credential file uploaded by a doctor during registration. Has a specific type: `doctorLicense`, `diploma`, or `certification`.
- **Document_Type**: The category of a Doctor_Document. Valid values: `doctorLicense` (required), `diploma` (required), `certification` (optional).
- **doctorVerificationStatus**: The Firestore field on a doctor's user record that tracks verification state. Valid values: `pending`, `approved`, `rejected`.
- **Pending_Screen**: A dedicated UI page shown to doctors whose `doctorVerificationStatus` is `pending` after they attempt to log in.
- **Admin_Approvals_Panel**: The admin-only page (`/admin/doctor-approvals`) where admins review doctor applications.
- **Role_Redirect_Page**: The page (`/role-redirect`) that routes authenticated users to their role-specific dashboard.
- **Protected_Route**: The React component (`ProtectedRoute.tsx`) that enforces role-based access to routes.
- **Credential_Documents_Map**: A Firestore map field on the doctor's user record storing typed document URLs, keyed by Document_Type (e.g., `{ doctorLicense: "url", diploma: "url", certification: "url" }`).

---

## Requirements

### Requirement 1: Typed Credential Document Upload During Registration

**User Story:** As a doctor registering on CareLink, I want to upload my credentials in clearly labeled slots by document type, so that admins can easily identify and review each document.

#### Acceptance Criteria

1. WHEN a user selects the "Healthcare Provider" role on the Registration_Form, THE Registration_Form SHALL display three distinct upload slots: one for `doctorLicense` (labeled "Medical License"), one for `diploma` (labeled "Diploma / Degree"), and one for `certification` (labeled "Additional Certification").

2. THE Registration_Form SHALL mark the `doctorLicense` slot and the `diploma` slot as required, and the `certification` slot as optional.

3. WHEN a user attempts to submit the Registration_Form with the doctor role selected and either the `doctorLicense` or `diploma` slot empty, THE Registration_Form SHALL prevent form submission and display a validation error identifying which required document is missing.

4. WHEN a user selects a file for a document slot, THE Registration_Form SHALL accept only files with MIME types `application/pdf`, `image/jpeg`, or `image/png`, and SHALL reject any other file type with an inline error message on that slot.

5. WHEN a user selects a file for a document slot, THE Registration_Form SHALL display the selected filename within that slot and provide a remove button to clear the selection.

6. WHEN a doctor completes registration and the Registration_Form is submitted successfully, THE Auth_Context SHALL upload each provided Doctor_Document to Firebase_Storage under the path `doctor-documents/{userId}/{documentType}/{timestamp}_{filename}`.

7. WHEN all Doctor_Documents have been uploaded to Firebase_Storage, THE Auth_Context SHALL write the resulting download URLs to the doctor's Firestore user record as a `credentialDocuments` map field keyed by Document_Type (e.g., `{ doctorLicense: "https://...", diploma: "https://..." }`).

8. WHEN a doctor's Firestore user record is created during registration, THE Auth_Context SHALL set the `doctorVerificationStatus` field to `"pending"` and SHALL NOT set an `approvalStatus` field.

---

### Requirement 2: Doctor Pending Approval Screen

**User Story:** As a doctor whose account is under review, I want to see a clear explanation of my account status when I log in, so that I understand why I cannot access the platform yet.

#### Acceptance Criteria

1. WHEN a doctor with `doctorVerificationStatus` equal to `"pending"` completes the login flow, THE Auth_Context SHALL NOT log the doctor out silently. THE Auth_Context SHALL allow the session to remain active and SHALL redirect the doctor to the Pending_Screen at `/doctor/pending`.

2. THE Pending_Screen SHALL display a message informing the doctor that their account is under review, that the review process may take up to a defined number of business days, and that they will be notified upon a decision.

3. WHILE a doctor's `doctorVerificationStatus` is `"pending"`, THE Protected_Route SHALL redirect any attempt by that doctor to access `/doctor/dashboard` or any other doctor-only route to the Pending_Screen at `/doctor/pending`.

4. THE Pending_Screen SHALL display a logout button that, when activated, calls the Auth_Context logout function and redirects the doctor to the login page.

5. WHEN a doctor with `doctorVerificationStatus` equal to `"rejected"` completes the login flow, THE Auth_Context SHALL redirect the doctor to a rejection screen at `/doctor/rejected` instead of the Pending_Screen.

6. THE rejection screen at `/doctor/rejected` SHALL display a message stating that the application was not approved and SHALL provide contact information or a support link for the doctor to follow up.

---

### Requirement 3: Admin Doctor Approvals Panel

**User Story:** As an admin, I want to review each doctor's typed credential documents and approve or reject their application, so that only verified healthcare providers can access the platform.

#### Acceptance Criteria

1. WHEN an admin navigates to `/admin/doctor-approvals`, THE Admin_Approvals_Panel SHALL fetch all user records from Firestore where `role` equals `"doctor"` and display them grouped by `doctorVerificationStatus`: pending applications first, then reviewed applications.

2. THE Admin_Approvals_Panel SHALL display for each doctor: full name, email address, registration date, current `doctorVerificationStatus` badge, and the count of uploaded documents.

3. WHEN an admin selects a doctor to review, THE Admin_Approvals_Panel SHALL open a detail view displaying each uploaded Doctor_Document in a labeled section corresponding to its Document_Type (`doctorLicense`, `diploma`, `certification`), with a link to open the document in a new browser tab.

4. WHEN an admin clicks "Approve" for a pending doctor, THE Admin_Approvals_Panel SHALL update the doctor's Firestore `doctorVerificationStatus` field to `"approved"` and SHALL reflect the updated status in the panel without requiring a full page reload.

5. WHEN an admin clicks "Reject" for a pending doctor, THE Admin_Approvals_Panel SHALL update the doctor's Firestore `doctorVerificationStatus` field to `"rejected"` and SHALL reflect the updated status in the panel without requiring a full page reload.

6. IF the Firestore update for an approval or rejection action fails, THEN THE Admin_Approvals_Panel SHALL display an error toast notification and SHALL NOT change the displayed status of the doctor in the panel.

7. WHILE an approval or rejection action is in progress, THE Admin_Approvals_Panel SHALL disable the Approve and Reject buttons for that doctor to prevent duplicate submissions.

8. THE Admin_Approvals_Panel SHALL be accessible only to users with `role` equal to `"admin"`, enforced by the Protected_Route component.

---

### Requirement 4: Post-Decision Access Control

**User Story:** As a doctor whose application has been reviewed, I want the platform to grant or deny me access based on the admin's decision, so that I can either start using CareLink or understand that my application was declined.

#### Acceptance Criteria

1. WHEN a doctor with `doctorVerificationStatus` equal to `"approved"` logs in, THE Role_Redirect_Page SHALL redirect the doctor to `/doctor/dashboard` as normal.

2. WHEN a doctor with `doctorVerificationStatus` equal to `"approved"` accesses any doctor-only route, THE Protected_Route SHALL grant access without redirection.

3. WHEN a doctor with `doctorVerificationStatus` equal to `"rejected"` logs in, THE Auth_Context SHALL keep the session active and SHALL redirect the doctor to `/doctor/rejected`.

4. WHILE a doctor's `doctorVerificationStatus` is `"rejected"`, THE Protected_Route SHALL redirect any attempt by that doctor to access `/doctor/dashboard` or any other doctor-only route to `/doctor/rejected`.

5. THE Role_Redirect_Page SHALL handle the `doctorVerificationStatus` field for routing decisions and SHALL NOT rely on the legacy `approvalStatus` field.

---

### Requirement 5: Field Migration from `approvalStatus` to `doctorVerificationStatus`

**User Story:** As a developer maintaining CareLink, I want all references to the old `approvalStatus` field replaced with `doctorVerificationStatus`, so that the codebase is consistent and the Firestore schema is unambiguous.

#### Acceptance Criteria

1. THE Auth_Context SHALL read and write `doctorVerificationStatus` exclusively when checking or setting a doctor's verification state, and SHALL NOT reference `approvalStatus`.

2. THE Admin_Approvals_Panel SHALL read and write `doctorVerificationStatus` exclusively when fetching or updating doctor records, and SHALL NOT reference `approvalStatus`.

3. THE firebase.ts module SHALL set `doctorVerificationStatus` to `"pending"` when creating a new doctor user record in Firestore, and SHALL NOT set `approvalStatus`.

4. WHEN the `getAllDoctors` function in firebase.ts is called, THE function SHALL return doctor records that include the `doctorVerificationStatus` field so that callers can filter or display verification state correctly.

5. THE `uploadDoctorDocuments` function in firebase.ts SHALL accept a typed documents map (`{ doctorLicense?: File, diploma?: File, certification?: File }`) instead of a flat `File[]` array, and SHALL upload each file to a path that includes the Document_Type as a path segment.
