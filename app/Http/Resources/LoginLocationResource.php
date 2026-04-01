<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LoginLocationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'world' => $this->world,
            'x' => $this->x,
            'y' => $this->y,
            'z' => $this->z,
            'formatted_coordinates' => $this->formatted_coordinates,
            'ip' => $this->ip,
            'login_at' => $this->login?->login_at?->format('Y-m-d H:i:s'),
            'user' => [
                'username' => $this->user->username,
            ],
        ];
    }
}
