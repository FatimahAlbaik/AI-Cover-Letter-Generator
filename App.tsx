import React, { useState, useCallback, useRef, useEffect } from 'react';
import { generateCoverLetter } from './services/geminiService';
import { CV_DATA } from './constants';
import { jsPDF } from "jspdf";
import { Document, Packer, Paragraph, TextRun, AlignmentType, PageBorderDisplay, PageBorders, BorderStyle } from "docx";
import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';


const SparklesIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M9.93 2.13a2.46 2.46 0 0 1 4.14 0l.24.52a.37.37 0 0 0 .5.25l.59-.14a2.46 2.46 0 0 1 2.7 2.7l-.14.59a.37.37 0 0 0 .25.5l.52.24a2.46 2.46 0 0 1 0 4.14l-.52.24a.37.37 0 0 0-.25.5l.14.59a2.46 2.46 0 0 1-2.7 2.7l-.59-.14a.37.37 0 0 0-.5.25l-.24.52a2.46 2.46 0 0 1-4.14 0l-.24-.52a.37.37 0 0 0-.5-.25l-.59.14a2.46 2.46 0 0 1-2.7-2.7l.14-.59a.37.37 0 0 0-.25-.5l-.52-.24a2.46 2.46 0 0 1 0-4.14l.52-.24a.37.37 0 0 0 .25-.5l-.14-.59a2.46 2.46 0 0 1 2.7-2.7l.59.14a.37.37 0 0 0 .5-.25Z"/><path d="M4 8v2"/><path d="M8 4h2"/><path d="M14 4h2"/><path d="M20 8v2"/><path d="M18 14v2"/><path d="M14 20h2"/><path d="M8 20h2"/><path d="M4 14v2"/>
    </svg>
);

const CopyIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </svg>
);

const DownloadIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" />
    </svg>
);

const CheckIcon = (props: React.SVGProps<SVGSVGElement>) => (
     <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M20 6 9 17l-5-5" />
    </svg>
);

const RefreshCwIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M3 2v6h6" />
        <path d="M21 12A9 9 0 0 0 6 5.3L3 8" />
        <path d="M21 22v-6h-6" />
        <path d="M3 12a9 9 0 0 0 15 6.7l3-2.7" />
    </svg>
);

const Spinner = () => (
    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
);

// Helper to parse the cover letter text into non-empty blocks.
const parseCoverLetterIntoBlocks = (text: string): string[] => {
    const lines = text.split('\n');
    const blocks: string[] = [];
    let currentBlockLines: string[] = [];

    for (const line of lines) {
        if (line.trim() === '') {
            if (currentBlockLines.length > 0) {
                blocks.push(currentBlockLines.join('\n'));
                currentBlockLines = [];
            }
        } else {
            currentBlockLines.push(line);
        }
    }
    if (currentBlockLines.length > 0) {
        blocks.push(currentBlockLines.join('\n'));
    }
    return blocks;
};

export default function App() {
    const [jobDescription, setJobDescription] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [companyAddress, setCompanyAddress] = useState('');
    const [hiringManager, setHiringManager] = useState('');
    const [candidateName, setCandidateName] = useState('Fatimah Albaik');
    const [useCustomCv, setUseCustomCv] = useState(false);
    const [customCvText, setCustomCvText] = useState('');
    const [fileName, setFileName] = useState<string | null>(null);
    const [isParsing, setIsParsing] = useState(false);

    const [coverLetter, setCoverLetter] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [isDownloadMenuOpen, setIsDownloadMenuOpen] = useState(false);
    const downloadMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Setup pdf.js worker. The importmap will resolve this path to the correct CDN URL.
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'pdfjs-dist/build/pdf.worker.min.mjs';
        
        const handleClickOutside = (event: MouseEvent) => {
            if (downloadMenuRef.current && !downloadMenuRef.current.contains(event.target as Node)) {
                setIsDownloadMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsParsing(true);
        setError(null);
        setFileName(file.name);
        setCustomCvText(''); // Clear previous CV

        try {
            const arrayBuffer = await file.arrayBuffer();
            let text = '';
            if (file.name.endsWith('.docx')) {
                const result = await mammoth.extractRawText({ arrayBuffer });
                text = result.value;
            } else if (file.name.endsWith('.pdf')) {
                const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
                const numPages = pdf.numPages;
                let fullText = '';
                for (let i = 1; i <= numPages; i++) {
                    const page = await pdf.getPage(i);
                    const textContent = await page.getTextContent();
                    const pageText = textContent.items.map(item => 'str' in item ? item.str : '').join(' ');
                    fullText += pageText + '\n\n';
                }
                text = fullText;
            } else {
                throw new Error("Unsupported file type. Please upload a .pdf or .docx file.");
            }
            setCustomCvText(text);
        } catch (err: any) {
            setError(err.message || 'Failed to parse the file.');
            setFileName(null);
        } finally {
            setIsParsing(false);
            // Reset the file input so the user can upload the same file again after an error
            event.target.value = '';
        }
    };


    const handleGenerate = useCallback(async () => {
        const cvData = useCustomCv ? customCvText : CV_DATA;
        if (!jobDescription.trim() || !companyName.trim() || !candidateName.trim() || !cvData.trim()) {
            setError('Please fill in Your Name, Company Name, Job Description, and provide a CV.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setCoverLetter('');
        try {
            const generatedText = await generateCoverLetter({
                jobDescription,
                companyName,
                companyAddress,
                hiringManager,
                candidateName,
                cvData: cvData,
            });
            setCoverLetter(generatedText);
        } catch (e: any) {
            setError(e.message || 'Failed to generate cover letter. Please check your connection and API key, then try again.');
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    }, [jobDescription, companyName, companyAddress, hiringManager, candidateName, useCustomCv, customCvText]);

    const handleCopy = () => {
        if (coverLetter) {
            navigator.clipboard.writeText(coverLetter);
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        }
    };
    
    const handleDownloadPdf = () => {
        const doc = new jsPDF({ unit: 'pt' });
        const FONT_SIZE = 11;
        const LINE_SPACING_FACTOR = 1.2;
        const SINGLE_LINE_HEIGHT = FONT_SIZE * LINE_SPACING_FACTOR;

        const { width: pageWidth, height: pageHeight } = doc.internal.pageSize;
        const HORIZONTAL_MARGIN = 40;
        const VERTICAL_MARGIN = 40;
        const usableWidth = pageWidth - HORIZONTAL_MARGIN * 2;

        doc.rect(20, 20, pageWidth - 40, pageHeight - 40);
        doc.setFont("times", "normal");
        doc.setFontSize(FONT_SIZE);
        let y = VERTICAL_MARGIN;

        const addPageIfNeeded = (blockHeight: number) => {
            if (y + blockHeight > pageHeight - VERTICAL_MARGIN) {
                doc.addPage();
                doc.rect(20, 20, pageWidth - 40, pageHeight - 40);
                y = VERTICAL_MARGIN;
            }
        };

        const blocks = parseCoverLetterIntoBlocks(coverLetter);
        const headerBlockCount = 4;
        const footerBlockCount = 2;
        const totalBlocks = blocks.length;

        blocks.forEach((block, index) => {
            const isBodyParagraph = index >= headerBlockCount && index < totalBlocks - footerBlockCount;

            if (isBodyParagraph) {
                const unwrappedText = block.replace(/\n/g, ' ');
                const textLines = doc.splitTextToSize(unwrappedText, usableWidth);
                const blockHeight = textLines.length * SINGLE_LINE_HEIGHT;
                addPageIfNeeded(blockHeight);
                
                doc.text(unwrappedText, HORIZONTAL_MARGIN, y, {
                    maxWidth: usableWidth,
                    align: 'justify',
                    lineHeightFactor: LINE_SPACING_FACTOR,
                });
                y += blockHeight;
            } else {
                const individualLines = block.split('\n');
                const blockHeight = individualLines.length * SINGLE_LINE_HEIGHT;
                addPageIfNeeded(blockHeight);

                doc.text(individualLines, HORIZONTAL_MARGIN, y, {
                    lineHeightFactor: LINE_SPACING_FACTOR,
                    align: 'left'
                });
                y += blockHeight;
            }

            // Add spacer after block
             if (index < totalBlocks - 1) {
                y += SINGLE_LINE_HEIGHT;
                addPageIfNeeded(0);
            }
        });
        
        doc.save(`Cover-Letter-${companyName || candidateName.replace(' ', '-')}.pdf`);
        setIsDownloadMenuOpen(false);
    };

    const handleDownloadDocx = () => {
        const blocks = parseCoverLetterIntoBlocks(coverLetter);
        const headerBlockCount = 4;
        const footerBlockCount = 2;
        const totalBlocks = blocks.length;

        const docxParagraphs: Paragraph[] = [];

        blocks.forEach((block, index) => {
            const isBodyParagraph = index >= headerBlockCount && index < totalBlocks - footerBlockCount;

            if (isBodyParagraph) {
                const unwrappedText = block.replace(/\n/g, ' ');
                docxParagraphs.push(new Paragraph({
                    children: [new TextRun(unwrappedText)],
                    alignment: AlignmentType.JUSTIFIED,
                }));
            } else {
                const lines = block.split('\n');
                lines.forEach(line => {
                    docxParagraphs.push(new Paragraph({
                        children: [new TextRun(line)],
                        alignment: AlignmentType.LEFT,
                    }));
                });
            }

            // Add a spacer paragraph after each block, except the last one.
            if (index < totalBlocks - 1) {
                docxParagraphs.push(new Paragraph({ children: [] }));
            }
        });

        const doc = new Document({
             styles: {
                paragraph: {
                    run: {
                        font: "Arial",
                        size: 22, // 11pt
                    },
                },
            },
            sections: [{
                properties: {
                     page: {
                        borders: {
                            pageBorders: {
                                display: PageBorderDisplay.ALL_PAGES,
                                top: { style: BorderStyle.SINGLE, size: 6, color: 'auto' },
                                bottom: { style: BorderStyle.SINGLE, size: 6, color: 'auto' },
                                left: { style: BorderStyle.SINGLE, size: 6, color: 'auto' },
                                right: { style: BorderStyle.SINGLE, size: 6, color: 'auto' },
                            }
                        }
                    }
                },
                children: docxParagraphs,
            }],
        });
        
        Packer.toBlob(doc).then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `Cover-Letter-${companyName || candidateName.replace(' ', '-')}.docx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        });
        setIsDownloadMenuOpen(false);
    };


    return (
        <div className="min-h-screen bg-slate-900 text-slate-200 font-sans p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <header className="text-center mb-10">
                    <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-500">
                        AI Cover Letter Generator
                    </h1>
                    <p className="mt-4 text-lg text-slate-400">
                        Craft a professional, ATS-friendly cover letter in seconds.
                    </p>
                </header>

                <main className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Input Section */}
                    <div className="bg-slate-800/50 p-6 rounded-2xl shadow-lg border border-slate-700">
                        <div className="grid grid-cols-1 gap-6">
                             <div>
                                <h2 className="text-2xl font-bold text-cyan-400">Candidate Details</h2>
                                <div className="mt-4 space-y-4 p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                                    <div>
                                        <label htmlFor="candidateName" className="block text-sm font-medium text-slate-300 mb-2">Your Name *</label>
                                        <input
                                            type="text"
                                            id="candidateName"
                                            value={candidateName}
                                            onChange={(e) => setCandidateName(e.target.value)}
                                            placeholder="e.g., John Doe"
                                            className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
                                        />
                                    </div>
                                    <div className="flex items-center">
                                        <input
                                            id="use-custom-cv"
                                            name="use-custom-cv"
                                            type="checkbox"
                                            checked={useCustomCv}
                                            onChange={(e) => {
                                                setUseCustomCv(e.target.checked);
                                                if (e.target.checked) {
                                                    setCandidateName('');
                                                    setCustomCvText('');
                                                    setFileName(null);
                                                } else {
                                                    setCandidateName('Fatimah Albaik');
                                                }
                                            }}
                                            className="h-4 w-4 rounded border-slate-600 bg-slate-700 text-cyan-600 focus:ring-cyan-500"
                                        />
                                        <label htmlFor="use-custom-cv" className="ml-3 block text-sm font-medium text-slate-300">
                                            Use a different CV
                                        </label>
                                    </div>
                                    {useCustomCv && (
                                        <div>
                                            <label htmlFor="cv-upload" className="block text-sm font-medium text-slate-300 mb-2">Upload CV (.pdf or .docx) *</label>
                                            <div className="mt-2 flex items-center space-x-4">
                                                <input
                                                    id="cv-upload"
                                                    type="file"
                                                    accept=".pdf,.docx"
                                                    onChange={handleFileChange}
                                                    disabled={isParsing}
                                                    className="block w-full text-sm text-slate-400
                                                      file:mr-4 file:py-2 file:px-4
                                                      file:rounded-full file:border-0
                                                      file:text-sm file:font-semibold
                                                      file:bg-cyan-50 file:text-cyan-700
                                                      hover:file:bg-cyan-100"
                                                />
                                                {isParsing && <Spinner />}
                                            </div>
                                            {fileName && <p className="mt-2 text-sm text-slate-400">Loaded: {fileName}</p>}
                                             {customCvText && (
                                                 <div>
                                                    <label htmlFor="customCvPreview" className="block text-sm font-medium text-slate-300 mb-2 mt-4">CV Text Preview</label>
                                                    <textarea
                                                        id="customCvPreview"
                                                        rows={8}
                                                        value={customCvText}
                                                        readOnly
                                                        className="w-full bg-slate-800 border border-slate-700 rounded-md py-2 px-3 text-slate-400 placeholder-slate-500 focus:outline-none cursor-default"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div>
                               <h2 className="text-2xl font-bold text-cyan-400">Job Details</h2>
                               <div className="mt-4 space-y-4 p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                                    <div>
                                        <label htmlFor="companyName" className="block text-sm font-medium text-slate-300 mb-2">Company Name *</label>
                                        <input
                                            type="text"
                                            id="companyName"
                                            value={companyName}
                                            onChange={(e) => setCompanyName(e.target.value)}
                                            placeholder="e.g., Google"
                                            className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
                                        />
                                    </div>
                                     <div>
                                        <label htmlFor="companyAddress" className="block text-sm font-medium text-slate-300 mb-2">Company Address (Optional)</label>
                                        <input
                                            type="text"
                                            id="companyAddress"
                                            value={companyAddress}
                                            onChange={(e) => setCompanyAddress(e.target.value)}
                                            placeholder="e.g., 1600 Amphitheatre Parkway, Mountain View, CA"
                                            className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="hiringManager" className="block text-sm font-medium text-slate-300 mb-2">Hiring Manager (Optional)</label>
                                        <input
                                            type="text"
                                            id="hiringManager"
                                            value={hiringManager}
                                            onChange={(e) => setHiringManager(e.target.value)}
                                            placeholder="e.g., Jane Doe"
                                            className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="jobDescription" className="block text-sm font-medium text-slate-300 mb-2">Job Description *</label>
                                        <textarea
                                            id="jobDescription"
                                            rows={10}
                                            value={jobDescription}
                                            onChange={(e) => setJobDescription(e.target.value)}
                                            placeholder="Paste the job description here..."
                                            className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
                                        />
                                    </div>
                               </div>
                            </div>
                        </div>
                        <button
                            onClick={handleGenerate}
                            disabled={isLoading || isParsing}
                            className="w-full mt-8 py-3 px-6 flex items-center justify-center font-semibold text-white bg-cyan-600 rounded-lg shadow-md hover:bg-cyan-500 disabled:bg-slate-600 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
                        >
                            {isLoading ? (
                                <>
                                    <Spinner />
                                    <span className="ml-3">Generating...</span>
                                </>
                            ) : (
                                <>
                                    <SparklesIcon className="h-5 w-5 mr-2" />
                                    Generate Cover Letter
                                </>
                            )}
                        </button>
                        {error && <p className="mt-4 text-center text-red-400">{error}</p>}
                    </div>

                    {/* Output Section */}
                    <div className="bg-slate-800/50 p-6 rounded-2xl shadow-lg border border-slate-700 min-h-[400px] flex flex-col">
                         <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-cyan-400">Generated Letter</h2>
                            {coverLetter && !isLoading && (
                                <div className="flex items-center space-x-2">
                                     <button
                                        onClick={handleGenerate}
                                        className="flex items-center px-4 py-2 text-sm font-medium bg-slate-700 hover:bg-slate-600 rounded-lg transition"
                                    >
                                        <RefreshCwIcon className="h-5 w-5 mr-2" />
                                        Another Version
                                    </button>
                                     <div className="relative" ref={downloadMenuRef}>
                                        <button
                                            onClick={() => setIsDownloadMenuOpen(!isDownloadMenuOpen)}
                                            className="flex items-center px-4 py-2 text-sm font-medium bg-slate-700 hover:bg-slate-600 rounded-lg transition"
                                        >
                                            <DownloadIcon className="h-5 w-5 mr-2" />
                                            Download
                                        </button>
                                        {isDownloadMenuOpen && (
                                            <div className="absolute right-0 mt-2 w-40 bg-slate-800 border border-slate-700 rounded-md shadow-lg z-10">
                                                <button onClick={handleDownloadPdf} className="block w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700">as PDF</button>
                                                <button onClick={handleDownloadDocx} className="block w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700">as Word (.docx)</button>
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={handleCopy}
                                        className="flex items-center px-4 py-2 text-sm font-medium bg-slate-700 hover:bg-slate-600 rounded-lg transition"
                                    >
                                        {copied ? <CheckIcon className="h-5 w-5 mr-2 text-green-400" /> : <CopyIcon className="h-5 w-5 mr-2" />}
                                        {copied ? 'Copied!' : 'Copy'}
                                    </button>
                                </div>
                            )}
                        </div>
                        <div className="flex-grow">
                             {isLoading ? (
                                <div className="flex items-center justify-center h-full">
                                    <div className="text-center">
                                        <div className="flex justify-center items-center h-full">
                                            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-400"></div>
                                        </div>
                                        <p className="mt-4 text-slate-400">AI is writing, please wait...</p>
                                    </div>
                                </div>
                            ) : coverLetter ? (
                                <textarea
                                    value={coverLetter}
                                    onChange={(e) => setCoverLetter(e.target.value)}
                                    className="w-full h-full bg-slate-900/50 border border-slate-700 rounded-md p-4 text-slate-300 leading-relaxed resize-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 font-serif"
                                    spellCheck="false"
                                />
                            ) : (
                                <div className="flex items-center justify-center h-full text-center text-slate-500">
                                    <p>Your generated cover letter will appear here.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}