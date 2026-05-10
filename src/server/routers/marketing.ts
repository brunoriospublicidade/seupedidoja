import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { db } from '../db';
import { restaurants, settings } from '../db/schema';
import { eq } from 'drizzle-orm';

export const marketingRouter = router({
  sendWhatsApp: publicProcedure
    .input(z.object({
      phone: z.string(),
      message: z.string(),
      restaurantId: z.string(),
    }))
    .mutation(async ({ input }) => {
       // 1. Buscar Configurações Globais
       const [config] = await db.select()
         .from(settings)
         .where(eq(settings.key, 'marketing_config'));
          
       if (!config || !(config.value as any).evolution_url) {
         throw new Error('Evolution API não configurada no painel administrativo');
       }
       
       const { evolution_url, evolution_key, evolution_instance } = config.value as any;
       
       // 2. Verificar Créditos do Restaurante
       const [restaurant] = await db.select()
         .from(restaurants)
         .where(eq(restaurants.id, input.restaurantId));
          
       if (!restaurant) throw new Error('Restaurante não encontrado');
       
       const availableCredits = (restaurant.messageCredits || 30) - (restaurant.messagesSentThisMonth || 0);
       
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
         await db.update(restaurants)
           .set({ 
             messagesSentThisMonth: (restaurant.messagesSentThisMonth || 0) + 1 
           })
           .where(eq(restaurants.id, input.restaurantId));

         return { success: true };
       } catch (error: any) {
         console.error('Marketing Send Error:', error);
         throw new Error(error.message || 'Falha ao processar envio de WhatsApp');
       }
    }),
});
