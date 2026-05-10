import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { supabase } from '../../lib/supabase';

export const marketingRouter = router({
  sendWhatsApp: publicProcedure
    .input(z.object({
      phone: z.string(),
      message: z.string(),
      restaurantId: z.string(),
    }))
    .mutation(async ({ input }) => {
       // 1. Buscar Configurações Globais
       const { data: settings } = await supabase
         .from('settings')
         .select('value')
         .eq('key', 'marketing_config')
         .single();
         
       if (!settings || !settings.value.evolution_url) {
         throw new Error('Evolution API não configurada no painel administrativo');
       }
       
       const { evolution_url, evolution_key, evolution_instance } = settings.value;
       
       // 2. Verificar Créditos do Restaurante
       const { data: restaurant } = await supabase
         .from('restaurants')
         .select('message_credits, messages_sent_this_month')
         .eq('id', input.restaurantId)
         .single();
         
       if (!restaurant) throw new Error('Restaurante não encontrado');
       
       const availableCredits = (restaurant.message_credits || 30) - (restaurant.messages_sent_this_month || 0);
       
       if (availableCredits <= 0) {
          throw new Error('Créditos insuficientes para este disparo');
       }
       
       // 3. Enviar via Evolution API
       try {
         const cleanPhone = input.phone.replace(/\D/g, '');
         const response = await fetch(`${evolution_url}/message/sendText/${evolution_instance}`, {
           method: 'POST',
           headers: {
             'Content-Type': 'application/json',
             'apikey': evolution_key
           },
           body: JSON.stringify({
             number: cleanPhone,
             options: {
               delay: 1200,
               presence: "composing",
               linkPreview: false
             },
             textMessage: {
               text: input.message
             }
           })
         });

         if (!response.ok) {
           const errorData = await response.json().catch(() => ({}));
           console.error('Evolution API Error Response:', errorData);
           throw new Error('A Evolution API recusou o envio. Verifique a conexão do WhatsApp.');
         }
         
         // 4. Atualizar Créditos no Banco
         await supabase
           .from('restaurants')
           .update({ 
             messages_sent_this_month: (restaurant.messages_sent_this_month || 0) + 1 
           })
           .eq('id', input.restaurantId);

         return { success: true };
       } catch (error: any) {
         console.error('Marketing Send Error:', error);
         throw new Error(error.message || 'Falha ao processar envio de WhatsApp');
       }
    }),
});
