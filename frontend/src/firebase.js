import { initializeApp } from "firebase/app";
import { initializeFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";




const firebaseConfig = {
  apiKey: "AIzaSyCX-h6n7oQpAkbw6ZHrkgKoYDB7ZSyezlA",
  authDomain: "arios-ai.firebaseapp.com",
  projectId: "arios-ai",
};

const app = initializeApp(firebaseConfig);

export const db = initializeFirestore(
  app,
  {},
  "arios-database"
);

export const auth = getAuth(app);
