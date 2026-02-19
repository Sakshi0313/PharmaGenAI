import { VCFVariant } from '../types';
import logger from '../utils/logger';

export class VCFParser {
  /**
   * Parse VCF file content and extract variants
   */
  static parseVCF(content: string): VCFVariant[] {
    const lines = content.split('\n');
    const variants: VCFVariant[] = [];
    
    logger.info('Starting VCF parsing');

    for (const line of lines) {
      // Skip header lines and empty lines
      if (line.startsWith('#') || line.trim() === '') {
        continue;
      }

      try {
        const variant = this.parseLine(line);
        if (variant) {
          variants.push(variant);
        }
      } catch (error) {
        logger.warn(`Failed to parse VCF line: ${line.substring(0, 50)}...`, error);
      }
    }

    logger.info(`Parsed ${variants.length} variants from VCF`);
    return variants;
  }

  /**
   * Parse a single VCF line
   */
  private static parseLine(line: string): VCFVariant | null {
    const fields = line.split('\t');
    
    if (fields.length < 8) {
      return null;
    }

    const [chrom, pos, id, ref, alt, qual, filter, info] = fields;

    // Parse INFO field
    const infoObj = this.parseInfo(info);

    // Parse genotype if present
    let genotype: string | undefined;
    if (fields.length >= 10 && fields[8] && fields[9]) {
      genotype = this.parseGenotype(fields[8], fields[9]);
    }

    return {
      chromosome: chrom,
      position: parseInt(pos, 10),
      rsid: id === '.' ? '' : id,
      ref,
      alt,
      quality: qual === '.' ? 0 : parseFloat(qual),
      filter,
      info: infoObj,
      genotype,
    };
  }

  /**
   * Parse INFO field into key-value pairs
   */
  private static parseInfo(info: string): Record<string, string> {
    const infoObj: Record<string, string> = {};
    
    const pairs = info.split(';');
    for (const pair of pairs) {
      const [key, value] = pair.split('=');
      if (key) {
        infoObj[key] = value || 'true';
      }
    }

    return infoObj;
  }

  /**
   * Parse genotype from FORMAT and sample columns
   */
  private static parseGenotype(format: string, sample: string): string {
    const formatFields = format.split(':');
    const sampleFields = sample.split(':');
    
    const gtIndex = formatFields.indexOf('GT');
    if (gtIndex !== -1 && sampleFields[gtIndex]) {
      return sampleFields[gtIndex];
    }

    return './.';
  }

  /**
   * Filter variants by pharmacogenomic genes
   */
  static filterPharmacogenomicVariants(variants: VCFVariant[]): VCFVariant[] {
    const pgxGenes = ['CYP2D6', 'CYP2C19', 'CYP2C9', 'SLCO1B1', 'TPMT', 'DPYD'];
    
    return variants.filter(variant => {
      const gene = variant.info.GENE || variant.info.GENEINFO;
      if (!gene) return false;
      
      return pgxGenes.some(pgxGene => 
        gene.toUpperCase().includes(pgxGene)
      );
    });
  }

  /**
   * Extract patient ID from VCF header
   */
  static extractPatientId(content: string): string {
    const lines = content.split('\n');
    
    for (const line of lines) {
      if (line.startsWith('##SAMPLE=')) {
        const match = line.match(/ID=([^,\s>]+)/);
        if (match) return match[1];
      }
      if (line.startsWith('#CHROM')) {
        const fields = line.split('\t');
        if (fields.length >= 10) {
          return fields[9]; // Sample column name
        }
      }
    }

    return `PATIENT_${Date.now()}`;
  }

  /**
   * Validate VCF format
   */
  static validateVCF(content: string): { valid: boolean; error?: string } {
    const lines = content.split('\n');
    
    // Check for VCF header
    if (!lines[0]?.startsWith('##fileformat=VCF')) {
      return { valid: false, error: 'Invalid VCF format: Missing fileformat header' };
    }

    // Check for column header
    const hasColumnHeader = lines.some(line => line.startsWith('#CHROM'));
    if (!hasColumnHeader) {
      return { valid: false, error: 'Invalid VCF format: Missing column header' };
    }

    // Check for at least one variant
    const hasVariants = lines.some(line => 
      !line.startsWith('#') && line.trim() !== ''
    );
    if (!hasVariants) {
      return { valid: false, error: 'VCF file contains no variants' };
    }

    return { valid: true };
  }
}
