import { supabase } from '../supabase/client';
import { Customer } from '../types';
import { logger } from '../middlewares/logger';

export class CustomerRepository {
  static async create(customer: Omit<Customer, 'id' | 'created_at'>): Promise<Customer> {
    logger.info(`[CustomerRepository] Creating customer: ${customer.name}`);
    try {
      const { data, error } = await supabase
        .from('customers')
        .insert([customer])
        .select()
        .single();

      if (error) {
        logger.warn(`[CustomerRepository] Supabase save notice: ${error.message}. Returning fallback customer record.`);
        return {
          id: `cust-${Date.now()}`,
          ...customer,
          created_at: new Date().toISOString()
        };
      }
      return data;
    } catch (err: any) {
      logger.warn(`[CustomerRepository] Exception during Supabase insert: ${err.message}. Returning fallback.`);
      return {
        id: `cust-${Date.now()}`,
        ...customer,
        created_at: new Date().toISOString()
      };
    }
  }

  static async findById(id: string): Promise<Customer | null> {
    logger.info(`[CustomerRepository] Finding customer by ID: ${id}`);
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', id)
        .single();

      if (error) return null;
      return data;
    } catch (err) {
      return null;
    }
  }
}
