export class ProcessorException extends Error {
  public context: string | undefined;

  constructor(message: string, context?: string) {
    super(message);
    this.context = context;
  }
}
