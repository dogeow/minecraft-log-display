<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ChatMessageResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $isAdmin = $request->user()?->is_admin;

        return [
            'id' => $this->id,
            'username' => $this->username,
            'content' => $isAdmin ? $this->content : null,
            'sent_at' => $this->sent_at->format('Y-m-d H:i:s'),
        ];
    }
}
