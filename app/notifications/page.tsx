'use client';

import { useEffect, useState } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  writeBatch,
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import DashboardLayout from '@/components/DashboardLayout';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) return;

      const q = query(
        collection(db, 'notifications'),
        where('receiverId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );

      const unsub = onSnapshot(
        q,
        async (snapshot) => {
          console.log('Notifications:', snapshot.size);

          const data = snapshot.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          }));

          console.log('Notification Data:', data);

          setNotifications(data);
// Mark all unread notifications as read
const batch = writeBatch(db);

snapshot.docs.forEach((notificationDoc) => {
  const notification = notificationDoc.data();

  if (notification.isRead === false) {
    batch.update(notificationDoc.ref, {
      isRead: true,
    });
  }
});
await batch.commit();
         
        },
        (error) => {
          console.error('Notification Error:', error);
        }
      );

      return unsub;
    });

    return () => unsubscribeAuth();
  }, []);

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto py-8 min-h-screen transition-colors">
  
        <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">
          Notifications
        </h1>
  
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow border border-gray-200 dark:border-slate-700 transition-colors">
  
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              No Notifications
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`border-b border-gray-200 dark:border-slate-700 p-5 
                hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors
                ${
                  !notification.read
                    ? "bg-blue-50 dark:bg-slate-700"
                    : "bg-white dark:bg-slate-800"
                }`}
              >
  
                <h2 className="font-semibold text-gray-800 dark:text-white">
                  {notification.title}
                </h2>
  
                <p className="text-gray-600 dark:text-gray-300 mt-1">
                  {notification.message}
                </p>
  
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                  {notification.type}
                </p>
  
              </div>
            ))
          )}
  
        </div>
  
      </div>
    </DashboardLayout>
  );
}