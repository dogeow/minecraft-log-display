<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $isAdmin = (bool) $request->user()?->is_admin;

        return [
            'id' => $this->id,
            'username' => $this->username,
            'uuid' => $this->uuid,
            'is_online' => (bool) $this->is_online,
            'last_login_at' => $this->last_login_at?->format('Y-m-d H:i:s'),
            'last_logout_at' => $this->last_logout_at?->format('Y-m-d H:i:s'),
            'total_online_time' => (int) $this->total_online_time,
            'is_scientist' => (bool) $this->is_scientist,
            'login_locations' => $isAdmin
                ? LoginLocationResource::collection($this->whenLoaded('loginLocations'))
                : [],
        ];
    }
}
