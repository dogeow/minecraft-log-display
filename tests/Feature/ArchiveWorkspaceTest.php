<?php

namespace Tests\Feature;

use App\Models\ChatMessage;
use App\Models\DailyStat;
use App\Models\Login;
use App\Models\LoginLocation;
use App\Models\User;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Tests\TestCase;

class ArchiveWorkspaceTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        config(['database.default' => 'sqlite', 'database.connections.sqlite.database' => ':memory:']);
        Artisan::call('migrate:fresh', ['--quiet' => true]);
        Cache::flush();
        $this->withoutVite();
    }

    public function test_daily_duration_is_sorted_numerically_before_pagination_and_filters_are_retained(): void
    {
        $user = $this->player('Alex');
        foreach ([9, 100, 20, 3, 80, 7, 40, 10, 2, 60, 50, 1] as $duration) {
            DailyStat::create(['user_id' => $user->id, 'date' => '2026-01-02', 'online_time' => $duration]);
        }
        DailyStat::create(['user_id' => $user->id, 'date' => '2025-12-31', 'online_time' => 999]);
        $query = '/api/daily-stats?search=Alex&start_date=2026-01-01&end_date=2026-01-03&sort=online_time&direction=asc&per_page=10';
        $first = $this->getJson($query)->assertOk()->assertJsonPath('paginatedData.meta.total', 12);
        $this->assertSame([1, 2, 3, 7, 9, 10, 20, 40, 50, 60], array_column($first->json('paginatedData.data'), 'online_time'));
        $second = $this->getJson($query.'&page=2')->assertOk();
        $this->assertSame([80, 100], array_column($second->json('paginatedData.data'), 'online_time'));
        $this->getJson(str_replace('direction=asc', 'direction=desc', $query))->assertJsonPath('paginatedData.data.0.online_time', 100);
    }

    public function test_daily_date_sort_is_bidirectional_with_stable_ties(): void
    {
        $user = $this->player('Alex');
        $a = DailyStat::create(['user_id' => $user->id, 'date' => '2026-02-01', 'online_time' => 20]);
        $b = DailyStat::create(['user_id' => $user->id, 'date' => '2026-01-01', 'online_time' => 20]);
        $c = DailyStat::create(['user_id' => $user->id, 'date' => '2026-02-01', 'online_time' => 20]);
        $this->assertSame([$b->id, $c->id, $a->id], array_column($this->getJson('/api/daily-stats?sort=date&direction=asc')->assertOk()->json('paginatedData.data'), 'id'));
        $this->assertSame([$c->id, $a->id, $b->id], array_column($this->getJson('/api/daily-stats?sort=date&direction=desc')->assertOk()->json('paginatedData.data'), 'id'));
    }

    public function test_explicit_user_duration_sort_overrides_default_online_priority(): void
    {
        $online = $this->player('Online');
        $online->update(['is_online' => true, 'total_online_time' => 3]);
        $offline = $this->player('Offline');
        $offline->update(['is_online' => false, 'total_online_time' => 100, 'last_logout_at' => '2026-01-01 12:00:00']);
        $this->getJson('/api/users?sort=total_online_time&direction=desc')->assertOk()->assertJsonPath('paginatedData.data.0.username', 'Offline')->assertJsonPath('paginatedData.data.0.last_logout_at', '2026-01-01 12:00:00');
        $this->getJson('/api/users')->assertOk()->assertJsonPath('paginatedData.data.0.username', 'Online');
        $this->getJson('/api/users?status=offline')->assertOk()->assertJsonCount(1, 'paginatedData.data')->assertJsonPath('paginatedData.data.0.username', 'Offline');
    }

    public function test_login_dates_and_durations_sort_with_missing_values_last(): void
    {
        $user = $this->player('Alex');
        $missing = Login::create(['user_id' => $user->id, 'login_at' => null, 'duration' => null]);
        $long = Login::create(['user_id' => $user->id, 'login_at' => '2026-02-01 10:00:00', 'duration' => 100]);
        $short = Login::create(['user_id' => $user->id, 'login_at' => '2026-01-01 10:00:00', 'duration' => 9]);
        foreach (['asc' => [$short->id, $long->id, $missing->id], 'desc' => [$long->id, $short->id, $missing->id]] as $direction => $ids) {
            foreach (['duration', 'login_at'] as $sort) {
                $this->assertSame($ids, array_column($this->getJson("/api/logins?sort=$sort&direction=$direction")->assertOk()->json('paginatedData.data'), 'id'));
            }
        }
    }

    public function test_date_range_is_inclusive_and_does_not_convert_browser_timezones(): void
    {
        config(['app.timezone' => 'Asia/Shanghai']);
        $user = $this->player('Alex');
        foreach (['2026-01-01 23:59:59', '2026-01-02 00:00:00', '2026-01-02 23:59:59', '2026-01-03 00:00:00'] as $time) {
            Login::create(['user_id' => $user->id, 'login_at' => $time, 'duration' => 1]);
        }
        $this->getJson('/api/logins?start_date=2026-01-02&end_date=2026-01-02&sort=login_at&direction=asc')
            ->assertOk()->assertJsonCount(2, 'paginatedData.data')->assertJsonPath('paginatedData.data.0.login_at', '2026-01-02 00:00:00')->assertJsonPath('paginatedData.data.1.login_at', '2026-01-02 23:59:59');
    }

    public function test_reversed_dates_oversized_pages_and_unlisted_sort_fields_are_rejected(): void
    {
        foreach (['start_date=2026-02-02&end_date=2026-01-01', 'per_page=1000', 'sort=password', 'sort=online_time&direction=sideways', 'page=0', 'search[]=bad', 'start_date=invalid', 'sort[]=date'] as $query) {
            $this->getJson('/api/daily-stats?'.$query)->assertUnprocessable();
        }
        $this->getJson('/api/daily-stats?sort=login_at')->assertUnprocessable();
        $this->getJson('/api/logins?sort=online_time')->assertUnprocessable();
    }

    public function test_public_chat_search_cannot_probe_hidden_message_content(): void
    {
        $user = $this->player('Alex');
        ChatMessage::create(['user_id' => $user->id, 'username' => 'Alex', 'content' => 'private-needle', 'sent_at' => '2026-01-01 10:00:00']);
        $this->getJson('/api/chat?search=private-needle')->assertOk()->assertJsonPath('paginatedData.meta.total', 0);
        $this->getJson('/api/chat?search=Alex')->assertOk()->assertJsonPath('paginatedData.data.0.content', null);
        $this->actingAs($this->player('Admin', true))->getJson('/api/chat?search=private-needle')->assertOk()->assertJsonPath('paginatedData.meta.total', 1)->assertJsonPath('paginatedData.data.0.content', 'private-needle');
    }

    public function test_locations_sort_by_related_login_time_without_exposing_private_fields(): void
    {
        $user = $this->player('Alex');
        foreach (['2026-02-01 10:00:00', '2026-01-01 10:00:00'] as $time) {
            $login = Login::create(['user_id' => $user->id, 'login_at' => $time]);
            LoginLocation::create(['login_id' => $login->id, 'user_id' => $user->id, 'world' => 'world', 'x' => 1, 'y' => 64, 'z' => 1, 'entity_id' => 1, 'ip' => '127.0.0.1']);
        }
        $this->getJson('/api/login-locations?sort=login_at&direction=asc')->assertOk()->assertJsonPath('paginatedData.data.0.login_at', '2026-01-01 10:00:00')->assertJsonPath('paginatedData.data.0.ip', null)->assertJsonPath('paginatedData.data.0.formatted_coordinates', null);
        $this->getJson('/api/login-locations?sort=login_at&direction=desc&start_date=2026-02-01')->assertOk()->assertJsonCount(1, 'paginatedData.data');
    }

    public function test_failed_login_errors_and_username_reach_the_spa_without_password(): void
    {
        $this->from('/login')->post('/login', ['username' => 'Unknown', 'password' => 'test-only-password'])->assertRedirect('/login')->assertSessionHasErrors('username');
        $this->get('/login')->assertOk()->assertSee('app-config')->assertSee('Unknown')->assertDontSee('test-only-password');
    }

    public function test_only_admin_can_log_in_and_logout_returns_to_public_home(): void
    {
        $user = $this->player('Player');
        $user->password = Hash::make('test-only-password');
        $user->save();
        $this->from('/login')->post('/login', ['username' => 'Player', 'password' => 'test-only-password'])->assertSessionHasErrors('username');
        $this->assertGuest();
        $admin = $this->player('Admin', true);
        $admin->password = Hash::make('test-only-password');
        $admin->save();
        $this->post('/login', ['username' => 'Admin', 'password' => 'test-only-password'])->assertRedirect('/admin');
        $this->assertAuthenticatedAs($admin);
        $this->get('/login')->assertRedirect('/admin');
        $this->post('/logout')->assertRedirect('/');
        $this->assertGuest();
    }

    private function player(string $name, bool $admin = false): User
    {
        $user = new User;
        $user->username = $name;
        $user->uuid = (string) Str::uuid();
        $user->is_admin = $admin;
        $user->save();

        return $user;
    }
}
