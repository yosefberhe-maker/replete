import { describe, expect, it } from "vitest";
import {
  isCompleteProfile,
  isRenderableSharedProfile,
} from "@/lib/profile-validation";
import type { SharedProfile } from "@/lib/storage";

const completeProfile = {
  intake: {},
  profile: {},
  supplements: [],
  mealPlan: {},
  cycle: {},
  gi: {},
  safetyAlerts: [],
};

const wellFormedShared: SharedProfile = {
  code: "ABC123",
  drug: "sema",
  duration: "6-12",
  diet: "omni",
  dose: "moderate",
  overallScore: 60,
  riskTier: "moderate",
  topDeficiencies: [{ key: "iron", label: "Iron", score: 60 }],
  supplements: [
    {
      id: "iron",
      name: "Iron",
      dose: "18mg",
      priority: "high",
      icon: "x",
      deficiencyKey: "iron",
    },
  ],
  createdAt: "2026-05-25",
};

describe("isCompleteProfile", () => {
  it("accepts an object containing all required keys", () => {
    expect(isCompleteProfile(completeProfile)).toBe(true);
  });

  it("REGRESSION: rejects an otherwise-complete object that is MISSING mealPlan", () => {
    const { mealPlan: _mealPlan, ...withoutMealPlan } = completeProfile;
    void _mealPlan;
    expect(isCompleteProfile(withoutMealPlan)).toBe(false);
  });

  it("rejects null", () => {
    expect(isCompleteProfile(null)).toBe(false);
  });

  it("rejects a non-object (e.g. a string)", () => {
    expect(isCompleteProfile("not an object" as unknown)).toBe(false);
  });
});

describe("isRenderableSharedProfile", () => {
  it("accepts a well-formed shared profile", () => {
    expect(isRenderableSharedProfile(wellFormedShared)).toBe(true);
  });

  it("REGRESSION: rejects a record MISSING topDeficiencies", () => {
    const { topDeficiencies: _topDeficiencies, ...withoutTop } =
      wellFormedShared;
    void _topDeficiencies;
    expect(isRenderableSharedProfile(withoutTop as unknown as SharedProfile)).toBe(
      false,
    );
  });

  it("REGRESSION: rejects a record MISSING supplements", () => {
    const { supplements: _supplements, ...withoutSupplements } =
      wellFormedShared;
    void _supplements;
    expect(
      isRenderableSharedProfile(withoutSupplements as unknown as SharedProfile),
    ).toBe(false);
  });

  it("REGRESSION: rejects a record with an invalid duration", () => {
    const badDuration = {
      ...wellFormedShared,
      duration: "bogus" as never,
    };
    expect(isRenderableSharedProfile(badDuration)).toBe(false);
  });

  it("rejects null", () => {
    expect(isRenderableSharedProfile(null)).toBe(false);
  });
});
