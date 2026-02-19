import { GoogleGenerativeAI } from '@google/generative-ai';
import { LLMExplanation, DetectedVariant, Phenotype } from '../types';
import logger from '../utils/logger';

export class LLMService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ 
      model: process.env.GEMINI_MODEL || 'gemini-1.5-flash' 
    });
  }

  /**
   * Generate clinical explanation using Gemini LLM
   */
  async generateExplanation(
    drug: string,
    gene: string,
    diplotype: string,
    phenotype: Phenotype,
    variants: DetectedVariant[],
    recommendation: string
  ): Promise<LLMExplanation> {
    logger.info(`Generating LLM explanation for ${drug}-${gene}`);

    const prompt = this.buildPrompt(drug, gene, diplotype, phenotype, variants, recommendation);

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const content = response.text();

      if (!content) {
        throw new Error('No response from LLM');
      }

      return this.parseResponse(content);
    } catch (error) {
      logger.error('LLM generation failed:', error);
      return this.getFallbackExplanation(drug, gene, phenotype);
    }
  }

  /**
   * Build prompt for LLM
   */
  private buildPrompt(
    drug: string,
    gene: string,
    diplotype: string,
    phenotype: Phenotype,
    variants: DetectedVariant[],
    recommendation: string
  ): string {
    const variantList = variants.map(v => 
      `${v.rsid} (${v.star_allele || 'unknown'})`
    ).join(', ');

    return `You are a clinical pharmacogenomics expert. Generate a clinical pharmacogenomics explanation for the following case:

**Drug:** ${drug}
**Gene:** ${gene}
**Diplotype:** ${diplotype}
**Phenotype:** ${phenotype}
**Detected Variants:** ${variantList || 'None'}
**Clinical Recommendation:** ${recommendation}

Please provide a structured explanation with the following sections:

1. **Summary** (2-3 sentences): Brief overview of the pharmacogenomic finding and its clinical significance.

2. **Biological Mechanism** (3-4 sentences): Explain how ${gene} affects ${drug} metabolism/transport. 
   Describe the enzymatic pathway and the role of the detected variants.

3. **Variant Interpretation** (2-3 sentences): Explain the specific variants detected (${variantList}), 
   their functional impact, and how they contribute to the ${phenotype} phenotype.

4. **Clinical Impact** (2-3 sentences): Describe the practical implications for patient care, 
   expected drug response, and why the recommendation is appropriate.

Use clear medical terminology but ensure explanations are understandable. Cite specific variants by rsID.
Format your response with clear section headers using **bold** markdown.`;
  }

  /**
   * Parse LLM response into structured format
   */
  private parseResponse(content: string): LLMExplanation {
    // Extract sections using regex or simple parsing
    const sections = {
      summary: '',
      biological_mechanism: '',
      variant_interpretation: '',
      clinical_impact: ''
    };

    // Try to extract sections
    const summaryMatch = content.match(/\*\*Summary\*\*[:\s]*([\s\S]*?)(?=\*\*|$)/i);
    const mechanismMatch = content.match(/\*\*Biological Mechanism\*\*[:\s]*([\s\S]*?)(?=\*\*|$)/i);
    const variantMatch = content.match(/\*\*Variant Interpretation\*\*[:\s]*([\s\S]*?)(?=\*\*|$)/i);
    const impactMatch = content.match(/\*\*Clinical Impact\*\*[:\s]*([\s\S]*?)(?=\*\*|$)/i);

    sections.summary = summaryMatch ? summaryMatch[1].trim() : '';
    sections.biological_mechanism = mechanismMatch ? mechanismMatch[1].trim() : '';
    sections.variant_interpretation = variantMatch ? variantMatch[1].trim() : '';
    sections.clinical_impact = impactMatch ? impactMatch[1].trim() : '';

    // If parsing failed, try to split by numbered sections
    if (!sections.summary) {
      const parts = content.split(/\d+\.\s+\*\*/).filter(p => p.trim());
      if (parts.length >= 4) {
        sections.summary = parts[0].replace(/\*\*/g, '').trim();
        sections.biological_mechanism = parts[1].replace(/\*\*/g, '').trim();
        sections.variant_interpretation = parts[2].replace(/\*\*/g, '').trim();
        sections.clinical_impact = parts[3].replace(/\*\*/g, '').trim();
      } else {
        // Fallback: use entire content as summary
        sections.summary = content.trim();
      }
    }

    return sections;
  }

  /**
   * Fallback explanation when LLM fails
   */
  private getFallbackExplanation(drug: string, gene: string, phenotype: Phenotype): LLMExplanation {
    const phenotypeDescriptions: Record<Phenotype, string> = {
      'PM': 'poor metabolizer with significantly reduced or absent enzyme activity',
      'IM': 'intermediate metabolizer with reduced enzyme activity',
      'NM': 'normal metabolizer with typical enzyme activity',
      'RM': 'rapid metabolizer with increased enzyme activity',
      'URM': 'ultra-rapid metabolizer with significantly increased enzyme activity',
      'Unknown': 'metabolizer with uncertain enzyme activity'
    };

    return {
      summary: `The patient is a ${phenotypeDescriptions[phenotype]} for ${gene}, which affects ${drug} metabolism. 
        Genetic variants in ${gene} alter enzyme function, requiring dosage adjustments or alternative therapy.`,
      
      biological_mechanism: `${gene} encodes an enzyme critical for ${drug} metabolism. Genetic variants can reduce, 
        eliminate, or increase enzyme activity, directly impacting drug efficacy and safety. The ${phenotype} phenotype 
        indicates altered metabolic capacity compared to normal metabolizers.`,
      
      variant_interpretation: `The detected genetic variants contribute to the ${phenotype} phenotype. These variants 
        affect enzyme expression, stability, or catalytic activity, resulting in altered ${drug} metabolism.`,
      
      clinical_impact: `The ${phenotype} phenotype has significant clinical implications for ${drug} therapy. 
        Dosage adjustments or alternative medications may be necessary to achieve optimal therapeutic outcomes 
        while minimizing adverse effects.`
    };
  }

  /**
   * Generate batch explanations for multiple drugs
   */
  async generateBatchExplanations(
    analyses: Array<{
      drug: string;
      gene: string;
      diplotype: string;
      phenotype: Phenotype;
      variants: DetectedVariant[];
      recommendation: string;
    }>
  ): Promise<LLMExplanation[]> {
    const promises = analyses.map(analysis =>
      this.generateExplanation(
        analysis.drug,
        analysis.gene,
        analysis.diplotype,
        analysis.phenotype,
        analysis.variants,
        analysis.recommendation
      )
    );

    return Promise.all(promises);
  }
}
