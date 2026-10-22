import {
  Injectable,
  PLATFORM_ID,
  inject,
  signal
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel
} from '@microsoft/signalr';

import { environment } from '../../../environments/environment';

interface VendorOrderAlert {
  eventId: string;
  orderId: number;
  orderNumber?: string;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class VendorNotificationService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly toastr = inject(ToastrService);

  private connection?: HubConnection;
  private timer?: ReturnType<typeof setInterval>;
  private busy = false;
  private initialized = false;
  private connectedToken = '';

  readonly connected = signal(false);
  readonly latestOrder = signal<VendorOrderAlert | null>(null);

  private readonly visibilityHandler = () => {
    void this.refreshSession();
  };

  initialize(): void {
    if (!isPlatformBrowser(this.platformId) || this.initialized) {
      return;
    }

    this.initialized = true;

    document.addEventListener(
      'visibilitychange',
      this.visibilityHandler
    );

    // Also retries an unsuccessful initial connection.
    this.timer = setInterval(() => {
      void this.refreshSession();
    }, 20_000);

    void this.refreshSession();
  }

  async refreshSession(): Promise<void> {
    if (!isPlatformBrowser(this.platformId) || this.busy) {
      return;
    }

    this.busy = true;

    try {
      let token = '';
      let isVendor = false;

      try {
        token = sessionStorage.getItem('gbAccessToken') || '';

        const profile = JSON.parse(
          sessionStorage.getItem('gbProfile') || 'null'
        );

        isVendor = profile?.fldUserType === 'Vendor';
      } catch {
        // Missing or invalid session: disconnect below.
      }

      // Stop the previous identity's connection on logout/account change.
      if (!isVendor || !token || token !== this.connectedToken) {
        const previous = this.connection;

        this.connection = undefined;
        this.connectedToken = '';
        this.connected.set(false);

        if (previous) {
          await previous.stop();
        }
      }

      if (!isVendor || !token) {
        return;
      }

      if (!this.connection) {
        const connection = new HubConnectionBuilder()
          .withUrl(
            `${environment.apiBaseUrl.replace(/\/+$/, '')}` +
            '/hubs/vendor-notifications',
            {
              accessTokenFactory: () => token
            }
          )
          .withAutomaticReconnect()
          .configureLogging(LogLevel.Error)
          .build();

        connection.on(
          'OrderCreated',
          async (alert: VendorOrderAlert) => {
            // Ignore events from a previous login or a hidden page.
            if (
              this.connection !== connection ||
              document.visibilityState !== 'visible' ||
              sessionStorage.getItem('gbAccessToken') !== token
            ) {
              return;
            }
            console.info('OrderCreated received:', alert);


            this.latestOrder.set(alert);

            this.toastr.info(
              alert.orderNumber
                ? `New order: ${alert.orderNumber}`
                : 'A new order is waiting for your review.',
              'Green Basket',
              {
                timeOut: 10_000,
                closeButton: true
              }
            );

            try {
              await connection.invoke(
                'AcknowledgeOrderNotification',
                alert.eventId
              );

              console.info(
                'Order notification acknowledged:',
                alert.eventId
              );
            } catch (error) {
              console.error(
                'Order notification acknowledgment failed:',
                error
              );
            }
            // Add the authenticated API acknowledgement here
            // after confirming its actual route and payload.
          }
        );

        connection.onreconnecting(() => {
          this.connected.set(false);
        });

        connection.onreconnected(() => {
          if (this.connection === connection) {
            this.connected.set(true);
            void this.sendHeartbeat(connection);
          }
        });

        connection.onclose(() => {
          if (this.connection === connection) {
            this.connected.set(false);
          }
        });

        this.connection = connection;
        this.connectedToken = token;
      }

      const connection = this.connection;

      if (connection.state === HubConnectionState.Disconnected) {
        await connection.start();
      }

      if (connection.state === HubConnectionState.Connected) {
        this.connected.set(true);
        await this.sendHeartbeat(connection);
      }
    } catch {
      this.connected.set(false);

      console.warn(
        'Vendor notification connection is unavailable. ' +
        'It will retry automatically.'
      );
    } finally {
      this.busy = false;
    }
  }

  private async sendHeartbeat(
    connection: HubConnection
  ): Promise<void> {
    if (connection.state !== HubConnectionState.Connected) {
      return;
    }

    try {
      await connection.invoke(
        'Heartbeat',
        document.visibilityState === 'visible'
      );
    } catch {
      console.warn('Unable to update vendor presence.');
    }
  }
}