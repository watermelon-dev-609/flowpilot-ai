import {
  GEO_RESEARCH_TOPIC_POOL_STORAGE_KEY,
  GeoResearchTopicPoolItem,
  GeoResearchTopicStatus,
  normalizeGeoResearchTopicPool
} from "./geo-research-topic-contract";
import { AsyncDataState, createSuccessState } from "./async-data-state";

export type TopicPoolStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export type TopicPoolRepository = {
  list: () => GeoResearchTopicPoolItem[];
  listState: () => AsyncDataState<GeoResearchTopicPoolItem[]>;
  save: (items: unknown) => GeoResearchTopicPoolItem[];
  updateStatus: (itemId: string, status: GeoResearchTopicStatus) => GeoResearchTopicPoolItem[];
  updatePlan: (
    itemId: string,
    patch: Pick<GeoResearchTopicPoolItem, "status"> & Partial<Pick<GeoResearchTopicPoolItem, "scheduledAt" | "owner" | "priority" | "contentStage">>
  ) => GeoResearchTopicPoolItem[];
};

export function createTopicPoolRepository(storage: TopicPoolStorage): TopicPoolRepository {
  return {
    list() {
      try {
        const rawTopicPool = storage.getItem(GEO_RESEARCH_TOPIC_POOL_STORAGE_KEY);
        if (!rawTopicPool) return [];

        return normalizeGeoResearchTopicPool(JSON.parse(rawTopicPool));
      } catch {
        storage.removeItem(GEO_RESEARCH_TOPIC_POOL_STORAGE_KEY);
        return [];
      }
    },

    listState() {
      return createSuccessState(this.list());
    },

    save(items) {
      const normalizedItems = normalizeGeoResearchTopicPool(items);
      storage.setItem(GEO_RESEARCH_TOPIC_POOL_STORAGE_KEY, JSON.stringify(normalizedItems));
      return normalizedItems;
    },

    updateStatus(itemId, status) {
      const nextTopicPool = this.list().map((item) => (item.id === itemId ? { ...item, status } : item));
      return this.save(nextTopicPool);
    },

    updatePlan(itemId, patch) {
      const nextTopicPool = this.list().map((item) => (item.id === itemId ? { ...item, ...patch } : item));
      return this.save(nextTopicPool);
    }
  };
}

export function createBrowserTopicPoolRepository() {
  return createTopicPoolRepository(localStorage);
}
