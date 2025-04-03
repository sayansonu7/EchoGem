import axios from "axios";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    console.log("API route called");

    // Parse the request body
    let body;
    try {
      body = await req.json();
      console.log("Request parsed successfully");
    } catch (parseError) {
      console.error("Failed to parse request:", parseError);
      return NextResponse.json(
        {
          role: "assistant",
          content: "I couldn't understand your message. Please try again.",
        },
        { status: 200 }
      );
    }

    const { messages } = body;

    // Validate request
    if (!messages || !Array.isArray(messages)) {
      console.error("Invalid messages format:", messages);
      return NextResponse.json(
        {
          role: "assistant",
          content: "I couldn't process your message format. Please try again.",
        },
        { status: 200 }
      );
    }

    // Check API key
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("API key missing");
      return NextResponse.json(
        {
          role: "assistant",
          content:
            "The system is currently unable to connect to its knowledge source. Please try again later.",
        },
        { status: 200 }
      );
    }

    // Format messages for Gemini API
    const lastMessage = messages[messages.length - 1].content;

    try {
      console.log("Calling Gemini API...");
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
        {
          contents: [
            {
              parts: [
                {
                  text: lastMessage,
                },
              ],
            },
          ],
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Gemini API responded successfully");

      // Extract the response text from Gemini's response format
      const responseText = response.data.candidates[0].content.parts[0].text;

      return NextResponse.json({
        role: "assistant",
        content: responseText,
      });
    } catch (error: any) {
      console.error("Gemini API error:");
      console.error("Status:", error.response?.status);
      console.error("Data:", JSON.stringify(error.response?.data || {}));

      return NextResponse.json(
        {
          role: "assistant",
          content:
            "I'm having trouble connecting to my knowledge source. This might be due to API limits or connection issues. Please try again later.",
        },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error("General error:", error);
    return NextResponse.json(
      {
        role: "assistant",
        content:
          "I encountered an unexpected error. Please try asking a different question.",
      },
      { status: 200 }
    );
  }
}
