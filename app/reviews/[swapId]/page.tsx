'use client';


import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import {
  addDoc,
  collection,
  serverTimestamp,
  doc,
  getDoc,
} from "firebase/firestore";
import { sendNotification } from "@/lib/notifications";

export default function ReviewPage() {
  const params = useParams();
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [swap, setSwap] = useState<any>(null);
  
  const router = useRouter();
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
    });
  
    return () => unsubscribe();
  }, [params.swapId]);


  const handleSubmitReview = async () => {
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
  review,
  createdAt: serverTimestamp(),
});

await sendNotification(
  revieweeId,
  currentUser.uid,
  "new_review",
  "New Review",
  "You have received a new review."
);

alert("Review Submitted Successfully!");

router.push("/swaps/completed");
    } catch (error) {
      console.error(error);
      alert("Failed to submit review");
    }
  };



  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Rate Your Swap</h1>

      <div className="mt-6 border rounded-lg p-5 shadow">
        <p>
          <strong>Swap ID:</strong> {params.swapId}
        </p>

        <div className="mt-6">
          <label className="font-medium">Rating</label>

          <div className="flex gap-3 mt-3">
          <div className="flex gap-2 mt-3">
  {[1, 2, 3, 4, 5].map((star) => (
    <button
      key={star}
      type="button"
      onClick={() => setRating(star)}
      className={`text-3xl ${
        star <= rating ? "text-yellow-500" : "text-gray-400"
      }`}
    >
      ★
    </button>
  ))}
</div>

<p className="mt-2">Selected Rating: {rating}/5</p>
          </div>
        </div>

        <div className="mt-6">
          <label className="font-medium">Review</label>

          <textarea
  value={review}
  onChange={(e) => setReview(e.target.value)}
  className="w-full border rounded p-3 mt-2"
  rows={5}
  placeholder="Write your experience..."
/>
        </div>
        <button
  onClick={handleSubmitReview}
  className="mt-6 bg-blue-600 text-white px-4 py-2 rounded"
>
          Submit Review
        </button>
      </div>
    </div>
  );
}