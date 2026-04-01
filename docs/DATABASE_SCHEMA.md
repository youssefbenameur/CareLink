# Database Schema Documentation

## Firebase Collections

### Users Collection
```typescript
users: {
  uid: string              // Unique user identifier
  role: string            // "admin" | "doctor" | "patient"
  email: string           // User's email address
  firstName: string       // User's first name
  lastName: string        // User's last name
  createdAt: timestamp    // Account creation date
  settings: {            // User preferences
    language: string
    theme: string
    notifications: boolean
  }
  profileImage?: string   // URL to profile image
}
```

### Appointments Collection
```typescript
appointments: {
  id: string             // Unique appointment identifier
  doctorId: string       // Reference to doctor's uid
  patientId: string      // Reference to patient's uid
  date: timestamp        // Appointment date and time
  duration: number       // Duration in minutes
  status: string         // "scheduled" | "completed" | "cancelled"
  type: string          // "initial" | "follow-up" | "emergency"
  notes: string         // Appointment notes
  meetingLink?: string  // Video consultation link
  createdAt: timestamp  // Creation timestamp
  updatedAt: timestamp  // Last update timestamp
}
```

### Medical Records Collection
```typescript
medicalRecords: {
  id: string            // Unique record identifier
  patientId: string     // Reference to patient's uid
  records: [{
    date: timestamp     // Record date
    type: string       // Record type
    description: string // Record description
    attachments: string[] // URLs to attached files
    doctorId: string   // Reference to doctor's uid
  }]
  history: [{
    condition: string  // Medical condition
    diagnosis: string  // Diagnosis details
    treatment: string  // Treatment plan
    date: timestamp   // Date of diagnosis
  }]
}
```

### Patient Notes Collection
```typescript
patientNotes: {
  id: string           // Unique note identifier
  patientId: string    // Reference to patient's uid
  doctorId: string     // Reference to doctor's uid
  notes: string        // Clinical notes
  category: string     // Note category
  createdAt: timestamp // Creation date
  updatedAt: timestamp // Last update date
  private: boolean     // Visibility flag
}
```

### Mood Tracking Collection
```typescript
moodTracking: {
  id: string           // Unique tracking identifier
  userId: string       // Reference to patient's uid
  mood: string        // Mood rating
  activities: string[] // Activities performed
  notes: string       // Patient's notes
  timestamp: timestamp // Entry timestamp
  tags: string[]      // Mood tags/categories
}
```

### Chat Messages Collection
```typescript
messages: {
  id: string           // Unique message identifier
  senderId: string     // Reference to sender's uid
  receiverId: string   // Reference to receiver's uid
  content: string      // Message content
  timestamp: timestamp // Message timestamp
  read: boolean       // Read status
  type: string        // "text" | "file" | "image"
  fileUrl?: string    // URL for attachments
}
```

### Resources Collection
```typescript
resources: {
  id: string           // Unique resource identifier
  title: string        // Resource title
  description: string  // Resource description
  category: string     // Resource category
  content: string      // Resource content
  attachments: string[] // URLs to attached files
  tags: string[]       // Search tags
  createdAt: timestamp // Creation date
  updatedAt: timestamp // Last update date
  visibility: string   // "public" | "private" | "role-specific"
}
```