import React, { useState, useRef, useEffect } from "react";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import { Message, ChatState } from "@/types/chat";

const initialSystemMessage: Message = {
  role: "system",
  content:
    "You are an AI academic assistant for a university's academic management system. Your primary role is to help students with their academic needs, including: 1) Providing personalized course recommendations based on their interests and career goals, 2) Answering questions about course content, prerequisites, and academic policies, 3) Offering study tips and learning strategies tailored to different subjects, 4) Helping with time management and academic planning, 5) Giving guidance on research methodologies and academic writing. Provide clear, concise, and helpful responses. When appropriate, suggest specific resources or next steps. Maintain a supportive and encouraging tone.",
};

const ChatContainer: React.FC = () => {
  const [chatState, setChatState] = useState<ChatState>({
    messages: [initialSystemMessage],
    isLoading: false,
    error: null,
  });

  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom of chat when messages change
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [chatState.messages]);

  const handleSendMessage = async (content: string) => {
    // Add user message to chat
    const userMessage: Message = { role: "user", content };
    setChatState((prev) => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      isLoading: true,
      error: null,
    }));

    try {
      // Prepare messages for API
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...chatState.messages, userMessage],
        }),
      });

      // Parse response
      const data = await response.json();

      // Check if we got a proper assistant message
      if (data && data.role === "assistant" && data.content) {
        // Add AI response to chat
        setChatState((prev) => ({
          ...prev,
          messages: [...prev.messages, data],
          isLoading: false,
        }));
      } else if (data && data.error) {
        // Handle error response but don't show to user
        console.error("API returned error:", data.error);
        setChatState((prev) => ({
          ...prev,
          isLoading: false,
          messages: [
            ...prev.messages,
            {
              role: "assistant",
              content:
                "I'm having trouble connecting to my knowledge source. Please try again later.",
            },
          ],
        }));
      } else {
        // Handle unexpected format
        console.error("Unexpected API response format:", data);
        setChatState((prev) => ({
          ...prev,
          isLoading: false,
          messages: [
            ...prev.messages,
            {
              role: "assistant",
              content:
                "I received an unexpected response format. Please try again.",
            },
          ],
        }));
      }
    } catch (error) {
      // Handle fetch errors
      console.error("Error sending message:", error);
      setChatState((prev) => ({
        ...prev,
        isLoading: false,
        messages: [
          ...prev.messages,
          {
            role: "assistant",
            content:
              "I couldn't connect to the server. Please check your internet connection and try again.",
          },
        ],
      }));
    }
  };

  // Filter out system messages from display
  const displayMessages = chatState.messages.filter(
    (msg) => msg.role !== "system"
  );

  return (
    <div className="flex flex-col h-full max-w-3xl mx-auto border rounded-lg shadow-lg bg-white">
      <div className="p-4 bg-blue-600 text-white rounded-t-lg">
        <h2 className="text-xl font-bold">
        AI Chatbot
        </h2>
      </div>

      <div
        ref={chatContainerRef}
        className="flex-1 p-4 overflow-y-auto"
        style={{ maxHeight: "calc(100vh - 200px)" }}
      >
        {displayMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            Send a message to start the conversation
          </div>
        ) : (
          displayMessages.map((message, index) => (
            <ChatMessage key={index} message={message} />
          ))
        )}

        {chatState.isLoading && (
          <div className="flex justify-start mb-4">
            <div className="bg-gray-200 text-gray-800 px-4 py-3 rounded-lg rounded-tl-none animate-pulse">
              Thinking...
            </div>
          </div>
        )}
      </div>

      <ChatInput
        onSendMessage={handleSendMessage}
        isLoading={chatState.isLoading}
      />
    </div>
  );
};

export default ChatContainer;
