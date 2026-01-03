import { OpenRouter } from "@openrouter/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from "./db";
import { AI_MODELS, type AIModel } from "./ai-models";

// Re-export for backward compatibility
export { AI_MODELS, type AIModel };

/**
 * AI Model Monitoring and Failover Configuration
 *
 * Provides automatic monitoring, health checks, failover to backup models,
 * and automatic rollback to primary model when it recovers.
 */

// Initialize OpenRouter client
const openRouter = new OpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
  httpReferer: process.env.BASE_URL,
  xTitle: "RCCG Jesus Glory Intl",
});

// Initialize Google Generative AI client
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");

interface AIMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface AICompletionResult {
  content: string;
  modelUsed: string;
}

// Model status tracking
export interface ModelStatus {
  available: boolean | null; // null means never tested
  lastChecked: Date | null;
  lastFailure?: Date;
  errorCount: number;
  lastError?: string;
  hasBeenTested: boolean; // Tracks if model has been explicitly tested
}

// Track model statuses in memory
const modelStatusMap = new Map<string, ModelStatus>();

// Initialize all models with unknown status (never tested)
AI_MODELS.forEach((model) => {
  modelStatusMap.set(model, {
    available: null, // Unknown - needs to be tested
    lastChecked: null,
    errorCount: 0,
    hasBeenTested: false,
  });
});

// Track current active model index (0 = primary)
let currentActiveModelIndex = 0;
const PRIMARY_MODEL_INDEX = 0;

/**
 * Update model status in the status map
 */
function updateModelStatus(
  model: string,
  available: boolean,
  error?: string
): void {
  const status = modelStatusMap.get(model) || {
    available: null,
    lastChecked: null,
    errorCount: 0,
    hasBeenTested: false,
  };

  status.available = available;
  status.lastChecked = new Date();
  status.hasBeenTested = true; // Mark as explicitly tested

  if (available) {
    status.errorCount = 0;
    status.lastFailure = undefined;
    status.lastError = undefined;
  } else {
    status.errorCount++;
    status.lastFailure = new Date();
    status.lastError = error;
  }

  modelStatusMap.set(model, status);
}

/**
 * Check if an error is a rate limit error (429)
 */
function isRateLimitError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes("429") ||
      message.includes("rate limit") ||
      message.includes("rate-limited")
    );
  }

  // Check for response body with 429 code
  if (typeof error === "object" && error !== null) {
    const errorObj = error as Record<string, unknown>;
    if (errorObj.code === 429) return true;
    if (typeof errorObj.body === "string") {
      try {
        const body = JSON.parse(errorObj.body);
        return body?.error?.code === 429;
      } catch {
        return errorObj.body.includes("429");
      }
    }
  }

  return false;
}

/**
 * Call Google Generative AI model
 */
async function callGoogleGenAI(
  model: string,
  messages: AIMessage[]
): Promise<string> {
  const modelName = model.replace("google:", "");
  const genModel = genAI.getGenerativeModel({ model: modelName });

  // Convert messages to Google format
  // Note: Google's API has a slightly different structure, usually handled by history or prompt
  // For simplicity, we'll combine user/system prompts appropriately or use chat history if needed.
  // This simple implementation concatenates for a single prompt or handles basic chat.

  const history = messages.slice(0, -1).map((msg) => ({
    role: msg.role === "assistant" ? "model" : "user",
    parts: [{ text: msg.content }],
  }));

  const lastMessage = messages[messages.length - 1];
  const chat = genModel.startChat({
    history: history,
  });

  const result = await chat.sendMessage(lastMessage.content);
  return result.response.text();
}

/**
 * Check model health by performing a lightweight API call
 */
export async function checkModelHealth(model: string): Promise<boolean> {
  try {
    // Use minimal test message to check availability
    const testMessages: AIMessage[] = [
      {
        role: "user",
        content: "test",
      },
    ];

    let content: string | null = null;

    if (model.startsWith("google:")) {
      content = await callGoogleGenAI(model, testMessages);
    } else {
      const completion = await openRouter.chat.send({
        model,
        messages: testMessages,
        stream: false,
        maxTokens: 5, // Minimal tokens for health check
      });
      const rawContent = completion.choices[0]?.message?.content || null;

      if (Array.isArray(rawContent)) {
        content = rawContent
          .filter((item) => item.type === "text")
          .map((item) => (item as { type: "text"; text: string }).text)
          .join("");
      } else {
        content = rawContent;
      }
    }

    // If we get a response, model is available
    if (content !== undefined && content !== null) {
      updateModelStatus(model, true);
      return true;
    }

    updateModelStatus(model, false, "No content returned");
    return false;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    updateModelStatus(model, false, errorMessage);
    return false;
  }
}

/**
 * Get list of available models in priority order
 * Returns models that are either untested (available is null) or tested and available (true)
 * Excludes models that have been explicitly tested and marked unavailable (false)
 */
export function getAvailableModels(): string[] {
  return AI_MODELS.filter((model) => {
    const status = modelStatusMap.get(model);
    // Include if: untested (null) OR tested and available (true)
    // Exclude if: tested and unavailable (false)
    return status?.available !== false;
  });
}

/**
 * Get the current active model index
 */
export function getCurrentModelIndex(): number {
  return currentActiveModelIndex;
}

/**
 * Get the current active model string
 */
export function getCurrentModel(): string {
  return AI_MODELS[currentActiveModelIndex];
}

/**
 * Switch to a different model by index
 */
function switchToModel(modelIndex: number): void {
  if (modelIndex < 0 || modelIndex >= AI_MODELS.length) {
    throw new Error(`Invalid model index: ${modelIndex}`);
  }
  currentActiveModelIndex = modelIndex;
  console.log(
    `🔄 Switched to model: ${AI_MODELS[modelIndex]} (index ${modelIndex})`
  );
}

/**
 * Check if we should switch back to the primary model
 */
function shouldSwitchBackToPrimary(): boolean {
  // If we're already on primary, no need to switch
  if (currentActiveModelIndex === PRIMARY_MODEL_INDEX) {
    return false;
  }

  // Check if primary model is available
  const primaryModel = AI_MODELS[PRIMARY_MODEL_INDEX];
  const primaryStatus = modelStatusMap.get(primaryModel);

  return primaryStatus?.available === true;
}

/**
 * Get model preference from database (manual override or auto)
 */
async function getModelPreferenceFromDB(): Promise<{
  selectedModel: string | null;
  autoSelectModel: boolean;
}> {
  try {
    const settings = await prisma.siteSettings.findFirst();
    return {
      selectedModel: settings?.selectedModel || null,
      autoSelectModel: settings?.autoSelectModel ?? true,
    };
  } catch (error) {
    console.error("Error fetching model preference from DB:", error);
    return {
      selectedModel: null,
      autoSelectModel: true,
    };
  }
}

/**
 * Find the next available model starting from a given index
 */
function findNextAvailableModel(startIndex: number): number | null {
  for (let i = startIndex; i < AI_MODELS.length; i++) {
    const model = AI_MODELS[i];
    const status = modelStatusMap.get(model);
    if (status?.available !== false) {
      return i;
    }
  }
  return null;
}

/**
 * Call AI with automatic fallback, health checks, and rollback
 *
 * This function:
 * 1. Checks DB for manual override first
 * 2. If automatic mode, uses current active model from status manager
 * 3. Performs health check on selected model
 * 4. If model fails, updates status and switches to next available
 * 5. On success, checks if we should roll back to primary
 * 6. Updates model status accordingly
 */
export async function callAIWithFallback(
  messages: AIMessage[],
  startModelIndex?: number
): Promise<AICompletionResult> {
  const errors: string[] = [];

  // Get model preference from database
  const { selectedModel, autoSelectModel } = await getModelPreferenceFromDB();

  // Determine which model to use
  let targetModelIndex: number;
  if (!autoSelectModel && selectedModel) {
    // Manual override - use selected model
    const manualIndex = AI_MODELS.indexOf(selectedModel as AIModel);
    if (manualIndex === -1) {
      throw new Error(`Selected model not found: ${selectedModel}`);
    }
    targetModelIndex = manualIndex;
  } else if (startModelIndex !== undefined) {
    // Explicit start index provided
    targetModelIndex = startModelIndex;
  } else {
    // Automatic mode - use current active model
    targetModelIndex = currentActiveModelIndex;
  }

  // Try models starting from target index
  let attemptIndex = targetModelIndex;
  const attemptedModels = new Set<number>();

  while (attemptedModels.size < AI_MODELS.length) {
    if (attemptedModels.has(attemptIndex)) {
      // Try next available model
      const nextAvailable = findNextAvailableModel(0);
      if (nextAvailable === null) {
        throw new Error(`All AI models failed. Errors:\n${errors.join("\n")}`);
      }
      attemptIndex = nextAvailable;
      continue;
    }

    attemptedModels.add(attemptIndex);
    const model = AI_MODELS[attemptIndex];

    try {
      console.log(
        `🤖 Attempting AI call with model: ${model} (index ${attemptIndex})`
      );

      // Perform health check before attempting (skip if we just checked it)
      const status = modelStatusMap.get(model);
      const timeSinceLastCheck = status?.lastChecked
        ? Date.now() - status.lastChecked.getTime()
        : Infinity;

      // Only check health if status is uncertain or old (older than 30 seconds)
      if (
        status?.available === false ||
        (status?.lastChecked && timeSinceLastCheck > 30000)
      ) {
        const isHealthy = await checkModelHealth(model);
        if (!isHealthy) {
          console.log(`⚠️ Model ${model} failed health check, trying next...`);
          errors.push(`${model}: Health check failed`);
          attemptIndex = (attemptIndex + 1) % AI_MODELS.length;
          continue;
        }
      }

      // Attempt the actual API call
      let content: string;

      if (model.startsWith("google:")) {
        // Direct Google Call
        content = await callGoogleGenAI(model, messages);
      } else {
        // OpenRouter Call
        const completion = await openRouter.chat.send({
          model,
          messages,
          stream: false,
        });

        const rawContent = completion.choices[0]?.message?.content;

        // Handle both string and array content types
        if (typeof rawContent === "string") {
          content = rawContent;
        } else if (Array.isArray(rawContent)) {
          // Extract text from content items
          content = rawContent
            .filter((item) => item.type === "text")
            .map((item) => (item as { type: "text"; text: string }).text)
            .join("");
        } else {
          throw new Error(`No content returned from model: ${model}`);
        }
      }

      if (!content) {
        throw new Error(`Empty content returned from model: ${model}`);
      }

      console.log(`✅ AI call succeeded with model: ${model}`);

      // Update status to available
      updateModelStatus(model, true);

      // Update current active model if in auto mode
      if (autoSelectModel) {
        switchToModel(attemptIndex);

        // Check if we should roll back to primary
        if (shouldSwitchBackToPrimary()) {
          console.log(`🔄 Primary model recovered, switching back...`);
          switchToModel(PRIMARY_MODEL_INDEX);
        }
      }

      return {
        content,
        modelUsed: model,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      console.error(`❌ Model ${model} failed: ${errorMessage}`);

      // Update model status
      if (isRateLimitError(error)) {
        console.log(`⚠️ Rate limit hit on ${model}, trying next model...`);
        errors.push(`${model}: Rate limited`);
        updateModelStatus(model, false, "Rate limited");
      } else {
        errors.push(`${model}: ${errorMessage}`);
        updateModelStatus(model, false, errorMessage);
      }

      // In auto mode, switch to next available model
      if (autoSelectModel) {
        const nextAvailable = findNextAvailableModel(
          (attemptIndex + 1) % AI_MODELS.length
        );
        if (nextAvailable !== null) {
          attemptIndex = nextAvailable;
          continue;
        }
      }

      // If we've tried all models or no next available, throw error
      if (attemptedModels.size >= AI_MODELS.length) {
        throw new Error(`All AI models failed. Errors:\n${errors.join("\n")}`);
      }

      // Try next model
      attemptIndex = (attemptIndex + 1) % AI_MODELS.length;
    }
  }

  throw new Error(`All AI models exhausted. Errors:\n${errors.join("\n")}`);
}

/**
 * Get status of all models
 */
export function getModelStatuses(): Map<string, ModelStatus> {
  return new Map(modelStatusMap);
}

/**
 * Get status of a specific model
 */
export function getModelStatus(model: string): ModelStatus | undefined {
  return modelStatusMap.get(model);
}

/**
 * Reset model status (clear failure state)
 */
export function resetModelStatus(model: string): void {
  updateModelStatus(model, true);
}

/**
 * Reset the model index to start from the primary model again
 */
export function resetModelIndex(): void {
  currentActiveModelIndex = PRIMARY_MODEL_INDEX;
}

/**
 * Test a specific model's availability (for UI health checks)
 */
export async function testModel(model: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const isAvailable = await checkModelHealth(model);
  const status = modelStatusMap.get(model);

  if (isAvailable) {
    console.log("success");
    return { success: true };
  } else {
    const err = status?.lastError || "Model health check failed";
    console.error(err);
    return {
      success: false,
      error: err,
    };
  }
}

// Re-export openRouter for direct use if needed
export { openRouter };
