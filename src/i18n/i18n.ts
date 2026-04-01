
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// English translations
import enNavigation from './locales/en/navigation.json';
import enCommon from './locales/en/common.json';
import enAuth from './locales/en/auth.json';
import enLanding from './locales/en/landing.json';
import enDoctorDashboard from './locales/en/doctorDashboard.json';
import enPatientDashboard from './locales/en/patientDashboard.json';
import enFindDoctor from './locales/en/findDoctor.json';
import enPatientDetails from './locales/en/patientDetails.json';
import enAppointments from './locales/en/appointments.json';
import enMedicalRecords from './locales/en/medicalRecords.json';
import enErrors from './locales/en/errors.json';
import enDashboard from './locales/en/dashboard.json';
import enSettings from './locales/en/settings.json';
// Add new namespace for chat
import enChat from './locales/en/chat.json';
// Add new namespace for mood tracker
import enMoodTracker from './locales/en/moodTracker.json';
// Add admin namespace
import enAdmin from './locales/en/admin.json';

// French translations
import frNavigation from './locales/fr/navigation.json';
import frCommon from './locales/fr/common.json';
import frAuth from './locales/fr/auth.json';
import frLanding from './locales/fr/landing.json';
import frDoctorDashboard from './locales/fr/doctorDashboard.json';
import frPatientDashboard from './locales/fr/patientDashboard.json';
import frFindDoctor from './locales/fr/findDoctor.json';
import frMedicalRecords from './locales/fr/medicalRecords.json';
import frErrors from './locales/fr/errors.json';
import frAppointments from './locales/fr/appointments.json';
import frDashboard from './locales/fr/dashboard.json';
import frSettings from './locales/fr/settings.json';
// Add new namespace for chat
import frChat from './locales/fr/chat.json';
// Add new namespace for mood tracker
import frMoodTracker from './locales/fr/moodTracker.json';
// Add admin namespace
import frAdmin from './locales/fr/admin.json';

// Arabic translations
import arNavigation from './locales/ar/navigation.json';
import arCommon from './locales/ar/common.json';
import arAuth from './locales/ar/auth.json';
import arLanding from './locales/ar/landing.json';
import arDoctorDashboard from './locales/ar/doctorDashboard.json';
import arPatientDashboard from './locales/ar/patientDashboard.json';
import arPatientDetails from './locales/ar/patientDetails.json';
import arMedicalRecords from './locales/ar/medicalRecords.json';
import arErrors from './locales/ar/errors.json';
import arAppointments from './locales/ar/appointments.json';
import arFindDoctor from './locales/ar/findDoctor.json';
import arDashboard from './locales/ar/dashboard.json';
import arSettings from './locales/ar/settings.json';
// Add new namespace for chat
import arChat from './locales/ar/chat.json';
// Add new namespace for mood tracker
import arMoodTracker from './locales/ar/moodTracker.json';
// Add admin namespace
import arAdmin from './locales/ar/admin.json';

// Default translations when keys are missing
const defaultTranslations = {
  chat: {
    title: 'Chat',
    withPatient: 'Chat with your patients',
    withDoctor: 'Chat with your doctor',
    yourPatients: 'Your Patients',
    noPatients: 'No patients found',
    checkPatientList: 'Check the patient list in the dashboard',
    selectPatient: 'Select a Patient',
    selectPatientFromList: 'Select a patient from the list to start chatting',
    noPatientSelected: 'No Patient Selected',
    selectPatientToChat: 'Select a patient to start chatting',
    patient: 'Patient',
    noDoctorSelected: 'No Doctor Selected',
    selectDoctorToChat: 'Select a doctor to start chatting',
    doctor: 'Doctor',
    healthcareProvider: 'Healthcare Provider',
    noMessagesYet: 'No messages yet',
    startConversation: 'Start the conversation',
    typeMessage: 'Type a message...',
    send: 'Send'
  },
  moodTracker: {
    history: 'Mood History',
    noData: 'No mood data available',
    mood: 'Mood',
    moods: {
      anxious: 'Anxiety'
    }
  }
};

// Create empty JSON files if they don't exist
const ensureTranslation = (namespace: string, translation: any) => {
  return translation || JSON.parse(JSON.stringify(defaultTranslations[namespace] || {}));
};

// Handle RTL setup on language change
const handleLanguageChange = (lng: string) => {
  document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.lang = lng;
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        navigation: enNavigation,
        common: enCommon,
        auth: enAuth,
        landing: enLanding,
        doctorDashboard: enDoctorDashboard,
        patientDashboard: enPatientDashboard,
        findDoctor: enFindDoctor,
        patientDetails: enPatientDetails,
        appointments: enAppointments,
        medicalRecords: enMedicalRecords,
        errors: enErrors,
        dashboard: enDashboard,
        chat: enChat,
        moodTracker: enMoodTracker,
        settings: enSettings,
        admin: enAdmin
      },
      fr: {
        navigation: frNavigation,
        common: frCommon,
        auth: frAuth,
        landing: frLanding,
        doctorDashboard: frDoctorDashboard,
        patientDashboard: frPatientDashboard,
        findDoctor: frFindDoctor,
        medicalRecords: frMedicalRecords,
        errors: frErrors,
        appointments: frAppointments,
        dashboard: frDashboard,
        chat: frChat,
        moodTracker: frMoodTracker,
        settings: frSettings,
        admin: frAdmin
      },
      ar: {
        navigation: arNavigation,
        common: arCommon,
        auth: arAuth,
        landing: arLanding,
        doctorDashboard: arDoctorDashboard,
        patientDashboard: arPatientDashboard,
        patientDetails: arPatientDetails,
        medicalRecords: arMedicalRecords,
        errors: arErrors,
        appointments: arAppointments,
        findDoctor: arFindDoctor,
        dashboard: arDashboard,
        chat: arChat,
        moodTracker: arMoodTracker,
        settings: arSettings,
        admin: arAdmin
      }
    },
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage']
    },
    // This will help with namespace resolution
    ns: [
      'navigation', 
      'common', 
      'auth', 
      'resources', 
      'landing', 
      'doctorDashboard', 
      'patientDashboard', 
      'findDoctor', 
      'patientDetails', 
      'appointments',
      'medicalRecords',
      'errors',
      'dashboard',
      'chat',
      'moodTracker',
      'settings',
      'admin'
    ],
    defaultNS: 'common'
  });

// Setup initial language direction
handleLanguageChange(i18n.language);

// Listen for language changes
i18n.on('languageChanged', handleLanguageChange);

export default i18n;
