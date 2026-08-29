<?php

namespace App\Enum;

enum AuthenticationEventType: string
{
    case Login = 'login';
    case Logout = 'logout';
}
