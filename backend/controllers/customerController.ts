import { Request, Response } from 'express';
import { CustomerRepository } from '../repositories/customerRepository';
import { logger } from '../middlewares/logger';

export const createCustomer = async (req: Request, res: Response) => {
  try {
    const { name, address, zip_code, energy_bill, home_year, primary_decisionmaker } = req.body;
    const customer = await CustomerRepository.create({
      name,
      address,
      zip_code,
      energy_bill: Number(energy_bill),
      home_year: Number(home_year),
      primary_decisionmaker: Boolean(primary_decisionmaker)
    });
    res.status(201).json(customer);
  } catch (error: any) {
    logger.error(`Error creating customer: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

export const getCustomerById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const customer = await CustomerRepository.findById(id);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    res.json(customer);
  } catch (error: any) {
    logger.error(`Error fetching customer by id: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};
