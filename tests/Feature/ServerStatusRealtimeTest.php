<?php

namespace Tests\Feature;

use App\Events\ServerStatusChanged;
use App\Services\MinecraftServerStatus;
use App\Services\ServerStatusPublisher;
use Illuminate\Broadcasting\BroadcastManager;
use Illuminate\Broadcasting\Channel;
use Illuminate\Contracts\Broadcasting\Factory;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Mockery;
use RuntimeException;
use Tests\TestCase;

class ServerStatusRealtimeTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        config([
            'database.default' => 'sqlite',
            'database.connections.sqlite.database' => ':memory:',
            'cache.default' => 'array',
            'realtime.enabled' => true,
            'broadcasting.default' => 'reverb',
        ]);
        DB::purge('sqlite');
        Cache::flush();
        $this->withoutVite();
    }

    public function test_notifications_are_public_invalidation_only(): void
    {
        $event = new ServerStatusChanged('test-revision');
        $this->assertSame(Channel::class, $event->broadcastOn()[0]::class);
        $this->assertSame('minecraft.status', $event->broadcastOn()[0]->name);
        $this->assertSame('status.changed', $event->broadcastAs());
        $this->assertSame(['revision' => 'test-revision'], $event->broadcastWith());
        $this->assertSame('none', config('reverb.apps.apps.0.accept_client_events_from'));
        $this->assertNotContains('*', config('reverb.apps.apps.0.allowed_origins'));
    }

    public function test_unchanged_status_is_deduplicated_but_changes_and_heartbeat_are_published(): void
    {
        Event::fake([ServerStatusChanged::class]);
        $status = Mockery::mock(MinecraftServerStatus::class);
        $status->shouldReceive('getServerStatus')->andReturn(
            ['is_online' => true, 'players' => ['Alex', 'Steve'], 'timer' => 0.1, 'ip' => 'private-address'],
            ['is_online' => true, 'players' => ['Steve', 'Alex'], 'timer' => 0.2, 'ip' => 'private-address'],
            ['is_online' => false, 'players' => []],
            ['is_online' => false, 'players' => []],
        );
        $publisher = new ServerStatusPublisher($status);
        $this->assertTrue($publisher->publish());
        $this->assertFalse($publisher->publish());
        $this->assertTrue($publisher->publish());
        $this->travel(61)->seconds();
        $this->assertTrue($publisher->publish());
        Event::assertDispatchedTimes(ServerStatusChanged::class, 3);
        Event::assertDispatched(ServerStatusChanged::class, fn ($event) => array_keys($event->broadcastWith()) === ['revision']);
    }

    public function test_disabled_or_non_reverb_mode_does_not_probe_or_broadcast(): void
    {
        Event::fake([ServerStatusChanged::class]);
        $status = Mockery::mock(MinecraftServerStatus::class);
        $status->shouldNotReceive('getServerStatus');
        $publisher = new ServerStatusPublisher($status);
        config(['realtime.enabled' => false]);
        $this->assertFalse($publisher->publish());
        config(['realtime.enabled' => true, 'broadcasting.default' => 'log']);
        $this->assertFalse($publisher->publish());
        Event::assertNotDispatched(ServerStatusChanged::class);
    }

    public function test_rollback_discards_notification_and_commit_publishes_afterwards(): void
    {
        Event::fake([ServerStatusChanged::class]);
        $status = Mockery::mock(MinecraftServerStatus::class);
        $status->shouldReceive('getServerStatus')->once()->andReturn(['is_online' => true]);
        $publisher = new ServerStatusPublisher($status);
        DB::beginTransaction();
        $this->assertFalse($publisher->publish());
        Event::assertNotDispatched(ServerStatusChanged::class);
        DB::rollBack();
        Event::assertNotDispatched(ServerStatusChanged::class);
        DB::beginTransaction();
        $this->assertFalse($publisher->publish());
        Event::assertNotDispatched(ServerStatusChanged::class);
        DB::commit();
        Event::assertDispatchedTimes(ServerStatusChanged::class, 1);
    }

    public function test_broadcast_failure_does_not_suppress_the_next_retry(): void
    {
        $broadcasts = Mockery::mock(BroadcastManager::class);
        $broadcasts->shouldReceive('queue')->once()->ordered()->andThrow(new RuntimeException('test transport unavailable'));
        $broadcasts->shouldReceive('queue')->once()->ordered()->andReturnNull();
        $this->app->instance(Factory::class, $broadcasts);
        $status = Mockery::mock(MinecraftServerStatus::class);
        $status->shouldReceive('getServerStatus')->times(3)->andReturn(['is_online' => true]);
        $publisher = new ServerStatusPublisher($status);
        try {
            $publisher->publish();
            $this->fail('Expected transport failure');
        } catch (RuntimeException $exception) {
            $this->assertSame('test transport unavailable', $exception->getMessage());
        }
        $this->assertTrue($publisher->publish());
        $this->assertFalse($publisher->publish());
    }

    public function test_page_configuration_never_exposes_the_reverb_secret(): void
    {
        config([
            'broadcasting.connections.reverb.secret' => 'test-private-secret-do-not-serialize',
            'reverb.apps.apps.0.secret' => 'test-private-secret-do-not-serialize',
            'realtime.public.key' => 'test-public-key',
            'realtime.public.host' => 'mc.example.test',
        ]);
        $this->get('/')->assertOk()->assertSee('test-public-key')->assertSee('mc.example.test')->assertDontSee('test-private-secret-do-not-serialize');
    }

    public function test_console_command_is_safe_when_not_enabled(): void
    {
        config(['realtime.enabled' => false]);
        $status = Mockery::mock(MinecraftServerStatus::class);
        $status->shouldNotReceive('getServerStatus');
        $this->app->instance(MinecraftServerStatus::class, $status);
        $this->artisan('minecraft:publish-status')->assertSuccessful();
    }
}
