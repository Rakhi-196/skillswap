"use client";
import {  useState,useEffect } from "react";
interface Props {
    msg: any;
    isMe: boolean;
    onPreviewImage: (url: string) => void;
  
    onCopy: (text: string) => void;
    onEdit: (msg: any) => void;
    onDelete: (msg: any) => void;
  }
  export default function MessageBubble({
    msg,
    isMe,
    onPreviewImage,
    onCopy,
    onEdit,
    onDelete,
  }: Props) {

    const [menu, setMenu] = useState<{
        show: boolean;
        x: number;
        y: number;
      }>({
        show: false,
        x: 0,
        y: 0,
      });
      useEffect(() => {
        const closeMenu = () => {
          setMenu({
            show: false,
            x: 0,
            y: 0,
          });
        };
      
        document.addEventListener("click", closeMenu);
      
        return () => {
          document.removeEventListener("click", closeMenu);
        };
      }, []);


if (msg.deleted) {
    return (
      <div className={`flex mb-3 ${isMe ? "justify-end" : "justify-start"}`}>
        <div
          className={`max-w-xs px-4 py-2 rounded-2xl italic ${
            isMe
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-600"
          }`}
        >
          🚫 This message was deleted
        </div>
      </div>
    );
  }
  return (
    <>
    

{menu.show && (
  <div
    style={{
      position: "fixed",
      top: menu.y,
      left: menu.x,
      zIndex: 9999,
    }}
    className="w-40 bg-white border rounded-lg shadow-xl overflow-hidden"
  >
    {msg.text && (
      <button
        onClick={() => {
          onCopy(msg.text);
          setMenu({ ...menu, show: false });
        }}
        className="w-full text-left px-4 py-2 hover:bg-gray-100 text-black"
      >
        📋 Copy
      </button>
    )}

    {isMe && (
      <button
        onClick={() => {
          onEdit(msg);
          setMenu({ ...menu, show: false });
        }}
        className="w-full text-left px-4 py-2 hover:bg-gray-100 text-black"
      >
        ✏️ Edit
      </button>
    )}

    {isMe && (
      <button
        onClick={() => {
          onDelete(msg);
          setMenu({ ...menu, show: false });
        }}
        className="w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600"
      >
        🗑 Delete
      </button>
    )}
  </div>
)}
<div
  className={`flex mb-3 ${
    isMe ? "justify-end" : "justify-start"
  }`}
>

   <div
  onContextMenu={(e) => {
    e.preventDefault();
    console.log("right clicked");
    setMenu({
      show: true,
      x: e.clientX,
      y: e.clientY,
    });
  }}
  className={`relative max-w-xs px-4 py-2 rounded-2xl ${
    isMe
      ? "bg-blue-600 text-white rounded-br-sm"
      : "bg-gray-200 text-black rounded-bl-sm"
  }`}
>


   
        {/* Image */}
        {msg.image && (
          <img
            src={msg.image}
            alt="Shared"
            className="rounded-lg mb-2 max-w-[250px] max-h-[250px] object-cover cursor-pointer hover:opacity-90 transition"
            onClick={() => onPreviewImage(msg.image)}
          />
        )}

        {/* Audio */}
        {msg.audio && (
          <audio controls className="w-[220px] mb-2">
            <source src={msg.audio} type="audio/webm" />
            Your browser does not support audio.
          </audio>
        )}

        {/* File */}
        {msg.fileUrl && (
          <div className="bg-white text-black border rounded-lg p-3 mb-2 min-w-[180px]">
            <div className="flex items-center gap-2">
              <span>📄</span>
              <span className="text-sm break-all">
                {msg.fileName}
              </span>
            </div>

            <a
              href={msg.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 text-sm mt-2 inline-block"
            >
              ⬇️ Open / Download
            </a>
          </div>
        )}

        {/* Text */}
        {msg.text && <p>{msg.text}</p>}

        {/* Time */}
        <div
          className={`flex items-center mt-1 text-xs ${
            isMe ? "justify-end" : "justify-start"
          }`}
        >
          <span className={isMe ? "text-blue-100" : "text-gray-500"}>
            {msg.createdAt?.toDate?.().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>

          {isMe && (
            <span
              className={`ml-1 font-semibold ${
                msg.seen ? "text-cyan-300" : "text-gray-300"
              }`}
            >
              {msg.seen ? "✓✓" : "✓"}
            </span>
          )}
        </div>
      </div>
    </div>
     </>
  );
}