import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { supabase } from '../../lib/supabase';

export const settingsRouter = router({
  get: publicProcedure
    .query(async () => {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('key', 'marketing_config')
        .single();

      if (error || !data) {
        return {
          free_credits: 30,
          price_per_message: 0.15
        };
      }

      return data.value;
    }),

  update: publicProcedure
    .input(z.object({
      free_credits: z.number(),
      price_per_message: z.number(),
      evolution_url: z.string().optional(),
      evolution_key: z.string().optional(),
      evolution_instance: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { error } = await supabase
        .from('settings')
        .upsert({
          key: 'marketing_config',
          value: input,
          updated_at: new Date()
        }, { onConflict: 'key' });

      if (error) {
        console.error('Error saving settings:', error);
        throw new Error('Falha ao salvar configurações');
      }

      return { success: true };
    }),
});
