import {
  GeoMonitorEvidenceAttachmentPayload,
  GeoMonitorRecordReviewPayload,
  GeoMonitorSnapshot
} from "../../lib/flowpilot-api";

export type SessionFormState = {
  name: string;
  target_brand: string;
  target_url: string;
  data_mode: "manual" | "real";
};

export type RecordFormState = {
  session_id: string;
  query: string;
  ai_channel: string;
  related_concept_found: boolean;
  brand_mentioned: boolean;
  page_retrieved: boolean;
  source_cited: boolean;
  raw_response: string;
  response_summary: string;
  data_mode: "manual" | "real";
};

export type EvidenceFormState = {
  attachment_type: GeoMonitorEvidenceAttachmentPayload["attachment_type"];
  title: string;
  url: string;
  note: string;
};

export type ReviewFormState = {
  reviewer: string;
  review_note: string;
};

export type ReviewStatusCode = GeoMonitorRecordReviewPayload["review_status_code"];

export const fallbackEvidenceLevels: Record<string, string> = {
  "0": "未出现",
  "1": "出现相关概念",
  "2": "品牌被提及",
  "3": "页面被检索到",
  "4": "页面作为来源被引用"
};

export const levelDescriptions: Record<string, string> = {
  "0": "模型回答没有出现目标概念、品牌或页面。",
  "1": "只出现智能沙盘、数字孪生等相关概念。",
  "2": "回答中出现武汉微艺达等品牌实体。",
  "3": "回答中出现目标页面信息或链接线索。",
  "4": "目标页面被作为来源明确引用。"
};

export const emptySessionForm: SessionFormState = {
  name: "",
  target_brand: "武汉微艺达智能科技有限公司",
  target_url: "",
  data_mode: "manual"
};

export const emptyRecordForm: RecordFormState = {
  session_id: "",
  query: "",
  ai_channel: "deepseek",
  related_concept_found: false,
  brand_mentioned: false,
  page_retrieved: false,
  source_cited: false,
  raw_response: "",
  response_summary: "",
  data_mode: "manual"
};

export const emptyEvidenceForm: EvidenceFormState = {
  attachment_type: "source_url",
  title: "",
  url: "",
  note: ""
};

export const emptyReviewForm: ReviewFormState = {
  reviewer: "",
  review_note: ""
};

export const aiChannelOptions = [
  { id: "deepseek", name: "深度求索" },
  { id: "doubao", name: "豆包" },
  { id: "wenxin", name: "文心一言" },
  { id: "yuanbao", name: "腾讯元宝" },
  { id: "kimi", name: "月之暗面" }
];

export function createEmptyGeoSnapshot(): GeoMonitorSnapshot {
  return {
    sessions: { data_mode: "mock", evidence_levels: fallbackEvidenceLevels, sessions: [] },
    records: { data_mode: "mock", records: [] }
  };
}
