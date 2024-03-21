export interface Page {
  title: string;
  description?: React.ReactNode;
  order?: number;
}

export type PageWithMeta = Page & {
  slug: string | null;
  pathSegments: string[];
};
