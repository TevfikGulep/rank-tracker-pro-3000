export type RankHistory = {
  date: string;
  rank: number | null;
};

export type Keyword = {
  id: string;
  name: string;
  country: string;
  history: RankHistory[];
};

export type Project = {
  id: string;
  name: string;
  domain: string;
};
