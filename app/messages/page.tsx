'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import DashboardLayout from '@/components/DashboardLayout';

export default function Messages() {
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/auth/login");
        return;
      }
  
      setCurrentUser(user);
  
      try {
        const conversationsRef = collection(db, "conversations");
  
        const q = query(
          conversationsRef,
          where("participants", "array-contains", user.uid),
          orderBy("lastMessageAt", "desc")
        );
  
        const querySnapshot = await getDocs(q);
        querySnapshot.docs.forEach((doc) => {
          console.log("Conversation:", doc.id, doc.data());
        });

        console.log("Conversation Docs:", querySnapshot.docs.length);
        console.log(
          querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
        );
        const conversationsData = await Promise.all(
          querySnapshot.docs.map(async (doc) => {
            const data = doc.data();
  
            const otherUserId = data.participants.find(
              (id: string) => id !== user.uid
            );
  
            const userDocRef = await getDocs(
              query(
                collection(db, "users"),
                where("uid", "==", otherUserId)
              )
            );
  
            let userData = null;
  
            if (!userDocRef.empty) {
              userData = userDocRef.docs[0].data();
            }
  
            return {
              id: doc.id,
              ...data,
              swapId: data.swapId,
              otherUser: userData,
            };
          })
        );
  
        setConversations(conversationsData);
        console.log("FINAL Conversations:", conversationsData);
      } catch (error) {
        console.error("Error fetching conversations:", error);
      } finally {
        setLoading(false);
      }
    });
  
    return () => unsubscribe();
  }, [router]);
  
  
  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return '';
    if (timestamp?.toDate) {
      timestamp = timestamp.toDate();
    }
    const date = new Date(timestamp);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="py-6 bg-gray-50 dark:bg-slate-900 min-h-screen transition-colors">
  
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
  
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Messages
            </h1>
          </div>
  
          <div className="mt-6 bg-white dark:bg-slate-800 shadow overflow-hidden sm:rounded-lg transition-colors">
  
            {conversations.length > 0 ? (
              <ul className="divide-y divide-gray-200 dark:divide-slate-700">
  
                {conversations.map((conversation) => {
                  console.log("Conversation Object:", conversation);
  
                  return (
                    <li key={conversation.id}>
                      <Link
                        href={`/chat/${conversation.id}`}
                        className="block hover:bg-gray-50 dark:hover:bg-slate-700"
                      >
  
                        <div className="px-4 py-4 sm:px-6">
  
                          <div className="flex items-center justify-between">
  
                            <div className="flex items-center">
  
                              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 dark:bg-slate-600 flex items-center justify-center">
  
                                {conversation.otherUser?.photoURL ? (
                                  <img
                                    className="h-10 w-10 rounded-full"
                                    src={conversation.otherUser.photoURL}
                                    alt={conversation.otherUser.displayName}
                                  />
                                ) : (
                                  <span className="text-gray-600 dark:text-gray-200 font-medium">
                                    {conversation.otherUser?.displayName?.charAt(0) ||
                                      conversation.otherUser?.email?.charAt(0) ||
                                      "U"}
                                  </span>
                                )}
  
                              </div>
  
                              <div className="ml-4">
  
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {conversation.otherUser?.displayName || "Unknown User"}
                                </div>
  
                                <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                                  {conversation.lastMessage || "No messages yet"}
                                </div>
  
                              </div>
  
                            </div>
  
  
                            <div className="ml-2 flex-shrink-0 flex flex-col items-end">
  
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {formatTimestamp(conversation.lastMessageAt)}
                              </div>
  
                              {conversation.unreadCount?.[currentUser?.uid] > 0 && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200">
                                  {conversation.unreadCount[currentUser.uid]}
                                </span>
                              )}
  
                            </div>
  
                          </div>
  
                        </div>
  
                      </Link>
                    </li>
                  );
                })}
  
              </ul>
  
            ) : (
  
              <div className="px-4 py-5 sm:p-6 text-center">
  
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                  No messages yet
                </h3>
  
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Start a conversation by browsing skills and connecting with other users.
                </p>
  
              </div>
  
            )}
  
          </div>
  
        </div>
      </div>
    </DashboardLayout>
  );
}