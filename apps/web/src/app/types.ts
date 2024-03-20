export interface Page {
  slug: string | null;
  title: string;
  description?: React.ReactNode;
  weight?: number;
}

export interface LayoutSegment {
  parentSegments: string[];
  pages: Page[];
}
