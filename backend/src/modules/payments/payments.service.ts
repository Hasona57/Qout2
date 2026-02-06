import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { DecimalUtil } from '../../common/utils/decimal.util';

@Injectable()
export class PaymentsService {
  private paymobApiKey: string;
  private paymobIntegrationId: string;
  private fawryMerchantCode: string;
  private fawrySecurityKey: string;

  constructor(private configService: ConfigService) {
    this.paymobApiKey = this.configService.get<string>('PAYMOB_API_KEY') || '';
    this.paymobIntegrationId = this.configService.get<string>('PAYMOB_INTEGRATION_ID') || '';
    this.fawryMerchantCode = this.configService.get<string>('FAWRY_MERCHANT_CODE') || '';
    this.fawrySecurityKey = this.configService.get<string>('FAWRY_SECURITY_KEY') || '';
  }

  /**
   * Create payment with Paymob
   */
  async createPaymobPayment(orderId: string, amount: number, customerInfo: any): Promise<any> {
    try {
      // Step 1: Get authentication token
      const authResponse = await axios.post('https://accept.paymob.com/api/auth/tokens', {
        api_key: this.paymobApiKey,
      });

      const authToken = authResponse.data.token;

      // Step 2: Create order
      const orderResponse = await axios.post(
        'https://accept.paymob.com/api/ecommerce/orders',
        {
          auth_token: authToken,
          delivery_needed: 'false',
          amount_cents: Math.round(amount * 100), // Convert to cents
          currency: 'EGP',
          items: [],
        },
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        },
      );

      const paymobOrderId = orderResponse.data.id;

      // Step 3: Get payment key
      const paymentKeyResponse = await axios.post(
        'https://accept.paymob.com/api/acceptance/payment_keys',
        {
          auth_token: authToken,
          amount_cents: Math.round(amount * 100),
          expiration: 3600,
          order_id: paymobOrderId,
          billing_data: {
            apartment: 'NA',
            email: customerInfo.email,
            floor: 'NA',
            first_name: customerInfo.name.split(' ')[0] || customerInfo.name,
            street: 'NA',
            building: 'NA',
            phone_number: customerInfo.phone || '00000000000',
            shipping_method: 'NA',
            postal_code: 'NA',
            city: 'NA',
            country: 'EG',
            last_name: customerInfo.name.split(' ').slice(1).join(' ') || customerInfo.name,
            state: 'NA',
          },
          currency: 'EGP',
          integration_id: parseInt(this.paymobIntegrationId),
        },
      );

      return {
        paymentKey: paymentKeyResponse.data.token,
        orderId: paymobOrderId,
        iframeUrl: `https://accept.paymob.com/api/acceptance/iframes/${this.paymobIntegrationId}?payment_token=${paymentKeyResponse.data.token}`,
      };
    } catch (error) {
      throw new Error(`Paymob payment creation failed: ${error.message}`);
    }
  }

  /**
   * Create payment with Fawry
   */
  async createFawryPayment(orderId: string, amount: number, customerInfo: any): Promise<any> {
    try {
      const merchantRefNumber = `ORD-${orderId}-${Date.now()}`;
      const signature = this.generateFawrySignature(merchantRefNumber, amount, customerInfo);

      const response = await axios.post('https://atfawry.fawrystaging.com/ECommerceWeb/Fawry/payments/charge', {
        merchantCode: this.fawryMerchantCode,
        merchantRefNumber,
        customerMobile: customerInfo.phone || '00000000000',
        customerMail: customerInfo.email,
        customerName: customerInfo.name,
        amount: amount,
        currencyCode: 'EGP',
        language: 'ar-eg',
        chargeItems: [
          {
            itemId: orderId,
            description: `Order ${orderId}`,
            price: amount,
            quantity: 1,
          },
        ],
        signature,
        paymentMethod: 'CARD',
        description: `Payment for order ${orderId}`,
      });

      return {
        merchantRefNumber,
        paymentUrl: response.data.paymentUrl,
        orderStatus: response.data.orderStatus,
      };
    } catch (error) {
      throw new Error(`Fawry payment creation failed: ${error.message}`);
    }
  }

  /**
   * Verify payment callback
   */
  async verifyPaymentCallback(provider: string, data: any): Promise<boolean> {
    if (provider === 'paymob') {
      // Verify Paymob callback
      return this.verifyPaymobCallback(data);
    } else if (provider === 'fawry') {
      // Verify Fawry callback
      return this.verifyFawryCallback(data);
    }
    return false;
  }

  private generateFawrySignature(merchantRefNumber: string, amount: number, customerInfo: any): string {
    const crypto = require('crypto');
    const message = `${this.fawryMerchantCode}${merchantRefNumber}${customerInfo.customerMobile || ''}${customerInfo.customerMail || ''}${amount}EGP`;
    return crypto.createHmac('sha256', this.fawrySecurityKey).update(message).digest('hex');
  }

  private async verifyPaymobCallback(data: any): Promise<boolean> {
    // Implement Paymob callback verification
    return true; // Simplified
  }

  private async verifyFawryCallback(data: any): Promise<boolean> {
    // Implement Fawry callback verification
    return true; // Simplified
  }
}














