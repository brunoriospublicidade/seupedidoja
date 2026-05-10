import React from 'react';
import { Users as UsersIcon, UserPlus, Shield, Mail, Calendar, Trash2, Pencil, BadgeCheck } from 'lucide-react';
import { motion } from 'framer-motion';

const UsersPage = () => {
  const MOCK_USERS = [
    { id: 1, name: 'João Administrador', email: 'joao@pedidoja.com', role: 'Dono', status: 'Ativo', since: 'Mar 2024' },
    { id: 2, name: 'Maria Gerente', email: 'maria@pedidoja.com', role: 'Gerente', status: 'Ativo', since: 'Abr 2024' },
    { id: 3, name: 'Pedro Atendente', email: 'pedro@pedidoja.com', role: 'Atendente', status: 'Inativo', since: 'Mai 2024' },
  ];

  return (
    <div className="space-y-8 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 dark:text-white">Gestão de Usuários</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Controle quem pode acessar e gerenciar o seu restaurante.</p>
        </div>
        <button className="flex items-center justify-center gap-2 bg-primary text-white px-6 py-3 rounded-2xl font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/20 active:scale-95">
          <UserPlus size={20} />
          Convidar Usuário
        </button>
      </header>

      <div className="bg-white dark:bg-slate-900 rounded-[32px] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
              <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-slate-400">Usuário</th>
              <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-slate-400">Cargo</th>
              <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-slate-400">Status</th>
              <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-slate-400 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
            {MOCK_USERS.map((user) => (
              <tr key={user.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-950/50 transition-colors">
                <td className="px-8 py-5">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        {user.name}
                        {user.role === 'Dono' && <BadgeCheck size={14} className="text-primary" />}
                      </div>
                      <div className="text-xs text-slate-400 flex items-center gap-1">
                        <Mail size={10} /> {user.email}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-5">
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <Shield size={14} className="text-slate-400" />
                    <span className="text-sm font-medium">{user.role}</span>
                  </div>
                </td>
                <td className="px-8 py-5">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    user.status === 'Ativo' 
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' 
                    : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-500'
                  }`}>
                    {user.status}
                  </span>
                </td>
                <td className="px-8 py-5 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button className="p-2 text-slate-300 hover:text-primary transition-colors">
                      <Pencil size={18} />
                    </button>
                    <button className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UsersPage;
