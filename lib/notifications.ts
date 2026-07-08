import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

export const sendNotification = async (
  receiverId: string,
  senderId: string,
  type: string,
  title: string,
  message: string
) => {
  try {
    await addDoc(collection(db, "notifications"), {
      receiverId,
      senderId,
      type,
      title,
      message,
      isRead: false,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Notification Error:", error);
  }
};