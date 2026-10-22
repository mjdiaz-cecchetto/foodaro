<?php

namespace App\Enums;

enum MedioPago: string
{
    case Transferencia = 'transferencia';
    case Debito = 'debito';
    case Efectivo = 'efectivo';
}
