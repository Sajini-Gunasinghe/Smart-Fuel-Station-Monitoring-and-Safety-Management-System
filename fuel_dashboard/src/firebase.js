import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyCmg9UEPvWkjPwmqaVBLBbaTUKRrIGYwgE",
  authDomain: "smartfuelstation-10a27.firebaseapp.com",
  databaseURL: "https://smartfuelstation-10a27-default-rtdb.asia-southeast1.firebasedatabase.app/",
  projectId: "smartfuelstation-10a27",
  storageBucket: "smartfuelstation-10a27.appspot.com",
  messagingSenderId: "48086616205",
  appId: "1:48086616205:web:fa918b81efbb7f0366bac4"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);