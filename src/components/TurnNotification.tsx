import { createSignal, Show } from 'solid-js';

export type TurnNotificationProps = {
  message: string;
};

export function TurnNotification(props: TurnNotificationProps) {
  return (
    <Show when={props.message}>
      <div class="turn-notification">
        <div class="turn-notification-content">
          <span>{props.message}</span>
        </div>
      </div>
    </Show>
  );
}