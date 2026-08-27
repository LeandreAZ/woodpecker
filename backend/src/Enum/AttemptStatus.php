<?php

namespace App\Enum;

enum AttemptStatus: string
{
    case InProgress = 'in_progress';
    case Failed = 'failed';
    case Solved = 'solved';
}
