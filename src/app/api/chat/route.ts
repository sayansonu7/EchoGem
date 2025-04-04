import axios from "axios";
import { NextResponse } from "next/server";

// Clean response text to remove unwanted formatting characters and create visually attractive formatting
function cleanResponseText(text: string): string {
  // Remove asterisks that might be used for markdown formatting
  let cleaned = text.replace(/\*+/g, "");

  // Ensure each sentence ends with proper spacing
  cleaned = cleaned.replace(/\.(?=[A-Z])/g, ". ");

  // Split text into lines
  let lines = cleaned.split("\n");

  // Process each line individually
  let formattedLines = [];
  let inList = false;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();

    // Skip empty lines
    if (!line) continue;

    // Check if this is a section header
    const isSectionHeader =
      /^[A-Z][a-z]+ Features:/.test(line) ||
      /^(Key|Main|Common|Popular|Important) [A-Z][a-z]+:/.test(line);

    // Check if this is a feature item
    const isFeatureItem = /^[A-Z][a-z]+[\-]?[A-Z]?[a-z]*:/.test(line);

    // Check if this is a list item
    const isNumberedItem = /^\d+\./.test(line);
    const isBulletedItem = /^•/.test(line);
    const isListItem = isNumberedItem || isBulletedItem;

    // Format based on content type
    if (isSectionHeader) {
      // Add extra space before section headers (except the first one)
      if (formattedLines.length > 0) {
        formattedLines.push("");
      }
      formattedLines.push(line);
      formattedLines.push(""); // Add blank line after header
    } else if (isFeatureItem) {
      // Add extra space before feature items
      if (formattedLines.length > 0 && !inList) {
        formattedLines.push("");
      }
      formattedLines.push(line);
      inList = false;
    } else if (isListItem) {
      // Format list items with proper indentation
      if (!inList && formattedLines.length > 0) {
        formattedLines.push(""); // Add blank line before list starts
      }
      formattedLines.push(line);
      inList = true;
    } else {
      // Regular paragraph text
      if (inList) {
        formattedLines.push(""); // Add blank line after list ends
        inList = false;
      }

      // Check if this looks like a continuation of the previous line
      if (
        formattedLines.length > 0 &&
        !formattedLines[formattedLines.length - 1].endsWith(".") &&
        !formattedLines[formattedLines.length - 1].endsWith(":") &&
        !formattedLines[formattedLines.length - 1].endsWith("?") &&
        !formattedLines[formattedLines.length - 1].endsWith("!") &&
        !line.startsWith("•") &&
        !/^\d+\./.test(line) &&
        !/^[A-Z][a-z]+:/.test(line)
      ) {
        // This appears to be a continuation, so append to previous line
        formattedLines[formattedLines.length - 1] += " " + line;
      } else {
        formattedLines.push(line);
      }
    }
  }

  // Join lines back together with proper line breaks
  cleaned = formattedLines.join("\n");

  // Ensure proper spacing after colons
  cleaned = cleaned.replace(/:\s*/g, ": ");

  // Ensure no double spaces
  cleaned = cleaned.replace(/\s{2,}/g, " ");

  // Fix bullet points with proper spacing
  cleaned = cleaned.replace(/•\s*/g, "• ");

  // Fix numbered points with proper spacing
  cleaned = cleaned.replace(/(\d+\.)\s*/g, "$1 ");

  // Remove any spaces at the beginning of lines
  cleaned = cleaned.replace(/\n\s+/g, "\n");

  // Clean up excessive newlines
  cleaned = cleaned.replace(/\n{3,}/g, "\n\n");

  return cleaned.trim();
}

// Mock response function for when API is unavailable
function getMockResponse(question: string) {
  // Simple pattern matching for some common academic questions
  if (question.toLowerCase().includes("python")) {
    return "Python is a high-level, interpreted programming language known for its readability and versatility. Created by Guido van Rossum in 1991, Python emphasizes code readability with its notable use of significant whitespace. It supports multiple programming paradigms including procedural, object-oriented, and functional programming. Python is widely used in data science, web development, automation, and artificial intelligence.";
  } else if (question.toLowerCase().includes("javascript")) {
    return "JavaScript is a high-level, interpreted programming language that conforms to the ECMAScript specification. It's primarily known as the scripting language for Web pages but is also used in many non-browser environments. JavaScript enables interactive web pages and is an essential part of web applications.";
  } else if (
    question.toLowerCase().includes("study") ||
    question.toLowerCase().includes("tips")
  ) {
    return "Here are some effective study tips for academic success:\n\n1. Create a dedicated study space\n2. Use active recall techniques rather than passive reading\n3. Implement spaced repetition for better long-term retention\n4. Take regular breaks (try the Pomodoro technique)\n5. Join or form study groups for collaborative learning\n6. Maintain a healthy sleep schedule\n7. Stay hydrated and eat nutritious foods\n8. Use concept mapping to connect ideas\n9. Teach concepts to others to solidify your understanding";
  } else if (
    question.toLowerCase().includes("course") ||
    question.toLowerCase().includes("recommendation")
  ) {
    return "When recommending courses, I consider several factors:\n\n1. Your academic goals and career aspirations\n2. Previous coursework and prerequisites\n3. Your interests and strengths\n4. Course difficulty and workload\n5. Professor ratings and teaching styles\n\nFor more personalized recommendations, please share your major, academic interests, and career goals.";
  } else if (question.toLowerCase().includes("java")) {
    return "Java is a high-level, class-based, object-oriented programming language that is designed to have as few implementation dependencies as possible. It is a general-purpose programming language intended to let application developers write once, run anywhere (WORA), meaning that compiled Java code can run on all platforms that support Java without the need for recompilation. Java applications are typically compiled to bytecode that can run on any Java virtual machine (JVM) regardless of the underlying computer architecture.";
  } else {
    return "As an academic assistant, I'm here to help with your educational needs. I can provide information on various subjects, offer study strategies, recommend courses, explain complex concepts, and assist with academic planning. Please feel free to ask specific questions about your coursework or academic interests.";
  }
}

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

    // Extract the latest user message
    const userMessages = messages.filter((msg) => msg.role === "user");
    const latestUserMessage =
      userMessages[userMessages.length - 1]?.content || "";

    if (!latestUserMessage) {
      console.error("No user message found");
      return NextResponse.json(
        {
          role: "assistant",
          content: "I couldn't understand your message. Please try again.",
        },
        { status: 200 }
      );
    }

    // Check if mock responses should be used
    const useMockResponses = process.env.USE_MOCK_RESPONSES === "true";
    if (useMockResponses) {
      console.log("Using mock response system");
      const mockResponse = getMockResponse(latestUserMessage);
      return NextResponse.json({
        role: "assistant",
        content: mockResponse,
      });
    }

    // Check for API key
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "YOUR_GEMINI_API_KEY_HERE") {
      console.error("Missing or invalid API key");
      return NextResponse.json(
        {
          role: "assistant",
          content:
            "Configuration error: Please add a valid Gemini API key to your .env.local file.",
        },
        { status: 200 }
      );
    }

    console.log("Trying direct call to gemini-1.5-flash model...");
    console.log(
      "User message:",
      latestUserMessage.substring(0, 50) +
        (latestUserMessage.length > 50 ? "..." : "")
    );

    try {
      // Try using gemini-1.5-flash directly
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          contents: [
            {
              parts: [
                {
                  text: latestUserMessage,
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

      console.log("Gemini 1.5 Flash API responded successfully");

      // Extract text from response
      let responseText =
        "I'm sorry, I couldn't generate a response. Please try again.";

      if (
        response.data.candidates &&
        response.data.candidates[0] &&
        response.data.candidates[0].content &&
        response.data.candidates[0].content.parts &&
        response.data.candidates[0].content.parts[0] &&
        response.data.candidates[0].content.parts[0].text
      ) {
        responseText = response.data.candidates[0].content.parts[0].text;
        // Clean the response text
        responseText = cleanResponseText(responseText);
      }

      return NextResponse.json({
        role: "assistant",
        content: responseText,
      });
    } catch (directError: any) {
      console.error(
        "Direct call to gemini-1.5-flash failed:",
        directError.message
      );
      console.error("Status:", directError.response?.status);
      console.error("Data:", JSON.stringify(directError.response?.data || {}));

      // If direct call fails, try fetching available models
      try {
        console.log("Fetching available models...");
        const modelsResponse = await axios.get(
          `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
        );

        console.log("Available models:", JSON.stringify(modelsResponse.data));

        // Extract model names
        const availableModels = modelsResponse.data.models || [];
        const modelNames = availableModels.map((model: any) => model.name);
        console.log("Model names:", modelNames);

        // Try to find a suitable model, prioritizing newer models
        let modelToUse = "";

        if (modelNames.includes("models/gemini-1.5-flash")) {
          modelToUse = "models/gemini-1.5-flash";
        } else if (modelNames.includes("models/gemini-1.5-pro")) {
          modelToUse = "models/gemini-1.5-pro";
        } else if (modelNames.includes("models/gemini-pro")) {
          modelToUse = "models/gemini-pro";
        } else if (modelNames.includes("models/gemini-1.0-pro")) {
          modelToUse = "models/gemini-1.0-pro";
        } else if (modelNames.some((name: string) => name.includes("gemini"))) {
          // Take the first gemini model we find
          modelToUse = modelNames.find((name: string) =>
            name.includes("gemini")
          );
        }

        if (!modelToUse) {
          console.error(
            "No suitable Gemini model found among available models"
          );
          // Fall back to mock response
          const mockResponse = getMockResponse(latestUserMessage);
          return NextResponse.json({
            role: "assistant",
            content: mockResponse,
          });
        }

        console.log("Using model:", modelToUse);

        // Extract just the model name without the "models/" prefix
        const cleanModelName = modelToUse.replace("models/", "");

        // Now try to use the detected model
        console.log(`Calling Gemini API with model ${cleanModelName}...`);

        const fallbackResponse = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/${cleanModelName}:generateContent?key=${apiKey}`,
          {
            contents: [
              {
                parts: [
                  {
                    text: latestUserMessage,
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

        console.log("Gemini API responded successfully with fallback model");

        // Extract text from response
        let responseText =
          "I'm sorry, I couldn't generate a response. Please try again.";

        if (
          fallbackResponse.data.candidates &&
          fallbackResponse.data.candidates[0] &&
          fallbackResponse.data.candidates[0].content &&
          fallbackResponse.data.candidates[0].content.parts &&
          fallbackResponse.data.candidates[0].content.parts[0] &&
          fallbackResponse.data.candidates[0].content.parts[0].text
        ) {
          responseText =
            fallbackResponse.data.candidates[0].content.parts[0].text;
          // Clean the response text
          responseText = cleanResponseText(responseText);
        }

        return NextResponse.json({
          role: "assistant",
          content: responseText,
        });
      } catch (error: any) {
        console.error("Error in API call:", error.message);
        console.error("Status:", error.response?.status);
        console.error("Data:", JSON.stringify(error.response?.data || {}));

        // If we can't connect to the API, use mock responses
        console.log("Falling back to mock response due to API error");
        const mockResponse = getMockResponse(latestUserMessage);
        return NextResponse.json({
          role: "assistant",
          content: mockResponse,
        });
      }
    }
  } catch (error) {
    console.error("General error:", error);
    return NextResponse.json(
      {
        role: "assistant",
        content:
          "An unexpected error occurred while processing your request. Please try again later.",
      },
      { status: 200 }
    );
  }
}
