export class RedisOperationTimeoutError extends Error {
  constructor(message = "Redis operation timed out") {
    super(message);
    this.name = "RedisOperationTimeoutError";
  }
}

export class RedisOperationExecutor {
  constructor(private readonly timeoutMs = 300) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    let timer: NodeJS.Timeout | undefined;

    try {
      return await Promise.race([
        operation(),

        new Promise<T>((_, reject) => {
          timer = setTimeout(() => {
            reject(new RedisOperationTimeoutError());
          }, this.timeoutMs);
        }),
      ]);
    } finally {
      if (timer) {
        clearTimeout(timer);
      }
    }
  }
}
