"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  GeoMonitorRecord,
  GeoMonitorSession,
  GeoMonitorSnapshot,
  addGeoMonitorRecordEvidenceAttachment,
  createGeoMonitorRecord,
  createGeoMonitorSession,
  loadGeoMonitorSnapshot,
  reviewGeoMonitorRecord
} from "../lib/flowpilot-api";
import {
  GeoMonitorEmptyPanel,
  GeoMonitorErrorPanel,
  GeoMonitorEvidenceGuide,
  GeoMonitorLoadingPanel,
  GeoMonitorModuleLinks,
  GeoMonitorOverviewPanel,
  GeoMonitorSupportCards
} from "./components/geo-monitor-overview-panel";
import { GeoMonitorRecordPanel } from "./components/geo-monitor-record-panel";
import { GeoMonitorReportPanel } from "./components/geo-monitor-report-panel";
import { GeoMonitorReviewPanel } from "./components/geo-monitor-review-panel";
import { GeoMonitorSessionPanel } from "./components/geo-monitor-session-panel";
import {
  createEmptyGeoSnapshot,
  emptyEvidenceForm,
  emptyRecordForm,
  emptyReviewForm,
  emptySessionForm,
  EvidenceFormState,
  fallbackEvidenceLevels,
  RecordFormState,
  ReviewFormState,
  ReviewStatusCode,
  SessionFormState
} from "./components/shared";

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "empty" }
  | { status: "success"; data: GeoMonitorSnapshot };

export type GeoMonitorWorkspaceView = "overview" | "sessions" | "records" | "review" | "report";

export type PublishMonitorLead = {
  sessionId: string;
  query: string;
  url: string;
};

export function GeoMonitorWorkspace({ view = "overview" }: { view?: GeoMonitorWorkspaceView }) {
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [sessionForm, setSessionForm] = useState<SessionFormState>(emptySessionForm);
  const [recordForm, setRecordForm] = useState<RecordFormState>(emptyRecordForm);
  const [publishMonitorLead, setPublishMonitorLead] = useState<PublishMonitorLead | null>(null);
  const [lastCreatedRecord, setLastCreatedRecord] = useState<GeoMonitorRecord | null>(null);
  const [evidenceForms, setEvidenceForms] = useState<Record<string, EvidenceFormState>>({});
  const [reviewForms, setReviewForms] = useState<Record<string, ReviewFormState>>({});
  const [busyEvidenceRecordId, setBusyEvidenceRecordId] = useState("");
  const [busyReviewRecordId, setBusyReviewRecordId] = useState("");
  const [operationError, setOperationError] = useState("");

  useEffect(() => {
    const lead = readPublishMonitorLead();
    if (!lead) return;

    setPublishMonitorLead(lead);
    setRecordForm((current) => ({
      ...current,
      session_id: lead.sessionId || current.session_id,
      query: lead.query || current.query
    }));
  }, []);

  useEffect(() => {
    let active = true;

    loadGeoMonitorSnapshot()
      .then((data) => {
        if (!active) return;

        if (data.sessions.sessions.length === 0 && data.records.records.length === 0) {
          setState({ status: "empty" });
          return;
        }

        setState({ status: "success", data });
      })
      .catch((error: Error) => {
        if (!active) return;
        setState({ status: "error", message: error.message });
      });

    return () => {
      active = false;
    };
  }, []);

  const snapshot = state.status === "success" ? state.data : undefined;
  const evidenceLevels = snapshot?.sessions.evidence_levels || fallbackEvidenceLevels;
  const sessions = useMemo(() => snapshot?.sessions.sessions || [], [snapshot]);
  const records = useMemo(() => snapshot?.records.records || [], [snapshot]);
  const selectedSession = sessions.find((session) => session.session_id === recordForm.session_id) || sessions[0];

  async function handleCreateSession(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setOperationError("");

    try {
      const created = await createGeoMonitorSession({
        ...sessionForm,
        actor: "frontend-user"
      });
      applySessionUpdate(created);
      setRecordForm((current) => ({ ...current, session_id: created.session_id }));
      setSessionForm(emptySessionForm);
    } catch (error) {
      setOperationError(error instanceof Error ? error.message : "监测任务创建失败");
    }
  }

  async function handleCreateRecord(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setOperationError("");

    if (!selectedSession) {
      setOperationError("请先创建或选择监测任务");
      return;
    }

    try {
      const created = await createGeoMonitorRecord({
        ...recordForm,
        session_id: recordForm.session_id || selectedSession.session_id,
        target_brand: selectedSession.target_brand,
        target_url: selectedSession.target_url,
        manual_review_status: "待复核",
        reviewer: "",
        actor: "frontend-user"
      });
      applyRecordUpdate(created);
      setLastCreatedRecord(created);
      setRecordForm((current) => ({
        ...emptyRecordForm,
        session_id: current.session_id || selectedSession.session_id
      }));
    } catch (error) {
      setOperationError(error instanceof Error ? error.message : "监测记录录入失败");
    }
  }

  async function handleCreateSessionFromPublishLead() {
    if (!publishMonitorLead?.url) return;

    setOperationError("");

    try {
      const created = await createGeoMonitorSession({
        name: `发布链接监测：${publishMonitorLead.query || publishMonitorLead.url}`,
        target_brand: emptySessionForm.target_brand,
        target_url: publishMonitorLead.url,
        data_mode: "manual",
        actor: "frontend-user"
      });
      applySessionUpdate(created);
      setRecordForm((current) => ({ ...current, session_id: created.session_id }));
    } catch (error) {
      setOperationError(error instanceof Error ? error.message : "发布链接监测任务创建失败");
    }
  }

  async function handleAddEvidenceAttachment(record: GeoMonitorRecord) {
    setOperationError("");
    const form = evidenceForms[record.record_id] || emptyEvidenceForm;
    setBusyEvidenceRecordId(record.record_id);

    try {
      const updated = await addGeoMonitorRecordEvidenceAttachment(record.record_id, {
        ...form,
        actor: "frontend-user"
      });
      applyRecordUpdate(updated);
      setEvidenceForms((current) => ({ ...current, [record.record_id]: emptyEvidenceForm }));
    } catch (error) {
      setOperationError(error instanceof Error ? error.message : "证据附件提交失败");
    } finally {
      setBusyEvidenceRecordId("");
    }
  }

  async function handleReviewRecord(record: GeoMonitorRecord, reviewStatusCode: ReviewStatusCode) {
    setOperationError("");
    const form = reviewForms[record.record_id] || emptyReviewForm;

    if (!form.reviewer.trim()) {
      setOperationError("请填写复核人");
      return;
    }

    setBusyReviewRecordId(record.record_id);

    try {
      const updated = await reviewGeoMonitorRecord(record.record_id, {
        review_status_code: reviewStatusCode,
        reviewer: form.reviewer,
        review_note: form.review_note,
        actor: "frontend-user"
      });
      applyRecordUpdate(updated);
    } catch (error) {
      setOperationError(error instanceof Error ? error.message : "复核状态提交失败");
    } finally {
      setBusyReviewRecordId("");
    }
  }

  return (
    <>
      <GeoMonitorEvidenceGuide evidenceLevels={evidenceLevels} />

      {operationError && (
        <section className="rounded-lg border border-rose-400/30 bg-rose-950/30 p-5 text-sm text-rose-100">
          {operationError}
        </section>
      )}

      {(view === "overview" || view === "report") && <GeoMonitorOverviewPanel sessions={sessions} records={records} />}
      {view === "overview" && <GeoMonitorModuleLinks />}

      {view === "sessions" && (
        <GeoMonitorSessionPanel
          sessionForm={sessionForm}
          sessions={sessions}
          onSessionChange={setSessionForm}
          onCreateSession={handleCreateSession}
        />
      )}

      {view === "records" && (
        <GeoMonitorRecordPanel
          recordForm={recordForm}
          sessions={sessions}
          data={snapshot}
          publishMonitorLead={publishMonitorLead}
          lastCreatedRecord={lastCreatedRecord}
          onRecordChange={setRecordForm}
          onCreateRecord={handleCreateRecord}
          onCreateSessionFromPublishLead={handleCreateSessionFromPublishLead}
        />
      )}

      {state.status === "loading" && <GeoMonitorLoadingPanel />}
      {state.status === "empty" && <GeoMonitorEmptyPanel />}
      {state.status === "error" && <GeoMonitorErrorPanel message={state.message} />}

      {state.status === "success" && view === "review" && (
        <GeoMonitorReviewPanel
          data={state.data}
          evidenceForms={evidenceForms}
          reviewForms={reviewForms}
          busyEvidenceRecordId={busyEvidenceRecordId}
          busyReviewRecordId={busyReviewRecordId}
          onEvidenceFormChange={(recordId, form) => setEvidenceForms((current) => ({ ...current, [recordId]: form }))}
          onReviewFormChange={(recordId, form) => setReviewForms((current) => ({ ...current, [recordId]: form }))}
          onAddEvidenceAttachment={handleAddEvidenceAttachment}
          onReviewRecord={handleReviewRecord}
        />
      )}

      {view === "report" && (
        <GeoMonitorReportPanel
          initialReportSnapshots={snapshot?.reportSnapshots?.snapshots || []}
          records={records}
          sessions={sessions}
        />
      )}
      {view === "overview" && <GeoMonitorSupportCards />}
    </>
  );

  function applySessionUpdate(session: GeoMonitorSession) {
    setState((current) => {
      const currentSnapshot = current.status === "success" ? current.data : createEmptyGeoSnapshot();
      return {
        status: "success",
        data: {
          sessions: {
            ...currentSnapshot.sessions,
            sessions: [...currentSnapshot.sessions.sessions.filter((item) => item.session_id !== session.session_id), session]
          },
          records: currentSnapshot.records,
          reportSnapshots: currentSnapshot.reportSnapshots
        }
      };
    });
  }

  function applyRecordUpdate(record: GeoMonitorRecord) {
    setState((current) => {
      const currentSnapshot = current.status === "success" ? current.data : createEmptyGeoSnapshot();
      const updatedRecords = [...currentSnapshot.records.records.filter((item) => item.record_id !== record.record_id), record];
      const updatedSessions = currentSnapshot.sessions.sessions.map((session) => {
        if (session.session_id !== record.session_id) return session;
        const sessionRecords = updatedRecords.filter((item) => item.session_id === session.session_id);
        return {
          ...session,
          total_records: sessionRecords.length,
          highest_evidence_level: Math.max(...sessionRecords.map((item) => item.evidence_level))
        };
      });

      return {
        status: "success",
        data: {
          sessions: { ...currentSnapshot.sessions, sessions: updatedSessions },
          records: { ...currentSnapshot.records, records: updatedRecords },
          reportSnapshots: currentSnapshot.reportSnapshots
        }
      };
    });
  }
}

function readPublishMonitorLead(): PublishMonitorLead | null {
  if (typeof window === "undefined") return null;

  const params = new URLSearchParams(window.location.search);
  const query = params.get("query")?.trim() || "";
  const url = params.get("url")?.trim() || "";
  const sessionId = params.get("session")?.trim() || "";

  if (!sessionId && !query && !url) return null;
  return { sessionId, query, url };
}
