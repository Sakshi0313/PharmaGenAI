import { AnalysisResult, AnalysisRequest, VCFVariant } from '../types';
import { VCFParser } from '../parsers/vcfParser';
import { GenotypeAnalyzer } from './genotypeAnalyzer';
import { LLMService } from './llmService';
import { StorageService } from './storageService';
import { getGenesForDrug, getRiskAssessment, getCPICReference, getAlternativeDrugs } from '../data/drugGeneRules';
import logger from '../utils/logger';

export class AnalysisService {
  private llmService: LLMService;
  private storageService: StorageService;

  constructor() {
    this.llmService = new LLMService();
    this.storageService = new StorageService();
  }

  /**
   * Analyze VCF file for pharmacogenomic risks
   */
  async analyzeVCF(request: AnalysisRequest): Promise<AnalysisResult[]> {
    logger.info('Starting VCF analysis');

    // Read VCF file
    const vcfContent = request.vcfFile.buffer.toString('utf-8');

    // Validate VCF
    const validation = VCFParser.validateVCF(vcfContent);
    if (!validation.valid) {
      throw new Error(validation.error || 'Invalid VCF file');
    }

    // Parse VCF
    const allVariants = VCFParser.parseVCF(vcfContent);
    const pgxVariants = VCFParser.filterPharmacogenomicVariants(allVariants);
    
    logger.info(`Found ${pgxVariants.length} pharmacogenomic variants out of ${allVariants.length} total variants`);

    // Extract patient ID
    const patientId = request.patientId || VCFParser.extractPatientId(vcfContent);

    // Analyze each drug
    const results: AnalysisResult[] = [];

    for (const drug of request.drugs) {
      try {
        const result = await this.analyzeDrug(
          drug,
          patientId,
          pgxVariants,
          allVariants
        );
        results.push(result);
        
        // Save to Firebase
        await this.storageService.saveAnalysisResult(result);
      } catch (error) {
        logger.error(`Failed to analyze drug ${drug}:`, error);
        // Continue with other drugs
      }
    }

    return results;
  }

  /**
   * Analyze a single drug
   */
  private async analyzeDrug(
    drug: string,
    patientId: string,
    pgxVariants: VCFVariant[],
    _allVariants: VCFVariant[]
  ): Promise<AnalysisResult> {
    logger.info(`Analyzing drug: ${drug}`);

    // Get relevant genes for this drug
    const genes = getGenesForDrug(drug);
    
    if (genes.length === 0) {
      throw new Error(`No pharmacogenomic data available for drug: ${drug}`);
    }

    // Use primary gene (first in list)
    const primaryGene = genes[0];

    // Analyze genotype
    const geneData = GenotypeAnalyzer.analyzeGene(primaryGene, pgxVariants);

    // Get risk assessment
    const riskData = getRiskAssessment(drug, primaryGene, geneData.phenotype);
    
    if (!riskData) {
      throw new Error(`No risk assessment available for ${drug}-${primaryGene}`);
    }

    // Calculate confidence
    const confidence = GenotypeAnalyzer.calculateConfidence(
      geneData.variants,
      pgxVariants
    );

    // Get clinical recommendation
    const cpicReference = getCPICReference(drug, primaryGene);
    const alternativeDrugs = getAlternativeDrugs(drug);

    // Generate LLM explanation
    const llmExplanation = await this.llmService.generateExplanation(
      drug,
      primaryGene,
      geneData.diplotype,
      geneData.phenotype,
      geneData.variants,
      riskData.recommendation
    );

    // Calculate quality metrics
    const annotationCompleteness = GenotypeAnalyzer.calculateAnnotationCompleteness(
      geneData.variants,
      pgxVariants.length
    );

    // Build result
    const result: AnalysisResult = {
      patient_id: patientId,
      drug: drug.toUpperCase(),
      timestamp: new Date().toISOString(),
      risk_assessment: {
        risk_label: riskData.risk,
        confidence_score: confidence,
        severity: riskData.severity
      },
      pharmacogenomic_profile: {
        primary_gene: primaryGene,
        diplotype: geneData.diplotype,
        phenotype: geneData.phenotype,
        detected_variants: geneData.variants
      },
      clinical_recommendation: {
        cpic_guideline_reference: cpicReference,
        recommended_action: riskData.recommendation,
        alternative_drugs: alternativeDrugs
      },
      llm_generated_explanation: llmExplanation,
      quality_metrics: {
        vcf_parsing_success: true,
        annotation_completeness: annotationCompleteness,
        variants_detected: geneData.variants.length,
        genes_analyzed: genes.length
      }
    };

    logger.info(`Analysis complete for ${drug}: Risk=${riskData.risk}, Phenotype=${geneData.phenotype}`);

    return result;
  }

  /**
   * Analyze multiple drugs in batch
   */
  async analyzeBatch(request: AnalysisRequest): Promise<AnalysisResult[]> {
    return this.analyzeVCF(request);
  }

  /**
   * Get patient history
   */
  async getPatientHistory(patientId: string): Promise<AnalysisResult[]> {
    return this.storageService.getPatientAnalyses(patientId);
  }

  /**
   * Get recent analyses
   */
  async getRecentAnalyses(limit: number = 20): Promise<AnalysisResult[]> {
    return this.storageService.getRecentAnalyses(limit);
  }

  /**
   * Get analysis by ID
   */
  async getAnalysisById(analysisId: string): Promise<AnalysisResult | null> {
    return this.storageService.getAnalysisById(analysisId);
  }

  /**
   * Get supported drugs
   */
  getSupportedDrugs(): string[] {
    return [
      'CODEINE',
      'CLOPIDOGREL',
      'WARFARIN',
      'SIMVASTATIN',
      'AZATHIOPRINE',
      'FLUOROURACIL'
    ];
  }

  /**
   * Validate drug names
   */
  validateDrugs(drugs: string[]): { valid: boolean; invalidDrugs: string[] } {
    const supported = this.getSupportedDrugs();
    const invalidDrugs = drugs.filter(
      drug => !supported.includes(drug.toUpperCase())
    );

    return {
      valid: invalidDrugs.length === 0,
      invalidDrugs
    };
  }
}
