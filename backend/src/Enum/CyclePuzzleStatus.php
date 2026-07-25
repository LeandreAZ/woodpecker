<?php

namespace App\Enum;

enum CyclePuzzleStatus: string
{
    case Pending = 'pending';
    case Solved = 'solved';
    case Failed = 'failed';
    case Skipped = 'skipped';
}
