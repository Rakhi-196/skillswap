'use client';
import { uploadToCloudinary } from "@/lib/cloudinary";
import { useParams } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { auth, db, rtdb } from "@/lib/firebase";
import { ref, onValue, set, onDisconnect } from "firebase/database";
import { onAuthStateChanged } from "firebase/auth";
import{
    collection,
    addDoc,
    serverTimestamp,
    query,
    where,
    orderBy,
    onSnapshot,
    setDoc,
    doc,
    getDoc,
    getDocs,
    updateDoc,
  } from "firebase/firestore";
  import { sendNotification } from "@/lib/notifications";
  import { uploadFileToCloudinary } from "@/lib/cloudinary";
   import VoiceRecorder from "@/components/chat/voiceRecorder";
   
import MessageBubble from "@/components/chat/MessageBubble";
  import EmojiPicker from "emoji-picker-react";
  import {
    
    deleteDoc,
  } from "firebase/firestore";
  
export default function ChatPage() {
  const params = useParams();
  
const [currentUser, setCurrentUser] = useState<any>(null);
const [message, setMessage] = useState("");
const [messages, setMessages] = useState<any[]>([]);
const [previewImage, setPreviewImage] = useState<string | null>(null);
const [selectedImage, setSelectedImage] = useState<File | null>(null);
const [selectedImagePreview, setSelectedImagePreview] = useState<string | null>(null);
const [uploadingImage, setUploadingImage] = useState(false);

const [showImagePreview, setShowImagePreview] = useState(false);
const [showEmojiPicker, setShowEmojiPicker] = useState(false);
const messagesEndRef = useRef<HTMLDivElement | null>(null);
const [otherUser, setOtherUser] = useState<any>(null);
const [onlineStatus, setOnlineStatus] = useState<any>(null);
const [otherUserTyping, setOtherUserTyping] = useState(false);
const typingTimeout = useRef<NodeJS.Timeout | null>(null);
const [editingMessage, setEditingMessage] = useState<any>(null);
const [menuMessage, setMenuMessage] = useState<any>(null);
const emojiPickerRef = useRef<HTMLDivElement>(null);
const [editingId, setEditingId] = useState<string | null>(null);
const [editingText, setEditingText] = useState("");

useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    if (user) {
      setCurrentUser(user);
    }
  });

  return () => unsubscribe();
}, []);
const handleEmojiClick = (emojiData: any) => {
  setMessage((prev) => prev + emojiData.emoji);
};
const handleSend = async () => {
  if (!message.trim() || !currentUser) return;

  try {

    if (editingId) {
      await updateDoc(doc(db, "messages", editingId), {
        text: message,
        edited: true,
      });
    
      setEditingId(null);
      setEditingText("");
      setMessage("");
      return;
    }
    // Save message
    await addDoc(collection(db, "messages"), {
      swapId: params.swapId,
      senderId: currentUser.uid,
      text: message,
      createdAt: serverTimestamp(),
      seen: false,
    });
  
    // Get swap details
    const swapRef = doc(db, "swaps", params.swapId as string);
    const swapSnap = await getDoc(swapRef);
  
    if (!swapSnap.exists()) return;
  
    const swap = swapSnap.data();
  
    const receiverId =
      currentUser.uid === swap.senderId
        ? swap.receiverId
        : swap.senderId;
  
    // Update conversation
    await setDoc(
      doc(db, "conversations", params.swapId as string),
      {
        swapId: params.swapId,
        participants: [swap.senderId, swap.receiverId],
        lastMessage: message,
        lastMessageAt: serverTimestamp(),
        lastSender: currentUser.uid,
        unreadCount: {
          [currentUser.uid]: 0,
          [receiverId]: 1,
        },
      },
      { merge: true }
    );
  
    console.log("Conversation Updated:", message);
  
    // Send notification
    await sendNotification(
      receiverId,
      currentUser.uid,
      "new_message",
      "New Message",
      message
    );
  
    await set(ref(rtdb, `typing/${currentUser.uid}`), false);
    setMessage("");
  } catch (error) {
    console.error(error);
    alert("Failed to send message");
  }
}
const handleVoiceRecorded = async (file: Blob) => {
  await handleSendVoice(file);
};
const handleCopy = async (text: string) => {
  await navigator.clipboard.writeText(text);
  alert("Copied");
};

const handleEdit = (msg: any) => {
  setEditingId(msg.id);
  setEditingText(msg.text);
  setMessage(msg.text);
};
const handleDelete = async (msg: any) => {
  if (!confirm("Delete this message?")) return;

  await updateDoc(doc(db, "messages", msg.id), {
    deleted: true,
    text: "",
    image: "",
    audio: "",
    fileUrl: "",
    fileName: "",
  });
};
const handleSendImage = async () => {
  try {
    if (!selectedImage) return;

    setUploadingImage(true);

    // 1. upload image
    const imageUrl = await uploadToCloudinary(selectedImage);

    // 2. get swap
    const swapRef = doc(db, "swaps", params.swapId as string);
    const swapSnap = await getDoc(swapRef);

    if (!swapSnap.exists()) return;

    const swap = swapSnap.data();

    const receiverId =
      currentUser.uid === swap.senderId
        ? swap.receiverId
        : swap.senderId;

    // 3. SEND MESSAGE (IMPORTANT PART MISSING HOGA)
    await addDoc(collection(db, "messages"), {
      swapId: params.swapId,
      senderId: currentUser.uid,
      image: imageUrl,
      text: "",
      createdAt: serverTimestamp(),
      seen: false,
    });

    // 4. update conversation
    await setDoc(
      doc(db, "conversations", params.swapId as string),
      {
        lastMessage: "📷 Photo",
        lastMessageAt: serverTimestamp(),
        lastSender: currentUser.uid,
      },
      { merge: true }
    );

    // 5. cleanup UI
    setSelectedImage(null);
    setSelectedImagePreview(null);
    setShowImagePreview(false);

  } catch (err) {
    console.error(err);
    alert("Image send failed");
  } finally {
    setUploadingImage(false);
  }
};

const handleSendVoice = async (file: Blob) => {
  try {
    const audioUrl = await uploadToCloudinary(file);
    console.log("VOICE URL:", audioUrl);
    const swapRef = doc(db, "swaps", params.swapId as string);
    const swapSnap = await getDoc(swapRef);

    if (!swapSnap.exists()) return;

    const swap = swapSnap.data();

    const receiverId =
      currentUser.uid === swap.senderId
        ? swap.receiverId
        : swap.senderId;

    await addDoc(collection(db, "messages"), {
      swapId: params.swapId,
      senderId: currentUser.uid,
      audio: audioUrl,
      text: "",
      createdAt: serverTimestamp(),
      seen: false,
    });

    await setDoc(
      doc(db, "conversations", params.swapId as string),
      {
        lastMessage: "🎤 Voice Message",
        lastMessageAt: serverTimestamp(),
        lastSender: currentUser.uid,
      },
      { merge: true }
    );
  } catch (err) {
    console.error(err);
    alert("Voice send failed");
  }
};
const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  setSelectedImage(file);
  setSelectedImagePreview(URL.createObjectURL(file));
  setShowImagePreview(true);

  e.target.value = "";
};
const handleFileUpload = async (
  e: React.ChangeEvent<HTMLInputElement>
) => {
  const file = e.target.files?.[0];

  if (!file || !currentUser) return;

  try {
    const fileUrl = await uploadFileToCloudinary(file);
    console.log("File URL:", fileUrl);

    if (!fileUrl) {
      console.log("Cloudinary se URL nahi mili");
      return;
    }
    
    await addDoc(collection(db, "messages"), {
      swapId: params.swapId,
      senderId: currentUser.uid,

      fileUrl,
      fileName: file.name,
      fileType: file.type,

      createdAt: serverTimestamp(),
      seen: false,
    });

    e.target.value = "";

  } catch (error) {
    console.log("File upload error:", error);
  }
};
useEffect(() => {
  const loadOtherUser = async () => {
    if (!currentUser) return;

    const swapRef = doc(db, "swaps", params.swapId as string);
    const swapSnap = await getDoc(swapRef);

    if (!swapSnap.exists()) return;

    const swap = swapSnap.data();

    const otherUserId =
      currentUser.uid === swap.senderId
        ? swap.receiverId
        : swap.senderId;

    const userSnap = await getDocs(
      query(
        collection(db, "users"),
        where("uid", "==", otherUserId)
      )
    );

    if (!userSnap.empty) {
      setOtherUser(userSnap.docs[0].data());
    }
  };

  loadOtherUser();
}, [currentUser, params.swapId]);

useEffect(() => {
  if (!otherUser?.uid) return;

  const statusRef = ref(rtdb, `status/${otherUser.uid}`);

  const unsubscribe = onValue(statusRef, (snapshot) => {
    if (snapshot.exists()) {
      setOnlineStatus(snapshot.val());
    }
  });

  return () => unsubscribe();
}, [otherUser]);

useEffect(() => {
  if (!otherUser?.uid) return;

  const typingRef = ref(rtdb, `typing/${otherUser.uid}`);

  const unsubscribe = onValue(typingRef, (snapshot) => {
    setOtherUserTyping(snapshot.val() === true);
  });

  return () => unsubscribe();
}, [otherUser]);

useEffect(() => {
  const q = query(
    collection(db, "messages"),
    where("swapId", "==", params.swapId),
    orderBy("createdAt", "asc")
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    console.log("Messages:", snapshot.docs.length);

    const msgs = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    setMessages(msgs);
  });

  return () => unsubscribe();
}, [params.swapId]);

// Reset unread count when chat opens
useEffect(() => {
  if (!currentUser || !params.swapId) return;

  const resetUnread = async () => {
    try {
      await updateDoc(
        doc(db, "conversations", params.swapId as string),
        {
          [`unreadCount.${currentUser.uid}`]: 0,
        }
      );
    } catch (error) {
      console.error("Reset unread failed:", error);
    }
  };

  resetUnread();
}, [currentUser, params.swapId]);

useEffect(() => {
  if (!currentUser) return;

  const markMessagesSeen = async () => {
    const q = query(
      collection(db, "messages"),
      where("swapId", "==", params.swapId)
    );

    const snapshot = await getDocs(q);

    for (const messageDoc of snapshot.docs) {
      const data = messageDoc.data();

      if (
        data.senderId !== currentUser.uid &&
        data.seen === false
      ) {
        await updateDoc(doc(db, "messages", messageDoc.id), {
          seen: true,
        });
      }
    }
  };

  markMessagesSeen();
}, [currentUser, params.swapId, messages]);

useEffect(() => {
  messagesEndRef.current?.scrollIntoView({
    behavior: "smooth",
  });
}, [messages]);

useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
    if (
      emojiPickerRef.current &&
      !emojiPickerRef.current.contains(event.target as Node)
    ) {
      setShowEmojiPicker(false);
    }
  };

  document.addEventListener("mousedown", handleClickOutside);

  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
  };
}, []);

  return (
    <div className="p-6 bg-gray-50 dark:bg-slate-900 min-h-screen transition-colors">
   <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
  💬 Swap Chat
</h1>

<div className="mt-6 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg p-5 flex flex-col h-[75vh] transition-colors">
<div className="flex items-center gap-3 mb-4 pb-4 border-b">
  <div className="h-12 w-12 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
    {otherUser?.photoURL ? (
      <img
        src={otherUser.photoURL}
        alt={otherUser.displayName}
        className="h-full w-full object-cover"
      />
    ) : (
      <span className="text-lg font-semibold">
        {otherUser?.displayName?.charAt(0) || "U"}
      </span>
    )}
  </div>

  <div>
  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
      {otherUser?.displayName || "Loading..."}
    </h2>

    <p className="text-sm text-gray-500 dark:text-gray-400">
  {otherUserTyping
    ? "Typing..."
    : onlineStatus?.online
    ? "🟢 Online"
    : onlineStatus?.lastSeen
    ? `Last seen ${new Date(
        onlineStatus.lastSeen
      ).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}`
    : otherUser?.email}
</p>
  </div>
</div>


<div className="mt-6 flex-1 border border-gray-300 dark:border-slate-700 rounded p-4 overflow-y-auto bg-gray-50 dark:bg-slate-900">
{messages.map((msg) => {
  const isMe = msg.senderId === currentUser?.uid;

  return (
    <MessageBubble
      key={msg.id}
      msg={msg}
      isMe={isMe}
      onPreviewImage={setPreviewImage}
      onCopy={(text) => {
        navigator.clipboard.writeText(text);
        alert("Copied!");
      }}
      onEdit={handleEdit}
      onDelete={handleDelete}
    />
  );
})}
<div ref={messagesEndRef}></div>
</div>
{showEmojiPicker && (
  <div
    ref={emojiPickerRef}
    className="absolute bottom-20 left-5 z-50"
  >
    <EmojiPicker
      onEmojiClick={handleEmojiClick}
      width={300}
      height={400}
    />
  </div>
)}
<div className="mt-4 flex gap-2 border-t pt-4">
<button
  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
  className="bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 text-gray-900 dark:text-white px-3 py-2 rounded"
>
  😊
</button>
<label className="bg-gray-200 hover:bg-gray-300 px-3 py-2 rounded cursor-pointer">
  📷
  <input
    type="file"
    accept="image/*"
    className="hidden"
    onChange={handleImageUpload}
  />
  
</label>
<label className="bg-gray-200 hover:bg-gray-300 px-3 py-2 rounded cursor-pointer">
  📎
  <input
    type="file"
    className="hidden"
    onChange={handleFileUpload}
  />
</label>
<input
  type="text"
  value={message}
  onChange={async (e) => {
    const value = e.target.value;

    setMessage(value);

    await set(
      ref(rtdb, `typing/${currentUser.uid}`),
      value.length > 0
    );

    if (typingTimeout.current) {
      clearTimeout(typingTimeout.current);
    }

    typingTimeout.current = setTimeout(async () => {
      await set(
        ref(rtdb, `typing/${currentUser.uid}`),
        false
      );
    }, 2000);
  }}
  placeholder="Type a message..."
className="flex-1 border border-gray-300 dark:border-slate-600 rounded px-3 py-2 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
/>
<VoiceRecorder
  onRecorded={handleVoiceRecorded}
/>
<button
  onClick={handleSend}
  className="bg-blue-600 text-white px-4 py-2 rounded"
>
{editingId ? "Save" : "Send"}
</button>
</div> 
</div> 
{showImagePreview && selectedImagePreview && (
  <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">

<div className="bg-white dark:bg-slate-800 rounded-lg p-4 w-full max-w-md max-h-[90vh] flex flex-col">

      <img
        src={selectedImagePreview}
        alt="Preview"
        className="w-full max-h-[65vh] object-contain rounded-md"
      />

      <div className="flex justify-between mt-4">

        <button
          onClick={() => {
            setShowImagePreview(false);
            setSelectedImage(null);
            setSelectedImagePreview(null);
          }}
          className="px-4 py-2 bg-gray-300 dark:bg-slate-600 text-gray-900 dark:text-white rounded"
        >
          Cancel
        </button>

        <button
          onClick={handleSendImage}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Send
        </button>

      </div>

    </div>

  </div>
)}
{previewImage && (
  <div
    className="fixed inset-0 bg-black/90 flex items-center justify-center z-50"
    onClick={() => setPreviewImage(null)}
  >
    <button
      className="absolute top-5 right-6 text-white text-4xl font-bold"
      onClick={() => setPreviewImage(null)}
    >
      ✕
    </button>

    <img
      src={previewImage}
      alt="Preview"
      className="max-w-[90vw] max-h-[90vh] rounded-lg shadow-2xl"
      onClick={(e) => e.stopPropagation()}
    />
  </div>
)}
</div> 
); 
};
