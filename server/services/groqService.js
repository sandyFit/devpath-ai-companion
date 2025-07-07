const Groq = require('groq-sdk');

class GroqService {
  constructor() {
    this.groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    this.PREFERRED_MODEL = 'llama3-70b-8192';
    this.FALLBACK_MODEL = 'llama3-8b-8192';
    this.rateLimiter = { requests: [], maxRequests: 10, windowMs: 60000, retryDelay: 1000, maxRetries: 3 };
  }

  async analyzeCode(content, language, analysisTypes, highPriority = false) {
    if (!Array.isArray(analysisTypes)) {
      console.error('[GroqService] Invalid analysisTypes:', analysisTypes);
      throw new Error("analysisTypes must be an array");
    }
    
  
    const prompt = this.buildPrompt(content, language, analysisTypes);
    const model = highPriority ? this.PREFERRED_MODEL : this.FALLBACK_MODEL;
    await this.applyRateLimit();
    return await this.makeRequest(prompt, model);
  }
  

  async makeRequest(prompt, model, retry = 0) {
    try {
      const res = await this.groq.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: 'You are an expert code analyst...' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1,
        max_tokens: 2048
      });
      return this.parseResponse(res.choices[0]?.message?.content);
    } catch (err) {
      if (retry < this.rateLimiter.maxRetries) {
        await this.sleep(this.rateLimiter.retryDelay * Math.pow(2, retry));
        return this.makeRequest(prompt, model, retry + 1);
      }
      if (model === this.PREFERRED_MODEL) {
        return this.makeRequest(prompt, this.FALLBACK_MODEL);
      }
      throw err;
    }
  }

  buildPrompt(code, language, types) {
    const tasks = types.map(t => `- ${t}`).join('\n');
  
    return `
  You are an expert software analyst. Analyze the following ${language} code and return **only** a JSON object 
  with this structure:
  
  \`\`\`json
  {
    "qualityScore": number (0-10),
    "complexityScore": number (0-10),
    "securityScore": number (0-10),
    "issues": [
      { "type": "string", "description": "string" }
    ],
    "strengths": [ "string" ],
    "suggestions": [ "string" ],
    "learningRecommendations": [ "string" ]
  }
  \`\`\`
  
  Code to analyze:
  
  \`\`\`${language}
  ${code}
  \`\`\`
  
  Perform these tasks:
  ${tasks}
  
  **Do not include any explanation or commentary. Just return the JSON object.**
    `.trim();
  }
  
  

  parseResponse(text) {
    try {
      const match = text.match(/\{[\s\S]*\}/);
      const raw = match ? match[0] : text;
      const parsed = JSON.parse(raw);
      return parsed;
    } catch (err) {
      console.warn('[GroqService] Failed to parse response:', text);
      return {
        qualityScore: 5,
        complexityScore: 5,
        securityScore: 5,
        issues: [],
        strengths: [],
        suggestions: [],
        learningRecommendations: []
      };
    }
  }
  
  

  async applyRateLimit() {
    const now = Date.now();
    this.rateLimiter.requests = this.rateLimiter.requests.filter(ts => now - ts < this.rateLimiter.windowMs);
    if (this.rateLimiter.requests.length >= this.rateLimiter.maxRequests) {
      const wait = this.rateLimiter.windowMs - (now - this.rateLimiter.requests[0]);
      await this.sleep(wait);
    }
    this.rateLimiter.requests.push(now);
  }

  sleep(ms) { return new Promise(res => setTimeout(res, ms)); }
}

module.exports = new GroqService();
