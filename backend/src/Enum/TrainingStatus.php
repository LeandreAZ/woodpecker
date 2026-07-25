<?php

namespace App\Enum;

enum TrainingStatus: string
{
    case Draft = 'draft';
    case Active = 'active';
    case Archived = 'archived';
}
