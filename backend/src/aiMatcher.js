import { GoogleGenerativeAI } from "@google/generative-ai";
import axios from 'axios';
import { Profile } from './models/Profile.js';

// Load Gemini API Key from environment
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const SUBGRAPH_URL = process.env.SUBGRAPH_URL || 'https://api.thegraph.com/subgraphs/name/username/polylance';

/**
 * AI Job Matcher Service v2
 * Performs deep semantic matching, risk assessment, and skill gap analysis.
 */
export async function calculateMatchScore(jobDescription, freelancerProfile) {
    try {
        if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY missing");

        // Upgrading to 2026-spec Gemini 2.0 for higher reasoning density
        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash-exp",
            generationConfig: {
                temperature: 0.1, // Precision over creativity
                topP: 0.95,
                maxOutputTokens: 1024,
            }
        });

        const prompt = `
            # POLY-AGENCY AGENT v2.1
            Analyze synergy between Job and Freelancer. 
            Skepticism level: HIGH.

            JOB: "${jobDescription}"
            FREELANCER: "${freelancerProfile.skills}"
            REP: ${freelancerProfile.reputationScore}/1000
            JOBS/DISP: ${freelancerProfile.completedJobs}/${freelancerProfile.disputedJobs || 0}

            OUTPUT ONLY JSON:
            {"score":0.0-1.0,"reason":"Summary","strengths":[],"gaps":[],"riskLevel":"L/M/H","proTip":"Advice","agentNotes":"Log"}
        `;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        const jsonMatch = responseText.match(/\{.*\}/s);

        if (jsonMatch) {
            const data = JSON.parse(jsonMatch[0]);
            return {
                score: Math.min(Math.max(parseFloat(data.score) || 0.5, 0), 1.0),
                reason: data.reason || "Standard match.",
                strengths: data.strengths || [],
                gaps: data.gaps || [],
                riskLevel: data.riskLevel || "Low",
                proTip: data.proTip || "N/A"
            };
        }
        throw new Error("Invalid AI response");
    } catch (error) {
        console.warn("AI Matching failed:", error.message);
        return {
            score: fallbackMatch(jobDescription, freelancerProfile),
            reason: "Legacy keyword match.",
            strengths: [],
            gaps: [],
            riskLevel: "Unknown",
            proTip: "Update your profile for AI insights."
        };
    }
}

/**
 * Natural Language Search Intent Detection
 * Converts "I want to build a dapp" into specific filters.
 */
export async function determineSearchIntent(userInput) {
    if (!process.env.GEMINI_API_KEY) return { query: userInput, category: 'All' };

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `
            Convert this user search query into structured search filters.
            Query: "${userInput}"
            
            Categories: [Development, Design, Marketing, Writing]
            
            Respond in JSON:
            {
                "refinedQuery": "Optimized search keywords",
                "category": "The best matching category",
                "minBudget": estimated min budget if mentioned or 0
            }
            OUTPUT ONLY JSON.
        `;

        const result = await model.generateContent(prompt);
        const jsonMatch = result.response.text().match(/\{.*\}/s);
        return jsonMatch ? JSON.parse(jsonMatch[0]) : { query: userInput, category: 'All' };
    } catch (e) {
        return { query: userInput, category: 'All' };
    }
}

/**
 * Recommends jobs to a specific freelancer.
 */
export async function calculateJobRecommendations(freelancerProfile, jobsList) {
    if (!process.env.GEMINI_API_KEY) return jobsList.slice(0, 3).map(j => j.jobId);

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const jobsSummary = jobsList.map(j => `ID: ${j.jobId}, Title: ${j.title}, Desc: ${j.description.substring(0, 100)}`).join('\n');

        const prompt = `
            Recommend the top 3 jobs for this freelancer.
            Profile: ${freelancerProfile.skills}, Reputation ${freelancerProfile.reputationScore}
            
            Jobs:
            ${jobsSummary}

            Return JSON array of IDs: [id1, id2, id3]
        `;

        const result = await model.generateContent(prompt);
        const arrayMatch = (await result.response).text().match(/\[.*\]/);
        return arrayMatch ? JSON.parse(arrayMatch[0]) : [];
    } catch (e) {
        return [];
    }
}

/**
 * Keyword fallback for matching when AI is unavailable.
 */
function fallbackMatch(jobDescription, freelancerProfile) {
    const jobKeywords = (jobDescription || "").toLowerCase().split(/\W+/);
    const skills = (freelancerProfile.skills || "").toLowerCase().split(/\W+/);

    let matches = 0;
    skills.forEach(skill => {
        if (skill.length > 2 && jobKeywords.includes(skill)) {
            matches++;
        }
    });

    const finalScore = (matches / Math.max(jobKeywords.length * 0.2, 1));
    return Math.min(finalScore, 1.0);
}

/**
 * AI Profile Polish
 * Enhances a user's bio based on their skills and category.
 */
export async function polishProfileBio(name, category, skills, roughBio) {
    if (!process.env.GEMINI_API_KEY) {
        console.warn("[AI] Key missing, using fallback polish.");
        // Fallback simulation for demo/dev without API key
        return `[Auto-Enhanced] A highly skilled ${category} specialist with expertise in ${skills}. ${roughBio} Committed to delivering high-quality decentralized solutions on the Polygon network.`;
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `
            You are a professional brand consultant for high-end Web3 freelancers.
            Enhance this user's bio to be elite, persuasive, and professional.
            
            NAME: ${name}
            CATEGORY: ${category}
            SKILLS: ${skills}
            CURRENT BIO: "${roughBio}"

            TASK:
            1. Rewrite the bio to highlight their strengths.
            2. Keep it under 3 sentences.
            3. Use a tone appropriate for a premium blockchain marketplace.
            4. Do not lie, only amplify what is there.
            
            RETURN ONLY THE REWRITTEN BIO TEXT.
        `;

        const result = await model.generateContent(prompt);
        return (await result.response).text().trim();
    } catch (e) {
        console.error("AI Polish Error:", e);
        return roughBio;
    }
}

/**
 * analyzeDispute
 * Elite AI Arbitration analysis for ongoing disputes.
 */
export async function analyzeDispute(jobData, chatHistory, workMetadata) {
    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash-exp",
            generationConfig: { temperature: 0.05 }
        });

        const prompt = `
            # LEGAL AGENT: POLY-ESCROW ARBITRATION
            Evaluate a dispute between Client and Freelancer.

            JOB DESC: "${jobData.description}"
            WORK SUBMITTED: "${JSON.stringify(workMetadata)}"
            CHAT LOGS: "${JSON.stringify(chatHistory)}"

            # OBJECTIVE:
            1. Identify the 'Defaulting' party.
            2. Propose a fair % split (0-100 to Freelancer).
            3. Provide a 'Protocol Precedent' logic.

            # OUTPUT JSON:
            {"winnerAddress": "string", "suggestedSplit": 0-100, "verdict": "string", "reasoning": "string"}
        `;

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const cleaned = text.match(/\{.*\}/s);
        return cleaned ? JSON.parse(cleaned[0]) : { suggestedSplit: 50 };
    } catch (error) {
        console.error("AI Arbitration Error:", error);
        return { suggestedSplit: 50, verdict: "Manual review required" };
    }
}
