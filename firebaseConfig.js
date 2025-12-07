import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAWPhgiQCDoXwcGLZbZxu317ar85kwjEBg",
  authDomain: "internship-bd4ea.firebaseapp.com",
  projectId: "internship-bd4ea",
  storageBucket: "internship-bd4ea.firebasestorage.app",
  messagingSenderId: "922374566812",
  appId: "1:922374566812:web:0d1adefa89b1dccff1ce59"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

export default app;
