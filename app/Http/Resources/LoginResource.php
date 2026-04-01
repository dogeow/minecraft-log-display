<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LoginResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'login_at' => $this->login_at->format('Y-m-d H:i:s'),
            'logout_at' => $this->logout_at?->format('Y-m-d H:i:s'),
            'duration' => $this->duration,
            'user' => [
                'username' => $this->user->username,
            ],
        ];
    }
}
