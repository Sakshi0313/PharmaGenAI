import { VCFVariant, DetectedVariant, GeneVariantData, Phenotype } from '../types';
import { getVariantByRsid } from '../data/pharmacogenomicVariants';
import logger from '../utils/logger';

/**
 * Analyzes genotypes and determines phenotypes
 */
export class GenotypeAnalyzer {
  /**
   * Analyze variants for a specific gene
   */
  static analyzeGene(gene: string, vcfVariants: VCFVariant[]): GeneVariantData {
    logger.info(`Analyzing gene: ${gene}`);

    const detectedVariants: DetectedVariant[] = [];
    const starAlleles: string[] = [];

    // Match VCF variants with known pharmacogenomic variants
    for (const vcfVariant of vcfVariants) {
      const knownVariant = getVariantByRsid(vcfVariant.rsid);
      
      if (knownVariant && knownVariant.gene === gene) {
        detectedVariants.push({
          rsid: vcfVariant.rsid,
          chromosome: vcfVariant.chromosome,
          position: vcfVariant.position.toString(),
          ref: vcfVariant.ref,
          alt: vcfVariant.alt,
          genotype: vcfVariant.genotype,
          gene: knownVariant.gene,
          star_allele: knownVariant.star_allele
        });

        // Track star alleles
        if (knownVariant.star_allele && !starAlleles.includes(knownVariant.star_allele)) {
          starAlleles.push(knownVariant.star_allele);
        }
      }
    }

    // Determine diplotype and phenotype
    const diplotype = this.determineDiplotype(gene, detectedVariants, starAlleles);
    const phenotype = this.determinePhenotype(gene, diplotype, detectedVariants);

    logger.info(`Gene ${gene}: Diplotype=${diplotype}, Phenotype=${phenotype}`);

    return {
      gene,
      variants: detectedVariants,
      diplotype,
      phenotype,
      star_alleles: starAlleles
    };
  }

  /**
   * Determine diplotype from detected variants
   */
  private static determineDiplotype(
    _gene: string, 
    variants: DetectedVariant[], 
    _starAlleles: string[]
  ): string {
    if (variants.length === 0) {
      return '*1/*1'; // Wild-type
    }

    // Count alleles based on genotype
    const alleleCount: Record<string, number> = {};
    
    for (const variant of variants) {
      const allele = variant.star_allele || '*1';
      const genotype = variant.genotype || '0/0';
      
      // Parse genotype (e.g., "0/1", "1/1", "0|1")
      const [allele1, allele2] = genotype.split(/[/|]/);
      
      if (allele1 === '1' || allele2 === '1') {
        alleleCount[allele] = (alleleCount[allele] || 0) + 1;
      }
    }

    // Build diplotype
    const alleles = Object.keys(alleleCount);
    
    if (alleles.length === 0) {
      return '*1/*1';
    } else if (alleles.length === 1) {
      const allele = alleles[0];
      const count = alleleCount[allele];
      return count >= 2 ? `${allele}/${allele}` : `*1/${allele}`;
    } else {
      // Multiple different alleles detected
      const sortedAlleles = alleles.sort();
      return `${sortedAlleles[0]}/${sortedAlleles[1]}`;
    }
  }

  /**
   * Determine phenotype from diplotype
   */
  private static determinePhenotype(
    gene: string, 
    diplotype: string, 
    variants: DetectedVariant[]
  ): Phenotype {
    const alleles = diplotype.split('/');
    
    // Get functional status of each allele
    const functionalStatuses = alleles.map(allele => 
      this.getAlleleFunctionalStatus(gene, allele, variants)
    );

    // Calculate activity score
    const activityScore = functionalStatuses.reduce((sum, status) => {
      switch (status) {
        case 'normal': return sum + 1;
        case 'decreased': return sum + 0.5;
        case 'increased': return sum + 1.5;
        case 'no_function': return sum + 0;
        default: return sum + 1;
      }
    }, 0);

    // Determine phenotype based on activity score
    if (activityScore === 0) {
      return 'PM'; // Poor Metabolizer
    } else if (activityScore <= 1) {
      return 'IM'; // Intermediate Metabolizer
    } else if (activityScore <= 2) {
      return 'NM'; // Normal Metabolizer
    } else if (activityScore <= 2.5) {
      return 'RM'; // Rapid Metabolizer
    } else {
      return 'URM'; // Ultra-Rapid Metabolizer
    }
  }

  /**
   * Get functional status of an allele
   */
  private static getAlleleFunctionalStatus(
    _gene: string, 
    allele: string, 
    variants: DetectedVariant[]
  ): 'normal' | 'decreased' | 'increased' | 'no_function' {
    if (allele === '*1') {
      return 'normal'; // Wild-type
    }

    // Find variant with this star allele
    const variant = variants.find(v => v.star_allele === allele);
    if (!variant) {
      return 'normal';
    }

    // Get known variant data
    const knownVariant = getVariantByRsid(variant.rsid);
    if (!knownVariant) {
      return 'normal';
    }

    return knownVariant.functional_status;
  }

  /**
   * Calculate confidence score based on variant quality and coverage
   */
  static calculateConfidence(variants: DetectedVariant[], vcfVariants: VCFVariant[]): number {
    if (variants.length === 0) {
      return 0.5; // Low confidence when no variants detected
    }

    let totalQuality = 0;
    let count = 0;

    for (const variant of variants) {
      const vcfVariant = vcfVariants.find(v => v.rsid === variant.rsid);
      if (vcfVariant && vcfVariant.quality > 0) {
        // Normalize quality score (assuming PHRED scale, max ~100)
        const normalizedQuality = Math.min(vcfVariant.quality / 100, 1);
        totalQuality += normalizedQuality;
        count++;
      }
    }

    if (count === 0) {
      return 0.7; // Medium confidence when variants detected but no quality scores
    }

    const avgQuality = totalQuality / count;
    
    // Boost confidence if multiple variants detected
    const variantBonus = Math.min(variants.length * 0.05, 0.2);
    
    return Math.min(avgQuality + variantBonus, 0.99);
  }

  /**
   * Calculate annotation completeness
   */
  static calculateAnnotationCompleteness(
    detectedVariants: DetectedVariant[], 
    totalVariants: number
  ): number {
    if (totalVariants === 0) return 0;
    
    const annotatedCount = detectedVariants.filter(v => 
      v.gene && v.star_allele
    ).length;

    return Math.min(annotatedCount / Math.max(totalVariants, 1), 1);
  }
}
