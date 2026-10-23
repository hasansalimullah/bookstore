export interface CatNode {
  name: string;
  path: string;
  count: number;
  children: CatNode[];
}

export interface MenuSection {
  title: string;
  links: { label: string; href: string; count: number }[];
}

export interface AuthorGroup {
  label: string;
  names: string[];
}

export interface MenuData {
  tree: CatNode[];
  authors: { featured: string[]; byEra: AuthorGroup[]; byTag: AuthorGroup[] };
}

export interface AuthorInfo {
  name: string;
  era: string | null;
  tags: string[];
  featured: boolean;
  books: number;
}

/** "Fiqh > Hanbali > Usul" rows (with how many books each has) → nested tree. */
export function buildTree(rows: { category: string; n: number }[]): CatNode[] {
  const root: CatNode = { name: "", path: "", count: 0, children: [] };
  for (const row of rows) {
    const parts = row.category.split(">").map((s) => s.trim()).filter(Boolean);
    let node = root;
    parts.forEach((part, i) => {
      let child = node.children.find((c) => c.name.toLowerCase() === part.toLowerCase());
      if (!child) {
        child = { name: part, path: parts.slice(0, i + 1).join(" > "), count: 0, children: [] };
        node.children.push(child);
      }
      child.count += row.n;
      node = child;
    });
  }
  const sort = (nodes: CatNode[]) => {
    nodes.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
    nodes.forEach((n) => sort(n.children));
  };
  sort(root.children);
  return root.children;
}

const link = (n: CatNode) => ({ label: n.name, href: `/shop?category=${encodeURIComponent(n.path)}`, count: n.count });

/** Menu sections for a top-level category ("Arabic" or "Quran|Tafsir"). */
export function sectionsFor(tree: CatNode[], auto: string): MenuSection[] {
  const words = auto.split("|").map((w) => w.trim().toLowerCase()).filter(Boolean);
  const tops = tree.filter((n) => words.some((w) => n.name.toLowerCase().includes(w)));
  const sections: MenuSection[] = [];
  const flat: CatNode[] = [];
  for (const top of tops) {
    if (!top.children.length) {
      flat.push(top);
      continue;
    }
    const loose: CatNode[] = [];
    const nested: MenuSection[] = [];
    for (const child of top.children) {
      if (child.children.length) nested.push({ title: child.name, links: child.children.map(link) });
      else loose.push(child);
    }
    if (loose.length) sections.push({ title: top.name, links: loose.map(link) });
    sections.push(...nested);
  }
  if (flat.length) sections.unshift({ title: "", links: flat.map(link) });
  return sections;
}

/** Authors → "top authors", grouped by era (in the order given) and by tag (in the order given). */
export function groupAuthors(authors: AuthorInfo[], eras: string[], tags: { key: string; label: string }[]): MenuData["authors"] {
  const byName = (a: AuthorInfo, b: AuthorInfo) => a.name.localeCompare(b.name);
  const featured = authors.filter((a) => a.featured).sort(byName).map((a) => a.name);
  const fallback = [...authors].sort((a, b) => b.books - a.books || byName(a, b)).slice(0, 20).map((a) => a.name);
  const byEra = eras
    .map((era) => ({ label: era, names: authors.filter((a) => a.era === era).sort(byName).map((a) => a.name) }))
    .filter((g) => g.names.length);
  const byTag = tags
    .map((t) => ({ label: t.label, names: authors.filter((a) => a.tags.includes(t.key)).sort(byName).map((a) => a.name) }))
    .filter((g) => g.names.length);
  return { featured: featured.length ? featured.slice(0, 30) : fallback, byEra, byTag };
}