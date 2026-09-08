import Groq from 'groq-sdk';

export interface AICompletionOptions {
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
}

export interface AIProvider {
  name: string;
  isAvailable(): boolean;
  generateCompletion(
    prompt: string,
    systemPrompt?: string,
    options?: AICompletionOptions
  ): Promise<string>;
}

export class GroqProvider implements AIProvider {
  public readonly name = 'Groq';
  private groqClient: Groq | null = null;
  private readonly defaultModel: string;

  constructor() {
    this.defaultModel = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
    const apiKey = process.env.GROQ_API_KEY?.trim();
    if (apiKey) {
      try {
        this.groqClient = new Groq({ apiKey });
      } catch (err) {
        console.error('[GroqProvider] Failed to initialize Groq client:', err);
      }
    }
  }

  public isAvailable(): boolean {
    return Boolean(process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim().length > 0);
  }

  public getModelName(): string {
    return this.defaultModel;
  }

  public async generateCompletion(
    prompt: string,
    systemPrompt?: string,
    options: AICompletionOptions = {}
  ): Promise<string> {
    const apiKey = process.env.GROQ_API_KEY?.trim();
    if (!apiKey) {
      throw new Error(
        'GROQ_API_KEY is not configured in environment variables. Please set GROQ_API_KEY to enable live Groq LLM generations.'
      );
    }

    // Lazy re-instantiate if key was provided at runtime
    if (!this.groqClient) {
      this.groqClient = new Groq({ apiKey });
    }

    const messages: Array<{ role: 'system' | 'user'; content: string }> = [];
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });

    const model = process.env.GROQ_MODEL || this.defaultModel;

    try {
      console.log(`[GroqProvider] Invoking Groq API with model: ${model}...`);
      const response = await this.groqClient.chat.completions.create({
        model,
        messages,
        temperature: options.temperature ?? 0.2, // low temperature for grounded generation
        max_tokens: options.maxTokens ?? 3500,
        response_format: options.jsonMode ? { type: 'json_object' } : undefined,
      });

      const output = response.choices[0]?.message?.content || '';
      if (!output) {
        throw new Error('Groq returned an empty response.');
      }
      return output;
    } catch (err: any) {
      const errorMsg = err?.message || String(err);
      console.error('[GroqProvider] Groq API execution error:', errorMsg);

      if (err?.status === 401 || errorMsg.includes('Invalid API Key') || errorMsg.includes('Unauthorized')) {
        throw new Error('Invalid or unauthorized GROQ_API_KEY. Please check your Groq credentials.');
      }
      if (err?.status === 429 || errorMsg.includes('rate limit') || errorMsg.includes('Rate limit')) {
        throw new Error('Groq API rate limit reached. Please try again in a few moments.');
      }
      if (errorMsg.includes('timeout') || errorMsg.includes('ETIMEDOUT')) {
        throw new Error('Groq API request timed out. Please try again.');
      }

      throw new Error(`Groq LLM Generation error: ${errorMsg}`);
    }
  }
}

// Singleton export
export const groqProvider = new GroqProvider();
