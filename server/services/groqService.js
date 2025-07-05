const Groq = require('groq-sdk');
const { v4: uuidv4 } = require('uuid');

class GroqService {
  constructor() {
    this.groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });
    
    // Model configuration
    this.PREFERRED_MODEL = 'llama3-70b-8192';
    this.FALLBACK_MODEL = 'llama3-8b-8192';
    
    // Rate limiting configuration
    this.rateLimiter = {
      requests: [],
      maxRequests: 10, // Max requests per minute
      windowMs: 60000, // 1 minute window
      retryDelay: 1000, // Initial retry delay in ms
      maxRetries: 3
    };
    
    // File size limits
    this.FILE_SIZE_LIMITS = {
      maxFileSize: 50000, // 50KB
      maxBatchSize: 500000 // 500KB total for batch
    };
  }

  async analyzeCode(fileData, isHighPriority = false) {
    try {
      const { fileId, filename, language, content, analysisTypes } = fileData;
      
      console.log(`[GroqService] Starting analysis for file: ${filename} (${language})`);
      console.log(`[GroqService] Analysis types requested: ${analysisTypes.join(', ')}`);
      console.log(`[GroqService] High priority: ${isHighPriority}`);

      // Validate file size
      this.validateFileSize(content, filename);
      
      // Apply rate limiting
      await this.applyRateLimit();
      
      const model = isHighPriority ? this.PREFERRED_MODEL : this.FALLBACK_MODEL;
      console.log(`[GroqService] Using model: ${model}`);
      
      const prompt = this.buildAnalysisPrompt(content, language, analysisTypes);
      
      const analysisResult = await this.makeGroqRequest(prompt, model);
      
      const result = {
        fileId: fileId || uuidv4(),
        model: model,
        analysis: {
          qualityScore: analysisResult.qualityScore || 5.0,
          complexityScore: analysisResult.complexityScore || 5.0,
          securityScore: analysisResult.securityScore || 5.0,
          issues: analysisResult.issues || [],
          strengths: analysisResult.strengths || [],
          learningRecommendations: analysisResult.learningRecommendations || []
        }
      };

      console.log(`[GroqService] Analysis completed for file: ${filename}`);
      return result;

    } catch (error) {
      console.error('[GroqService] Error during code analysis:', error);
      throw new Error(`Groq analysis failed: ${error.message}`);
    }
  }

  async makeGroqRequest(prompt, model, retryCount = 0) {
    try {
      const completion = await this.groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "You are an expert code analyst. Analyze the provided code and return a JSON response with the exact structure specified. Be thorough but concise in your analysis."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        model: model,
        temperature: 0.1,
        max_tokens: 2048,
      });

      return this.parseAnalysisResponse(completion.choices[0]?.message?.content);

    } catch (error) {
      console.error(`[GroqService] Groq API error (attempt ${retryCount + 1}):`, error);
      
      // Retry logic with exponential backoff
      if (retryCount < this.rateLimiter.maxRetries) {
        const delay = this.rateLimiter.retryDelay * Math.pow(2, retryCount);
        console.log(`[GroqService] Retrying in ${delay}ms...`);
        
        await this.sleep(delay);
        return this.makeGroqRequest(prompt, model, retryCount + 1);
      }
      
      // If preferred model fails after retries, try fallback
      if (model === this.PREFERRED_MODEL && retryCount >= this.rateLimiter.maxRetries) {
        console.log(`[GroqService] Falling back to ${this.FALLBACK_MODEL}`);
        return this.makeGroqRequest(prompt, this.FALLBACK_MODEL, 0);
      }
      
      throw error;
    }
  }

  async applyRateLimit() {
    const now = Date.now();
    
    // Clean old requests outside the window
    this.rateLimiter.requests = this.rateLimiter.requests.filter(
      timestamp => now - timestamp < this.rateLimiter.windowMs
    );
    
    // Check if we're at the limit
    if (this.rateLimiter.requests.length >= this.rateLimiter.maxRequests) {
      const oldestRequest = Math.min(...this.rateLimiter.requests);
      const waitTime = this.rateLimiter.windowMs - (now - oldestRequest);
      
      if (waitTime > 0) {
        console.log(`[GroqService] Rate limit reached. Waiting ${waitTime}ms...`);
        await this.sleep(waitTime);
      }
    }
    
    // Add current request timestamp
    this.rateLimiter.requests.push(now);
  }

  validateFileSize(content, filename) {
    const fileSize = Buffer.byteLength(content, 'utf8');
    
    if (fileSize > this.FILE_SIZE_LIMITS.maxFileSize) {
      throw new Error(
        `File ${filename} is too large (${fileSize} bytes). Maximum allowed: ${this.FILE_SIZE_LIMITS.maxFileSize} bytes`
      );
    }
    
    console.log(`[GroqService] File size validation passed for ${filename}: ${fileSize} bytes`);
  }

  validateBatchSize(filesData) {
    const totalSize = filesData.reduce((sum, file) => {
      return sum + Buffer.byteLength(file.content, 'utf8');
    }, 0);
    
    if (totalSize > this.FILE_SIZE_LIMITS.maxBatchSize) {
      throw new Error(
        `Batch size too large (${totalSize} bytes). Maximum allowed: ${this.FILE_SIZE_LIMITS.maxBatchSize} bytes`
      );
    }
    
    console.log(`[GroqService] Batch size validation passed: ${totalSize} bytes`);
  }

  buildAnalysisPrompt(code, language, analysisTypes) {
    const analysisInstructions = {
      code_quality: "Evaluate code readability, maintainability, and adherence to best practices",
      complexity: "Assess algorithmic complexity, nesting levels, and code structure complexity",
      security: "Identify potential security vulnerabilities and unsafe practices",
      best_practices: "Check adherence to language-specific best practices and conventions",
      learning_gaps: "Identify areas where the developer could improve their skills"
    };

    const requestedAnalysis = analysisTypes
      .map(type => analysisInstructions[type])
      .filter(Boolean)
      .join(', ');

    return `
Analyze the following ${language} code and provide a comprehensive assessment focusing on: ${requestedAnalysis}.

Code to analyze:
\`\`\`${language}
${code}
\`\`\`

Return your analysis in the following JSON format:
{
  "qualityScore": <number between 1-10>,
  "complexityScore": <number between 1-10>,
  "securityScore": <number between 1-10>,
  "issues": [
    {
      "type": "<analysis_type>",
      "severity": "<low|medium|high>",
      "line": <line_number>,
      "description": "<issue_description>",
      "suggestion": "<improvement_suggestion>"
    }
  ],
  "strengths": [
    "<positive_aspect_1>",
    "<positive_aspect_2>"
  ],
  "learningRecommendations": [
    {
      "topic": "<learning_topic>",
      "priority": "<low|medium|high>",
      "reason": "<why_this_is_important>"
    }
  ]
}

Provide specific, actionable feedback with line numbers where applicable.
    `;
  }

  parseAnalysisResponse(response) {
    try {
      // Extract JSON from response if it's wrapped in markdown or other text
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // Try parsing the entire response as JSON
      return JSON.parse(response);
    } catch (error) {
      console.error('[GroqService] Failed to parse analysis response:', error);
      console.error('[GroqService] Raw response:', response);
      
      // Return a fallback structure
      return {
        qualityScore: 5.0,
        complexityScore: 5.0,
        securityScore: 5.0,
        issues: [{
          type: 'parsing_error',
          severity: 'medium',
          line: 0,
          description: 'Failed to parse AI analysis response',
          suggestion: 'Review the code manually or try the analysis again'
        }],
        strengths: ['Code structure appears functional'],
        learningRecommendations: [{
          topic: 'Code Analysis Tools',
          priority: 'medium',
          reason: 'Consider using additional static analysis tools'
        }]
      };
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Utility method to get current rate limit status
  getRateLimitStatus() {
    const now = Date.now();
    const recentRequests = this.rateLimiter.requests.filter(
      timestamp => now - timestamp < this.rateLimiter.windowMs
    );
    
    return {
      requestsInWindow: recentRequests.length,
      maxRequests: this.rateLimiter.maxRequests,
      windowMs: this.rateLimiter.windowMs,
      remainingRequests: this.rateLimiter.maxRequests - recentRequests.length
    };
  }
}

module.exports = new GroqService();