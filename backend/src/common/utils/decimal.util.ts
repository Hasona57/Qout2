import { Decimal } from 'decimal.js';

/**
 * Utility functions for handling decimal calculations (money, quantities)
 * Avoids floating point precision issues
 */

export class DecimalUtil {
  /**
   * Create a Decimal from a number or string
   */
  static from(value: number | string | Decimal): Decimal {
    return new Decimal(value);
  }

  /**
   * Add two decimal values
   */
  static add(a: number | string | Decimal, b: number | string | Decimal): Decimal {
    return DecimalUtil.from(a).plus(b);
  }

  /**
   * Subtract two decimal values
   */
  static subtract(a: number | string | Decimal, b: number | string | Decimal): Decimal {
    return DecimalUtil.from(a).minus(b);
  }

  /**
   * Multiply two decimal values
   */
  static multiply(a: number | string | Decimal, b: number | string | Decimal): Decimal {
    return DecimalUtil.from(a).times(b);
  }

  /**
   * Divide two decimal values
   */
  static divide(a: number | string | Decimal, b: number | string | Decimal): Decimal {
    return DecimalUtil.from(a).div(b);
  }

  /**
   * Calculate percentage
   */
  static percentage(value: number | string | Decimal, percent: number | string | Decimal): Decimal {
    return DecimalUtil.multiply(value, DecimalUtil.divide(percent, 100));
  }

  /**
   * Round to 2 decimal places (for money)
   */
  static roundMoney(value: number | string | Decimal): Decimal {
    return DecimalUtil.from(value).toDecimalPlaces(2);
  }

  /**
   * Convert to number (use with caution for money)
   */
  static toNumber(value: Decimal): number {
    return value.toNumber();
  }

  /**
   * Convert to string
   */
  static toString(value: Decimal, decimals?: number): string {
    return decimals !== undefined
      ? value.toFixed(decimals)
      : value.toString();
  }
}














