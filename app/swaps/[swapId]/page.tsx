'use client';

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import {  useRouter } from "next/navigation";
import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  collection,
  addDoc,
} from "firebase/firestore";
import { sendNotification } from "@/lib/notifications";

export default function SwapDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [swap, setSwap] = useState<any>(null);
const [currentUser, setCurrentUser] = useState<any>(null);
const [loading, setLoading] = useState(true);
const [rating, setRating] = useState(5);
const [feedback, setFeedback] = useState("");
const [showRating, setShowRating] = useState(false);

useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return;
  
      setCurrentUser(user);
  
      const swapDoc = await getDoc(
        doc(db, "swaps", params.swapId as string)
      );
  
      if (swapDoc.exists()) {
        setSwap({
          id: swapDoc.id,
          ...swapDoc.data(),
        });
      }
  
      setLoading(false);
    });
  
    return () => unsubscribe();
  }, [params.swapId]);
  if (loading) {
    return <div className="p-6">Loading...</div>;
  }
  const handleAccept = async () => {
    try {
      await updateDoc(doc(db, "swaps", swap.id), {
        status: "active",
        acceptedAt: serverTimestamp(),
        startDate: serverTimestamp(),
      
        senderCompleted: false,
        receiverCompleted: false,
      });
  
      alert("Swap Accepted!");
  
      setSwap({
        ...swap,
        status: "active",
      });
  
      router.push("/swaps/active");
    } catch (error) {
      console.error(error);
      alert("Failed to accept swap");
    }
   
  };
  
  
  const handleReject = async () => {
    try {
      await updateDoc(doc(db, "swaps", swap.id), {
        status: "rejected",
      });
  
      alert("Swap Rejected!");
  
      setSwap({
        ...swap,
        status: "rejected",
      });
    } catch (error) {
      console.error(error);
      alert("Failed to reject swap");
    }
  };

  const handleComplete = async () => {
    try {
      const updateData: any = {};
  
      if (currentUser.uid === swap.senderId) {
        updateData.senderCompleted = true;
      }
  
      if (currentUser.uid === swap.receiverId) {
        updateData.receiverCompleted = true;
      }
  
      // Agar dono complete kar chuke hain
      if (
        (swap.senderCompleted || currentUser.uid === swap.senderId) &&
        (swap.receiverCompleted || currentUser.uid === swap.receiverId)
      ) {
        updateData.status = "completed";
        updateData.completedAt = serverTimestamp();
      }
  
      await updateDoc(doc(db, "swaps", swap.id), updateData);
  
      alert("Completion status updated!");
  
      const updatedSwap = await getDoc(doc(db, "swaps", swap.id));
  
      setSwap({
        id: updatedSwap.id,
        ...updatedSwap.data(),
      });
  
      if (updatedSwap.data()?.status === "completed") {
        setShowRating(true);
      }
  
    } catch (error) {
      console.error(error);
      alert("Failed");
    }
  };

  const handleSubmitRating = async () => {
    try {
      const revieweeId =
        currentUser.uid === swap.senderId
          ? swap.receiverId
          : swap.senderId;
  
      await addDoc(collection(db, "reviews"), {
        swapId: swap.id,
        reviewerId: currentUser.uid,
        revieweeId,
        rating,
        feedback,
        createdAt: serverTimestamp(),
      });
  
      // ✅ Send notification to the reviewed user
      await sendNotification(
        revieweeId,
        currentUser.uid,
        "new_review",
        "New Review",
        "You have received a new review."
      );
  
      alert("Rating Submitted!");
  
      router.push("/swaps/completed");
    } catch (error) {
      console.error(error);
      alert("Failed to submit rating");
    }
  };
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Swap Details</h1>
  
      <div className="border rounded-lg p-5 shadow">
  
        <p className="mb-2">
          <strong>Swap ID:</strong> {swap?.id}
        </p>
  
        <p className="mb-2">
          <strong>Status:</strong> {swap?.status}
        </p>
  
        <p className="mb-2">
          <strong>Sender ID:</strong> {swap?.senderId}
        </p>
  
        <p className="mb-2">
          <strong>Receiver ID:</strong> {swap?.receiverId}
        </p>
  
        <p className="mb-2">
          <strong>Created At:</strong>{" "}
          {swap?.createdAt?.toDate
            ? swap.createdAt.toDate().toLocaleString()
            : "N/A"}
        </p>
        {currentUser?.uid === swap?.receiverId && swap?.status === "pending" && (
              <div className="mt-6 flex gap-3">
              <button
      onClick={handleAccept}
      className="bg-green-600 text-white px-4 py-2 rounded"
      >
      Accept
        </button>

                   <button
               onClick={handleReject}
           className="bg-red-600 text-white px-4 py-2 rounded"
          >
              Reject
       </button>
         </div>
         )}
        {swap?.status === "active" && (
  <div className="mt-6">
    <button
      onClick={handleComplete}
      className="bg-blue-600 text-white px-4 py-2 rounded"
    >
      Complete Swap
    </button>

    {/* Completion Status */}
    <div className="mt-4 text-sm">
      <p>
        Sender:
        {swap.senderCompleted ? " ✅ Completed" : " ⏳ Pending"}
      </p>

      <p>
        Receiver:
        {swap.receiverCompleted ? " ✅ Completed" : " ⏳ Pending"}
      </p>
    </div>
  </div>
)}

{showRating && (
  <div className="mt-8 border rounded-lg p-5 bg-gray-50">
    <h2 className="text-xl font-semibold mb-4">
      Rate Your Experience
    </h2>

    <label className="block mb-2">Rating</label>

    <select
      value={rating}
      onChange={(e) => setRating(Number(e.target.value))}
      className="border rounded px-3 py-2 w-full"
    >
      <option value={5}>⭐⭐⭐⭐⭐ (5)</option>
      <option value={4}>⭐⭐⭐⭐ (4)</option>
      <option value={3}>⭐⭐⭐ (3)</option>
      <option value={2}>⭐⭐ (2)</option>
      <option value={1}>⭐ (1)</option>
    </select>

    <textarea
      value={feedback}
      onChange={(e) => setFeedback(e.target.value)}
      placeholder="Write your feedback..."
      className="border rounded w-full mt-4 p-3"
      rows={4}
    />

    <button
      onClick={handleSubmitRating}
      className="mt-4 bg-green-600 text-white px-4 py-2 rounded"
    >
      Submit Rating
    </button>
  </div>
)}
      </div>
    </div>
  );
}