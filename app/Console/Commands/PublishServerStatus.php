<?php

namespace App\Console\Commands;

use App\Services\ServerStatusPublisher;
use Illuminate\Console\Command;
use Throwable;

class PublishServerStatus extends Command
{
    protected $signature = 'minecraft:publish-status';

    protected $description = 'Publish a public status-change notification when the Minecraft status changes';

    public function handle(ServerStatusPublisher $publisher): int
    {
        try {
            $publisher->publish();
        } catch (Throwable $exception) {
            report($exception);
            $this->error('Status notification failed; the next scheduled check will retry.');

            return self::FAILURE;
        }

        return self::SUCCESS;
    }
}
