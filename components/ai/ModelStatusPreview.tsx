"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  CheckCircle,
  AlertCircle,
  XCircle,
  Loader2,
  ArrowRight,
  Info,
} from "lucide-react";
import { useModelStatus, ModelStatusInfo } from "@/hooks/useModelStatus";
import { useState } from "react";

export function ModelStatusPreview() {
  const { models, activeModelIndex, isLoading, switchModel } =
    useModelStatus(60000); // Poll every 60 seconds
  const [isOpen, setIsOpen] = useState(false);

  const activeModel = models[activeModelIndex];

  const getStatusIcon = (status?: ModelStatusInfo["status"]) => {
    if (!status) return <Info className="h-3 w-3 text-muted-foreground" />;
    switch (status) {
      case "available":
        return <CheckCircle className="h-3 w-3 text-green-500" />;
      case "rate_limited":
        return <AlertCircle className="h-3 w-3 text-yellow-500" />;
      case "error":
        return <XCircle className="h-3 w-3 text-red-500" />;
      case "testing":
        return <Loader2 className="h-3 w-3 text-blue-500 animate-spin" />;
      case "unknown":
        return <Info className="h-3 w-3 text-gray-500" />;
      default:
        return <Info className="h-3 w-3 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status?: ModelStatusInfo["status"]) => {
    if (!status) return "text-muted-foreground";
    switch (status) {
      case "available":
        return "text-green-500";
      case "rate_limited":
        return "text-yellow-500";
      case "error":
        return "text-red-500";
      case "testing":
        return "text-blue-500";
      case "unknown":
        return "text-gray-500";
      default:
        return "text-muted-foreground";
    }
  };

  const formatModelName = (name: string) => {
    return (
      name
        .split("/")
        .pop()
        ?.replace(/-/g, " ")
        .replace(/\b\w/g, (l) => l.toUpperCase()) || name
    );
  };

  const handleSwitchModel = async (modelIndex: number) => {
    const success = await switchModel(modelIndex);
    if (success) {
      setIsOpen(false);
    }
  };

  if (isLoading && !activeModel) {
    return (
      <div className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">
          Loading model status...
        </span>
      </div>
    );
  }

  if (!activeModel) {
    return null;
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          {getStatusIcon(activeModel.status)}
          <span className="text-xs">{formatModelName(activeModel.name)}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-sm mb-2">AI Model Status</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 rounded-md bg-muted">
                <div className="flex items-center gap-2">
                  {getStatusIcon(activeModel.status)}
                  <span className="text-sm font-medium">
                    {formatModelName(activeModel.name)}
                  </span>
                </div>
                <Badge variant="default" className="text-xs">
                  Active
                </Badge>
              </div>
            </div>
          </div>

          <div>
            <h5 className="text-xs font-medium text-muted-foreground mb-2">
              All Models
            </h5>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {models.map((model, index) => {
                const isActive = model.isActive;
                return (
                  <div
                    key={model.name}
                    className={`flex items-center justify-between p-2 rounded-md text-sm ${
                      isActive ? "bg-primary/10 border border-primary" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {getStatusIcon(model.status)}
                      <span className="truncate text-xs">
                        {formatModelName(model.name)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {isActive ? (
                        <Badge variant="default" className="text-xs">
                          Active
                        </Badge>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs"
                          onClick={() => handleSwitchModel(index)}
                          disabled={isLoading}
                        >
                          <ArrowRight className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {activeModel.lastError && (
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground mb-1">Last Error:</p>
              <p className="text-xs text-red-500">{activeModel.lastError}</p>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
