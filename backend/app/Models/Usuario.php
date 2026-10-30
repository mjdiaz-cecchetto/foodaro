<?php

namespace App\Models;

use App\Enums\RolUsuario;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

/** Usuario del panel admin de un local o Root de Foodaro. */
class Usuario extends Authenticatable
{
    use HasApiTokens, Notifiable;

    protected $table = 'usuarios';

    protected $attributes = [
        'rol' => RolUsuario::Administrador,
        'activo' => true,
    ];

    protected $fillable = ['local_id', 'nombre', 'email', 'password', 'rol', 'activo', 'ultimo_acceso_en'];

    protected $hidden = ['password', 'remember_token'];

    protected function casts(): array
    {
        return [
            'password' => 'hashed',
            'rol' => RolUsuario::class,
            'activo' => 'boolean',
            'ultimo_acceso_en' => 'datetime',
        ];
    }

    public function local(): BelongsTo
    {
        return $this->belongsTo(Local::class);
    }

    public function esSuperadmin(): bool
    {
        return $this->rol === RolUsuario::Superadmin;
    }

    /** Indica si el usuario administra el local indicado. */
    public function administra(int $localId): bool
    {
        return $this->esSuperadmin() || $this->local_id === $localId;
    }
}
