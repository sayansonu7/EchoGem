# AI Academic Assistant Chatbot

A web-based chatbot built with Next.js and OpenAI's GPT API to assist students with course recommendations, answer academic queries, and provide real-time guidance.

## Features

- Real-time chat interface
- Integration with OpenAI's GPT-3.5 Turbo
- Responsive design for desktop and mobile
- Customizable system prompts for academic contexts

## Getting Started

### Prerequisites

- Node.js 18+
- An OpenAI API key

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env.local` file in the root directory and add your OpenAI API key:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   ```

### Running the Development Server

```bash
npm run dev
```

Then, open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment

This application can be easily deployed to Vercel:

```bash
npm run build
npm run start
```

## Customizing for Your Academic System

To adapt this chatbot for your specific academic management system:

1. Modify the system prompt in `ChatContainer.tsx` to include specific details about your courses, policies, or academic information
2. Add academic-specific entities and queries to the AI prompt
3. Integrate with your existing academic management system API if needed

## License

MIT
