"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  AlertCircle,
  XCircle,
  RefreshCw,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { useModelStatus, ModelStatusInfo } from "@/hooks/useModelStatus";
import { useState } from "react";

export function ModelManager() {
  const { models, activeModelIndex, isLoading, refresh, switchModel, testModel } =
    useModelStatus(30000); // Poll every 30 seconds
  const [testingModels, setTestingModels] = useState<Set<string>>(new Set());
  const [expandedModel, setExpandedModel] = useState<string | null>(null);

  const getStatusIcon = (status: ModelStatusInfo["status"]) => {
    switch (status) {
      case "available":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "rate_limited":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "testing":
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return null;
    }
  };

  const getStatusBadgeVariant = (status: ModelStatusInfo["status"]) => {
    switch (status) {
      case "available":
        return "default";
      case "rate_limited":
        return "secondary";
      case "error":
        return "destructive";
      case "testing":
        return "outline";
      default:
        return "outline";
    }
  };

  const getStatusColor = (status: ModelStatusInfo["status"]) => {
    switch (status) {
      case "available":
        return "text-green-500";
      case "rate_limited":
        return "text-yellow-500";
      case "error":
        return "text-red-500";
      case "testing":
        return "text-blue-500";
      default:
        return "text-muted-foreground";
    }
  };

  const formatModelName = (name: string) => {
    // Format model names for better readability
    return name
      .split("/")
      .pop()
      ?.replace(/-/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase()) || name;
  };

  const handleTestModel = async (modelName: string) => {
    setTestingModels((prev) => new Set(prev).add(modelName));
    await testModel(modelName);
    setTestingModels((prev) => {
      const next = new Set(prev);
      next.delete(modelName);
      return next;
    });
  };

  const handleSwitchModel = async (modelIndex: number) => {
    await switchModel(modelIndex);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Never";
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString();
    } catch {
      return "Invalid date";
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>AI Model Management</CardTitle>
          <div className="flex items-center gap-2">
            {isLoading && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => refresh()}
              disabled={isLoading}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {models.length === 0 && isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : models.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No models available
          </div>
        ) : (
          <div className="space-y-3">
            {models.map((model, index) => {
              const isActive = model.isActive;
              const isTesting = testingModels.has(model.name);

              return (
                <div
                  key={model.name}
                  className={`border rounded-lg p-4 transition-colors ${
                    isActive
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {getStatusIcon(model.status)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">
                              {formatModelName(model.name)}
                            </h4>
                            {isActive && (
                              <Badge variant="default" className="text-xs">
                                Active
                              </Badge>
                            )}
                            <Badge
                              variant={getStatusBadgeVariant(model.status)}
                              className={`text-xs ${getStatusColor(
                                model.status
                              )}`}
                            >
                              {model.status.replace("_", " ")}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {model.name}
                          </p>
                        </div>
                      </div>

                      {expandedModel === model.name && (
                        <div className="mt-3 pt-3 border-t space-y-2 text-sm">
                          {model.lastError && (
                            <div>
                              <span className="text-muted-foreground">
                                Last Error:{" "}
                              </span>
                              <span className="text-red-500">
                                {model.lastError}
                              </span>
                            </div>
                          )}
                          {model.lastErrorTime && (
                            <div>
                              <span className="text-muted-foreground">
                                Error Time:{" "}
                              </span>
                              {formatDate(model.lastErrorTime)}
                            </div>
                          )}
                          {model.lastSuccessTime && (
                            <div>
                              <span className="text-muted-foreground">
                                Last Success:{" "}
                              </span>
                              {formatDate(model.lastSuccessTime)}
                            </div>
                          )}
                          {model.retryAfter && (
                            <div>
                              <span className="text-muted-foreground">
                                Retry After:{" "}
                              </span>
                              {formatDate(model.retryAfter)}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      {!isActive && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSwitchModel(index)}
                          disabled={isLoading}
                        >
                          <ArrowRight className="h-4 w-4 mr-1" />
                          Switch
                        </Button>
                      )}
                      {(model.status === "error" ||
                        model.status === "rate_limited") && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTestModel(model.name)}
                          disabled={isTesting || isLoading}
                        >
                          {isTesting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "Test"
                          )}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setExpandedModel(
                            expandedModel === model.name ? null : model.name
                          )
                        }
                      >
                        {expandedModel === model.name ? "Less" : "Details"}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

