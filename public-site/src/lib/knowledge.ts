import { DOCS, DOC_MAP, knowledgePointsForDoc } from "./content";
import { ROADMAPS, ROADMAP_MAP, categoryLabelZh, roadmapContextCategory } from "../data/roadmaps";
import type { DocMeta, KnowledgePoint } from "./types";
import type { Roadmap } from "../data/roadmaps";

export const DOC_ROUTE_MAP: Record<string, string[]> = {
  "01": ["html", "frontend", "frontend-beginner"],
  "02": ["css", "frontend", "frontend-beginner"],
  "03": ["javascript", "frontend", "frontend-beginner"],
  "04": ["javascript", "typescript"],
  "05": ["react", "react-native"],
  "06": ["mini-program"],
  "07": ["frontend", "devops"],
  "08": ["frontend", "react-native", "mini-program", "full-stack"],
  "09": ["frontend", "full-stack"],
  "10": ["flutter"],
  "11": ["computer-science", "backend"],
  "12": ["testing", "frontend", "backend"],
  "13": ["leetcode", "datastructures-and-algorithms"],
  "14": ["typescript", "react", "react-native"],
  "15": ["hybrid", "frontend"],
  "16": ["testing", "frontend", "backend"],
  "17": ["android", "ios", "kotlin", "swift-ui", "react-native"],
  "18": ["nodejs", "backend"],
  "19": ["system-design", "software-architect"],
  "20": ["cyber-security", "devops", "frontend"],
  "21": ["mini-program"],
};

export function docsForRoute(routeId: string): DocMeta[] {
  return DOCS.filter((doc) => (DOC_ROUTE_MAP[doc.id] ?? []).includes(routeId));
}

export function routesForDoc(docId: string): Roadmap[] {
  return (DOC_ROUTE_MAP[docId] ?? [])
    .map((routeId) => ROADMAP_MAP.get(routeId))
    .filter((route): route is Roadmap => Boolean(route));
}

export function knowledgePointsForRoute(routeId: string): Array<{ doc: DocMeta; points: KnowledgePoint[] }> {
  return docsForRoute(routeId).map((doc) => ({ doc, points: knowledgePointsForDoc(doc) }));
}

export function knowledgePointTotal(): number {
  return DOCS.reduce((sum, doc) => sum + knowledgePointsForDoc(doc).length, 0);
}

export function docContextCategory(docId: string): { id: string; label: string } | null {
  const primary = routesForDoc(docId)[0];
  if (!primary) return null;
  return roadmapContextCategory(primary);
}

export function docCategoryLabel(docId: string): string {
  return docContextCategory(docId)?.label ?? "知识库";
}

export function knowledgeTotalForRoute(routeId: string): number {
  return knowledgePointsForRoute(routeId).reduce((sum, item) => sum + item.points.length, 0);
}

export const ALL_CATEGORY_LABEL = (id: string) => categoryLabelZh(id);

export function knowledgePointBySlug(docId: string, slug: string | undefined): KnowledgePoint | null {
  const doc = DOC_MAP.get(docId);
  if (!doc) return null;
  const points = knowledgePointsForDoc(doc);
  if (!slug) return points[0] ?? null;
  return points.find((point) => point.slug === slug) ?? points[0] ?? null;
}

export const KNOWLEDGE_ROUTES = ROADMAPS;
