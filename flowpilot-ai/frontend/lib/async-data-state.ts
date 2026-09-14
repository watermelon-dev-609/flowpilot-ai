export type AsyncDataState<T> =
  | { status: "loading" }
  | { status: "empty"; data: T }
  | { status: "success"; data: T }
  | { status: "error"; message: string };

export function createLoadingState(): AsyncDataState<never> {
  return { status: "loading" };
}

export function createEmptyState<T extends unknown[] = []>(data = [] as unknown as T): AsyncDataState<T> {
  return { status: "empty", data };
}

export function createSuccessState<T>(data: T): AsyncDataState<T> {
  if (Array.isArray(data) && data.length === 0) {
    return { status: "empty", data };
  }

  return { status: "success", data };
}

export function createErrorState(error: unknown): AsyncDataState<never> {
  if (error instanceof Error && error.message.trim()) {
    return { status: "error", message: error.message };
  }

  if (typeof error === "string" && error.trim()) {
    return { status: "error", message: error };
  }

  return { status: "error", message: "数据读取失败，请稍后重试" };
}

export async function resolveAsyncState<T>(loader: () => T | Promise<T>): Promise<AsyncDataState<T>> {
  try {
    return createSuccessState(await loader());
  } catch (error) {
    return createErrorState(error);
  }
}
