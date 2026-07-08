# 🚀 Skill Swap

A modern full-stack skill exchange platform where users can connect with others, exchange skills, send swap requests, and communicate through real-time messaging.

Built using **Next.js**, **Firebase**, **Cloud Firestore**, **Cloudinary**, **TypeScript**, and **Tailwind CSS**.

---

# 📌 Features

## 🔐 Authentication

- Email & Password Authentication
- Google Sign In
- Secure Authentication using Firebase
- Protected Routes

---

## 👤 User Profile

- Create Profile
- Edit Profile
- Upload Profile Image using Cloudinary
- View Other User Profiles

---

## 🛠 Skill Management

- Add Skills
- Edit Skills
- Delete Skills
- Browse Available Skills

---

## 🤝 Skill Swap

- Send Swap Requests
- Accept Swap Requests
- Reject Swap Requests
- View Pending Swaps
- View Accepted Swaps

---

## 💬 Real-Time Messaging

- One-to-One Chat
- Real-Time Firestore Updates
- Image Sharing
- Conversation List
- Latest Message Preview
- Read / Unread Messages

---

## 🔔 Notifications

- Swap Request Notifications
- New Message Notifications
- Read / Unread Status

---

## 🎨 User Interface

- Responsive Design
- Dark / Light Theme
- Dashboard
- Clean UI using Tailwind CSS

---

# 🛠 Tech Stack

### Frontend

- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS

### Backend

- Firebase Authentication
- Cloud Firestore

### Image Storage

- Cloudinary

### State Management

- React Context API

### Deployment

- Vercel

---

# 📂 Project Structure

```
skill-swap/

│── app/
│   ├── dashboard/
│   ├── messages/
│   ├── notifications/
│   ├── onboarding/
│   ├── profile/
│   ├── reviews/
│   ├── settings/
│   ├── skills/
│   ├── swaps/
│
│── components/
│── context/
│── hooks/
│── lib/
│── public/
│── package.json
```

---

# ⚙️ Installation

## Clone Repository

```bash
git clone https://github.com/your-username/skillswap-platform.git
```

Move into the project folder

```bash
cd skillswap-platform
```

Install dependencies

```bash
npm install
```

Create a `.env.local` file and add your Firebase and Cloudinary configuration.

```env
NEXT_PUBLIC_FIREBASE_API_KEY=

NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=

NEXT_PUBLIC_FIREBASE_PROJECT_ID=

NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=

NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=

NEXT_PUBLIC_FIREBASE_APP_ID=

NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=

NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=
```

Start the development server

```bash
npm run dev
```

Open

```
http://localhost:3000
```

---

# 🚀 Deployment

This project can be deployed easily using **Vercel**.

Build the project

```bash
npm run build
```

Run production build

```bash
npm start
```

---

# 📦 Dependencies

- Next.js
- React
- TypeScript
- Tailwind CSS
- Firebase
- Cloudinary
- React Context API

---

# 🔮 Future Improvements

- Search and Filter Improvements
- Better Notification Management
- UI Enhancements
- Performance Optimization

---

# 👨‍💻 Developed By

**Rakhi Chauhan**

GitHub:
https://github.com/your-github-username

LinkedIn:
https://linkedin.com/in/your-linkedin

---

## 📄 License

This project is licensed under the MIT License.