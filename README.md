# System Design Visualizer

A real-time collaborative tool for designing and visualizing system architectures.

## Tech Stack
- **Frontend**: React (Vite), ReactFlow, Tailwind CSS, Lucide React, Framer Motion
- **Backend**: Node.js (Express), Socket.io
- **Database**: Firebase (Firestore)
- **Authentication**: Firebase Auth (Google)

## Features
- **Drag & Drop**: Easily add system components (Servers, Databases, Load Balancers, etc.)
- **Real-time Collaboration**: See updates from other users instantly via WebSockets.
- **Persistence**: Save your diagrams to the cloud.
- **Responsive UI**: Clean, modern interface built with Tailwind CSS.

## Setup Instructions
1. **Environment Variables**: Ensure `GEMINI_API_KEY` is set in your secrets.
2. **Install Dependencies**: `npm install`
3. **Run Development Server**: `npm run dev`
4. **Build for Production**: `npm run build`

## Project Structure
- `/src/components`: UI components and custom ReactFlow nodes.
- `/src/firebase.ts`: Firebase initialization and configuration.
- `/server.ts`: Express server with Socket.io integration.
- `/firestore.rules`: Security rules for the database.
- `/firebase-blueprint.json`: Data structure definition.
