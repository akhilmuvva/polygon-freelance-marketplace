import { Profile } from './models/Profile.js';

/**
 * AI Job Matcher Service
 * Performs semantic matching between Job Descriptions and Freelancer Skills.
 */

export async function calculateMatchScore(jobDescription, freelancerProfile) {
    // In a real implementation, you would use OpenAI Embeddings or Gemini Pro
    // to compare the jobDescription with the freelancerProfile.skills

    // Mock logic: Keyword matching
    const jobKeywords = (jobDescription || "").toLowerCase().split(' ');
    const skills = (freelancerProfile.skills || "").toLowerCase().split(',');

    let matches = 0;
    skills.forEach(skill => {
        if (jobKeywords.includes(skill.trim())) {
            matches++;
        }
    });

    // Semantic bonus (mocked)
    const semanticScore = Math.random() * 0.5; // Randomness to simulate AI nuance

    const finalScore = (matches / ((jobKeywords.length || 1) * 0.1)) + semanticScore;
    return Math.min(finalScore, 1.0); // Normalize to 0-1
}
