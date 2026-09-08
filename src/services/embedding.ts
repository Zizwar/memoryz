import { config } from "../config.ts";

export interface EmbeddingResult {
  embedding: number[];
  dimension: number;
}

export class EmbeddingService {
  private static apiKey = config.geminiApiKey;
  private static model = "gemini-embedding-001";
  private static targetDim = 768;

  /**
   * Generates a 768-dimensional vector embedding for the input text using Google Gemini API.
   */
  static async embed(text: string): Promise<number[]> {
    const trimmed = text.trim();
    if (!trimmed) {
      return new Array(this.targetDim).fill(0);
    }

    if (!this.apiKey) {
      console.warn("Warning: GEMINI_API_KEY not set. Generating deterministic pseudo-vector.");
      return this.generatePseudoEmbedding(trimmed, this.targetDim);
    }

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:embedContent?key=${this.apiKey}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: { parts: [{ text: trimmed }] },
          outputDimensionality: this.targetDim,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error(`Gemini Embedding error (${response.status}):`, errText);
        return this.generatePseudoEmbedding(trimmed, this.targetDim);
      }

      const data = await response.json();
      const values = data.embedding?.values;
      if (Array.isArray(values) && values.length > 0) {
        return values;
      }
      return this.generatePseudoEmbedding(trimmed, this.targetDim);
    } catch (err) {
      console.error("Embedding generation exception:", err);
      return this.generatePseudoEmbedding(trimmed, this.targetDim);
    }
  }

  /**
   * Compute Cosine Similarity between two numeric vectors
   */
  static cosineSimilarity(a: number[], b: number[]): number {
    if (!a.length || !b.length || a.length !== b.length) return 0;
    let dot = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Fallback pseudo-embedding generator to ensure graceful degradation if offline
   */
  private static generatePseudoEmbedding(text: string, dim: number): number[] {
    const vec = new Array(dim).fill(0);
    for (let i = 0; i < text.length; i++) {
      const code = text.charCodeAt(i);
      const idx = (code * 31 + i * 17) % dim;
      vec[idx] += (code % 10) / 10;
    }
    // Normalize vector
    const norm = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0)) || 1;
    return vec.map((v) => v / norm);
  }
}
