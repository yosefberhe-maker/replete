"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MealPlan } from "@/types";

interface MealPlanProps {
  plan: MealPlan;
}

export default function MealPlanView({ plan }: MealPlanProps) {
  const [openDay, setOpenDay] = useState<number>(plan.days[0]?.day ?? 1);

  return (
    <section>
      <div className="card-base border-l-4 border-l-blue p-4 sm:p-5">
        <h3 className="text-base font-semibold text-text">
          The Microdose Meal Philosophy
        </h3>
        <p className="mt-2 text-sm text-sub">{plan.philosophy}</p>
        <ul className="mt-3 grid gap-1.5 text-sm text-sub">
          {plan.keyPrinciples.map((p) => (
            <li key={p} className="flex gap-2">
              <span className="mt-1 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-green" />
              <span>{p}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-4 flex flex-col gap-3">
        {plan.days.map((day) => {
          const isOpen = openDay === day.day;
          return (
            <div key={day.day} className="card-base overflow-hidden">
              <button
                type="button"
                onClick={() => setOpenDay(isOpen ? -1 : day.day)}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between gap-3 p-4 text-left sm:p-5"
              >
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-green">
                    Day {day.day}
                  </p>
                  <p className="mt-1 text-base font-semibold text-text">
                    {day.title}
                  </p>
                </div>
                <ChevronDown
                  className={cn(
                    "h-5 w-5 flex-shrink-0 text-muted transition-transform",
                    isOpen ? "rotate-180" : "rotate-0",
                  )}
                />
              </button>
              <AnimatePresence initial={false}>
                {isOpen ? (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                  >
                    <ul className="flex flex-col gap-4 border-t border-border p-4 sm:p-5">
                      {day.meals.map((meal) => (
                        <li
                          key={`${day.day}-${meal.type}`}
                          className="flex flex-col gap-1"
                        >
                          <p className="text-xs font-semibold uppercase tracking-widest text-muted">
                            {meal.type} · ~{meal.proteinGrams} g protein
                          </p>
                          <p className="text-sm font-semibold text-text">
                            {meal.name}
                          </p>
                          <p className="text-sm text-sub">{meal.why}</p>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </section>
  );
}
