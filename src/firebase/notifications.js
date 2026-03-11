// src/firebase/notifications.js
import { db } from "./config";
import { collection, addDoc, getDocs, query, where } from "firebase/firestore";

// Admin ka UID lo
export const getAdminId = async () => {
  try {
    const snap = await getDocs(
      query(collection(db, "users"), where("role", "==", "admin"))
    );
    if (!snap.empty) return snap.docs[0].id;
    return null;
  } catch (error) {
    console.log("getAdminId error:", error);
    return null;
  }
};

// Notification send karo
export const sendNotification = async (userId, title, message, type, link = "") => {
  try {
    await addDoc(collection(db, "notifications"), {
      userId,
      title,
      message,
      type,
      link,
      read: false,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    console.log("sendNotification error:", error);
  }
};

// Employee ko notification bhejo
export const notifyEmployee = async (userId, title, message, type, link = "") => {
  try {
    await sendNotification(userId, title, message, type, link);
  } catch (error) {
    console.log("notifyEmployee error:", error);
  }
};

// Admin ko notification bhejo
export const notifyAdmin = async (title, message, type, link = "") => {
  try {
    const adminId = await getAdminId();
    if (adminId) {
      await sendNotification(adminId, title, message, type, link);
    }
  } catch (error) {
    console.log("notifyAdmin error:", error);
  }
};