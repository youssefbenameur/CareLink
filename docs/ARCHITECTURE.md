# System Architecture and UML Diagrams

## Class Diagram
```mermaid
classDiagram
    class User {
        +string uid
        +string email
        +string firstName
        +string lastName
        +string role
        +timestamp createdAt
        +updateProfile()
        +updateSettings()
    }

    class Admin {
        +manageUsers()
        +generateReports()
        +configureSystem()
    }

    class Doctor {
        +viewPatients()
        +manageAppointments()
        +writeMedicalNotes()
        +trackPatientProgress()
    }

    class Patient {
        +bookAppointment()
        +trackMood()
        +chatWithDoctor()
        +viewResources()
    }

    class Appointment {
        +string id
        +string doctorId
        +string patientId
        +timestamp date
        +string status
        +string type
        +schedule()
        +cancel()
        +reschedule()
    }

    class MedicalRecord {
        +string id
        +string patientId
        +Array records
        +Array history
        +addRecord()
        +updateRecord()
        +viewHistory()
    }

    class Chat {
        +string senderId
        +string receiverId
        +string content
        +timestamp timestamp
        +boolean read
        +sendMessage()
        +markAsRead()
    }

    User <|-- Admin
    User <|-- Doctor
    User <|-- Patient
    Doctor "1" -- "*" Patient : treats
    Doctor "1" -- "*" Appointment : manages
    Patient "1" -- "*" Appointment : books
    Patient "1" -- "1" MedicalRecord : has
    Doctor "1" -- "*" Chat : participates
    Patient "1" -- "*" Chat : participates
```

## Sequence Diagram - Appointment Booking
```mermaid
sequenceDiagram
    participant P as Patient
    participant UI as Frontend
    participant API as Backend
    participant DB as Firebase
    participant D as Doctor

    P->>UI: Request appointment booking
    UI->>API: Submit booking request
    API->>DB: Check doctor availability
    DB-->>API: Return availability
    alt Doctor Available
        API->>DB: Create appointment
        DB-->>API: Confirm creation
        API->>D: Send notification
        API-->>UI: Return success
        UI-->>P: Show confirmation
    else Doctor Unavailable
        API-->>UI: Return unavailable slots
        UI-->>P: Show alternative times
    end
```

## Component Diagram
```mermaid
graph TB
    subgraph Frontend
        UI[User Interface]
        Auth[Authentication]
        State[State Management]
        Routes[Route Handler]
    end

    subgraph Backend
        Firebase[Firebase Services]
        Storage[File Storage]
        RTDB[Realtime Database]
    end

    subgraph Services
        Chat[Chat Service]
        Appointments[Appointment Service]
        Records[Medical Records]
        Analytics[Analytics Service]
    end

    UI --> Auth
    UI --> State
    UI --> Routes
    Auth --> Firebase
    State --> RTDB
    Routes --> Services
    Services --> Firebase
    Services --> Storage
    Services --> RTDB
```

## Deployment Architecture
```mermaid
graph TB
    subgraph Client
        Browser[Web Browser]
        PWA[Progressive Web App]
    end

    subgraph Firebase
        Hosting[Firebase Hosting]
        Auth[Firebase Auth]
        Firestore[Cloud Firestore]
        Storage[Cloud Storage]
        Functions[Cloud Functions]
    end

    subgraph External
        Email[Email Service]
        Video[Video Service]
        Analytics[Analytics]
    end

    Browser --> Hosting
    PWA --> Hosting
    Hosting --> Auth
    Hosting --> Firestore
    Hosting --> Storage
    Hosting --> Functions
    Functions --> External
```

## Security Model
```mermaid
graph TB
    subgraph Authentication
        Login[Login]
        Register[Register]
        Reset[Password Reset]
    end

    subgraph Authorization
        Rules[Security Rules]
        RBAC[Role Based Access]
        Claims[Custom Claims]
    end

    subgraph Data Access
        Read[Read Operations]
        Write[Write Operations]
        Delete[Delete Operations]
    end

    Login --> RBAC
    Register --> RBAC
    RBAC --> Rules
    Rules --> Data Access
    Claims --> Rules
```

## System Interactions
1. **User Authentication Flow**
   - Registration/Login
   - Role assignment
   - Session management
   - Security rules enforcement

2. **Appointment Management Flow**
   - Availability check
   - Booking process
   - Notification system
   - Calendar integration

3. **Communication Flow**
   - Real-time chat
   - Video consultations
   - File sharing
   - Notifications

4. **Data Management Flow**
   - Medical records access
   - Progress tracking
   - Report generation
   - Data analytics

## Security Considerations
1. **Data Privacy**
   - End-to-end encryption for chats
   - Secure file storage
   - Role-based access control
   - HIPAA compliance measures

2. **Authentication**
   - Multi-factor authentication
   - Session management
   - Password policies
   - Account recovery

3. **Authorization**
   - Granular permissions
   - Data access rules
   - Action-based restrictions
   - Audit logging