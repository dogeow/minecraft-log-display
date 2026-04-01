<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LoginLocationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $isAdmin = $request->user() && $request->user()->is_admin;

        return [
            'id' => $this->id,
            'world' => $this->world,
            'x' => $isAdmin ? $this->x : null,
            'y' => $isAdmin ? $this->y : null,
            'z' => $isAdmin ? $this->z : null,
            'formatted_coordinates' => $isAdmin ? $this->formatted_coordinates : null,
            'ip' => $isAdmin ? $this->ip : null,
            'login_at' => $this->login?->login_at?->format('Y-m-d H:i:s'),
            'user' => [
                'username' => $this->user->username,
            ],
        ];
    }
}
