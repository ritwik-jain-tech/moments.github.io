import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Firebase configuration
// TODO: Replace these values with your Firebase project configuration
const firebaseConfig = {
    apiKey: "AIzaSyAbQjafSRfQVmiY19x7hOdrujt8hqJGszg",
    authDomain: "moments-38b77.firebaseapp.com",
    projectId: "moments-38b77",
    storageBucket: "moments-38b77.firebasestorage.app",
    messagingSenderId: "673332237675",
    appId: "1:673332237675:web:2e7beb5b9d7fe9b8bde82e",
    measurementId: "G-Q942KYWPZ6"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
export default app;
