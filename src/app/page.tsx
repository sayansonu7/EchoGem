"use client";

import React from "react";
import dynamic from "next/dynamic";

// Use dynamic import with SSR disabled to avoid hydration errors
const ChatContainer = dynamic(() => import("@/components/ChatContainer"), {
  ssr: false,
});

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 md:p-12 bg-white dark:bg-gray-900">
      <div className="w-full max-w-5xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-3 text-gray-900 dark:text-white">
            AI Academic Assistant
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Your personal assistant for academic guidance and support
          </p>
        </div>

        <div className="h-[75vh]">
          <ChatContainer />
        </div>

        <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>
            This AI assistant can help with course recommendations, answer
            academic queries, and provide guidance for students.
          </p>
        </div>
      </div>
    </main>
  );
}
