import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Customer } from '../types/types';
import { User, MapPin, DollarSign, Home, Phone, X, Sparkles } from 'lucide-react';

const customerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone_number: z.string().min(10, 'Valid phone number is required'),
  address: z.string().min(5, 'Street address is required'),
  zip_code: z.string().min(3, 'ZIP code is required'),
  energy_bill: z.coerce.number().min(1, 'Monthly bill must be greater than $0'),
  home_year: z.coerce.number().min(1800, 'Enter valid build year').max(new Date().getFullYear() + 1),
  primary_decisionmaker: z.boolean().default(true)
});

type CustomerFormData = z.infer<typeof customerSchema>;

interface CustomerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CustomerFormData) => void;
  isLoading: boolean;
}

export function CustomerFormModal({ isOpen, onClose, onSubmit, isLoading }: CustomerFormModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: 'Sarah Jenkins',
      phone_number: '(555) 234-5678',
      address: '742 Evergreen Terrace',
      zip_code: '90210',
      energy_bill: 240,
      home_year: 2012,
      primary_decisionmaker: true
    }
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg glass-panel bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 transition-colors p-1 rounded-lg hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            Start AI Solar Consultation Call <Sparkles className="w-5 h-5 text-cyan-400" />
          </h2>
          <p className="text-sm text-slate-400">
            Enter homeowner details to initiate AI lead qualification & appointment setting session.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-cyan-400" /> Homeowner Full Name
            </label>
            <input
              {...register('name')}
              placeholder="e.g. John Doe"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-colors"
            />
            {errors.name && <p className="text-xs text-rose-400 mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-cyan-400" /> Phone Number
            </label>
            <input
              {...register('phone_number')}
              placeholder="e.g. (555) 000-0000"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-colors"
            />
            {errors.phone_number && <p className="text-xs text-rose-400 mt-1">{errors.phone_number.message}</p>}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-cyan-400" /> Street Address
              </label>
              <input
                {...register('address')}
                placeholder="123 Main St"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-colors"
              />
              {errors.address && <p className="text-xs text-rose-400 mt-1">{errors.address.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">ZIP Code</label>
              <input
                {...register('zip_code')}
                placeholder="90210"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-colors"
              />
              {errors.zip_code && <p className="text-xs text-rose-400 mt-1">{errors.zip_code.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Avg Electric Bill ($)
              </label>
              <input
                type="number"
                {...register('energy_bill')}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-colors"
              />
              {errors.energy_bill && <p className="text-xs text-rose-400 mt-1">{errors.energy_bill.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Home className="w-3.5 h-3.5 text-amber-400" /> Home Build Year
              </label>
              <input
                type="number"
                {...register('home_year')}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-colors"
              />
              {errors.home_year && <p className="text-xs text-rose-400 mt-1">{errors.home_year.message}</p>}
            </div>
          </div>

          <div className="pt-2 flex items-center gap-2">
            <input
              type="checkbox"
              id="primary_decisionmaker"
              {...register('primary_decisionmaker')}
              className="rounded border-slate-800 bg-slate-950 text-cyan-500 focus:ring-cyan-500 w-4 h-4"
            />
            <label htmlFor="primary_decisionmaker" className="text-xs text-slate-300">
              Homeowner is primary decision maker for home upgrades
            </label>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-800/80">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium text-xs shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Initiating Call...
                </>
              ) : (
                'Launch AI Call Now'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
