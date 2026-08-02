import { supabase } from '../supabase/client';
import { Customer } from '../types';
import { logger } from '../middlewares/logger';

export class CustomerRepository {
  static async create(customer: Omit<Customer, 'id' | 'created_at'>): Promise<Customer> {
    logger.info(`[CustomerRepository] Creating customer: ${customer.name}`);
    const { data, error } = await supabase
      .from('customers')
      .insert([customer])
      .select()
      .single();

    if (error) {
      logger.error(`[CustomerRepository] Error creating customer: ${error.message}`);
      throw error;
    }
    return data;
  }

  static async findById(id: string): Promise<Customer | null> {
    logger.info(`[CustomerRepository] Finding customer by ID: ${id}`);
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      logger.error(`[CustomerRepository] Error finding customer: ${error.message}`);
      throw error;
    }
    return data;
  }
}
