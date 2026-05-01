-- ============================================================
-- TutorIA Web V24 — Seed: 21 módulos
-- ============================================================
insert into public.modulos (slug, nome, descricao, icone, ordem, status) values
  ('nucleo',          'Núcleo e Governança',           'Configurações centrais do sistema',          'Settings',      1,  'completo'),
  ('persistencia',    'Persistência Estrutural',        'Backup e estrutura de dados',                'Database',      2,  'vazio'),
  ('backup',          'Backup e Restauração',           'Gestão de backups e restauração',            'Archive',       3,  'completo'),
  ('financeiro-base', 'Financeiro Base',                'Lançamentos, categorias e saldo',            'DollarSign',    4,  'completo'),
  ('financeiro-ofx',  'Financeiro OFX e Banco',         'Importação de extratos bancários OFX',       'CreditCard',    5,  'completo'),
  ('gestao-fin',      'Gestão Financeira da Empresa',   'Relatórios e análises financeiras',          'TrendingUp',    6,  'vazio'),
  ('clientes',        'Clientes',                       'Cadastro e histórico de clientes',           'Users',         7,  'parcial'),
  ('obras',           'Obras e Projetos',               'Gestão de obras e projetos',                 'HardHat',       8,  'parcial'),
  ('engenharia',      'Engenharia',                     'Dados técnicos de engenharia',               'Ruler',         9,  'vazio'),
  ('producao',        'Produção',                       'Controle de produção',                       'Factory',       10, 'vazio'),
  ('montagem',        'Montagem',                       'Processo de montagem',                       'Wrench',        11, 'vazio'),
  ('comercial',       'Comercial e Pipeline',           'Pipeline de vendas e comercial',             'BarChart2',     12, 'vazio'),
  ('empresas',        'Empresas',                       'Cadastro das empresas do grupo',             'Building2',     13, 'vazio'),
  ('perfil-estrutural','Perfil Estrutural',             'Perfil e preferências do usuário',           'User',          14, 'completo'),
  ('perfil-psico',    'Perfil Psicológico Dinâmico',   'Análise comportamental dinâmica',            'Brain',         15, 'vazio'),
  ('diario',          'Diário Estratégico',             'Registros e reflexões estratégicas',         'BookOpen',      16, 'vazio'),
  ('radar',           'Radar Estratégico do Fundador',  'Visão estratégica 360°',                     'Radar',         17, 'vazio'),
  ('risco',           'Risco Empresarial',              'Mapeamento e gestão de riscos',              'AlertTriangle', 18, 'vazio'),
  ('mercado',         'Mercado e Posicionamento',       'Análise de mercado e posicionamento',        'Globe',         19, 'vazio'),
  ('evolucoes',       'Evoluções do Sistema',           'Histórico de evoluções e sessões',           'GitBranch',     20, 'completo'),
  ('biblica',         'Leitura Bíblica',                'Registro e análise de leituras bíblicas',    'BookMarked',    21, 'completo');

-- Usuário admin inicial (criar via Supabase Auth antes de rodar este seed)
-- Substitua o UUID abaixo pelo ID gerado no Supabase Auth
-- insert into public.usuarios (id, nome, email, role) values
--   ('SEU-UUID-AQUI', 'Fabiano Rodrigues', 'fgrodrigues74@gmail.com', 'admin');
