# AI Cover Letter Generator

An intelligent assistant that uses your CV to generate tailored, professional, and ATS-friendly cover letters for job applications based on a job description.

## Features

-   **AI-Powered Generation**: Leverages the Google Gemini API to create human-like, relevant cover letters.
-   **CV Integration**: Uses a default pre-loaded CV or allows users to upload their own in `.pdf` or `.docx` format.
-   **Customizable Inputs**: Fields for candidate name, company details (name, address), hiring manager, and the job description.
-   **ATS-Friendly Formatting**: The AI is specifically prompted to follow strict formatting rules (justified paragraphs, proper spacing, no indentation) to ensure compatibility with Applicant Tracking Systems.
-   **Rich Output Options**:
    -   **Edit**: The generated letter appears in a text area for manual edits.
    -   **Copy to Clipboard**: Quickly copy the entire letter text.
    -   **Download**: Export the final letter as a `.pdf` or `.docx` file, complete with professional formatting and page borders.
    -   **Re-generate**: Create a new version of the letter with a single click.
-   **Modern & Responsive UI**: Built with Tailwind CSS for a clean, intuitive, and mobile-friendly experience.

## Tech Stack

-   **Frontend**: React, TypeScript, Tailwind CSS
-   **AI Model**: Google Gemini (`gemini-2.5-flash`) via `@google/genai` SDK
-   **CV Parsing**:
    -   `pdfjs-dist`: For extracting text from PDF files.
    -   `mammoth`: For extracting text from DOCX files.
-   **Document Export**:
    -   `jspdf`: For generating PDF documents.
    -   `docx`: For generating Word (.docx) documents.

## How It Works

1.  **Data Input**: The user fills out the form with their name, details about the job (company name, job description, etc.), and either uses the default CV or uploads their own.
2.  **Prompt Engineering**: The application dynamically constructs a detailed prompt for the Gemini API. This prompt includes:
    -   The candidate's full CV text.
    -   The job details provided by the user.
    -   A set of strict instructions on formatting, structure, tone, and length to ensure the output is professional and ATS-compliant.
    -   A special rule to handle specific parts of the default CV for content consistency.
3.  **API Call**: The prompt is sent to the Gemini API via the `generateCoverLetter` service.
4.  **Display & Export**: The AI's response (the cover letter text) is displayed in a text area. The user can then copy it or use the download functions, which re-format the plain text into a structured PDF or DOCX document.

## Project Structure

```
.
├── index.html                # Main HTML entry point
├── index.tsx                 # React app entry point
├── App.tsx                   # Main application component (UI, state, logic)
├── services/
│   └── geminiService.ts      # Logic for Gemini API interaction and prompt building
├── constants.ts              # Stores the default CV data
├── types.ts                  # TypeScript type definitions
└── metadata.json             # Project metadata
```

### Key Logic Areas

#### `services/geminiService.ts`

This file is the core of the AI integration. The `buildPrompt` function is crucial for **prompt engineering**. It assembles all the user data and a comprehensive set of rules to guide the language model. This ensures the output is not just a generic letter but a well-structured, tailored, and correctly formatted document.

#### `App.tsx`

This component handles all client-side logic:

-   **State Management**: Uses `useState` to manage all form inputs, the generated letter, loading states, and errors.
-   **File Handling**: The `handleFileChange` function demonstrates client-side file processing. It reads an uploaded file (`.pdf` or `.docx`) into an `ArrayBuffer` and uses the appropriate library (`pdfjs-dist` or `mammoth`) to extract the raw text content.
-   **Document Generation**:
    -   `handleDownloadPdf`: Uses `jspdf` to create a PDF. It carefully calculates line breaks and spacing, and applies different text alignments (justified for body, left-aligned for headers) to match the AI's instructions.
    -   `handleDownloadDocx`: Uses the `docx` library to build a Word document programmatically. It creates `Paragraph` objects with specific alignment properties and assembles them into a document, which is then converted to a Blob for download.

## How to Run

To run this project, you would typically need:

1.  An environment with Node.js and npm installed.
2.  A Google Gemini API key.

**Setup**:

1.  Clone the repository.
2.  Install dependencies: `npm install`
3.  Create a `.env` file in the root directory and add your API key:
    ```
    API_KEY=YOUR_GEMINI_API_KEY
    ```
4.  Start the development server: `npm run dev`

*(Note: In the provided project environment, the API key is handled automatically as `process.env.API_KEY`)*
