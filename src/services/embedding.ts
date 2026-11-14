import { config } from "../config.ts";

export interface EmbeddingResult {
  embedding: number[];
  dimension: number;
  isFallback: boolean;
}

export class EmbeddingService {
  private static apiKey = config.geminiApiKey;
  private static model = "gemini-embedding-001";
  private static targetDim = 768;

  /**
   * Generates a 768-dimensional vector embedding with metadata indicating whether
   * a real semantic vector or an offline fallback was produced.
   */
  static async embedWithMeta(text: string): Promise<EmbeddingResult> {
    const trimmed = text.trim();
    if (!trimmed) {
      return {
        embedding: new Array(this.targetDim).fill(0),
        dimension: this.targetDim,
        isFallback: true,
      };
    }

    if (!this.apiKey) {
      console.warn("Warning: GEMINI_API_KEY not set. Generating deterministic pseudo-vector.");
      return {
        embedding: this.generatePseudoEmbedding(trimmed, this.targetDim),
        dimension: this.targetDim,
        isFallback: true,
      };
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
        return {
          embedding: this.generatePseudoEmbedding(trimmed, this.targetDim),
          dimension: this.targetDim,
          isFallback: true,
        };
      }

      const data = await response.json();
      const values = data.embedding?.values;
      if (Array.isArray(values) && values.length > 0) {
        return {
          embedding: values,
          dimension: values.length,
          isFallback: false,
        };
      }
      return {
        embedding: this.generatePseudoEmbedding(trimmed, this.targetDim),
        dimension: this.targetDim,
        isFallback: true,
      };
    } catch (err) {
      console.error("Embedding generation exception:", err);
      return {
        embedding: this.generatePseudoEmbedding(trimmed, this.targetDim),
        dimension: this.targetDim,
        isFallback: true,
      };
    }
  }

  /**
   * Backward-compatible embedding helper returning the 768-dim vector.
   */
  static async embed(text: string): Promise<number[]> {
    const res = await this.embedWithMeta(text);
    return res.embedding;
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
    const norm = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0)) || 1;
    return vec.map((v) => v / norm);
  }
}
