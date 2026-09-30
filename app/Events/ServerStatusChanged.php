<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;

class ServerStatusChanged implements ShouldBroadcastNow, ShouldDispatchAfterCommit
{
    public function __construct(public readonly string $revision) {}

    public function broadcastOn(): array
    {
        return [new Channel('minecraft.status')];
    }

    public function broadcastAs(): string
    {
        return 'status.changed';
    }

    public function broadcastWith(): array
    {
        // Never serialize models, log lines, addresses, credentials, or the full query response.
        return ['revision' => $this->revision];
    }
}
