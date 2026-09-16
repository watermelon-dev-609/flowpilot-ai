import { ContentAdaptationInput } from "../app/content-adaptation/content-adaptation-engine";

export const GEO_RESEARCH_TOPIC_POOL_STORAGE_KEY = "flowpilot.geoResearch.topicPool";

export type GeoResearchContentAdaptationIntake = Omit<ContentAdaptationInput, "selectedPlatforms">;

export type GeoResearchTopicStatus = "待适配" | "适配中" | "已生成" | "已作废";

export type GeoResearchTopicPoolItem = GeoResearchContentAdaptationIntake & {
  id: string;
  platform: string;
  overallScore: number;
  status: GeoResearchTopicStatus;
  createdAt: string;
  scheduledAt?: string;
  owner?: string;
  priority?: "高" | "中" | "低";
  contentStage?: "待生产" | "生产中" | "待审核" | "待发布" | "已发布" | "待监测" | "已复盘" | "已完成";
};

export type ContentCalendarGroup = {
  dateLabel: string;
  items: GeoResearchTopicPoolItem[];
};

const geoResearchTopicStatuses: GeoResearchTopicStatus[] = ["待适配", "适配中", "已生成", "已作废"];

export function isGeoResearchTopicStatus(status: unknown): status is GeoResearchTopicStatus {
  return typeof status === "string" && geoResearchTopicStatuses.includes(status as GeoResearchTopicStatus);
}

export function normalizeGeoResearchTopicPool(value: unknown): GeoResearchTopicPoolItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(isGeoResearchTopicPoolItem);
}

export function buildContentCalendarGroups(items: GeoResearchTopicPoolItem[]): ContentCalendarGroup[] {
  const groupMap = items
    .filter((item) => item.status !== "已作废")
    .reduce<Record<string, GeoResearchTopicPoolItem[]>>((groups, item) => {
      const dateLabel = formatCalendarDate(item.scheduledAt || item.createdAt);
      groups[dateLabel] = [...(groups[dateLabel] || []), item];
      return groups;
    }, {});

  return Object.entries(groupMap).map(([dateLabel, groupItems]) => ({
    dateLabel,
    items: groupItems
  }));
}

function isGeoResearchTopicPoolItem(item: unknown): item is GeoResearchTopicPoolItem {
  if (!item || typeof item !== "object") {
    return false;
  }

  const candidate = item as Partial<GeoResearchTopicPoolItem>;

  return (
    isNonEmptyString(candidate.id) &&
    isNonEmptyString(candidate.topicTitle) &&
    isNonEmptyString(candidate.platform) &&
    isNonEmptyString(candidate.brandName) &&
    isNonEmptyString(candidate.productName) &&
    isNonEmptyString(candidate.region) &&
    isNonEmptyString(candidate.targetAudience) &&
    isNonEmptyString(candidate.facts) &&
    typeof candidate.overallScore === "number" &&
    Number.isFinite(candidate.overallScore) &&
    isGeoResearchTopicStatus(candidate.status) &&
    isNonEmptyString(candidate.createdAt)
  );
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function formatCalendarDate(createdAt: string) {
  const [, month = "", day = ""] = createdAt.match(/^\d{4}-(\d{2})-(\d{2})/) || [];
  if (!month || !day) return "未排期";

  return `${Number(month)}月${Number(day)}日`;
}
