import { GoogleGenAI } from "@google/genai";
import type { CoverLetterData } from '../types';

const buildPrompt = (data: CoverLetterData): string => {
    const { jobDescription, companyName, companyAddress, hiringManager, candidateName, cvData } = data;
    const currentDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    return `
      As an expert career advisor, create a professional, ATS-friendly cover letter for ${candidateName}.
      The letter must strictly adhere to modern professional formatting guidelines suitable for submission through an Applicant Tracking System (ATS).

      **Candidate's CV:**
      ---
      ${cvData}
      ---

      **Job Details:**
      - Company: ${companyName}
      - Job Description: ${jobDescription}
      ${companyAddress ? `- Company Address: ${companyAddress}` : ''}
      ${hiringManager ? `- Hiring Manager: ${hiringManager}` : ''}

      **Formatting and Structure Instructions (Strict Adherence Required):**
      1.  **Layout:** Use a single-column layout. Do not use any indentation.
      2.  **Alignment:** The main body paragraphs MUST be justified. All other lines (contact info, date, recipient info, salutation "Dear...", and closing "Sincerely,") MUST be left-aligned.
      3.  **Spacing:** Use single spacing within paragraphs. Use a single blank line between all distinct sections (e.g., between the sender's address and the date, between paragraphs, and before the closing).
      4.  **Font Compatibility:** The output must be plain text compatible with standard sans-serif fonts (e.g., Arial, Calibri). Do not use special characters, symbols, or styled text.
      5.  **Paragraphs:** Each paragraph must be a distinct block of text separated by a single blank line.

      **Length Constraint (CRITICAL):**
      - The entire cover letter, including all headers, footers, and spacing, MUST be concise enough to fit on a single standard US Letter or A4 page. Brevity is crucial.
      - The main body should consist of 3-4 short, impactful paragraphs.

      **Content Customization (Strict Adherence Required):**
      - If the CV is for Fatimah Albaik and mentions the "Data & AI New Associate" role at Accenture, you MUST use ONLY the following sentence to describe it: "My training as a Data & AI New Associate at Accenture has further equipped me with skills in building ETL pipelines, developing Power BI dashboards." Do not use any other details from the CV for this specific role.

      **Cover Letter Template (Follow this structure exactly):**

      [Start with the candidate's contact information (Name, Email, Phone, LinkedIn), extracted from the CV. Each piece of info should be on a new line.]

      ${currentDate}

      ${hiringManager || 'Hiring Manager'}
      ${companyName}${companyAddress ? `\n${companyAddress}` : ''}

      Dear ${hiringManager ? hiringManager.split(' ')[0] : 'Hiring Manager'},

      [Paragraph 1: Introduction - Justified]
      State the specific position being applied for and where it was seen. Express strong, genuine enthusiasm for the role and ${companyName}.

      [Paragraph 2: Body - Justified]
      Connect the candidate's most relevant experiences directly to the job description's requirements. Emphasize their key skills. Highlight a major achievement from the CV to demonstrate practical expertise.

      [Paragraph 3: Body - Justified]
      Elaborate on how their project experience and industry training make them a valuable asset. Show a clear understanding of what ${companyName} does and how they can contribute to their goals.

      [Paragraph 4: Conclusion - Justified]
      Reiterate their strong interest in the position and the company. Confidently state their ability to contribute to the team's success and include a clear call to action, expressing eagerness for an interview.

      Sincerely,



      ${candidateName}

      **Final Output:**
      Return ONLY the complete, formatted cover letter text as a single string. Do not include any extra commentary, headers, or explanations.
    `;
};


export const generateCoverLetter = async (data: CoverLetterData): Promise<string> => {
    // Create a new instance for each call to ensure the latest API key is used.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const model = 'gemini-2.5-flash';
    const prompt = buildPrompt(data);

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error generating content from Gemini API:", error);
        throw new Error("Failed to communicate with the AI model.");
    }
};