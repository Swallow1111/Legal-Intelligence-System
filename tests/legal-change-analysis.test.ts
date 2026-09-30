import assert from "node:assert/strict";
import { test } from "node:test";
import { LegalChangeSchema, normalizeAnalysis, type AnalysisRun } from "@aihot/backend/editorial/analyze";
import { UNDERSTAND_SYSTEM } from "@aihot/backend/editorial/writing";

test("content understanding carries a legal change card without adding another model stage", () => {
  assert.match(UNDERSTAND_SYSTEM, /legalChange/);
  assert.equal(LegalChangeSchema.parse(undefined), null, "older/replayed answers without the field stay readable");

  const legalChange = LegalChangeSchema.parse({
    status: "已公布，尚未施行",
    whatHappened: "最高人民法院公布新的司法解释。",
    previousRule: null,
    whatChanged: "新的司法解释明确了相关案件的适用规则。",
    affectedWork: "影响同类民商事案件的法律适用和诉讼方案。",
    lawyerAction: "应重新核对适用时间、请求权基础和证据安排。",
  });
  assert.ok(legalChange);

  const run: AnalysisRun = {
    prefilter: { label: "PASS", reason: "", model: "test", receiptId: 1, reused: false },
    scores: { model: "test", threshold: 60, values: [90, 90], receiptIds: [2, 3], reused: false },
    writing: {
      kind: "understand",
      model: "test",
      titleZh: "最高人民法院公布新的司法解释",
      summaryZh: "最高人民法院公布新的司法解释，并明确相关案件的适用规则。",
      reasonZh: "该规则直接影响同类案件的法律适用与诉讼方案。",
      tags: ["司法规则", "民商事"],
      itemType: "judicial_rule",
      authorRole: "principal",
      legalChange,
      receiptIds: [4],
      reused: false,
    },
    structure: {
      model: "test",
      category: "judicial-rules",
      tags: ["司法规则", "民商事"],
      subjects: ["spc"],
      fact: null,
      receiptId: 5,
      reused: false,
    },
  };

  const output = normalizeAnalysis(run);
  assert.equal(output.selected, true);
  assert.deepEqual(output.legalChange, legalChange);
});
