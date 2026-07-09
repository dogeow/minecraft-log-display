<?php

namespace Tests\Feature;

use App\Models\ChatMessage;
use App\Models\Login;
use App\Models\LoginLocation;
use App\Models\User;
use App\Services\MinecraftServerStatus;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Mockery;
use Tests\TestCase;

class SecurityFixRegressionTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        config([
            'database.default' => 'sqlite',
            'database.connections.sqlite.database' => ':memory:',
        ]);

        Artisan::call('migrate:fresh', ['--quiet' => true]);
        Cache::flush();
    }

    public function test_users_endpoint_hides_login_locations_for_non_admins(): void
    {
        $admin = $this->createUser('admin', true);
        $targetUser = $this->createUser('target_user');

        $login = Login::create([
            'user_id' => $targetUser->id,
            'login_at' => now(),
            'created_at' => now(),
        ]);

        LoginLocation::create([
            'login_id' => $login->id,
            'user_id' => $targetUser->id,
            'world' => 'overworld',
            'x' => 12.5,
            'y' => 64,
            'z' => -32.1,
            'entity_id' => 1234,
            'ip' => '127.0.0.1',
        ]);

        $response = $this->actingAs($admin)
            ->getJson('/api/users?search=target_user');

        $response->assertStatus(200);
        $response->assertJsonPath('paginatedData.data.0.login_locations.0.world', 'overworld');

        $response = $this->actingAs($targetUser)
            ->getJson('/api/users?search=target_user');

        $response->assertStatus(200);
        $response->assertJsonPath('paginatedData.data.0.login_locations', []);
    }

    public function test_chat_endpoint_hides_content_for_non_admin_and_exposes_for_admin(): void
    {
        $viewer = $this->createUser('viewer');
        $admin = $this->createUser('super_admin', true);

        ChatMessage::create([
            'user_id' => $viewer->id,
            'username' => $viewer->username,
            'content' => 'Only admins can view this',
            'sent_at' => now(),
            'created_at' => now(),
        ]);

        $this->actingAs($viewer)
            ->getJson('/api/chat')
            ->assertStatus(200)
            ->assertJsonPath('paginatedData.data.0.content', null);

        $this->actingAs($admin)
            ->getJson('/api/chat')
            ->assertStatus(200)
            ->assertJsonPath('paginatedData.data.0.content', 'Only admins can view this');
    }

    public function test_server_status_endpoint_is_throttled_to_thirty_requests_per_minute(): void
    {
        $payload = [
            'is_online' => true,
            'query_available' => true,
            'query_unavailable' => false,
            'timer' => '0.0000',
            'display_name' => 'DogeOW',
            'display_subtitle' => '服务器在线',
            'version' => '1.21.4',
            'server_flavor' => 'Mod 服务器',
            'software' => 'Paper',
            'game_mode' => '多人游戏',
            'online_players' => 0,
            'max_players' => 20,
            'motd_html' => '',
            'errors' => [],
            'info' => [],
            'queryInfo' => [],
            'players' => [],
            'favicon' => null,
            'endpoint' => '127.0.0.1:25565',
        ];

        $service = Mockery::mock(MinecraftServerStatus::class);
        $service->shouldReceive('getServerStatus')->times(30)->andReturn($payload);
        $this->app->instance(MinecraftServerStatus::class, $service);

        for ($i = 0; $i < 30; $i++) {
            $this->get('/api/server-status')->assertStatus(200);
        }

        $this->get('/api/server-status')->assertStatus(429);
    }

    private function createUser(string $username, bool $isAdmin = false): User
    {
        $user = new User();
        $user->username = $username;
        $user->uuid = (string) Str::uuid();
        $user->is_admin = $isAdmin;
        $user->save();

        return $user;
    }
}
