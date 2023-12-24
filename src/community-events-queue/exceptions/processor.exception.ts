export class ProcessorException extends Error {
  public context: string | undefined;

  constructor(message: string, context?: string, stack?: string) {
    super(message);
    this.context = context;
    this.stack = stack;
  }

  toJSON() {
    return {
      type: 'ProcessorException',
      error: this.message,
      context: this.context,
      stack: this.stack,
    };
  }
}
