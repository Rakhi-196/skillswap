import axios from "axios";

export const uploadToCloudinary = async (file: File | Blob) => {
  const formData = new FormData();

  formData.append("file", file);
  formData.append("upload_preset", "chat_upload");

  try {
    const res = await axios.post(
      "https://api.cloudinary.com/v1_1/ujn8c0jr/raw/upload",
      formData
    );
    console.log(res);
    console.log(res.status);
    console.log(res.headers);
    console.log(res.data);
    return res.data.secure_url;

  } catch (err: any) {
    console.log("Cloudinary Error:", err.response?.data);
    throw err;
  }
};

export const uploadFileToCloudinary = async (file: File) => {
  return uploadToCloudinary(file);
};