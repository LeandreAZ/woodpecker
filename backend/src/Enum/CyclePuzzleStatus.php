<?php

namespace App\Enum;

enum CyclePuzzleStatus: string
{
    case Pending = 'pending';
    case InProgress = 'in_progress';
    case Solved = 'solved';
    case Failed = 'failed';
    case Skipped = 'skipped';
}
