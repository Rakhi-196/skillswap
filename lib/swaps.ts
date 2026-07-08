import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { sendNotification } from "./notifications";


export const sendSwapRequest= async (
  senderId: string,
  receiverId: string
): Promise<{ success: boolean; message: string }> => {
  try {
    if (senderId === receiverId) {
      return { success: false, message: "You cannot send request to yourself" };
    }

    // ✅ check duplicate BOTH ways
    const q1 = query(
      collection(db, "swaps"),
      where("senderId", "==", senderId),
      where("receiverId", "==", receiverId)
    );

    const q2 = query(
      collection(db, "swaps"),
      where("senderId", "==", receiverId),
      where("receiverId", "==", senderId)
    );

    const [res1, res2] = await Promise.all([getDocs(q1), getDocs(q2)]);

   // Check existing swaps in both directions
const existingSwaps = [...res1.docs, ...res2.docs];

// Block only pending or active swaps
const hasActiveSwap = existingSwaps.some((doc) => {
  const data = doc.data();
  return data.status === "pending" || data.status === "active";
});

if (hasActiveSwap) {
  return {
    success: false,
    message: "Swap request already exists",
  };
}

    // ✅ create swap request
await addDoc(collection(db, "swaps"), {
  senderId,
  receiverId,
  participants: [senderId, receiverId],
  status: "pending",
  createdAt: serverTimestamp(),
});

// ✅ Send notification to receiver
await sendNotification(
  receiverId,
  senderId,
  "swap_request",
  "New Swap Request",
  "You have received a new swap request."
);

return {
  success: true,
  message: "Swap request sent successfully",
};
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Something went wrong",
    };
  }
};