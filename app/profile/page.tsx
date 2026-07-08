'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import DashboardLayout from '@/components/DashboardLayout';
import { sendSwapRequest } from '@/lib/swaps';
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import ProfileImageUpload from "@/components/ProfileImageUpload";

const SKILL_CATEGORIES = [
  'Programming & Development',
  'Design & Creative',
  'Language Learning',
  'Music & Instruments',
  'Cooking & Baking',
  'Fitness & Sports',
  'Academic Subjects',
  'Business & Finance',
  'Arts & Crafts',
  'Photography & Videography',
  'Writing & Editing',
  'Public Speaking',
  'DIY & Home Improvement',
  'Gardening',
  'Other'
];

export default function Profile() {
  const router = useRouter();
  const params = useParams();

  const profileUserId = params?.userId as string;

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>({});
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);

  const [formData, setFormData] = useState({
    displayName: '',
    bio: '',
    location: '',
    skillsOffered: [] as string[],
    skillsWanted: [] as string[],
    newSkillOffered: '',
    newSkillWanted: '',
    selectedCategoryOffered: SKILL_CATEGORIES[0],
    selectedCategoryWanted: SKILL_CATEGORIES[0]
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push('/auth/login');
        return;
      }

      setUser(currentUser);

      try {
        const ref = doc(db, 'users', profileUserId || currentUser.uid);
        const snap = await getDoc(ref);

        if (snap.exists()) {
          const data = snap.data();
          setUserData(data);

          setFormData((prev) => ({
            ...prev,
            displayName: data.displayName || '',
            bio: data.bio || '',
            location: data.location || '',
            skillsOffered: data.skillsOffered || [],
            skillsWanted: data.skillsWanted || []
          }));
        }
      } catch (err) {
        console.error(err);
      }
      // Fetch reviews
const reviewsQuery = query(
  collection(db, "reviews"),
  where("revieweeId", "==", profileUserId || currentUser.uid)
);

const reviewsSnapshot = await getDocs(reviewsQuery);

const reviews = reviewsSnapshot.docs.map((doc) => doc.data());

if (reviews.length > 0) {
  const total = reviews.reduce(
    (sum: number, review: any) => sum + review.rating,
    0
  );

  setAverageRating(total / reviews.length);
  setTotalReviews(reviews.length);
}

      setLoading(false);
    });

    return () => unsubscribe();
  }, [profileUserId, router]);

  const handleInputChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!user) return;

    setIsSaving(true);

    try {
      await updateDoc(doc(db, 'users', user.uid), {
        displayName: formData.displayName,
        bio: formData.bio,
        location: formData.location,
        skillsOffered: formData.skillsOffered,
        skillsWanted: formData.skillsWanted,
        updatedAt: new Date().toISOString()
      });

      setSaveMessage('Profile updated!');
      setIsEditing(false);
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (err) {
      console.error(err);
      setSaveMessage('Error updating profile');
    }

    setIsSaving(false);
  };

  const handleSendSwap = async () => {
    if (!user || !profileUserId) return;
    if (user.uid === profileUserId) return;
  
    try {
      const result = await sendSwapRequest(user.uid, profileUserId);
  
      if (result?.success) {
        alert('Swap request sent!');
      } else {
        alert(result?.message || 'Failed');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-screen">
          Loading...
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
   <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors duration-300">

        {/* HEADER */}
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 transition-colors duration-300">

        <h1 className="text-3xl font-bold text-center mb-6 text-gray-900 dark:text-white">
  Profile
</h1>

<div className="flex justify-center mb-6">
  <ProfileImageUpload />
</div>

<div className="flex justify-end">
  {profileUserId && user?.uid !== profileUserId ? (
    <button
      onClick={handleSendSwap}
      className="bg-gray-800 dark:bg-gray-700 hover:bg-gray-900 dark:hover:bg-gray-600 text-white px-5 py-2 rounded-lg transition-colors"
    >
      Send Swap Request
    </button>
  ) : (
    !isEditing && (
      <button
        onClick={() => setIsEditing(true)}
        className="bg-gray-800 hover:bg-gray-900 text-white px-5 py-2 rounded-lg"
      >
        Edit Profile
      </button>
    )
  )}
</div>

</div>

        {saveMessage && (
          <p className="text-green-600 dark:text-green-400 mt-2">{saveMessage}</p>
        )}

        {/* VIEW */}
        {!isEditing ? (
   <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mt-6 space-y-4 text-gray-900 dark:text-white transition-colors duration-300">
            <p><b>Name:</b> {userData.displayName}</p>
            <div className="flex items-center gap-2 mt-2">
  <span className="text-yellow-500 text-xl">
    {"★".repeat(Math.round(averageRating))}
    {"☆".repeat(5 - Math.round(averageRating))}
  </span>

  <span className="text-gray-600 dark:text-gray-300">
    {averageRating.toFixed(1)} ({totalReviews} Review{totalReviews !== 1 ? "s" : ""})
  </span>
</div>

            <p><b>Email:</b> {userData.email || "N/A"}</p>
            <p><b>Location:</b> {userData.location}</p>
            <p><b>Bio:</b> {userData.bio}</p>

            {/* ✅ FIX FOR ERROR (NO toDate) */}
            <p>
           <b>Member since:</b>{" "}
            {userData.createdAt
              ? (typeof userData.createdAt?.toDate === "function"
               ? userData.createdAt.toDate().toLocaleDateString()
               : new Date(userData.createdAt).toLocaleDateString())
                 : "N/A"}
                </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">

            <input
              name="displayName"
              value={formData.displayName}
              onChange={handleInputChange}
             className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg p-2 w-full focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Name"
            />

            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
             className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg p-2 w-full focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Bio"
            />

            <input
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg p-2 w-full focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Location"
            />

            <button
              type="submit"
              disabled={isSaving}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </form>
        )}

      </div>
    </DashboardLayout>
  );
}