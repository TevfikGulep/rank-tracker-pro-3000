import type { Project, Keyword } from './types';

export const projects: Project[] = [
  { id: 'proj_1', name: 'E-commerce Store', domain: 'ecommercestore.com' },
  { id: 'proj_2', name: 'SaaS Platform', domain: 'saasplatform.io' },
  { id: 'proj_3', name: 'Blog Network', domain: 'blognetwork.co' },
  { id: 'proj_4', name: 'Personal Portfolio', domain: 'johndoe.dev' },
];

export const keywords: Keyword[] = [
  // Keywords for E-commerce Store (proj_1)
  {
    id: 'kw_1',
    projectId: 'proj_1',
    name: 'buy cheap electronics',
    country: 'USA',
    history: [
      { date: '2024-04-01', rank: 15 },
      { date: '2024-04-08', rank: 12 },
      { date: '2024-04-15', rank: 10 },
      { date: '2024-04-22', rank: 11 },
      { date: '2024-04-29', rank: 8 },
      { date: '2024-05-06', rank: 9 },
    ],
  },
  {
    id: 'kw_2',
    projectId: 'proj_1',
    name: 'best gaming laptop 2024',
    country: 'USA',
    history: [
      { date: '2024-04-01', rank: 5 },
      { date: '2024-04-08', rank: 6 },
      { date: '2024-04-15', rank: 4 },
      { date: '2024-04-22', rank: 3 },
      { date: '2024-04-29', rank: 3 },
      { date: '2024-05-06', rank: 4 },
    ],
  },
  {
    id: 'kw_3',
    projectId: 'proj_1',
    name: 'smartphone deals',
    country: 'UK',
    history: [
      { date: '2024-04-01', rank: 25 },
      { date: '2024-04-08', rank: 22 },
      { date: '2024-04-15', rank: 28 },
      { date: '2024-04-22', rank: 20 },
      { date: '2024-04-29', rank: 18 },
      { date: '2024-05-06', rank: 21 },
    ],
  },
  // Keywords for SaaS Platform (proj_2)
  {
    id: 'kw_4',
    projectId: 'proj_2',
    name: 'project management software',
    country: 'Canada',
    history: [
      { date: '2024-04-01', rank: 7 },
      { date: '2024-04-08', rank: 7 },
      { date: '2024-04-15', rank: 6 },
      { date: '2024-04-22', rank: 8 },
      { date: '2024-04-29', rank: 5 },
      { date: '2024-05-06', rank: 5 },
    ],
  },
  {
    id: 'kw_5',
    projectId: 'proj_2',
    name: 'crm for small business',
    country: 'USA',
    history: [
      { date: '2024-04-01', rank: 18 },
      { date: '2024-04-08', rank: 15 },
      { date: '2024-04-15', rank: 12 },
      { date: '2024-04-22', rank: 14 },
      { date: '2024-04-29', rank: 13 },
      { date: '2024-05-06', rank: 10 },
    ],
  },
  // Keywords for Blog Network (proj_3)
  {
    id: 'kw_6',
    projectId: 'proj_3',
    name: 'how to start a blog',
    country: 'Australia',
    history: [
      { date: '2024-04-01', rank: 50 },
      { date: '2024-04-08', rank: 45 },
      { date: '2024-04-15', rank: 48 },
      { date: '2024-04-22', rank: 40 },
      { date: '2024-04-29', rank: 35 },
      { date: '2024-05-06', rank: 33 },
    ],
  },
  {
    id: 'kw_7',
    projectId: 'proj_3',
    name: 'content marketing tips',
    country: 'UK',
    history: [
      { date: '2024-04-01', rank: 11 },
      { date: '2024-04-08', rank: 10 },
      { date: '2024-04-15', rank: 12 },
      { date: '2024-04-22', rank: 9 },
      { date: '2024-04-29', rank: 10 },
      { date: '2024-05-06', rank: 8 },
    ],
  },
   // Keywords for Personal Portfolio (proj_4) - no keywords
];

export const countries = [
  { value: 'USA', label: 'USA' },
  { value: 'UK', label: 'United Kingdom' },
  { value: 'Canada', label: 'Canada' },
  { value: 'Australia', label: 'Australia' },
  { value: 'Germany', label: 'Germany' },
  { value: 'France', label: 'France' },
  { value: 'Turkey', label: 'Türkiye' },
];

// Simulate API calls
export const getProject = async (projectId: string): Promise<Project | null> => {
  await new Promise(resolve => setTimeout(resolve, 50)); // Simulate network delay
  return projects.find((p) => p.id === projectId) || null;
};

export const getProjects = async (): Promise<Project[]> => {
  await new Promise(resolve => setTimeout(resolve, 50)); // Simulate network delay
  return projects;
};

export const getKeywordsForProject = async (projectId: string): Promise<Keyword[]> => {
  await new Promise(resolve => setTimeout(resolve, 100)); // Simulate network delay
  return keywords.filter((k) => k.projectId === projectId);
};
