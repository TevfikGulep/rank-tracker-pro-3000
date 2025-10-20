import type { Project, Keyword } from './types';

export const projects: Project[] = [
  { id: 'proj_1', name: 'E-commerce Store', domain: 'ecommercestore.com' },
  { id: 'proj_2', name: 'SaaS Platform', domain: 'saasplatform.io' },
  { id: 'proj_3', name: 'Blog Network', domain: 'blognetwork.co' },
];

export const keywords: Keyword[] = [
  // Keywords for E-commerce Store
  {
    id: 'kw_1',
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
  // Keywords for SaaS Platform
  {
    id: 'kw_4',
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
];

export const countries = [
  { value: 'USA', label: 'USA' },
  { value: 'UK', label: 'United Kingdom' },
  { value: 'Canada', label: 'Canada' },
  { value: 'Australia', label: 'Australia' },
  { value: 'Germany', label: 'Germany' },
  { value: 'France', label: 'France' },
  { value: 'Turkey', label: 'Turkey' },
];

// Simulate API calls
export const getProject = async (projectId: string) => {
  return projects.find((p) => p.id === projectId) || null;
};

export const getProjects = async () => {
  return projects;
};

export const getKeywordsForProject = async (projectId: string) => {
  // In a real app, keywords would be linked to projects.
  // Here we return a subset based on project ID for simulation.
  if (projectId === 'proj_1') return keywords.slice(0, 3);
  if (projectId === 'proj_2') return keywords.slice(3, 5);
  return [];
};
