"use client";

import { useState, useCallback } from "react";
import { ChartCard } from "@/components/charts/ChartCard/ChartCard";
import { getAiInsights } from "@/app/actions/ai-advisor";
import type { AIInsight, AIAdvisorResponse } from "@/types/ai-advisor";
import styles from "./BusinessInsights.module.css";

type AdvisorState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "success"; insights: AIInsight[]; partial: boolean }
  | { kind: "error"; message: string };

const SEVERITY_LABELS: Record<string, string> = {
  positive: "Oportunidad",
  warning: "Requiere atención",
  critical: "Crítico",
};

export function BusinessInsights() {
  const [state, setState] = useState<AdvisorState>({ kind: "idle" });

  const handleGenerate = useCallback(async () => {
    setState({ kind: "loading" });

    try {
      const result: AIAdvisorResponse = await getAiInsights();

      if (result.error || result.insights.length === 0) {
        setState({
          kind: "error",
          message:
            result.error ||
            "No se encontraron hallazgos relevantes en este momento.",
        });
        return;
      }

      setState({
        kind: "success",
        insights: result.insights,
        partial: result.partial,
      });
    } catch {
      setState({
        kind: "error",
        message: "Consultor temporalmente fuera de línea. Intenta nuevamente en unos minutos.",
      });
    }
  }, []);

  return (
    <div className={styles.wrapper}>
      <ChartCard
        title="Bonzai Advisor"
        description="Diagnóstico estratégico cruzando datos de todos los servicios"
      >
        {state.kind === "idle" && (
          <button onClick={handleGenerate} className={styles.trigger}>
            <span className={styles.sparkle}>✨</span>
            Generar Diagnóstico de IA
          </button>
        )}

        {state.kind === "loading" && (
          <div className={styles.skeletonGroup}>
            <div className={styles.skeletonLine} />
            <div className={styles.skeletonLine} />
            <div className={styles.skeletonLine} />
          </div>
        )}

        {state.kind === "success" && (
          <div>
            <ul className={styles.insightsList}>
              {state.insights.map((insight, i) => (
                <li
                  key={i}
                  className={`${styles.insightItem} ${styles[insight.severity] ?? ""}`}
                >
                  <h4 className={styles.insightTitle}>
                    {insight.title}
                    <span
                      style={{
                        fontSize: "0.65rem",
                        fontWeight: 400,
                        marginLeft: "0.5rem",
                        color:
                          insight.severity === "positive"
                            ? "#526347"
                            : insight.severity === "warning"
                              ? "#d4a853"
                              : "#dc2626",
                      }}
                    >
                      {SEVERITY_LABELS[insight.severity] ?? insight.severity}
                    </span>
                  </h4>
                  <p className={styles.insightDescription}>
                    {insight.description}
                  </p>
                  <div className={styles.insightServices}>
                    {insight.services_involved?.map((svc) => (
                      <span key={svc} className={styles.serviceTag}>
                        {svc}
                      </span>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
            {state.partial && (
              <p className={styles.partialNotice}>
                Algunos servicios no estuvieron disponibles. El diagnóstico puede ser parcial.
              </p>
            )}
            <button
              onClick={handleGenerate}
              className={styles.trigger}
              style={{ marginTop: "1rem" }}
            >
              <span className={styles.sparkle}>✨</span>
              Regenerar Diagnóstico
            </button>
          </div>
        )}

        {state.kind === "error" && (
          <div>
            <div className={styles.errorMessage}>
              <span className={styles.errorIcon}>⚡</span>
              {state.message}
            </div>
            <button
              onClick={handleGenerate}
              className={styles.trigger}
              style={{ marginTop: "0.75rem" }}
            >
              <span className={styles.sparkle}>✨</span>
              Reintentar
            </button>
          </div>
        )}
      </ChartCard>
    </div>
  );
}
