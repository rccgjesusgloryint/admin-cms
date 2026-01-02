"use client";

import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";

export type ModelStatus =
  | "available"
  | "rate_limited"
  | "error"
  | "testing"
  | "unknown";

export interface ModelStatusInfo {
  name: string;
  status: ModelStatus;
  isActive: boolean;
  lastError?: string;
  lastErrorTime?: string;
  lastSuccessTime?: string;
  retryAfter?: string;
}

export interface ModelStatusResponse {
  models: ModelStatusInfo[];
  activeModelIndex: number;
}

export interface UseModelStatusReturn {
  models: ModelStatusInfo[];
  activeModelIndex: number;
  isLoading: boolean;
  refresh: () => Promise<void>;
  switchModel: (modelIndex: number | string) => Promise<boolean>;
  testModel: (modelName: string) => Promise<boolean>;
}

export function useModelStatus(
  pollInterval: number = 30000
): UseModelStatusReturn {
  const [models, setModels] = useState<ModelStatusInfo[]>([]);
  const [activeModelIndex, setActiveModelIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch("/api/ai-models/status");
      if (!response.ok) {
        throw new Error("Failed to fetch model status");
      }
      const data: ModelStatusResponse = await response.json();
      setModels(data.models);
      setActiveModelIndex(data.activeModelIndex);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching model status:", error);
      setIsLoading(false);
      // Don't show toast on initial load or polling errors
    }
  }, []);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    await fetchStatus();
  }, [fetchStatus]);

  const switchModel = useCallback(
    async (modelIndexOrName: number | string): Promise<boolean> => {
      try {
        const body =
          typeof modelIndexOrName === "number"
            ? { modelIndex: modelIndexOrName }
            : { modelName: modelIndexOrName };

        const response = await fetch("/api/ai-models/switch", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to switch model");
        }

        const data = await response.json();
        setModels(data.models);
        setActiveModelIndex(data.activeModelIndex);
        toast.success(data.message || "Model switched successfully");
        return true;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        toast.error(`Failed to switch model: ${errorMessage}`);
        return false;
      }
    },
    []
  );

  const testModel = useCallback(async (modelName: string): Promise<boolean> => {
    try {
      const response = await fetch("/api/ai-models/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ modelName }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to test model");
      }

      const data = await response.json();

      // Update the model in the local state
      setModels((prev) =>
        prev.map((model) =>
          model.name === modelName
            ? {
                ...model,
                status: data.model.status,
                lastError: data.model.lastError,
                lastErrorTime: data.model.lastErrorTime,
                lastSuccessTime: data.model.lastSuccessTime,
                retryAfter: data.model.retryAfter,
              }
            : model
        )
      );

      if (data.success) {
        toast.success(`Model ${modelName} is available`);
      } else {
        toast.error(
          `Model ${modelName} test failed: ${data.error || "Unknown error"}`
        );
      }
      return data.success;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      toast.error(`Failed to test model: ${errorMessage}`);
      return false;
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Polling
  useEffect(() => {
    if (pollInterval > 0) {
      const interval = setInterval(() => {
        fetchStatus();
      }, pollInterval);

      return () => clearInterval(interval);
    }
  }, [pollInterval, fetchStatus]);

  return {
    models,
    activeModelIndex,
    isLoading,
    refresh,
    switchModel,
    testModel,
  };
}
