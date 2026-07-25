<?php

namespace App\Enum;

enum CycleStatus: string
{
    case Planned = 'planned';
    case Active = 'active';
    case Completed = 'completed';
}
