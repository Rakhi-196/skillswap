import React from "react";
import { uploadToCloudinary } from "@/lib/cloudinary";

interface Props {
  onUploadComplete: (url: string) => void;
  onUploadError?: (error: Error) => void;
  allowedTypes?: string[];
  maxSizeMB?: number;

  // ✨ NEW FEATURES
  buttonText?: string;
  className?: string;
  generatePath?: (file: File) => string; // optional custom path logic
}

const FileUpload: React.FC<Props> = ({
  onUploadComplete,
  onUploadError,
  allowedTypes = ["image/jpeg", "image/png", "image/gif"],
  maxSizeMB = 2,
  buttonText = "Upload Image",
  className = "",
  generatePath,
}) => {

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // 📦 size check
      if (file.size > maxSizeMB * 1024 * 1024) {
        throw new Error(`File too large. Max ${maxSizeMB}MB allowed.`);
      }

      // 📎 type check
      if (!allowedTypes.includes(file.type)) {
        throw new Error("Invalid file type");
      }

      // 🔥 optional custom path logic (future-proof)
      if (generatePath) {
        generatePath(file);
      }

      // ☁️ upload
      const url = await uploadToCloudinary(file);

      onUploadComplete(url);
    } catch (err: any) {
      if (onUploadError) {
        onUploadError(err);
      }
    }

    // reset input so same file can be re-uploaded
    e.target.value = "";
  };
  
  return (
    <div className={className}>
      <label className="inline-flex items-center gap-2 cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg shadow transition">
        📷 {buttonText}
        <input
          type="file"
          accept={allowedTypes.join(",")}
          className="hidden"
          onChange={handleChange}
        />
      </label>
    </div>
  );
};

export default FileUpload;