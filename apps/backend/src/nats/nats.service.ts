import {
  Codec,
  NatsConnection,
  JetStreamClient,
  JSONCodec,
  connect,
  ConnectionOptions,
  PublishOptions,
  JetStreamManager,
  consumerOpts,
  JetStreamPublishOptions,
  PubAck,
  StreamInfo,
  JetStreamSubscription,
  createInbox,
} from 'nats';
import { AppLogger } from '../common/logger.service';
import {
  ConsumerOptsBuilderImpl,
  isConsumerOptsBuilder,
} from 'nats/lib/nats-base-client/jsconsumeropts';
import { NatsClientOptions } from './interfaces/nats-client-options.interface';
import { NatsStreamConfig } from './interfaces/nats-stream-config.interface';
export class Nats {
  readonly codec: Codec<unknown>;
  protected readonly logger: AppLogger;

  protected connection?: NatsConnection;
  protected jetstreamClient?: JetStreamClient;
  protected jetstreamManager?: JetStreamManager;

  constructor(protected readonly options: NatsClientOptions = {}) {
    this.logger = new AppLogger();
    this.codec = options.codec || JSONCodec();
  }

  async connect(): Promise<NatsConnection> {
    if (this.connection) {
      return this.connection;
    }
    this.connection = await this.createNatsConnection(this.options.connection);
    this.jetstreamClient = this.createJetStreamClient(this.connection);
    this.jetstreamManager = await this.createJetStreamManager(this.connection);

    this.handleStatusUpdates(this.connection);

    await this.createStreams(this.jetstreamManager, this.options.streams);
    this.logger.log(`Connected to ${this.connection.getServer()}`);
    return this.connection;
  }

  async handleStatusUpdates(connection: NatsConnection): Promise<void> {
    for await (const status of connection.status()) {
      const data =
        typeof status.data === 'object'
          ? JSON.stringify(status.data)
          : status.data;
      const message = `(${status.type}): ${data}`;

      switch (status.type) {
        case 'pingTimer':
        case 'reconnecting':
        case 'staleConnection':
          this.logger.log(message);
          break;

        case 'disconnect':
        case 'error':
          this.logger.error(message);
          break;

        case 'reconnect':
          this.logger.log(message);
          break;

        case 'ldm':
          this.logger.warn(message);
          break;

        case 'update':
          this.logger.log(message);
          break;
      }
    }
  }

  async close(): Promise<void> {
    if (this.connection) {
      await this.connection.drain();

      this.connection = undefined;
      this.jetstreamClient = undefined;
    }
  }

  createJetStreamManager(
    connection: NatsConnection,
  ): Promise<JetStreamManager> {
    return connection.jetstreamManager();
  }

  createJetStreamClient(connection: NatsConnection): JetStreamClient {
    return connection.jetstream();
  }

  createNatsConnection(
    options: ConnectionOptions = {},
  ): Promise<NatsConnection> {
    return connect(options);
  }

  async createStreams(
    manager: JetStreamManager,
    configs: NatsStreamConfig[] = [],
  ): Promise<void> {
    await Promise.all(
      configs.map((config) => this.upsertStream(manager, config)),
    );
  }

  getConnection(): NatsConnection | undefined {
    return this.connection;
  }

  getJetStreamClient(): JetStreamClient | undefined {
    return this.jetstreamClient;
  }

  async publish(
    subj: string,
    data?: any,
    options?: Partial<JetStreamPublishOptions>,
  ): Promise<PubAck> {
    if (!this.connection || !this.jetstreamClient) {
      throw new Error('NATS not connected!');
    }
    const payload = this.codec.encode(data);
    return this.jetstreamClient.publish(subj, payload, options);
  }

  async subscribeToEventPatterns(
    pattern: string,
  ): Promise<JetStreamSubscription> {
    if (!this.connection || !this.jetstreamClient) {
      throw new Error('NATS not connected!');
    }

    const consumerOptions = consumerOpts() as ConsumerOptsBuilderImpl;
    consumerOptions.durable('me');
    consumerOptions.manualAck();
    consumerOptions.ackExplicit();
    consumerOptions.deliverTo(createInbox());
    if (consumerOptions.config.durable_name) {
      consumerOptions.durable(
        this.createDurableName(consumerOptions.config.durable_name, pattern),
      );
    }

    try {
      this.logger.log(`Subscribing to ${pattern} events`);
      const sub = this.jetstreamClient.subscribe(pattern, consumerOptions);
      return sub;
    } catch (error: any) {
      if (error.message === 'no stream matches subject') {
        throw new Error(`Cannot find stream with the ${pattern} event pattern`);
      }

      throw error;
    }
  }

  /**
   * Create a durable name that follows NATS naming rules
   * @see https://docs.nats.io/jetstream/administration/naming
   */
  createDurableName(...parts: string[]): string {
    return parts.join('-').replace(/\s|\.|>|\*/g, '-');
  }

  subscribeToMessagePatterns(pattern: string): void {
    if (!this.connection) {
      throw new Error('NATS not connected!');
    }
    this.connection.subscribe(pattern, {
      callback: (error, message) => {
        if (error) {
          return this.logger.error(error.message, error.stack);
        }

        console.log(message, 'MEEEEEEE');
      },
      queue: this.options.queue,
    });

    this.logger.log(`Subscribed to ${pattern} messages`);
  }

  /**
   * Creates a new stream if it doesn't exist, otherwise updates the existing stream
   */
  async upsertStream(
    manager: JetStreamManager,
    config: NatsStreamConfig,
  ): Promise<StreamInfo> {
    try {
      const stream = await manager.streams.info(config.name);

      const updated = await manager.streams.update(config.name, {
        ...stream.config,
        ...config,
      });

      return updated;
    } catch (error: any) {
      if (error.message === 'stream not found') {
        const added = await manager.streams.add(config);

        return added;
      }

      throw error;
    }
  }
}
