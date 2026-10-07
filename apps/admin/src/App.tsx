import React, { useState } from 'react';
import { Group, GroupStatus, GroupStatusEnum } from '@panasecreto/shared';
import { colors } from '@panasecreto/ui-tokens';
import {
  Gift,
  Users,
  ShieldCheck,
  Sparkles,
  Search,
  Plus,
  Calendar,
  Lock,
  Unlock,
  CheckCircle2,
  Clock,
  ExternalLink,
} from 'lucide-react';

const mockGroups: Group[] = [
  {
    id: 'grp_001',
    name: 'Navidad Familia González 2026',
    description: 'Intercambio anual con la familia completa. Presupuesto límite $30.',
    creatorId: 'usr_001',
    status: GroupStatusEnum.WAITING,
    exchangeDate: '2026-12-24T20:00:00Z',
    budget: 30,
    currency: 'USD',
    inviteCode: 'PANA-NAVI',
    members: [
      { userId: 'usr_001', name: 'Carlos González', email: 'carlos@ejemplo.com', role: 'CREATOR', joinedAt: '2026-10-01', exclusions: [] },
      { userId: 'usr_002', name: 'María Gómez', email: 'maria@ejemplo.com', role: 'PARTICIPANT', joinedAt: '2026-10-02', exclusions: [] },
      { userId: 'usr_003', name: 'Pedro Soto', email: 'pedro@ejemplo.com', role: 'PARTICIPANT', joinedAt: '2026-10-03', exclusions: [] },
    ],
    createdAt: '2026-10-01T10:00:00Z',
    updatedAt: '2026-10-03T12:00:00Z',
  },
  {
    id: 'grp_002',
    name: 'Panas de la Oficina Tech',
    description: 'Amigo secreto del equipo de desarrollo e infraestructura.',
    creatorId: 'usr_004',
    status: GroupStatusEnum.LOCKED,
    exchangeDate: '2026-12-18T18:00:00Z',
    budget: 25,
    currency: 'USD',
    inviteCode: 'PANA-TECH',
    members: [
      { userId: 'usr_004', name: 'Ana Torres', email: 'ana@tech.io', role: 'CREATOR', joinedAt: '2026-09-20', exclusions: [] },
      { userId: 'usr_005', name: 'Luis Rivas', email: 'luis@tech.io', role: 'PARTICIPANT', joinedAt: '2026-09-21', exclusions: [] },
      { userId: 'usr_006', name: 'Elena Diaz', email: 'elena@tech.io', role: 'PARTICIPANT', joinedAt: '2026-09-22', exclusions: [] },
      { userId: 'usr_007', name: 'Javier Pérez', email: 'javier@tech.io', role: 'PARTICIPANT', joinedAt: '2026-09-22', exclusions: [] },
    ],
    createdAt: '2026-09-20T14:00:00Z',
    updatedAt: '2026-09-25T11:00:00Z',
  },
  {
    id: 'grp_003',
    name: 'Promo 2018 - El Reencuentro',
    description: 'Sorteo de fin de año con los panas del liceo.',
    creatorId: 'usr_008',
    status: GroupStatusEnum.REVEALED,
    exchangeDate: '2026-12-30T19:00:00Z',
    budget: 20,
    currency: 'USD',
    inviteCode: 'PANA-PROMO',
    members: [
      { userId: 'usr_008', name: 'Roberto Paz', email: 'roberto@mail.com', role: 'CREATOR', joinedAt: '2026-09-10', exclusions: [] },
      { userId: 'usr_009', name: 'Daniela Méndez', email: 'daniela@mail.com', role: 'PARTICIPANT', joinedAt: '2026-09-11', exclusions: [] },
    ],
    createdAt: '2026-09-10T08:00:00Z',
    updatedAt: '2026-10-05T19:00:00Z',
  },
];

export function App() {
  const [filter, setFilter] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');

  const filteredGroups = mockGroups.filter((group) => {
    const matchesFilter = filter === 'ALL' || group.status === filter;
    const matchesSearch = group.name.toLowerCase().includes(search.toLowerCase()) ||
                          group.inviteCode.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusBadge = (status: GroupStatus) => {
    switch (status) {
      case GroupStatusEnum.WAITING:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-secondary" /> En Espera
          </span>
        );
      case GroupStatusEnum.LOCKED:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
            <Lock className="w-3.5 h-3.5 text-accent" /> Sorteado / Bloqueado
          </span>
        );
      case GroupStatusEnum.REVEALED:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <Unlock className="w-3.5 h-3.5 text-primary" /> Revelado
          </span>
        );
      case GroupStatusEnum.COMPLETED:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Finalizado
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Header */}
      <header className="border-b border-gray-200 bg-surface shadow-xs sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md"
              style={{ backgroundColor: colors.primary }}
            >
              <Sparkles className="w-5 h-5 text-secondary" />
            </div>
            <div>
              <span className="font-heading text-xl font-bold tracking-tight text-primary">
                Pana<span style={{ color: colors.secondary }}>Secreto</span>
              </span>
              <span className="ml-2 text-xs font-medium px-2 py-0.5 rounded bg-gray-100 text-muted">
                Admin v1.0
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 text-xs text-muted mr-2">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
              Backend API: <span className="font-mono text-textDark">localhost:4000</span>
            </div>
            <button
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white shadow-sm hover:opacity-90 transition-opacity"
              style={{ backgroundColor: colors.primary }}
            >
              <Plus className="w-4 h-4" /> Nuevo Grupo
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero / Overview Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-surface rounded-2xl p-5 border border-gray-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">Total Grupos</p>
              <p className="text-2xl font-heading font-bold text-textDark mt-1">{mockGroups.length}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-primary">
              <Gift className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-surface rounded-2xl p-5 border border-gray-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">Participantes</p>
              <p className="text-2xl font-heading font-bold text-textDark mt-1">
                {mockGroups.reduce((acc, g) => acc + g.members.length, 0)}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-secondary">
              <Users className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-surface rounded-2xl p-5 border border-gray-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">Sorteos Listos</p>
              <p className="text-2xl font-heading font-bold text-textDark mt-1">1</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-sky-50 flex items-center justify-center text-accent">
              <ShieldCheck className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-surface rounded-2xl p-5 border border-gray-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">Paleta Oficial</p>
              <div className="flex gap-1.5 mt-2">
                <span className="w-5 h-5 rounded-full border border-white shadow-xs" style={{ backgroundColor: colors.primary }} title="Morado Noche"></span>
                <span className="w-5 h-5 rounded-full border border-white shadow-xs" style={{ backgroundColor: colors.secondary }} title="Amarillo Araguaney"></span>
                <span className="w-5 h-5 rounded-full border border-white shadow-xs" style={{ backgroundColor: colors.accent }} title="Azul Caribe"></span>
                <span className="w-5 h-5 rounded-full border border-white shadow-xs" style={{ backgroundColor: colors.danger }} title="Rojo Guacamaya"></span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center text-muted">
              <Sparkles className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-surface rounded-2xl p-4 border border-gray-200/80 shadow-xs mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por nombre o código (ej. PANA-TECH)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 rounded-xl border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            {['ALL', GroupStatusEnum.WAITING, GroupStatusEnum.LOCKED, GroupStatusEnum.REVEALED].map((st) => (
              <button
                key={st}
                onClick={() => setFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  filter === st
                    ? 'bg-primary text-white shadow-xs'
                    : 'bg-gray-100 text-muted hover:bg-gray-200'
                }`}
              >
                {st === 'ALL' ? 'Todos' : st}
              </button>
            ))}
          </div>
        </div>

        {/* Group Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGroups.map((group) => (
            <div
              key={group.id}
              className="bg-surface rounded-2xl border border-gray-200/80 shadow-xs hover:shadow-md transition-shadow flex flex-col overflow-hidden"
            >
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h3 className="font-heading font-semibold text-base text-textDark leading-snug">
                    {group.name}
                  </h3>
                  {getStatusBadge(group.status)}
                </div>

                <p className="text-xs text-muted line-clamp-2 mb-4">
                  {group.description || 'Sin descripción proporcionada.'}
                </p>

                <div className="space-y-2.5 mt-auto pt-4 border-t border-gray-100 text-xs">
                  <div className="flex items-center justify-between text-muted">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-accent" /> Fecha intercambio:
                    </span>
                    <span className="font-medium text-textDark">
                      {new Date(group.exchangeDate).toLocaleDateString('es-ES')}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-muted">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-secondary" /> Participantes:
                    </span>
                    <span className="font-semibold text-textDark">{group.members.length} panas</span>
                  </div>

                  <div className="flex items-center justify-between text-muted">
                    <span>Presupuesto sugerido:</span>
                    <span className="font-semibold text-emerald-600">
                      ${group.budget} {group.currency}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50/75 px-5 py-3 border-t border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-muted font-medium">Código:</span>
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-white border border-gray-200 text-primary">
                    {group.inviteCode}
                  </span>
                </div>
                <button
                  className="text-xs font-semibold text-accent hover:underline flex items-center gap-1"
                  onClick={() => alert(`Detalles del grupo: ${group.name}`)}
                >
                  Gestionar <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-surface py-6 text-center text-xs text-muted">
        <p>© 2026 PanaSecreto - Monorepo pnpm + React + Vite + Express + Expo</p>
      </footer>
    </div>
  );
}

export default App;
