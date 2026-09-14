import { GeoMonitorRecord, GeoMonitorSnapshot } from "../../lib/flowpilot-api";
import { EvidenceFormState, ReviewFormState, ReviewStatusCode } from "./shared";
import { GeoMonitorDataPanel } from "./geo-monitor-record-panel";

export function GeoMonitorReviewPanel({
  data,
  evidenceForms,
  reviewForms,
  busyEvidenceRecordId,
  busyReviewRecordId,
  onEvidenceFormChange,
  onReviewFormChange,
  onAddEvidenceAttachment,
  onReviewRecord
}: {
  data: GeoMonitorSnapshot;
  evidenceForms: Record<string, EvidenceFormState>;
  reviewForms: Record<string, ReviewFormState>;
  busyEvidenceRecordId: string;
  busyReviewRecordId: string;
  onEvidenceFormChange: (recordId: string, form: EvidenceFormState) => void;
  onReviewFormChange: (recordId: string, form: ReviewFormState) => void;
  onAddEvidenceAttachment: (record: GeoMonitorRecord) => void;
  onReviewRecord: (record: GeoMonitorRecord, reviewStatusCode: ReviewStatusCode) => void;
}) {
  return (
    <GeoMonitorDataPanel
      data={data}
      showReviewCards
      evidenceForms={evidenceForms}
      reviewForms={reviewForms}
      busyEvidenceRecordId={busyEvidenceRecordId}
      busyReviewRecordId={busyReviewRecordId}
      onEvidenceFormChange={onEvidenceFormChange}
      onReviewFormChange={onReviewFormChange}
      onAddEvidenceAttachment={onAddEvidenceAttachment}
      onReviewRecord={onReviewRecord}
    />
  );
}
