export interface Page {
  slug: string | null;
  title: string;
  description?: React.ReactNode;
}

export interface LayoutSegment {
  parentSegments: string[];
  pages: Page[];
}
